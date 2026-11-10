package com.pbl5cnpm.airbnb_service.spec;

import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import java.util.concurrent.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

class HostApplicationAcceptanceIT extends SpecIntegrationSupport {
    private MvcResult apply(Long id, Map<String, Object> input) throws Exception {
        return send("POST", "/api/users/host/apply", token(id.equals(hostId) ? "qa_host" : "qa_guest_a", id.equals(hostId) ? "HOST" : "GUEST"), input);
    }

    private MvcResult admin(String method, Long id) throws Exception {
        return send(method, "/api/users/host/status/" + id, token("qa_admin", "ADMIN"), null);
    }

    private void assertApplied(String description) {
        var snapshot = userSnapshot(guestId);
        assertTrue(snapshot.path("pending").asBoolean());
        assertEquals(description, snapshot.path("description").asText());
        assertEquals("QA Country", snapshot.path("country").asText());
        assertEquals(json.valueToTree(List.of("GUEST")), snapshot.path("roles"));
        assertEquals(json.valueToTree(List.of(viId, enId).stream().sorted().toList()), snapshot.path("languages"));
        assertEquals(6, count("users"));
    }

    @Test
    void HOST_IT_001_validApplicationPersistsProfileAndLanguages() throws Exception {
        var otherBefore = userSnapshot(otherId);
        var result = expect(apply(guestId, applyBody(guestId)), 200, 200);
        assertEquals("Apply to host success", result.path("message").asText());
        assertApplied("QA application");
        assertEquals("QA Host", userSnapshot(guestId).path("fullname").asText());
        assertEquals(2, userSnapshot(guestId).path("years").asInt());
        assertEquals(2, count("user_languages")); assertEquals(5, count("user_roles"));
        assertEquals(otherBefore, userSnapshot(otherId));
    }

    @Test
    void HOST_IT_002_repeatApplicationUpdatesSameUser() throws Exception {
        expect(apply(guestId, applyBody(guestId)), 200, 200);
        var updated = applyBody(guestId); updated.put("description", "QA updated");
        updated.put("experience", "4 năm kinh nghiệm"); updated.put("didHostYear", 4);
        expect(apply(guestId, updated), 200, 200);
        assertApplied("QA updated");
        assertEquals(4, userSnapshot(guestId).path("years").asInt());
        assertEquals(2, count("user_languages")); assertEquals(5, count("user_roles"));
    }

    @Test
    void HOST_IT_003_anonymousCannotApply() throws Exception {
        var before = userSnapshot(guestId);
        expectUnauthorized(send("POST", "/api/users/host/apply", null, applyBody(guestId)));
        assertEquals(before, userSnapshot(guestId)); assertEquals(0, count("user_languages"));
    }

    @Test @Tag("proposal")
    void HOST_IT_004_cannotApplyForAnotherUser() throws Exception {
        var before = userSnapshot(otherId);
        var result = apply(guestId, applyBody(otherId));
        assertAll(() -> assertEquals(403, result.getResponse().getStatus()),
                () -> assertEquals(before, userSnapshot(otherId), "other user's profile must not change"));
    }

    @Test @Tag("proposal")
    void HOST_IT_005_missingNullZeroNegativeAndWrongTypeUserId() {
        assertAll(java.util.stream.Stream.of("omitted", "null", "zero", "negative", "text").map(variant -> () -> {
            var input = applyBody(guestId);
            switch (variant) {
                case "omitted" -> input.remove("userId");
                case "null" -> input.put("userId", null);
                case "zero" -> input.put("userId", 0);
                case "negative" -> input.put("userId", -1);
                default -> input.put("userId", "abc");
            }
            var before = userSnapshot(guestId);
            var result = apply(guestId, input);
            assertEquals(before, userSnapshot(guestId));
            assertEquals(400, result.getResponse().getStatus(), variant);
            if (variant.equals("omitted") || variant.equals("null")) assertEquals(1011, body(result).path("code").asInt());
        }));
    }

