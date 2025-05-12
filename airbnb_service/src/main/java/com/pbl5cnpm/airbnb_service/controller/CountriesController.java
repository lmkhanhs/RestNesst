package com.pbl5cnpm.airbnb_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.pbl5cnpm.airbnb_service.AirbnbServiceApplication;
import com.pbl5cnpm.airbnb_service.dto.Request.CountryResquest;
import com.pbl5cnpm.airbnb_service.dto.Request.CoutriesRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CountryDetailResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CoutriesResponse;
import com.pbl5cnpm.airbnb_service.service.CoutriesService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api")

public class CountriesController {

    private final CoutriesService coutriesService;

    CountriesController(CoutriesService coutriesService) {
        this.coutriesService = coutriesService;
    }
    @PostMapping(value = "/countries", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CountryDetailResponse>> createCountries(@ModelAttribute CountryResquest coutryRequest){
        ApiResponse<CountryDetailResponse> apiResponse = ApiResponse.<CountryDetailResponse>builder()
                                                    .result(this.coutriesService.handleCreateCounties(coutryRequest))
                                                    .code(201)
                                                    .message("create country success!")
                                                    .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }
    @GetMapping("/countries")
    public ApiResponse<List<CoutriesResponse>> getallCountries(){
        return ApiResponse.<List<CoutriesResponse>>builder()
                    .result(this.coutriesService.handleGetAll())
                    .message("get all countries successfully!")
                    .build();
    }
    @GetMapping("/countries/detail")
    public ApiResponse<List<CountryDetailResponse>> getALldetail() {
        List<CountryDetailResponse> result = this.coutriesService.handlegetDetail();
        return ApiResponse.<List<CountryDetailResponse>>builder()
                        .code(200)
                        .message("get detail country")
                        .result(result)
                        .build();
    }
    
}
