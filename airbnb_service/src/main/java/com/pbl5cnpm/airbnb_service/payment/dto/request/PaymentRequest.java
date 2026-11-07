package com.pbl5cnpm.airbnb_service.payment.dto.request;

import java.time.LocalDate;

import jakarta.persistence.Column;
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
public class PaymentRequest {
    Long bookingId;
    @Column(unique = true, nullable = false)
    String content;
}
