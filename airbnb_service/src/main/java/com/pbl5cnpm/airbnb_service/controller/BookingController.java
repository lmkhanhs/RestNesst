package com.pbl5cnpm.airbnb_service.controller;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.dto.Request.BookingRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.BookingResponse;
import com.pbl5cnpm.airbnb_service.service.BookingService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping("/bookings")
    public ApiResponse<BookingResponse> booking(@RequestBody BookingRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return ApiResponse.<BookingResponse>builder()
                .message("booking sucess")
                .code(201)
                .result(this.bookingService.handleBooking(request, username))
                .build();
    }

    @GetMapping("/bookings/my")
    public ApiResponse<List<BookingResponse>> getMyBooking() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        List<BookingResponse> responses = this.bookingService.bookingResponse(username);
        return ApiResponse.<List<BookingResponse>>builder()
                .code(200)
                .message("get my booked list")
                .result(responses)
                .build();
    }

    @PutMapping("/bookings/{id}")
    public ApiResponse<BookingResponse> pressReturn(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        BookingResponse res = this.bookingService.handlePressReturn(username, id);
        return ApiResponse.<BookingResponse>builder()
                .code(200)
                .message("return listing succcsessfully!")
                .result(res)
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/bookings/dasboards")
    public ApiResponse<List<BookingResponse>> getBoookingbyAdmin( 
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.<List<BookingResponse>>builder()
                .code(200)
                .message("Get booking by page")
                .result(this.bookingService.handlerGetBookingForAdmin(pageable))
                .build();
    }
    
}
