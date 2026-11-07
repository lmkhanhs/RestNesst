package com.pbl5cnpm.airbnb_service.booking.dto.request;


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
public class BookingRequest {
    Long listingId;
    LocalDate checkInDate;
    LocalDate checkOutDate;
    Double totalPrice;
    String content;
}