    @Test
    void HOST_IT_006_countryValidationAndTrimming() throws Exception {
        assertAll(Arrays.asList(null, "", "   ", "QA Missing Country").stream().map(country -> () -> {
            var input = applyBody(guestId); input.put("country", country);
            var before = userSnapshot(guestId);
            expect(apply(guestId, input), 400, 1014);
            assertEquals(before, userSnapshot(guestId)); assertEquals(0, count("user_languages"));
        }));
        var trimmed = applyBody(guestId); trimmed.put("country", "  QA Country  ");
        expect(apply(guestId, trimmed), 200, 200);
        assertApplied("QA application");
    }

    @Test
    void HOST_IT_007_invalidLanguagesRollBackEarlierProfileChanges() {
        assertAll(java.util.stream.Stream.of("missing", "deleted", "inactive").map(variant -> () -> {
            tx(() -> {
                var language = em.find(LanguageEntity.class, enId);
                language.setDeleted(variant.equals("deleted")); language.setIsActive(!variant.equals("inactive"));
                return null;
            });
            var input = applyBody(guestId);
            if (variant.equals("missing")) input.put("languageIds", List.of(viId, 999999999L));
            var before = userSnapshot(guestId);
            expect(apply(guestId, input), 400, 1027);
            assertEquals(before, userSnapshot(guestId)); assertEquals(0, count("user_languages"));
        }));
    }

    @Test
    void HOST_IT_008_languageIdsAreDeduplicatedAndOverrideFreeText() throws Exception {
        var input = applyBody(guestId); input.put("languageIds", List.of(viId, enId, viId));
        input.put("language", "Uncatalogued QA language");
        expect(apply(guestId, input), 200, 200);
        assertApplied("QA application"); assertEquals(2, count("user_languages"));
        assertEquals(Set.of("QA Vietnamese", "QA English"), tx(() ->
                new HashSet<>(Arrays.asList(em.find(UserEntity.class, guestId).getLanguages().split(", ")))));
    }

    @Test @Tag("proposal")
    void HOST_IT_009_requiredProfileFieldsAndUnspecifiedLengthLimits() {
        assertAll(java.util.stream.Stream.of("fullname:omitted", "fullname:blank", "description:omitted",
                "description:blank", "experience:omitted", "experience:blank", "languages:empty").map(variant -> () -> {
            createIsolatedFixture();
            String field = variant.split(":")[0];
            var input = applyBody(guestId);
            if (field.equals("languages")) { input.put("languageIds", List.of()); input.put("language", null); }
            else {
                if (variant.endsWith("omitted")) input.remove(field); else input.put(field, "");
                if (field.equals("experience")) input.put("didHostYear", null);
            }
            var before = userSnapshot(guestId);
            var result = apply(guestId, input);
            assertAll(() -> assertEquals(400, result.getResponse().getStatus(), field),
                    () -> assertEquals(before, userSnapshot(guestId)));
        }));
        Assumptions.assumeTrue(false, "Q-H03/Q-H04: required fields and max lengths need approval.");
    }

    @Test
    void HOST_IT_010_existingHostCannotApplyAgain() throws Exception {
        var before = userSnapshot(hostId);
        expect(apply(hostId, applyBody(hostId)), 400, 1011);
        assertEquals(before, userSnapshot(hostId));
    }

    @Test
    void HOST_IT_011_adminListsOnlyPendingApplicationsWithoutCredentials() throws Exception {
        expect(apply(guestId, applyBody(guestId)), 200, 200);
        var before = userSnapshot(guestId);
        var result = expect(send("GET", "/api/users/host/apply", token("qa_admin", "ADMIN"), null), 200, 200);
        JsonNode list = result.path("result"); assertEquals(1, list.size());
        assertEquals(guestId.longValue(), list.get(0).path("id").asLong());
        assertEquals("QA Country", list.get(0).path("country").asText());
        assertEquals(Set.of(viId, enId), json.convertValue(list.get(0).path("languageIds"), new com.fasterxml.jackson.core.type.TypeReference<Set<Long>>() {}));
        assertFalse(list.get(0).has("password")); assertFalse(list.get(0).has("hostApplicationPending"));
        assertEquals(before, userSnapshot(guestId));
    }

