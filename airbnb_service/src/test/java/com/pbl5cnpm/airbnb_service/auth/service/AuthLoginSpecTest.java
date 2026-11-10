package com.pbl5cnpm.airbnb_service.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.pbl5cnpm.airbnb_service.auth.dto.request.AuthenticationResquest;
import com.pbl5cnpm.airbnb_service.auth.repository.InvalidTokenRepository;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.shared.mail.MailerService;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/** ID methods map directly to docs/testing/backend/01-auth-login.md. No external services. */
class AuthLoginSpecTest {
    private static final String SECRET = "spec-test-key-only-".repeat(8);
    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder passwords = mock(PasswordEncoder.class);
    private final InvalidTokenRepository blacklist = mock(InvalidTokenRepository.class);
    private final MailerService mailer = mock(MailerService.class);
    private AuthenticationService service;
    private UserEntity user;
    private AuthenticationResquest request;
    private final LocalDateTime oldLogin = LocalDateTime.of(2020, 1, 1, 0, 0);

    @BeforeEach
    void setUp() {
        service = new AuthenticationService(users, passwords, blacklist, mailer);
        ReflectionTestUtils.setField(service, "SIGNER_KEY", SECRET);
        ReflectionTestUtils.setField(service, "DURATION_ACCESS", "600");
        ReflectionTestUtils.setField(service, "DURATION_REFRESH", "3600");
        user = UserEntity.builder().id(91001L).username("qa_guest_a").password("test-only-hash")
                .isActive(true).lastLogin(oldLogin)
                .roles(new HashSet<>(Set.of(RoleEntity.builder().id("qa-guest").roleName("GUEST").build()))).build();
        request = AuthenticationResquest.builder().username("qa_guest_a").password("test-only-password").build();
        when(users.findByUsername("qa_guest_a")).thenReturn(Optional.of(user));
    }

    @Test
    void AUTH_UT_001_validLoginSavesOnlyCurrentUser() throws Exception {
        when(passwords.matches(request.getPassword(), user.getPassword())).thenReturn(true);
        when(users.save(user)).thenReturn(user);
        var rolesBefore = Set.copyOf(user.getRoles());
        LocalDateTime before = LocalDateTime.now();
        var response = service.authenticate(request);
        LocalDateTime after = LocalDateTime.now();

        assertNotNull(response.getAccess_token());
        assertNotNull(response.getRefresh_token());
        assertEquals("600", response.getExpired_token());
        assertFalse(user.getLastLogin().isBefore(before));
        assertFalse(user.getLastLogin().isAfter(after));
        assertEquals("test-only-hash", user.getPassword());
        assertEquals(rolesBefore, user.getRoles());
        var json = new ObjectMapper().valueToTree(response);
        assertFalse(json.has("password"));
        assertFalse(json.has("hash"));
        verify(users).save(same(user));
        verifyNoInteractions(blacklist, mailer);
        verify(users).findByUsername("qa_guest_a");
        verify(passwords).matches(request.getPassword(), user.getPassword());
        verifyNoMoreInteractions(users, passwords);
    }

    @Test
    void AUTH_UT_002_wrongPasswordDoesNotMutateUser() {
        when(passwords.matches(request.getPassword(), user.getPassword())).thenReturn(false);
        assertEquals(ErrorCode.UNAUTHENTICATED,
                assertThrows(AppException.class, () -> service.authenticate(request)).getErrorcode());
        assertEquals(oldLogin, user.getLastLogin());
        assertEquals("test-only-hash", user.getPassword());
        assertEquals(Set.of("GUEST"), user.getRoles().stream().map(RoleEntity::getRoleName).collect(java.util.stream.Collectors.toSet()));
        verify(users, never()).save(any());
        verifyNoInteractions(blacklist, mailer);
    }

    @Test
    void AUTH_UT_003_lockedAccountDoesNotCheckPassword() {
        user.setIsActive(false);
        assertEquals(ErrorCode.ACCOUNT_NOT_ACCESS,
                assertThrows(AppException.class, () -> service.authenticate(request)).getErrorcode());
        assertEquals(oldLogin, user.getLastLogin());
        verifyNoInteractions(passwords, blacklist, mailer);
        verify(users, never()).save(any());
    }

    @Test
    void AUTH_UT_004_verifiesBothJwtSignaturesAndClaims() throws Exception {
        when(passwords.matches(request.getPassword(), user.getPassword())).thenReturn(true);
        var response = service.authenticate(request);
        SignedJWT access = SignedJWT.parse(response.getAccess_token());
        SignedJWT refresh = SignedJWT.parse(response.getRefresh_token());
        SignedJWT[] tokens = {access, refresh};
        String[] types = {"access", "refresh"};
        long[] durations = {600, 3600};
        for (int i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            assertEquals(JWSAlgorithm.HS512, token.getHeader().getAlgorithm());
            assertTrue(token.verify(new MACVerifier(SECRET.getBytes(StandardCharsets.UTF_8))));
            var claims = token.getJWTClaimsSet();
            assertEquals("qa_guest_a", claims.getSubject());
            assertEquals(types[i], claims.getStringClaim("type_token"));
            assertEquals("GUEST", claims.getStringClaim("scope"));
            assertNotNull(claims.getJWTID());
            assertFalse(claims.getJWTID().isBlank());
            assertTrue(Math.abs((claims.getExpirationTime().getTime() - claims.getIssueTime().getTime()) / 1000 - durations[i]) <= 1);
        }
        assertNotEquals(access.getJWTClaimsSet().getJWTID(), refresh.getJWTClaimsSet().getJWTID());
        verify(users).save(same(user));
        verifyNoInteractions(blacklist, mailer);
    }

    @Test
    void AUTH_UT_005_saveFailureDoesNotReturnTokens() {
        when(passwords.matches(request.getPassword(), user.getPassword())).thenReturn(true);
        var failure = new DataAccessResourceFailureException("simulated persistence failure");
        when(users.save(user)).thenThrow(failure);
        assertSame(failure, assertThrows(DataAccessResourceFailureException.class, () -> service.authenticate(request)));
        verify(users).save(same(user));
        verifyNoInteractions(blacklist, mailer);
    }
}
