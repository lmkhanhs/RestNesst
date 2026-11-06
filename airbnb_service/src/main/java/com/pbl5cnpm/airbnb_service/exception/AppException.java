package com.pbl5cnpm.airbnb_service.exception;

public class AppException extends RuntimeException {
    
    public AppException(ErrorCode errorcode) {
        super(errorcode.getMessage());
        this.errorcode = errorcode;
    }

    private ErrorCode errorcode;

    public ErrorCode getErrorcode() {
        return errorcode;
    }

    public void setErrorcode(ErrorCode errorcode) {
        this.errorcode = errorcode;
    }
    
}