    @Test
    void HOST_IT_012_emptyPendingListIsArray() throws Exception {
        var result = expect(send("GET", "/api/users/host/apply", token("qa_admin", "ADMIN"), null), 200, 200);
        assertTrue(result.path("result").isArray()); assertEquals(0, result.path("result").size());
        assertEquals("get user want to apply host", result.path("message").asText());
    }

    @Test
    void HOST_IT_013_guestAndHostCannotListApplications() {
        assertAll(java.util.stream.Stream.of("GUEST", "HOST").map(role -> () -> {
            var result = expect(send("GET", "/api/users/host/apply", token(role.equals("GUEST") ? "qa_guest_a" : "qa_host", role), null), 403, 1010);
            assertEquals("Error: Authority", result.path("message").asText());
            assertEquals("user have no permisson!", result.path("result").asText());
        }));
    }

    @Test @Tag("proposal")
    void HOST_IT_014_anonymousCannotListApplications() throws Exception {
        expectUnauthorized(send("GET", "/api/users/host/apply", null, null));
    }

    @Test
    void HOST_IT_015_approvalCommitsHostRoleAndClearsPendingTogether() throws Exception {
        expect(apply(guestId, applyBody(guestId)), 200, 200);
        var before = userSnapshot(guestId);
        var result = expect(admin("PUT", guestId), 200, 200);
        assertEquals("add role host successfully", result.path("message").asText());
        var after = userSnapshot(guestId);
        assertFalse(after.path("pending").asBoolean());
        assertEquals(json.valueToTree(List.of("GUEST", "HOST")), after.path("roles"));
        assertEquals(before.path("languages"), after.path("languages"));
        assertEquals(before.path("description"), after.path("description"));
        assertEquals(6, count("user_roles")); assertEquals(6, count("users")); assertEquals(1, count("listings"));
    }

    @Test
    void HOST_IT_016_approvalWithoutApplicationIsRejected() throws Exception {
        var before = userSnapshot(guestId);
        expect(admin("PUT", guestId), 400, 1011);
        assertEquals(before, userSnapshot(guestId)); assertEquals(5, count("user_roles"));
    }

    @Test
    void HOST_IT_017_repeatedApprovalDoesNotDuplicateRole() throws Exception {
        pending(guestId, true); expect(admin("PUT", guestId), 200, 200);
        var before = userSnapshot(guestId);
        var result = expect(admin("PUT", guestId), 200, 200);
        assertEquals("user had role host", result.path("message").asText());
        assertEquals(before, userSnapshot(guestId)); assertEquals(6, count("user_roles"));
    }

    @Test
    void HOST_IT_018_nonAdminsCannotApprove() {
        pending(guestId, true);
        assertAll(java.util.stream.Stream.of("GUEST", "HOST").map(role -> () -> {
            var before = userSnapshot(guestId);
            expect(send("PUT", "/api/users/host/status/" + guestId, token(role.equals("GUEST") ? "qa_guest_a" : "qa_host", role), null), 403, 1010);
            assertEquals(before, userSnapshot(guestId));
        }));
    }

    @Test
    void HOST_IT_019_anonymousCannotApproveOrReject() {
        pending(guestId, true);
        assertAll(java.util.stream.Stream.of("PUT", "DELETE").map(method -> () -> {
            var before = userSnapshot(guestId);
            expectUnauthorized(send(method, "/api/users/host/status/" + guestId, null, null));
            assertEquals(before, userSnapshot(guestId));
        }));
    }

    @Test
    void HOST_IT_020_rejectionPreservesProfileLanguagesAndGuestRole() throws Exception {
        expect(apply(guestId, applyBody(guestId)), 200, 200);
        var before = (com.fasterxml.jackson.databind.node.ObjectNode) userSnapshot(guestId);
        var result = expect(admin("DELETE", guestId), 200, 200);
        assertEquals("Reject to host ", result.path("message").asText());
        before.put("pending", false);
        assertEquals(before, userSnapshot(guestId)); assertEquals(6, count("users"));
    }

