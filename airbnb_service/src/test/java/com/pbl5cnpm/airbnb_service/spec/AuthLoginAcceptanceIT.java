package com.pbl5cnpm.airbnb_service.spec;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.time.Instant;
import java.util.*;

import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

/** H2 + a blacklist double: HTTP/JPA evidence, not a MySQL/Redis acceptance result. */
class AuthLoginAcceptanceIT extends SpecIntegrationSupport {
    @Test
    void AUTH_IT_001_loginPersistsLastLoginAndDoesNotChangeOtherTables() throws Exception {
        var before = userSnapshot(guestId);
        var otherBefore = userSnapshot(otherId);
        String credential = tx(() -> em.find(UserEntity.class, guestId).getPassword());
        var result = expect(send("POST", "/auth/login", null, loginBody("qa_guest_a", PASSWORD)), 200, 200);
        var tokens = result.path("result");
        var fields = new HashSet<String>(); tokens.fieldNames().forEachRemaining(fields::add);
        assertEquals(Set.of("access_token", "refresh_token", "expired_token"), fields);
        assertFalse(tokens.path("access_token").asText().isBlank());
        assertFalse(tokens.path("refresh_token").asText().isBlank());
        assertEquals("600", tokens.path("expired_token").asText());
        assertEquals("Login succesfully!", result.path("message").asText());
        assertNotEquals(before.path("lastLogin"), userSnapshot(guestId).path("lastLogin"));
        before = before.deepCopy(); ((com.fasterxml.jackson.databind.node.ObjectNode) before).remove("lastLogin");
        var after = (com.fasterxml.jackson.databind.node.ObjectNode) userSnapshot(guestId); after.remove("lastLogin");
        assertEquals(before, after);
        assertEquals(otherBefore, userSnapshot(otherId));
        assertEquals(credential, tx(() -> em.find(UserEntity.class, guestId).getPassword()));
        assertEquals(6, count("users")); assertEquals(3, count("roles"));
        assertEquals(0, count("booked")); assertEquals(0, count("payments"));
    }

    @Test
    void AUTH_IT_002_wrongPasswordIsUnauthorizedWithoutMutation() throws Exception {
        var before = userSnapshot(guestId);
        expectUnauthorized(send("POST", "/auth/login", null, loginBody("qa_guest_a", "wrong-fixture-password")));
        assertEquals(before, userSnapshot(guestId));
    }

    @Test @Tag("proposal")
    void AUTH_IT_003_missingUsernameMustNotDiscloseAccountExistence() throws Exception {
        var result = send("POST", "/auth/login", null, loginBody("qa_missing", PASSWORD));
        assertEquals(6, count("users"));
        expectUnauthorized(result); // Q-A01: proposed uniform response, not approved business policy.
    }

    @Test
    void AUTH_IT_004_lockedAccountDoesNotReceiveToken() throws Exception {
        var before = userSnapshot(lockedId);
        var result = expect(send("POST", "/auth/login", null, loginBody("qa_locked", PASSWORD)), 400, 1022);
        assertFalse(result.has("result"));
        assertEquals(before, userSnapshot(lockedId));
    }

    @Test @Tag("proposal")
    void AUTH_IT_005_missingAndNullCredentialsAreValidationErrors() {
        List<Map<String, Object>> variants = new ArrayList<>();
        variants.add(Map.of());
        var nullUsername = loginBody("qa_guest_a", PASSWORD); nullUsername.put("username", null); variants.add(nullUsername);
        variants.add(Map.of("username", "qa_guest_a"));
        var nullPassword = loginBody("qa_guest_a", PASSWORD); nullPassword.put("password", null); variants.add(nullPassword);
        assertAll(variants.stream().map(input -> () -> {
            var before = userSnapshot(guestId);
            var result = send("POST", "/auth/login", null, input);
            assertEquals(before, userSnapshot(guestId));
            assertEquals(400, result.getResponse().getStatus());
            assertFalse(body(result).has("result"));
        }));
    }

    @Test @Tag("proposal")
    void AUTH_IT_006_blankAndWhitespaceCredentialsAreValidationErrors() {
        List<Map<String, Object>> variants = List.of(loginBody("", PASSWORD), loginBody("   ", PASSWORD),
                loginBody("qa_guest_a", ""), loginBody("qa_guest_a", "   "));
        assertAll(variants.stream().map(input -> () -> {
            var before = userSnapshot(guestId);
            var result = send("POST", "/auth/login", null, input);
            assertEquals(before, userSnapshot(guestId));
            assertEquals(400, result.getResponse().getStatus());
            assertFalse(body(result).has("result"));
        }));
    }

    @Test
    void AUTH_IT_007_passwordWhitespaceIsSignificant() throws Exception {
        expect(send("POST", "/auth/login", null, loginBody("qa_guest_a", PASSWORD)), 200, 200);
        var beforeFailure = userSnapshot(guestId);
        expectUnauthorized(send("POST", "/auth/login", null, loginBody("qa_guest_a", PASSWORD + " ")));
        assertEquals(beforeFailure, userSnapshot(guestId));
    }

