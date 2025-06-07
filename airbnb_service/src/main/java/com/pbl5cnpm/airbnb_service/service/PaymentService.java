package com.pbl5cnpm.airbnb_service.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Response.PaymentResponse;
import com.pbl5cnpm.airbnb_service.entity.PaymentEntity;
import com.pbl5cnpm.airbnb_service.mapper.PaymentMapper;
import com.pbl5cnpm.airbnb_service.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;

    public Long counts() {
        return this.paymentRepository.count();
    }

    public Double getTotePayment() {
        return this.paymentRepository.getTotalRevenue();
    }

    public List<PaymentResponse> handleGetPayment(Pageable pageable) {
        Page<PaymentEntity> entyties = this.paymentRepository.findAll(pageable);
        List<PaymentEntity> payments = entyties.getContent();

        return payments.stream()
                .map(item -> this.paymentMapper.toPaymentResponse(item))
                .toList();
    }
}
