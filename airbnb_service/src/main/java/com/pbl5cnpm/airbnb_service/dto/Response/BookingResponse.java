package com.pbl5cnpm.airbnb_service.dto.Response;

import java.time.LocalDate;
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
public class BookingResponse {
    Long bookingId;
    Long listingId;
    String primaryUrl;
    String title;
    Double avgStart;
    Boolean popular;
    String address;
    String city;
    Double price;
    String area;
    LocalDate checkInDate;
    LocalDate checkOutDate;
    Double totalPrice;
    String content;
    String bookingStatus;
    Boolean commented;
    String paymentStatus;
}
