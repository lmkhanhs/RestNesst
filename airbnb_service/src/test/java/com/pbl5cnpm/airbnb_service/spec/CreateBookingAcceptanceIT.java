package com.pbl5cnpm.airbnb_service.spec;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

import com.pbl5cnpm.airbnb_service.booking.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.booking.mapper.BookingMapper;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class CreateBookingAcceptanceIT extends SpecIntegrationSupport {
    private MvcResult book(Map<String, Object> input) throws Exception {
        return send("POST", "/api/bookings", token("qa_guest_a", "GUEST"), input);
    }

    private void noBookingOrPayment() {
        assertEquals(0, count("booked"), "no booking should have been committed");
        assertEquals(0, count("payments"));
    }

    private void clearBookings() {
        tx(() -> { em.createQuery("DELETE FROM BookingEntity").executeUpdate(); return null; });
    }

    private void rejectedWithoutWrite(Map<String, Object> input, int status) throws Exception {
        clearBookings();
        var result = book(input);
        assertAll(() -> assertEquals(status, result.getResponse().getStatus()), this::noBookingOrPayment);
    }

    @Test
    void BOOK_IT_001_validBookingResponseMatchesCommittedData() throws Exception {
        var userBefore = userSnapshot(guestId);
        var result = expect(book(bookingBody()), 200, 201);
        assertEquals("booking sucess", result.path("message").asText());
        var response = result.path("result");
        assertTrue(response.path("bookingId").isIntegralNumber());
        assertEquals(listingId.longValue(), response.path("listingId").asLong());
        assertEquals("PENDING", response.path("bookingStatus").asText());
        assertFalse(response.path("commented").asBoolean());
        assertEquals(d1.toString(), response.path("checkInDate").asText());
        assertEquals(d2.toString(), response.path("checkOutDate").asText());
        assertEquals(1000000d, response.path("totalPrice").asDouble());
        assertEquals("QA booking", response.path("content").asText());
        assertEquals("QA listing", response.path("title").asText());
        assertEquals("QA address", response.path("address").asText());
        assertEquals("QA city", response.path("city").asText());
        assertEquals(500000d, response.path("price").asDouble());
        assertTrue(response.path("paymentStatus").isMissingNode() || response.path("paymentStatus").isNull());
        tx(() -> {
            var entity = em.find(BookingEntity.class, response.path("bookingId").asLong());
            assertEquals(guestId, entity.getUser().getId());
            assertEquals(listingId, entity.getListing().getId());
            assertEquals(d1, entity.getCheckInDate()); assertEquals(d2, entity.getCheckOutDate());
            assertEquals(1000000d, entity.getTotalPrice()); assertEquals("QA booking", entity.getContent());
            assertEquals("PENDING", entity.getBookingStatus());
            assertFalse(entity.getCommented()); assertFalse(entity.getDeleted());
            assertNotNull(entity.getCreatedAt()); assertNotNull(entity.getUpdatedAt());
            assertNull(entity.getPayment()); assertEquals("AVAILABLE", entity.getListing().getStatus());
            return null;
        });
        assertEquals(1, count("booked")); assertEquals(0, count("payments"));
        assertEquals(userBefore, userSnapshot(guestId)); assertEquals(5, count("user_roles"));
    }

    @Test
    void BOOK_IT_002_anonymousCannotCreateBooking() throws Exception {
        expectUnauthorized(send("POST", "/api/bookings", null, bookingBody()));
        noBookingOrPayment();
    }

    @Test @Tag("proposal")
    void BOOK_IT_003_expiredTamperedRevokedAndRefreshTokensCannotBook() {
        assertAll(java.util.stream.Stream.of("expired", "tampered", "revoked", "refresh").map(variant -> () -> {
            reset(blacklist);
            String jwt = signedToken("qa_guest_a", "GUEST", variant.equals("refresh") ? "refresh" : "access",
                    Instant.now().plusSeconds(variant.equals("expired") ? -60 : 600), "qa-revocation");
            if (variant.equals("tampered")) {
                var parsed = com.nimbusds.jwt.SignedJWT.parse(jwt);
                parsed.sign(new com.nimbusds.jose.crypto.MACSigner("other-spec-only-signing-key-".repeat(5)));
                jwt = parsed.serialize();
            }
            if (variant.equals("revoked")) when(blacklist.existsById("qa-revocation")).thenReturn(true);
            try { expectUnauthorized(send("POST", "/api/bookings", jwt, bookingBody())); }
            finally { noBookingOrPayment(); verify(blacklist, never()).invalidate(any(), any()); }
        }));
    }

    @Test
    void BOOK_IT_004_clientCannotOverrideOwnerStatusOrFlags() throws Exception {
        var input = bookingBody(); input.put("userId", otherId); input.put("username", "qa_guest_b");
        input.put("user", Map.of("id", otherId)); input.put("bookingStatus", "PAID");
        input.put("deleted", true); input.put("commented", true);
        var result = expect(book(input), 200, 201);
        tx(() -> {
            var booking = em.find(BookingEntity.class, result.path("result").path("bookingId").asLong());
            assertEquals(guestId, booking.getUser().getId());
            assertEquals("PENDING", booking.getBookingStatus());
            assertFalse(booking.getCommented()); assertFalse(booking.getDeleted()); return null;
        });
        assertEquals(1, count("booked")); assertEquals(0, count("payments"));
    }

    @Test @Tag("proposal")
    void BOOK_IT_005_missingListingReturnsNotFound() throws Exception {
        var input = bookingBody(); input.put("listingId", 999999999L);
        rejectedWithoutWrite(input, 404);
    }

    @Test @Tag("proposal")
    void BOOK_IT_006_invalidListingIdsAreValidationErrors() {
        assertAll(java.util.stream.Stream.of("omitted", "null", "zero", "negative", "text", "overflow").map(variant -> () -> {
            var input = bookingBody();
            switch (variant) {
                case "omitted" -> input.remove("listingId");
                case "null" -> input.put("listingId", null);
                case "zero" -> input.put("listingId", 0);
                case "negative" -> input.put("listingId", -1);
                case "text" -> input.put("listingId", "abc");
                default -> input.put("listingId", new java.math.BigInteger("9223372036854775808"));
            }
            rejectedWithoutWrite(input, 400);
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_007_missingOrNullDatesDoNotCreateBooking() {
        assertAll(java.util.stream.Stream.of("checkInDate", "checkOutDate", "both-null").map(variant -> () -> {
            var input = bookingBody();
            if (variant.equals("both-null")) { input.put("checkInDate", null); input.put("checkOutDate", null); }
            else input.remove(variant);
            rejectedWithoutWrite(input, 400);
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_008_zeroOrNegativeNightsAreRejected() {
        assertAll(java.util.stream.Stream.of(d1, d1.minusDays(1)).map(checkout -> () -> {
            var input = bookingBody(); input.put("checkOutDate", checkout.toString());
            rejectedWithoutWrite(input, 400);
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_009_pastTodayAndOneNightBoundaries() {
        tx(() -> {
            em.find(ListingEntity.class, listingId).setStartDate(LocalDate.now().minusDays(2));
            return null;
        });
        assertAll(java.util.stream.IntStream.range(0, 3).mapToObj(variant -> () -> {
            clearBookings();
            var input = bookingBody();
            var checkin = variant == 0 ? LocalDate.now().minusDays(1) : variant == 1 ? LocalDate.now() : d1;
            input.put("checkInDate", checkin.toString()); input.put("checkOutDate", checkin.plusDays(1).toString());
            input.put("totalPrice", 500000d);
            var result = book(input);
            if (variant == 0) assertAll(() -> assertEquals(400, result.getResponse().getStatus()), this::noBookingOrPayment);
            else expect(result, 200, 201); // Provisional: same-day and one-night bookings are allowed.
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_010_invalidDatesAndLeapYearRoundTrip() throws Exception {
        tx(() -> {
            var listing = em.find(ListingEntity.class, listingId);
            listing.setStartDate(LocalDate.of(2027, 1, 1));
            listing.setEndDate(LocalDate.of(2028, 12, 31));
            return null;
        });
        assertAll(java.util.stream.Stream.of("31/12/2028", "2027-02-29", "2028-02-30").map(date -> () -> {
            var input = bookingBody(); input.put("checkInDate", date);
            rejectedWithoutWrite(input, 400);
        }));
        var input = bookingBody(); input.put("checkInDate", "2028-02-29"); input.put("checkOutDate", "2028-03-01");
        input.put("totalPrice", 500000d);
        var result = expect(book(input), 200, 201);
        assertEquals("2028-02-29", result.path("result").path("checkInDate").asText());
    }

    @Test @Tag("proposal")
    void BOOK_IT_011_nullZeroNegativePricesCannotBePersistedAsSuccessfulTotals() {
        assertAll(Arrays.asList(null, 0d, -1d).stream().map(price -> () -> {
            clearBookings(); var input = bookingBody(); input.put("totalPrice", price);
            var result = book(input);
            if (result.getResponse().getStatus() < 300) {
                assertEquals(1000000d, body(result).path("result").path("totalPrice").asDouble(), "Q-B03 provisional 2 nights x listing price");
                assertEquals(1000000d, tx(() -> em.createQuery("SELECT b.totalPrice FROM BookingEntity b", Double.class).getSingleResult()));
            } else noBookingOrPayment();
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_012_clientCannotChooseArbitraryPriceOrInfinity() {
        assertAll(java.util.stream.Stream.of("1", "999999", "1000001", "1000000.001", "1e309").map(price -> () -> {
            clearBookings();
            String input = json.writeValueAsString(bookingBody()).replace("1000000.0", price);
            var result = mvc.perform(post("/api/bookings").header("Authorization", "Bearer " + token("qa_guest_a", "GUEST"))
                    .contentType(MediaType.APPLICATION_JSON).content(input)).andReturn();
            if (result.getResponse().getStatus() < 300) {
                assertEquals(1000000d, body(result).path("result").path("totalPrice").asDouble(), "Q-B03 provisional server-computed price");
            } else noBookingOrPayment();
            assertEquals(0, count("payments"));
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_013_unavailableDeletedOrUnapprovedListingCannotBeBooked() {
        assertAll(java.util.stream.Stream.of("deleted", "unapproved", "INACTIVE", "OCCUPIED").map(variant -> () -> {
            tx(() -> {
                var listing = em.find(ListingEntity.class, listingId);
                listing.setDeleted(variant.equals("deleted")); listing.setAccess(!variant.equals("unapproved"));
                listing.setStatus(variant.equals("INACTIVE") || variant.equals("OCCUPIED") ? variant : "AVAILABLE"); return null;
            });
            rejectedWithoutWrite(bookingBody(), 409);
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_014_listingCalendarBoundary() {
        LocalDate start = d1.minusDays(1), end = d2.plusDays(1);
        LocalDate[][] ranges = {{start.minusDays(1), start.plusDays(1)}, {start, start.plusDays(1)},
                {end.minusDays(1), end}, {end, end.plusDays(1)}};
        assertAll(java.util.stream.IntStream.range(0, 4).mapToObj(variant -> () -> {
            clearBookings(); var input = bookingBody(); input.put("checkInDate", ranges[variant][0].toString());
            input.put("checkOutDate", ranges[variant][1].toString()); input.put("totalPrice", variant == 0 ? 1000000d : 500000d);
            var result = book(input);
            if (variant == 0 || variant == 3) assertAll(() -> assertEquals(409, result.getResponse().getStatus()), this::noBookingOrPayment);
            else expect(result, 200, 201);
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_015_overlappingBookingsAndAdjacentCheckoutBoundary() {
        LocalDate[][] ranges = {{d1, d2}, {d1.plusDays(1), d2.plusDays(1)}, {d1.minusDays(1), d1.plusDays(1)},
                {d1.minusDays(1), d2.plusDays(1)}, {d2, d2.plusDays(1)}};
        assertAll(java.util.stream.IntStream.range(0, ranges.length).mapToObj(variant -> () -> {
            clearBookings();
            expect(book(bookingBody()), 200, 201);
            var input = bookingBody(); input.put("checkInDate", ranges[variant][0].toString()); input.put("checkOutDate", ranges[variant][1].toString());
            input.put("totalPrice", java.time.temporal.ChronoUnit.DAYS.between(ranges[variant][0], ranges[variant][1]) * 500000d);
            var result = book(input);
            if (variant < 4) assertAll(() -> assertEquals(409, result.getResponse().getStatus()), () -> assertEquals(1, count("booked")));
            else { expect(result, 200, 201); assertEquals(2, count("booked")); }
        }));
    }

    @Test @Tag("proposal")
    void BOOK_IT_016_concurrentBookingsCannotReserveTheSameSingleSlot() throws Exception {
        String jwt = token("qa_guest_a", "GUEST"); var start = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            Callable<MvcResult> task = () -> { assertTrue(start.await(5, TimeUnit.SECONDS)); return send("POST", "/api/bookings", jwt, bookingBody()); };
            var first = pool.submit(task); var second = pool.submit(task); start.countDown();
            var statuses = new ArrayList<>(List.of(first.get(10, TimeUnit.SECONDS).getResponse().getStatus(), second.get(10, TimeUnit.SECONDS).getResponse().getStatus()));
            Collections.sort(statuses);
            assertAll(() -> assertEquals(List.of(200, 409), statuses, "Q-B05 provisional one-slot policy"),
                    () -> assertEquals(1, count("booked")), () -> assertEquals(0, count("payments")));
        } finally { pool.shutdownNow(); }
    }

    @Test @Tag("proposal")
    void BOOK_IT_017_malformedEmptyAndUnsupportedMediaTypeAreRejected() throws Exception {
        String jwt = token("qa_guest_a", "GUEST");
        assertAll(java.util.stream.Stream.of("{\"listingId\":", "", "text/plain").map(variant -> () -> {
            var builder = post("/api/bookings").header("Authorization", "Bearer " + jwt);
            if (variant.equals("text/plain")) builder.contentType(MediaType.TEXT_PLAIN).content(json.writeValueAsString(bookingBody()));
            else builder.contentType(MediaType.APPLICATION_JSON).content(variant);
            var result = mvc.perform(builder).andReturn();
            assertEquals(variant.equals("text/plain") ? 415 : 400, result.getResponse().getStatus());
            noBookingOrPayment();
        }));
    }

    @Test @Tag("observation")
    void BOOK_IT_018_optionalContentRoundTripsAndUnspecifiedMaxLength() throws Exception {
        for (String content : Arrays.asList(null, "", "   ", "Ghi chú đặt phòng tiếng Việt")) {
            clearBookings(); var input = bookingBody(); input.put("content", content);
            var result = expect(book(input), 200, 201);
            assertEquals(content, tx(() -> em.find(BookingEntity.class, result.path("result").path("bookingId").asLong()).getContent()));
        }
        Assumptions.assumeTrue(false, "Q-B08: optional/required content and max length not approved; only round-trip characterized.");
    }

    @Test @Tag("proposal")
    void BOOK_IT_019_lockedAccountWithPreviouslyIssuedTokenCannotBook() throws Exception {
        var login = expect(send("POST", "/auth/login", null, loginBody("qa_guest_a", PASSWORD)), 200, 200);
        tx(() -> { em.find(UserEntity.class, guestId).setIsActive(false); return null; });
        var result = send("POST", "/api/bookings", login.path("result").path("access_token").asText(), bookingBody());
        assertAll(() -> assertTrue(Set.of(401, 403).contains(result.getResponse().getStatus())), this::noBookingOrPayment);
    }

    @Test @Tag("observation")
    void BOOK_IT_020_authenticatedHostAdminAndNoRoleUserBookingPolicy() throws Exception {
        // Characterizes current authenticated-only policy; does not approve Q-B06.
        for (String[] variant : List.of(new String[]{"qa_host", "HOST"}, new String[]{"qa_admin", "ADMIN"}, new String[]{"qa_no_role", ""})) {
            clearBookings();
            if (variant[0].equals("qa_host")) tx(() -> {
                em.find(ListingEntity.class, listingId).setHost(em.find(UserEntity.class, otherId)); return null;
            });
            var result = expect(send("POST", "/api/bookings", token(variant[0], variant[1]), bookingBody()), 200, 201);
            assertEquals(variant[0], tx(() -> em.find(BookingEntity.class, result.path("result").path("bookingId").asLong()).getUser().getUsername()));
        }
        Assumptions.assumeTrue(false, "Q-B06: role policy not approved; authenticated-only behavior characterized.");
    }

    @Test @Tag("proposal")
    void BOOK_IT_021_deletedPrincipalCannotCreateBooking() throws Exception {
        String jwt = token("qa_guest_a", "GUEST");
        tx(() -> { em.remove(em.find(UserEntity.class, guestId)); return null; });
        var result = send("POST", "/api/bookings", jwt, bookingBody());
        noBookingOrPayment(); assertEquals(5, count("users")); expectUnauthorized(result);
    }

    @Test @Tag("proposal")
    void BOOK_IT_022_responseMappingFailureMustNotLeaveCommittedBooking() throws Exception {
        BookingMapper mapper = context.getBean(BookingMapper.class);
        doThrow(new IllegalStateException("simulated response mapping failure")).when(mapper).toBookingResponse(any());
        MvcResult result;
        try { result = book(bookingBody()); }
        finally { reset(mapper); }
        assertAll(() -> assertTrue(result.getResponse().getStatus() >= 500), this::noBookingOrPayment);
    }

    @Test @Tag("proposal")
    void BOOK_IT_023_retryCannotCreateSecondBookingForOneLogicalRequest() throws Exception {
        expect(book(bookingBody()), 200, 201); // Simulate client losing this response before retry.
        var retry = book(bookingBody());
        assertEquals(1, count("booked"), "Q-B05/Q-B10 provisional single booking policy");
        assertTrue(Set.of(200, 201, 409).contains(retry.getResponse().getStatus()));
        assertEquals(0, count("payments"));
    }
}
