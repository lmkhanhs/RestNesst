package com.pbl5cnpm.airbnb_service.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentEntity  {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String payMethod;
    String status;
    String transactionId;
    String content;
    String code ;
    LocalDateTime createdDate;
    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private BookingEntity booking;
}
