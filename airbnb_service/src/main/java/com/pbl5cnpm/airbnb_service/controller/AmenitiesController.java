package com.pbl5cnpm.airbnb_service.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.AutoConfigureOrder;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudinary.Api;
import com.pbl5cnpm.airbnb_service.dto.Request.AmenitiesRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateAmenities;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitesForAdmin;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitiesResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.service.AmenitiesService;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
public class AmenitiesController {
    @Autowired
    private AmenitiesService amenitiesService;

    @GetMapping("/api/amenities")
    public ApiResponse<List<AmenitiesResponse>> getAllClient() {
        var result = this.amenitiesService.handleGetAll();
        return ApiResponse.<List<AmenitiesResponse>>builder()
                .result(result)
                .message("Get amenities successfully!")
                .code(200)
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(value = "/api/amenities", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AmenitiesResponse> createAminities(@ModelAttribute AmenitiesRequest amenitiesRequest) {
        return ApiResponse.<AmenitiesResponse>builder()
                .code(201)
                .message("create amenities succeccfully!")
                .result(this.amenitiesService.handleCreateAmenities(amenitiesRequest))
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/api/amenities/index")
    public ApiResponse<List<AmenitesForAdmin>> getAllForAdmin() {
        return ApiResponse.<List<AmenitesForAdmin>>builder()
                .code(200)
                .message("get amenities for admin")
                .result(this.amenitiesService.handleGetAllForAdmin())
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping(value = "/api/amenities/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AmenitesForAdmin> updateAmenities(@PathVariable Long id,
            @ModelAttribute UpdateAmenities amenities) {
        return ApiResponse.<AmenitesForAdmin>builder()
                .code(200)
                .message("update amenities by admin")
                .result(this.amenitiesService.handleUpdate(id, amenities))
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping(value = "/api/amenities/{id}")
    public ApiResponse<Void> deleteAmenities(@PathVariable Long id) {
        this.amenitiesService.handleDeleted(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("delete Amenities succeccfully by admin")
                .build();

    }

}
