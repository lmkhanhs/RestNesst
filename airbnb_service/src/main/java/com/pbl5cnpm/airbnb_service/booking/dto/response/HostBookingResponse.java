package com.pbl5cnpm.airbnb_service.booking.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostBookingResponse {
    Long bookingId;
    Long listingId;
    String primaryUrl;
    String title;
    String address;
    String city;
    Double price;
    Long guestId;
    String guestName;
    String guestUsername;
    String guestEmail;
    String guestAvatar;
    LocalDate checkInDate;
    LocalDate checkOutDate;
    Double totalPrice;
    String content;
    String bookingStatus;
    String paymentStatus;
    Boolean commented;
    LocalDateTime createdAt;
}
