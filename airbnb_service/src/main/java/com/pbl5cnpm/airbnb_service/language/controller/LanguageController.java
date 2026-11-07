package com.pbl5cnpm.airbnb_service.language.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.language.dto.request.LanguageRequest;
import com.pbl5cnpm.airbnb_service.language.dto.request.UpdateLanguageRequest;
import com.pbl5cnpm.airbnb_service.language.dto.response.LanguageDetailResponse;
import com.pbl5cnpm.airbnb_service.language.dto.response.LanguageResponse;
import com.pbl5cnpm.airbnb_service.language.service.LanguageService;
import com.pbl5cnpm.airbnb_service.shared.dto.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageService languageService;

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/languages")
    public ResponseEntity<ApiResponse<LanguageDetailResponse>> createLanguage(
            @RequestBody LanguageRequest request) {
        ApiResponse<LanguageDetailResponse> apiResponse = ApiResponse.<LanguageDetailResponse>builder()
                .result(this.languageService.handleCreateLanguage(request))
                .code(201)
                .message("create language success!")
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @GetMapping("/languages")
    public ApiResponse<List<LanguageResponse>> getAllLanguages() {
        return ApiResponse.<List<LanguageResponse>>builder()
                .code(200)
                .result(this.languageService.handleGetAll())
                .message("get all languages successfully!")
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/languages/detail")
    public ApiResponse<List<LanguageDetailResponse>> getAllDetail() {
        return ApiResponse.<List<LanguageDetailResponse>>builder()
                .code(200)
                .message("get detail languages")
                .result(this.languageService.handleGetDetail())
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/languages")
    public ApiResponse<LanguageDetailResponse> updateLanguage(
            @RequestBody UpdateLanguageRequest request) {
        return ApiResponse.<LanguageDetailResponse>builder()
                .code(200)
                .message("update language")
                .result(this.languageService.handleUpdate(request))
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/languages/{id}")
    public ApiResponse<Void> deleteLanguage(@PathVariable Long id) {
        this.languageService.handleDeleted(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("delete successfully!")
                .build();
    }
}
