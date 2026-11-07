package com.pbl5cnpm.airbnb_service.auth.controller;

import java.text.ParseException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.nimbusds.jose.JOSEException;
import com.pbl5cnpm.airbnb_service.auth.dto.request.AuthenticationResquest;
import com.pbl5cnpm.airbnb_service.auth.dto.request.ForgetPasswordRequest;
import com.pbl5cnpm.airbnb_service.auth.dto.request.IntrospectRequest;
import com.pbl5cnpm.airbnb_service.auth.dto.request.LogoutRequest;
import com.pbl5cnpm.airbnb_service.auth.dto.request.RefreshTokenRequest;
import com.pbl5cnpm.airbnb_service.shared.dto.response.ApiResponse;
import com.pbl5cnpm.airbnb_service.auth.dto.response.AuthenticationResponse;
import com.pbl5cnpm.airbnb_service.auth.dto.response.IntrospectResponse;
import com.pbl5cnpm.airbnb_service.auth.service.AuthenticationService;

import jakarta.mail.MessagingException;

@RestController
public class AuthenticationController {
    @Autowired
    private AuthenticationService authenticationService;
    @PostMapping("auth/login")
    public ApiResponse<AuthenticationResponse> login(@RequestBody AuthenticationResquest resquest) throws JOSEException{
        var result = this.authenticationService.authenticate(resquest);
        return  ApiResponse.<AuthenticationResponse>builder()
                            .result(result)
                            .code(200)
                            .message("Login succesfully!")
                            .build();
    }
    @PostMapping("auth/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest introspectRequest) throws JOSEException, ParseException{

        return ApiResponse.<IntrospectResponse>builder()
                        .result(this.authenticationService.introspect(introspectRequest))
                        .code(200)
                        .message("Introspect valid!")
                        .build();   
    }
    @PostMapping("auth/logout")
    public ResponseEntity<Void> logout(@RequestBody LogoutRequest logoutRequest) {
        
        this.authenticationService.handleLogout(logoutRequest);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build(); // 204
    }
    @PostMapping("auth/refresh")
    public ApiResponse<AuthenticationResponse> refreshToken(@RequestBody RefreshTokenRequest refreshTokenRequest) throws JOSEException {
        
        var result =  this.authenticationService.handleRefreshToken(refreshTokenRequest.getRefresh_token());
        
        return ApiResponse.<AuthenticationResponse>builder()
                                .code(HttpStatus.OK.value())
                                .message("refresh token succesfully")
                                .result(result)
                                .build();
    }
    @PostMapping("auth/forget")
    public ApiResponse<Void> postMethodName(@RequestBody ForgetPasswordRequest request) throws MessagingException {
        boolean result = this.authenticationService.handleForgetPass(request);
        return ApiResponse.<Void>builder()
                        .code(200)
                        .message("update new pass")
                        .build();
    }
}
