package com.pbl5cnpm.airbnb_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "booked")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    
    UserEntity user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)

    ListingEntity listing;
    LocalDate checkInDate;
    LocalDate checkOutDate;
    Double totalPrice;
    Boolean deleted;
    Boolean commented;

    String content;
    String bookingStatus;
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    private PaymentEntity payment;
}
