package com.pbl5cnpm.airbnb_service.booking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pbl5cnpm.airbnb_service.booking.dto.response.HostBookingResponse;
import com.pbl5cnpm.airbnb_service.booking.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.booking.enums.BookingStatus;
import com.pbl5cnpm.airbnb_service.booking.mapper.BookingMapper;
import com.pbl5cnpm.airbnb_service.booking.repository.BookingRepository;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.role.enums.RoleName;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class BookingServiceHostTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingMapper bookingMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ListingsRepository listingsRepository;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void handleGetBookingsForHostReturnsMappedBookings() {
        UserEntity host = buildUser(10L, "host01", RoleName.HOST.name());
        UserEntity guest = buildUser(20L, "guest01", RoleName.GUEST.name());
        ListingEntity listing = ListingEntity.builder()
                .id(101L)
                .title("Ocean View Homestay")
                .host(host)
                .build();
        BookingEntity booking = buildBooking(
                501L, listing, guest, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12), 1_000_000.0, "PENDING");
        HostBookingResponse mapped = HostBookingResponse.builder()
                .bookingId(501L)
                .listingId(101L)
                .title("Ocean View Homestay")
                .guestName("guest01")
                .bookingStatus("PENDING")
                .totalPrice(1_000_000.0)
                .build();

        when(userRepository.findByUsername("host01")).thenReturn(Optional.of(host));
        when(bookingRepository.findAllByListingHost(host)).thenReturn(List.of(booking));
        when(bookingMapper.toHostBookingResponse(booking)).thenReturn(mapped);

        List<HostBookingResponse> result = bookingService.handleGetBookingsForHost("host01");

        assertEquals(1, result.size());
        assertEquals(501L, result.get(0).getBookingId());
        assertEquals("Ocean View Homestay", result.get(0).getTitle());
    }

    @Test
    void handleUpdateBookingStatusByHostConfirmsPendingBookingForOwner() {
        UserEntity host = buildUser(10L, "host01", RoleName.HOST.name());
        UserEntity guest = buildUser(20L, "guest01", RoleName.GUEST.name());
        ListingEntity listing = ListingEntity.builder().id(101L).host(host).build();
        BookingEntity booking = buildBooking(
                501L, listing, guest, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12), 1_000_000.0, "PENDING");

        when(userRepository.findByUsername("host01")).thenReturn(Optional.of(host));
        when(bookingRepository.findById(501L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(bookingMapper.toHostBookingResponse(booking)).thenReturn(
                HostBookingResponse.builder().bookingId(501L).bookingStatus(BookingStatus.CONFIRMED.name()).build());

        HostBookingResponse updated = bookingService.handleUpdateBookingStatusByHost("host01", 501L, "confirmed");

        assertEquals(BookingStatus.CONFIRMED.name(), booking.getBookingStatus());
        assertEquals(BookingStatus.CONFIRMED.name(), updated.getBookingStatus());
    }

    @Test
    void handleUpdateBookingStatusByHostRejectsDifferentHost() {
        UserEntity ownerHost = buildUser(10L, "host01", RoleName.HOST.name());
        UserEntity otherHost = buildUser(11L, "host02", RoleName.HOST.name());
        UserEntity guest = buildUser(20L, "guest01", RoleName.GUEST.name());
        ListingEntity listing = ListingEntity.builder().id(101L).host(ownerHost).build();
        BookingEntity booking = buildBooking(
                501L, listing, guest, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12), 1_000_000.0, "PENDING");

        when(userRepository.findByUsername("host02")).thenReturn(Optional.of(otherHost));
        when(bookingRepository.findById(501L)).thenReturn(Optional.of(booking));

        AppException ex = assertThrows(AppException.class,
                () -> bookingService.handleUpdateBookingStatusByHost("host02", 501L, "CONFIRMED"));

        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void handleUpdateBookingStatusByHostRejectsCancellingPaidBooking() {
        UserEntity host = buildUser(10L, "host01", RoleName.HOST.name());
        UserEntity guest = buildUser(20L, "guest01", RoleName.GUEST.name());
        ListingEntity listing = ListingEntity.builder().id(101L).host(host).build();
        BookingEntity booking = buildBooking(
                501L, listing, guest, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12), 1_000_000.0, "PAID");

        when(userRepository.findByUsername("host01")).thenReturn(Optional.of(host));
        when(bookingRepository.findById(501L)).thenReturn(Optional.of(booking));

        AppException ex = assertThrows(AppException.class,
                () -> bookingService.handleUpdateBookingStatusByHost("host01", 501L, "CANCELLED"));

        assertEquals(ErrorCode.INVALID, ex.getErrorcode());
        verify(bookingRepository, never()).save(any());
    }

    private BookingEntity buildBooking(
            Long id,
            ListingEntity listing,
            UserEntity guest,
            LocalDate checkIn,
            LocalDate checkOut,
            Double totalPrice,
            String status) {
        return BookingEntity.builder()
                .id(id)
                .listing(listing)
                .user(guest)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .totalPrice(totalPrice)
                .bookingStatus(status)
                .deleted(false)
                .commented(false)
                .build();
    }

    private UserEntity buildUser(Long id, String username, String roleName) {
        RoleEntity role = new RoleEntity();
        role.setRoleName(roleName);
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setUsername(username);
        user.setRoles(Set.of(role));
        return user;
    }
}
