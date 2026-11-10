package com.pbl5cnpm.airbnb_service.spec;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Supplier;
import javax.sql.DataSource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.pbl5cnpm.airbnb_service.auth.repository.InvalidTokenRepository;
import com.pbl5cnpm.airbnb_service.country.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

@SpringJUnitConfig(SpecIntegrationConfig.class)
@WebAppConfiguration
@TestPropertySource(properties = {
        "security.secret=" + SpecIntegrationSupport.SECRET,
        "security.duration_access=600", "security.duration_refresh=3600", "image.customer=/uploads/qa.jpg",
        "upload.directory=/unused-spec-fixture"
})
public abstract class SpecIntegrationSupport {
    protected static final String SECRET = "spec-only-signing-key-0123456789abcdef0123456789abcdef0123456789abcdef";
    protected static final String PASSWORD = "qa-fixture-only";
    protected static final LocalDateTime OLD_LOGIN = LocalDateTime.of(2020, 1, 1, 0, 0);
    @Autowired protected WebApplicationContext context;
    @Autowired protected PlatformTransactionManager transactions;
    @Autowired protected InvalidTokenRepository blacklist;
    @Autowired protected DataSource dataSource;
    @PersistenceContext protected EntityManager em;
    protected MockMvc mvc;
    protected final ObjectMapper json = new ObjectMapper().findAndRegisterModules();
    protected Long guestId, otherId, hostId, lockedId, noRoleId, listingId, viId, enId;
    protected String guestRoleId, hostRoleId;
    protected final LocalDate d1 = LocalDate.now().plusDays(7);
    protected final LocalDate d2 = d1.plusDays(2);

