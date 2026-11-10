package com.pbl5cnpm.airbnb_service.auth.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.pbl5cnpm.airbnb_service.auth.repository.InvalidTokenRepository;
import com.pbl5cnpm.airbnb_service.auth.service.AuthenticationService;
import com.pbl5cnpm.airbnb_service.configuration.CustomJwtDecoder;
import com.pbl5cnpm.airbnb_service.configuration.PasswordEncoderConfig;
import com.pbl5cnpm.airbnb_service.configuration.SecurityConfig;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.GlobalExceptionHandler;
import com.pbl5cnpm.airbnb_service.shared.mail.MailerService;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EmptySource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.support.TestPropertySourceUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

/** Real MVC, security filters, BCrypt and JWT signing; no application startup or external services. */
class AuthLoginHttpTest {
    private static final String SECRET = "login-http-test-only-key-".repeat(4);
    private static final String USERNAME = "login_test_user";
    private static final String PASSWORD = "test-only-password";
    private static final LocalDateTime OLD_LOGIN = LocalDateTime.of(2020, 1, 1, 0, 0);
    private final ObjectMapper json = new ObjectMapper();
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private UserRepository users;
    private UserEntity user;
    private String passwordHash;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
                "security.secret=" + SECRET, "security.duration_access=600", "security.duration_refresh=3600");
        context.register(LoginConfiguration.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class)).build();
        users = context.getBean(UserRepository.class);
        passwordHash = context.getBean(PasswordEncoder.class).encode(PASSWORD);
        user = UserEntity.builder().id(1L).username(USERNAME).password(passwordHash)
                .isActive(true).lastLogin(OLD_LOGIN).roles(roles(Set.of("GUEST"))).build();
        when(users.findByUsername(USERNAME)).thenReturn(Optional.of(user));
    }

    @AfterEach
    void tearDown() {
        try {
            if (context.isActive()) {
                verifyNoInteractions(context.getBean(InvalidTokenRepository.class), context.getBean(MailerService.class),
                        context.getBean(JavaMailSender.class));
            }
        } finally {
            SecurityContextHolder.clearContext();
            context.close();
        }
    }

    @ParameterizedTest
    @MethodSource("roleSets")
    void anonymousLoginUsesStoredRolesAndReturnsSignedTokens(Set<String> storedRoles) throws Exception {
        user.setRoles(roles(storedRoles));
        LocalDateTime before = LocalDateTime.now();
        Instant issuedAfter = Instant.now().minusSeconds(1);
        // Client-supplied roles must never become JWT authorities.
        var response = login(json.writeValueAsString(Map.of("username", USERNAME, "password", PASSWORD,
                "roles", Set.of("INJECTED_ADMIN"))), 200, 200);
        Instant issuedBefore = Instant.now();

        assertEquals("Login succesfully!", response.path("message").asText());
        assertTrue(response.hasNonNull("timestamp"));
        var tokens = response.path("result");
        Set<String> fields = new HashSet<>();
        tokens.fieldNames().forEachRemaining(fields::add);
        assertEquals(Set.of("access_token", "refresh_token", "expired_token"), fields);
        assertEquals("600", tokens.path("expired_token").asText());
        var access = verifyToken(tokens.path("access_token").asText(), "access", 600, storedRoles,
                issuedAfter, issuedBefore);
        var refresh = verifyToken(tokens.path("refresh_token").asText(), "refresh", 3600, storedRoles,
                issuedAfter, issuedBefore);
        assertNotEquals(access.getJWTClaimsSet().getJWTID(), refresh.getJWTClaimsSet().getJWTID());
        assertFalse(user.getLastLogin().isBefore(before));
        assertFalse(user.getLastLogin().isAfter(LocalDateTime.now()));
        assertEquals(passwordHash, user.getPassword());
        assertEquals(storedRoles, user.getRoles().stream().map(RoleEntity::getRoleName).collect(Collectors.toSet()));
        verify(users).findByUsername(USERNAME);
        verify(users).save(same(user));
        verifyNoMoreInteractions(users);
    }

    static Stream<Set<String>> roleSets() {
        return Stream.of(Set.of("GUEST"), Set.of("HOST"), Set.of("ADMIN"), Set.of("GUEST", "HOST"), Set.of());
    }

    @ParameterizedTest
    @EmptySource
    @ValueSource(strings = {"wrong-password", "   ", PASSWORD + " "})
    void invalidPasswordReturns401WithoutSaving(String password) throws Exception {
        var request = json.createObjectNode().put("username", USERNAME).put("password", password);
        var response = login(request.toString(), 401, 106);
        assertEquals("unauthenticated! || token is invalid ", response.path("message").asText());
        assertNoTokensOrMutation(response);
    }

    @Test
    void lockedAccountReturns400EvenWithCorrectPassword() throws Exception {
        user.setIsActive(false);
        var response = login(credentials(PASSWORD), 400, 1022);
        assertEquals("account not acccess", response.path("message").asText());
        assertNoTokensOrMutation(response);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"missing-user", "   ", " " + USERNAME + " "})
    void unknownUsernameCurrentlyReturns500WithoutSaving(String username) throws Exception {
        // Characterize the existing USER_EXISTED mapping; changing this contract needs a separate logic change.
        var request = json.createObjectNode().put("username", username).put("password", PASSWORD);
        var response = login(request.toString(), 500, 1000);
        assertEquals("user existd", response.path("message").asText());
        assertNoTokensOrMutation(response);
        verify(users).findByUsername(username);
        verifyNoMoreInteractions(users);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"username\":\"login_test_user\"}",
            "{\"username\":\"login_test_user\",\"password\":null}"})
    void missingOrNullPasswordCurrentlyReturns400WithoutSaving(String body) throws Exception {
        // BCrypt rejects null before credential matching; the generic handler currently keeps body code 200.
        var response = login(body, 400, 200);
        assertEquals("rawPassword cannot be null", response.path("message").asText());
        assertNoTokensOrMutation(response);
    }

    @Test
    void omittedUsernameCurrentlyReturns500WithoutSaving() throws Exception {
        assertNoTokensOrMutation(login(json.writeValueAsString(Map.of("password", PASSWORD)), 500, 1000));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "null", "{\"username\":", "[]",
            "{\"username\":{},\"password\":\"test\"}", "{\"username\":\"login_test_user\",\"password\":[]}"})
    void unreadableRequestReturns400BeforeRepositoryAccess(String body) throws Exception {
        var result = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.result").doesNotExist()).andReturn();
        assertFalse(json.readTree(result.getResponse().getContentAsString()).has("result"));
        verifyNoInteractions(users);
    }

    @Test
    void repeatedLoginIssuesNewTokenIds() throws Exception {
        var first = login(credentials(PASSWORD), 200, 200).path("result");
        var second = login(credentials(PASSWORD), 200, 200).path("result");
        Set<String> ids = new HashSet<>();
        for (var tokens : new JsonNode[] {first, second}) {
            for (String field : new String[] {"access_token", "refresh_token"}) {
                assertTrue(ids.add(SignedJWT.parse(tokens.path(field).asText()).getJWTClaimsSet().getJWTID()));
            }
        }
        verify(users, times(2)).save(same(user));
    }

    @Test
    void anonymousUserCannotBypassSecurityOnProtectedRoute() throws Exception {
        mvc.perform(get("/api/users/myInformation"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value(106))
                .andExpect(jsonPath("$.result").doesNotExist());
        verifyNoInteractions(users);
    }

    private String credentials(String password) throws Exception {
        return json.writeValueAsString(Map.of("username", USERNAME, "password", password));
    }

    private JsonNode login(String body, int httpStatus, int code) throws Exception {
        var result = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(httpStatus)).andExpect(jsonPath("$.code").value(code)).andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    private void assertNoTokensOrMutation(JsonNode response) {
        assertFalse(response.has("result"));
        assertEquals(OLD_LOGIN, user.getLastLogin());
        assertEquals(passwordHash, user.getPassword());
        verify(users, never()).save(any());
    }

    private SignedJWT verifyToken(String value, String type, long duration, Set<String> expectedRoles,
            Instant issuedAfter, Instant issuedBefore) throws Exception {
        SignedJWT token = SignedJWT.parse(value);
        assertEquals(JWSAlgorithm.HS512, token.getHeader().getAlgorithm());
        assertTrue(token.verify(new MACVerifier(SECRET)));
        var claims = token.getJWTClaimsSet();
        assertEquals(USERNAME, claims.getSubject());
        assertEquals("inmobi.com.vn", claims.getIssuer());
        assertEquals(type, claims.getStringClaim("type_token"));
        String scope = claims.getStringClaim("scope");
        assertEquals(expectedRoles, scope.isEmpty() ? Set.of() : Set.of(scope.split(" ")));
        assertNotNull(claims.getJWTID());
        assertFalse(claims.getJWTID().isBlank());
        assertFalse(claims.getIssueTime().toInstant().isBefore(issuedAfter));
        assertFalse(claims.getIssueTime().toInstant().isAfter(issuedBefore));
        assertEquals(duration, (claims.getExpirationTime().getTime() - claims.getIssueTime().getTime()) / 1000);
        assertFalse(claims.getClaims().containsKey("password"));
        return token;
    }

    private Set<RoleEntity> roles(Set<String> names) {
        return names.stream().map(name -> RoleEntity.builder().id(name).roleName(name).build()).collect(Collectors.toSet());
    }

    // Explicit imports avoid application.yml, database connections and ApplicationInitConfig seed execution.
    @TestConfiguration
    @EnableWebMvc
    @Import({SecurityConfig.class, CustomJwtDecoder.class, PasswordEncoderConfig.class,
            AuthenticationController.class, AuthenticationService.class, GlobalExceptionHandler.class})
    static class LoginConfiguration {
        @Bean UserRepository users() { return mock(UserRepository.class); }
        @Bean InvalidTokenRepository blacklist() { return mock(InvalidTokenRepository.class); }
        @Bean MailerService mailer() { return mock(MailerService.class); }
        @Bean JavaMailSender mailSender() { return mock(JavaMailSender.class); }
    }
}
