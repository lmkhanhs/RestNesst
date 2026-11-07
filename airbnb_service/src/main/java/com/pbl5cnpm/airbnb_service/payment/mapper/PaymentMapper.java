package com.pbl5cnpm.airbnb_service.payment.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;

import com.pbl5cnpm.airbnb_service.payment.dto.response.PaymentResponse;
import com.pbl5cnpm.airbnb_service.payment.entity.PaymentEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;

@Mapper(componentModel = "spring")
public abstract class PaymentMapper {
    @Mappings({
        @Mapping(source = "payMethod", target = "payment_method"),
        @Mapping(source = "booking.totalPrice", target = "amount"),
        @Mapping(source = "booking.user.username", target = "username")
    })
    public abstract PaymentResponse toPaymentResponse(PaymentEntity paymentEntity);

}
