package com.pbl5cnpm.airbnb_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.PaymentEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {
    Optional<PaymentEntity> findByTransactionId(String transactionId);
    Optional<PaymentEntity> findByCode(String code);
    @Query(value = "SELECT SUM(b.total_price) FROM payments p JOIN booked b ON p.booking_id = b.id WHERE p.status = 'SUCCESS'", nativeQuery = true)
    Double getTotalRevenue();


}