    @Test
    void HOST_IT_021_nonAdminsCannotReject() {
        pending(guestId, true);
        assertAll(java.util.stream.Stream.of("GUEST", "HOST").map(role -> () -> {
            var before = userSnapshot(guestId);
            expect(send("DELETE", "/api/users/host/status/" + guestId, token(role.equals("GUEST") ? "qa_guest_a" : "qa_host", role), null), 403, 1010);
            assertEquals(before, userSnapshot(guestId));
        }));
    }

    @Test
    void HOST_IT_022_canApplyAgainAfterRejection() throws Exception {
        expect(apply(guestId, applyBody(guestId)), 200, 200); expect(admin("DELETE", guestId), 200, 200);
        var input = applyBody(guestId); input.put("description", "QA resubmitted");
        expect(apply(guestId, input), 200, 200);
        assertApplied("QA resubmitted"); assertEquals(2, count("user_languages"));
    }

    @Test @Tag("proposal")
    void HOST_IT_023_missingUserAndMissingHostRoleDoNotMutateApplicant() {
        assertAll(
                () -> { var result = admin("PUT", 999999999L); assertEquals(404, result.getResponse().getStatus(), "Q-H06 proposed 404"); },
                () -> {
                    pending(guestId, true);
                    tx(() -> {
                        em.find(UserEntity.class, hostId).getRoles().clear(); em.flush();
                        em.remove(em.find(RoleEntity.class, hostRoleId)); return null;
                    });
                    var before = userSnapshot(guestId);
                    expect(admin("PUT", guestId), 500, 1001);
                    assertEquals(before, userSnapshot(guestId));
                });
    }

    @Test @Tag("proposal")
    void HOST_IT_024_commitFailureRollsBackRoleAndPending() throws Exception {
        pending(guestId, true);
        var before = userSnapshot(guestId);
        tx(() -> { em.createNativeQuery("ALTER TABLE users ADD CONSTRAINT qa_fail_approval CHECK (id <> " + guestId + " OR host_application_pending = TRUE)").executeUpdate(); return null; });
        MvcResult result;
        try { result = admin("PUT", guestId); }
        finally { tx(() -> { em.createNativeQuery("ALTER TABLE users DROP CONSTRAINT qa_fail_approval").executeUpdate(); return null; }); }
        assertEquals(before, userSnapshot(guestId)); assertEquals(5, count("user_roles"));
        assertTrue(result.getResponse().getStatus() >= 500, "proposed controlled 5xx");
        assertFalse(body(result).has("result"));
        assertFalse(body(result).path("message").asText().toLowerCase().contains("sql"));
    }

    @Test @Tag("observation")
    void HOST_IT_025_concurrentApprovalAndRejectionPreserveRoleUniqueness() throws Exception {
        pending(guestId, true);
        String adminToken = token("qa_admin", "ADMIN");
        var start = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            Future<MvcResult> approve = pool.submit(() -> { assertTrue(start.await(5, TimeUnit.SECONDS)); return send("PUT", "/api/users/host/status/" + guestId, adminToken, null); });
            Future<MvcResult> reject = pool.submit(() -> { assertTrue(start.await(5, TimeUnit.SECONDS)); return send("DELETE", "/api/users/host/status/" + guestId, adminToken, null); });
            start.countDown();
            assertTrue(approve.get(10, TimeUnit.SECONDS).getResponse().getStatus() < 500);
            assertTrue(reject.get(10, TimeUnit.SECONDS).getResponse().getStatus() < 500);
            var after = userSnapshot(guestId);
            assertFalse(after.path("pending").asBoolean());
            assertEquals("QA original", after.path("fullname").asText());
            assertTrue(after.path("roles").toString().contains("GUEST"));
            assertEquals(0L, tx(() -> ((Number) em.createNativeQuery(
                    "SELECT COUNT(*) FROM (SELECT user_id, role_id FROM user_roles GROUP BY user_id, role_id HAVING COUNT(*) > 1) duplicate_roles")
                    .getSingleResult()).longValue()));
        } finally { pool.shutdownNow(); }
        Assumptions.assumeTrue(false, "Q-H08: chỉ kiểm tra invariant; chưa chốt thứ tự thắng/thua hoặc HTTP 409, chưa nghiệm thu đồng thời trên MySQL.");
    }
}
