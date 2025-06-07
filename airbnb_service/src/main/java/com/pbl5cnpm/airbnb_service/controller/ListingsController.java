package com.pbl5cnpm.airbnb_service.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.dto.Request.ListingRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.ReviewRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateListingRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingDetailResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingResponseManager;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingResponseManagerForHost;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingsResponse;
import com.pbl5cnpm.airbnb_service.service.ListingsServices;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.base.path}")
@RequiredArgsConstructor
@Slf4j
public class ListingsController {
    private final ListingsServices listingsServices;

    @GetMapping("/listings")
    public ApiResponse<List<ListingsResponse>> getAll() {
        ApiResponse apiResponse = ApiResponse.<List<ListingsResponse>>builder()
                .code(200)
                .message("feetch listing successfuly!")
                .result(this.listingsServices.handleGetAll())
                .build();
        return apiResponse;
    }

    @GetMapping("/listings/{id}")
    public ApiResponse<ListingDetailResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.<ListingDetailResponse>builder()
                .code(200)
                .message("get detail successfully!")
                .result(this.listingsServices.getDetail(id))
                .build();
    }

    @PreAuthorize("hasAuthority('HOST') or hasAuthority('ADMIN')")
    @PostMapping(value = "/listings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ListingsResponse>> creaeListing(@ModelAttribute ListingRequest request) throws IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        ApiResponse<ListingsResponse> apiResponse = ApiResponse.<ListingsResponse>builder()
                .message("Create listing successfully")
                .code(201)
                .result(this.listingsServices.handlleCreate(request, username))
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/listings/counts")
    public ApiResponse<Long> getcounts() {
        return ApiResponse.<Long>builder()
                .code(200)
                .message("get count listing")
                .result(this.listingsServices.getCount())
                .build();
    }

    @GetMapping("/listings/search")
    public ApiResponse<List<ListingsResponse>> search(
            @RequestParam(name = "keyword", required = true, defaultValue = " ") String param) {
        return ApiResponse.<List<ListingsResponse>>builder()
                .code(200)
                .message("get listring by key")
                .result(this.listingsServices.handlerSearch(param))
                .build();
    }

    @GetMapping("/listings/filter")
    public ApiResponse<List<ListingsResponse>> filter(
            @RequestParam Map<String, String> args,
            @RequestParam(name = "amenities", required = false) List<String> amenities) {

        return ApiResponse.<List<ListingsResponse>>builder()
                .code(200)
                .message("get listing by key")
                .result(this.listingsServices.handlerfilter(args, amenities))
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/listings/access/{id}")
    public ApiResponse<Void> statusAccess(@PathVariable Long id, @RequestParam Boolean status) {
        this.listingsServices.handleAccessStatus(status, id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("update status " + status)
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/listings/all")
    public ApiResponse<List<ListingResponseManager>> getFullAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<List<ListingResponseManager>>builder()
                .code(200)
                .message("get full all listings")
                .result(this.listingsServices.handlegetfullAll())
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/listings/{id}")
    public ApiResponse<Void> deletedListing(@PathVariable Long id) {
        this.listingsServices.handleDelete(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("delete success!")
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/listings/{id}/{position}")
    public ApiResponse<Void> changPosition(@PathVariable Long id, @PathVariable Long position) {
        this.listingsServices.handleChangePosition(id, position);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("change position")
                .build();
    }

    @PreAuthorize("hasAuthority('HOST')")
    @GetMapping("/listings/host")
    public ApiResponse<List<ListingResponseManagerForHost>> getListingByHost() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return ApiResponse.<List<ListingResponseManagerForHost>>builder()
                .code(200)
                .message("get listing by host")
                .result(this.listingsServices.getListingHost(username))
                .build();
    }

    @PreAuthorize("hasAuthority('HOST')")
    @PutMapping(value = "/listings/host", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ListingsResponse> update(@ModelAttribute UpdateListingRequest listingRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return ApiResponse.<ListingsResponse>builder()
                .code(200)
                .message("update listing by host")
                .result(this.listingsServices.handleUpdateListingByHost(username, listingRequest))
                .build();
    }

    @PostMapping(value = "/listings/reviews/{id}",  consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> createCommnet(@ModelAttribute ReviewRequest request, @PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        this.listingsServices.handleAddReview(request, username, id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Add comment successfully!")
                .build();
    }
}