    @Test
    void AUTH_IT_008_malformedOrEmptyJsonDoesNotWriteData() {
        assertAll(java.util.stream.Stream.of("{\"username\":", "").map(input -> () -> {
            var before = userSnapshot(guestId);
            var result = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(input)).andReturn();
            assertEquals(400, result.getResponse().getStatus());
            assertFalse(body(result).has("result"));
            assertEquals(before, userSnapshot(guestId));
        }));
    }

    @Test @Tag("proposal")
    void AUTH_IT_009_wrongCredentialTypesAndUnspecifiedLengthLimits() throws Exception {
        for (Object username : List.of(Map.of("bad", "type"), List.of("bad"))) {
            var input = loginBody("qa_guest_a", PASSWORD); input.put("username", username);
            assertEquals(400, send("POST", "/auth/login", null, input).getResponse().getStatus());
            assertEquals(OLD_LOGIN.toString(), userSnapshot(guestId).path("lastLogin").asText());
        }
        Assumptions.assumeTrue(false, "Q-A02: Umax/Pmax chưa được chốt; chỉ đã kiểm tra sai kiểu, chưa đủ ca.");
    }

    @Test
    void AUTH_IT_010_tokensUseDatabaseRolesAndIgnoreClientRoleInjection() throws Exception {
        for (String[] variant : List.of(new String[]{"qa_guest_a", "GUEST"}, new String[]{"qa_host", "HOST"}, new String[]{"qa_admin", "ADMIN"})) {
            var input = loginBody(variant[0], PASSWORD); input.put("roles", List.of("ADMIN"));
            var result = expect(send("POST", "/auth/login", null, input), 200, 200);
            for (String type : List.of("access_token", "refresh_token")) {
                var jwt = SignedJWT.parse(result.path("result").path(type).asText());
                assertTrue(jwt.verify(new MACVerifier(SECRET)));
                assertEquals(variant[1], jwt.getJWTClaimsSet().getStringClaim("scope"));
                assertEquals(variant[0], jwt.getJWTClaimsSet().getSubject());
            }
        }
        assertEquals(List.of("GUEST"), json.convertValue(userSnapshot(guestId).path("roles"), List.class));
        assertEquals(5, count("user_roles"));
    }

    @Test
    void AUTH_IT_011_loginAccessTokenWorksOnProtectedProfileEndpoint() throws Exception {
        var login = expect(send("POST", "/auth/login", null, loginBody("qa_guest_a", PASSWORD)), 200, 200);
        var before = userSnapshot(guestId);
        var profile = send("GET", "/api/users/myInformation", login.path("result").path("access_token").asText(), null);
        assertEquals(200, profile.getResponse().getStatus());
        var result = body(profile); // The spec requires result, not a body code on this endpoint.
        assertEquals(guestId.longValue(), result.path("result").path("id").asLong());
        assertEquals("qa_guest_a", result.path("result").path("username").asText());
        assertFalse(result.path("result").has("password"));
        assertEquals(before, userSnapshot(guestId));
    }

    @Test @Tag("proposal")
    void AUTH_IT_012_refreshTokenCannotAuthenticateProtectedEndpoint() throws Exception {
        var login = expect(send("POST", "/auth/login", null, loginBody("qa_guest_a", PASSWORD)), 200, 200);
        var before = userSnapshot(guestId);
        try {
            expectUnauthorized(send("GET", "/api/users/myInformation", login.path("result").path("refresh_token").asText(), null));
        } finally {
            assertEquals(before, userSnapshot(guestId));
            verify(blacklist, never()).invalidate(any(), any());
        }
    }

    @Test
    void AUTH_IT_013_introspectionExpiryBoundaryAndRevocation() {
        var now = Instant.now();
        assertAll(java.util.stream.IntStream.range(0, 4).mapToObj(variant -> () -> {
            reset(blacklist);
            var expiry = variant == 0 ? now.minusSeconds(1) : variant == 1 ? now : now.plusSeconds(60);
            when(blacklist.existsById("qa-jti")).thenReturn(variant == 3);
            var result = send("POST", "/auth/introspect", null,
                    Map.of("token", signedToken("qa_guest_a", "GUEST", "access", expiry, "qa-jti")));
            if (variant == 2) {
                var node = expect(result, 200, 200);
                assertTrue(node.path("result").path("vaild").asBoolean());
                assertEquals("Introspect valid!", node.path("message").asText());
            } else expectUnauthorized(result);
            verify(blacklist, never()).invalidate(any(), any());
            assertEquals(OLD_LOGIN.toString(), userSnapshot(guestId).path("lastLogin").asText());
        }));
    }

    @Test @Tag("proposal")
    void AUTH_IT_014_failedLastLoginWriteDoesNotReturnTokens() throws Exception {
        // An H2 constraint injects a real commit failure, with no production repository mocking.
        tx(() -> { em.createNativeQuery("ALTER TABLE users ADD CONSTRAINT qa_fail_login CHECK (last_login < TIMESTAMP '2021-01-01 00:00:00')").executeUpdate(); return null; });
        MvcResult result;
        try {
            result = send("POST", "/auth/login", null, loginBody("qa_guest_a", PASSWORD));
        } finally {
            tx(() -> { em.createNativeQuery("ALTER TABLE users DROP CONSTRAINT qa_fail_login").executeUpdate(); return null; });
        }
        assertEquals(OLD_LOGIN.toString(), userSnapshot(guestId).path("lastLogin").asText());
        assertFalse(body(result).has("result"));
        assertTrue(result.getResponse().getStatus() >= 500, "Q-A06: proposed controlled 5xx");
        assertFalse(body(result).path("message").asText().toLowerCase().contains("sql"));
    }
}
