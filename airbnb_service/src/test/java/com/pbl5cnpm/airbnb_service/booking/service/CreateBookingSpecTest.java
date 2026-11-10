package com.pbl5cnpm.airbnb_service.booking.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.pbl5cnpm.airbnb_service.booking.controller.BookingController;
import com.pbl5cnpm.airbnb_service.booking.dto.request.BookingRequest;
import com.pbl5cnpm.airbnb_service.booking.dto.response.BookingResponse;
import com.pbl5cnpm.airbnb_service.booking.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.booking.mapper.BookingMapper;
import com.pbl5cnpm.airbnb_service.booking.repository.BookingRepository;
import com.pbl5cnpm.airbnb_service.listing.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

class CreateBookingSpecTest {
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final BookingMapper mapper = mock(BookingMapper.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ListingsRepository listings = mock(ListingsRepository.class);
    private final BookingService service = new BookingService(bookings, mapper, users, listings);
    private final BookingRequest request = BookingRequest.builder().listingId(93001L)
            .checkInDate(LocalDate.of(2030, 1, 7)).checkOutDate(LocalDate.of(2030, 1, 9))
            .totalPrice(1000000d).content("QA booking").build();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void BOOK_UT_001_assignsPrincipalAndInitialStateBeforeSaving() {
        var user = UserEntity.builder().id(91001L).username("qa_guest_a").build();
        var entity = new BookingEntity();
        var saved = new BookingEntity();
        saved.setId(95001L);
        var response = BookingResponse.builder().bookingId(95001L).build();
        when(users.findByUsername("qa_guest_a")).thenReturn(Optional.of(user));
        when(mapper.toBookingEntity(request)).thenReturn(entity);
        when(bookings.save(entity)).thenAnswer(invocation -> {
            assertSame(user, entity.getUser());
            assertEquals("PENDING", entity.getBookingStatus());
            assertEquals(false, entity.getCommented());
            assertEquals(false, entity.getDeleted());
            assertNull(entity.getPayment());
            return saved;
        });
        when(mapper.toBookingResponse(saved)).thenReturn(response);
        assertSame(response, service.handleBooking(request, "qa_guest_a"));
        verify(bookings).save(same(entity));
        verify(mapper).toBookingResponse(same(saved));
        verifyNoInteractions(listings);
    }

    @Test
    void BOOK_UT_002_realMapperRejectsMissingListing() {
        BookingMapper realMapper = Mappers.getMapper(BookingMapper.class);
        ReflectionTestUtils.setField(realMapper, "listingsRepository", listings);
        request.setListingId(999999999L);
        when(listings.findById(999999999L)).thenReturn(Optional.empty());
        assertEquals(ErrorCode.LISTING_NOT_EXISTED,
                assertThrows(AppException.class, () -> realMapper.toBookingEntity(request)).getErrorcode());
        verify(listings).findById(999999999L);
        verifyNoMoreInteractions(listings);
        verifyNoInteractions(bookings, users);
    }

    @Test
    void BOOK_UT_003_realResponseMapperHandlesNullEmptyAndSingleImage() {
        BookingMapper realMapper = Mappers.getMapper(BookingMapper.class);
        var listing = ListingEntity.builder().id(93001L).title("QA listing").price(500000d).build();
        var entity = BookingEntity.builder().id(95001L).listing(listing).checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate()).totalPrice(1000000d).content("QA booking")
                .bookingStatus("PENDING").commented(false).deleted(false).build();
        for (int variant = 0; variant < 3; variant++) {
            listing.setImagesEntities(variant == 0 ? null : variant == 1 ? List.of()
                    : List.of(ImagesEntity.builder().imageUrl("/uploads/qa.jpg").build()));
            var response = realMapper.toBookingResponse(entity);
            assertEquals(95001L, response.getBookingId());
            assertEquals(93001L, response.getListingId());
            assertEquals(request.getCheckInDate(), response.getCheckInDate());
            assertEquals(request.getCheckOutDate(), response.getCheckOutDate());
            assertEquals(1000000d, response.getTotalPrice());
            assertEquals("QA booking", response.getContent());
            assertEquals("PENDING", response.getBookingStatus());
            assertEquals(false, response.getCommented());
            assertEquals(variant == 2 ? "/uploads/qa.jpg" : null, response.getPrimaryUrl());
            assertNull(response.getPaymentStatus());
            assertNull(entity.getPayment());
            assertEquals("PENDING", entity.getBookingStatus());
        }
        verifyNoInteractions(bookings, users, listings);
    }

    @Test
    void BOOK_UT_004_saveFailureDoesNotMapSuccessOrUpdateListing() {
        var entity = new BookingEntity();
        when(users.findByUsername("qa_guest_a")).thenReturn(Optional.of(new UserEntity()));
        when(mapper.toBookingEntity(request)).thenReturn(entity);
        var failure = new DataAccessResourceFailureException("simulated persistence failure");
        when(bookings.save(entity)).thenThrow(failure);
        assertSame(failure, assertThrows(DataAccessResourceFailureException.class,
                () -> service.handleBooking(request, "qa_guest_a")));
        verify(mapper, never()).toBookingResponse(any());
        verifyNoInteractions(listings);
    }

    @Test
    void BOOK_UT_005_controllerPassesUsernameFromSecurityContext() {
        BookingService serviceDouble = mock(BookingService.class);
        var response = BookingResponse.builder().bookingId(95001L).build();
        when(serviceDouble.handleBooking(request, "qa_guest_a")).thenReturn(response);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("qa_guest_a", null, List.of()));
        var result = new BookingController(serviceDouble).booking(request);
        assertEquals(201, result.getCode());
        assertEquals("booking sucess", result.getMessage());
        assertSame(response, result.getResult());
        verify(serviceDouble).handleBooking(same(request), eq("qa_guest_a"));
        verifyNoMoreInteractions(serviceDouble);
        verifyNoInteractions(bookings, users, listings);
    }
}
