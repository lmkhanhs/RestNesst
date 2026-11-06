package com.pbl5cnpm.airbnb_service.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public enum ErrorCode {
    USER_EXISTED(1000,"user existd", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_NOT_EXISTED(1009,"user not existd",   HttpStatus.INTERNAL_SERVER_ERROR),
    ROLE_NOT_EXISTED(1001,"role not exited!",  HttpStatus.INTERNAL_SERVER_ERROR),
    USERNAME_EXISTED(1002, "username exited!",  HttpStatus.INTERNAL_SERVER_ERROR),
    USERNAME_VALID(1003,"username is vaild!",  HttpStatus.INTERNAL_SERVER_ERROR),
    PASSWORD_VALID(1004,"password is vaild!",  HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(105, "invalid key",  HttpStatus.INTERNAL_SERVER_ERROR),
    COUNTRY_EXISTED(1007,"countriy existed!", HttpStatus.INTERNAL_SERVER_ERROR),
    LISTING_NOT_EXISTED(1008,"listing not existed!",  HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(106, "unauthenticated! || token is invalid ", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1010, "user have no permisson!", HttpStatus.FORBIDDEN),
    INVALID(1011, "data invalid", HttpStatus.BAD_REQUEST),
    FAVORITE_NOT_EXISTED(1012, "favorite not exited", HttpStatus.BAD_REQUEST),
    TRANSACTION_EXISTED(1013, "transaction exited", HttpStatus.BAD_REQUEST),
    COUNTRY_NOT_EXISTED(1014,"countriy not existed!", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1015, "password invalid", HttpStatus.BAD_REQUEST),
    PASSWORD_CONFIRM_NOT_MATCH(1016, "password confirm not match", HttpStatus.BAD_REQUEST),
    BOOKING_NOT_EXIT(1017,"booking not exits", HttpStatus.BAD_GATEWAY),
    BOOKING_DIFFERECES_PAID(1018,"booking not paid", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_EXIST(1019, "payment not exits", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_EXIT(1020, "catecory not exit", HttpStatus.BAD_REQUEST),
    EMENITIES_NOT_EXIT(1021, "amenities not exit", HttpStatus.BAD_REQUEST),
    ACCOUNT_NOT_ACCESS(1022,"account not acccess", HttpStatus.BAD_REQUEST),
    LISTING_NOT_ADMIN_OR_HOST(1023, "listing not of admin or host", HttpStatus.BAD_REQUEST)
    ;
    ErrorCode(int code, String message, HttpStatus httpStatus){
        this.code = code;
        this.message = message;     
        this.httpStatus = httpStatus;
    }
    private int code;
    private String message;
    private HttpStatus httpStatus;
    
}
