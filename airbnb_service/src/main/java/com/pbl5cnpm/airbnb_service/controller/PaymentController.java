package com.pbl5cnpm.airbnb_service.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.assistants.HMACutill;
import com.pbl5cnpm.airbnb_service.dto.Request.PaymentRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.PaymentResponse;
import com.pbl5cnpm.airbnb_service.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.entity.PaymentEntity;
import com.pbl5cnpm.airbnb_service.enums.BookingStatus;
import com.pbl5cnpm.airbnb_service.enums.PaymentMethod;
import com.pbl5cnpm.airbnb_service.enums.PaymentStatus;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.repository.BookingRepository;
import com.pbl5cnpm.airbnb_service.repository.PaymentRepository;
import com.pbl5cnpm.airbnb_service.service.PaymentService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    @Value("${vnpay.tmnCode}")
    private String vnp_TmnCode;

    @Value("${vnpay.hashSecret}")
    private String vnp_HashSecret;

    @Value("${vnpay.payUrl}")
    private String vnp_PayUrl;

    @Value("${vnpay.returnUrl}")
    private String vnp_Returnurl;

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/counts")
    public ApiResponse<Long> getCounts() {
        return ApiResponse.<Long>builder()
                .code(200)
                .message("get counts payments")
                .result(this.paymentService.counts())
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/amount")
    public ApiResponse<Double> getAount() {
        return ApiResponse.<Double>builder()
                .code(200)
                .message("Get total invoice amount")
                .result(this.paymentService.getTotePayment())
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/data")
    public ApiResponse<List<PaymentResponse>> getPayment(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        return ApiResponse.<List<PaymentResponse>>builder()
                .code(200)
                .message("Get payment by page")
                .result(this.paymentService.handleGetPayment(pageable))
                .build();
    }

    @PostMapping("/create-payment")
    public ApiResponse<String> createPayment(
            @RequestParam("paymethod") String method,
            @RequestBody PaymentRequest body,
            HttpServletRequest request) throws UnsupportedEncodingException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        if (method.equals("VnPay")) {
            String ipClient = getClientIp(request);
            String toUrl = createVNPay(ipClient, body, username);
            return ApiResponse.<String>builder()
                    .code(200)
                    .message("Create payment successfully")
                    .result(toUrl)
                    .build();
        }

        return null;
    }

    private String createVNPay(String ipClient, PaymentRequest body, String username)
            throws UnsupportedEncodingException {

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_OrderType = "other";
        String vnp_Locale = "vn";
        String vnp_CurrCode = "VND";
        String vnp_IpAddr = ipClient;
        String vnp_CreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());

        Long bookingId = body.getBookingId();
        BookingEntity bookingEntity = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXIT));

        String currentStatus = bookingEntity.getBookingStatus();

        if (BookingStatus.PAID.toString().equals(currentStatus)) {
            throw new AppException(ErrorCode.BOOKING_DIFFERECES_PAID);
        }

        bookingEntity.setBookingStatus(BookingStatus.CONFIRMED.toString());
        bookingRepository.save(bookingEntity);

        //
        PaymentEntity entity = PaymentEntity.builder()
                .payMethod(PaymentMethod.VNPAY.toString())
                .status(PaymentStatus.PENDING.toString())
                .booking(bookingEntity)
                .transactionId(UUID.randomUUID().toString())
                .content(body.getContent())
                .code(UUID.randomUUID().toString())
                .createdDate(LocalDateTime.now())
                .build();
        entity = this.paymentRepository.save(entity);
        //
        String vnp_TxnRef = entity.getCode();
        int vnp_Amount = (int) Math.round(bookingEntity.getTotalPrice() * 100);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(vnp_Amount));
        vnp_Params.put("vnp_CurrCode", vnp_CurrCode);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang: " + bookingId);
        vnp_Params.put("vnp_OrderType", vnp_OrderType);
        vnp_Params.put("vnp_Locale", vnp_Locale);
        vnp_Params.put("vnp_ReturnUrl", vnp_Returnurl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String value = vnp_Params.get(fieldName);
            if (value != null && !value.isEmpty()) {
                String encodedValue = URLEncoder.encode(value, StandardCharsets.UTF_8.toString());
                hashData.append(fieldName).append('=').append(encodedValue).append('&');
                query.append(fieldName).append('=').append(encodedValue).append('&');
            }
        }
        hashData.setLength(hashData.length() - 1);
        query.setLength(query.length() - 1);

        String secureHash = HMACutill.hmacSHA512(vnp_HashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        return vnp_PayUrl + "?" + query.toString();
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}