    @BeforeEach
    void createIsolatedFixture() throws Exception {
        // A hard guard protects fixture cleanup even if this configuration is accidentally changed.
        try (var connection = dataSource.getConnection()) {
            assertTrue(connection.getMetaData().getURL().startsWith("jdbc:h2:mem:restnesst-spec-"));
        }
        reset(blacklist);
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class)).build();
        tx(() -> {
            for (String table : List.of("payments", "booked", "images", "user_languages", "user_roles", "listings", "users", "languages", "countries", "roles")) {
                em.createNativeQuery("DELETE FROM " + table).executeUpdate();
            }
            RoleEntity guest = RoleEntity.builder().roleName("GUEST").build();
            RoleEntity host = RoleEntity.builder().roleName("HOST").build();
            RoleEntity admin = RoleEntity.builder().roleName("ADMIN").build();
            em.persist(guest); em.persist(host); em.persist(admin);
            guestRoleId = guest.getId(); hostRoleId = host.getId();
            guestId = persistUser("qa_guest_a", true, guest).getId();
            otherId = persistUser("qa_guest_b", true, guest).getId();
            hostId = persistUser("qa_host", true, host).getId();
            persistUser("qa_admin", true, admin);
            lockedId = persistUser("qa_locked", false, guest).getId();
            noRoleId = persistUser("qa_no_role", true).getId();
            CountriesEntity country = new CountriesEntity(); country.setName("QA Country"); em.persist(country);
            var vi = LanguageEntity.builder().name("QA Vietnamese").code("qvi").deleted(false).isActive(true).build();
            var en = LanguageEntity.builder().name("QA English").code("qen").deleted(false).isActive(true).build();
            em.persist(vi); em.persist(en); viId = vi.getId(); enId = en.getId();
            var listing = ListingEntity.builder().title("QA listing").address("QA address").city("QA city")
                    .host(em.find(UserEntity.class, hostId)).price(500000d).status("AVAILABLE").access(true)
                    .deleted(false).startDate(d1.minusDays(1)).endDate(d2.plusDays(1)).build();
            em.persist(listing); listingId = listing.getId();
            return null;
        });
    }

    private UserEntity persistUser(String username, boolean active, RoleEntity... roles) {
        var user = UserEntity.builder().username(username).fullname("QA original").isActive(active)
                .password(context.getBean(org.springframework.security.crypto.password.PasswordEncoder.class).encode(PASSWORD))
                .lastLogin(OLD_LOGIN).description("QA original description").roles(new HashSet<>(List.of(roles))).build();
        em.persist(user);
        return user;
    }

    protected <T> T tx(Supplier<T> action) {
        return new TransactionTemplate(transactions).execute(status -> action.get());
    }

    protected Map<String, Object> loginBody(String username, String password) {
        return new LinkedHashMap<>(Map.of("username", username, "password", password));
    }

    protected Map<String, Object> applyBody(Long id) {
        return new LinkedHashMap<>(Map.of("userId", id, "fullname", "QA Host", "country", "QA Country",
                "languageIds", List.of(viId, enId), "description", "QA application", "experience", "2 năm kinh nghiệm", "didHostYear", 2));
    }

    protected Map<String, Object> bookingBody() {
        return new LinkedHashMap<>(Map.of("listingId", listingId, "checkInDate", d1.toString(),
                "checkOutDate", d2.toString(), "totalPrice", 1000000d, "content", "QA booking"));
    }

    protected MvcResult send(String method, String path, String token, Object body) throws Exception {
        MockHttpServletRequestBuilder builder = switch (method) {
            case "GET" -> get(path);
            case "PUT" -> put(path);
            case "DELETE" -> delete(path);
            default -> post(path);
        };
        builder.accept(MediaType.APPLICATION_JSON);
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (body != null) builder.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(body));
        return mvc.perform(builder).andReturn();
    }

    protected String token(String username, String scope) throws Exception {
        return signedToken(username, scope, "access", Instant.now().plusSeconds(600), UUID.randomUUID().toString());
    }

    protected String signedToken(String username, String scope, String type, Instant expiry, String jti) throws Exception {
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS512), new JWTClaimsSet.Builder()
                .subject(username).issuer("inmobi.com.vn").jwtID(jti).issueTime(Date.from(Instant.now().minusSeconds(1)))
                .expirationTime(Date.from(expiry)).claim("scope", scope).claim("type_token", type).build());
        jwt.sign(new MACSigner(SECRET));
        return jwt.serialize();
    }

    protected JsonNode body(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsByteArray());
    }

    protected JsonNode expect(MvcResult result, int status, int code) throws Exception {
        assertEquals(status, result.getResponse().getStatus(), "HTTP status");
        JsonNode node = body(result);
        assertEquals(code, node.path("code").asInt(), "body code");
        return node;
    }

    protected void expectUnauthorized(MvcResult result) throws Exception {
        var node = expect(result, 401, 106);
        assertEquals("unauthenticated! || token is invalid ", node.path("message").asText());
        assertFalse(node.has("result"));
    }

    protected long count(String table) {
        return tx(() -> ((Number) em.createNativeQuery("SELECT COUNT(*) FROM " + table).getSingleResult()).longValue());
    }

    protected void pending(Long id, boolean value) {
        tx(() -> { em.find(UserEntity.class, id).setHostApplicationPending(value); return null; });
    }

    protected JsonNode userSnapshot(Long id) {
        return tx(() -> {
            var user = em.find(UserEntity.class, id);
            var result = json.createObjectNode();
            result.put("id", user.getId()); result.put("fullname", user.getFullname());
            result.put("description", user.getDescription()); result.put("pending", user.isHostApplicationPending());
            result.put("lastLogin", String.valueOf(user.getLastLogin()));
            result.put("country", user.getCountry() == null ? null : user.getCountry().getName());
            result.put("experience", user.getHostExperience());
            result.put("years", user.getDidHostYear());
            result.set("roles", json.valueToTree(user.getRoles().stream().map(RoleEntity::getRoleName).sorted().toList()));
            result.set("languages", json.valueToTree(user.getLanguageEntities().stream().map(LanguageEntity::getId).sorted().toList()));
            return result;
        });
    }
}
