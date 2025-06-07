package com.pbl5cnpm.airbnb_service.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.pbl5cnpm.airbnb_service.assistants.HMACutill;
import com.pbl5cnpm.airbnb_service.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.PaymentEntity;
import com.pbl5cnpm.airbnb_service.enums.BookingStatus;
import com.pbl5cnpm.airbnb_service.enums.ListingStatus;
import com.pbl5cnpm.airbnb_service.enums.PaymentStatus;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.repository.BookingRepository;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.repository.PaymentRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Transactional
public class PaymentControllerReturn {
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ListingsRepository listingsRepository;
    @Value("${vnpay.hashSecret}")
    private String vnp_HashSecret;

    @GetMapping("/vnpay-return")
    public String paymentReturn(HttpServletRequest request, Model model) throws UnsupportedEncodingException {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if (fieldName.startsWith("vnp_")) {
                fields.put(fieldName, fieldValue);
            }
        }

        String vnp_SecureHash = fields.remove("vnp_SecureHash");
        if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
            model.addAttribute("error", "Thiếu chữ ký.");
            return "payment-failed";
        }

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        for (String fieldName : fieldNames) {
            String value = fields.get(fieldName);
            if (value != null && !value.isEmpty()) {
                hashData.append(fieldName)
                        .append('=')
                        .append(URLEncoder.encode(value, StandardCharsets.US_ASCII.toString()))
                        .append('&');
            }
        }

        if (hashData.length() > 0) {
            hashData.deleteCharAt(hashData.length() - 1);
        }

        String checkHash = HMACutill.hmacSHA512(vnp_HashSecret, hashData.toString());

        if (!checkHash.equalsIgnoreCase(vnp_SecureHash)) {
            model.addAttribute("error", "Chữ ký không hợp lệ.");
            return "payment-failed";
        }

        String vnp_ResponseCode = fields.get("vnp_ResponseCode");
        String vnp_TxnRef = fields.get("vnp_TxnRef");
        String vnp_Amount = fields.get("vnp_Amount");
        String vnp_PayDate = fields.get("vnp_PayDate");
        String vnp_TransactionNo = fields.get("vnp_TransactionNo");
        // check transactionNo
        // var status =
        // this.paymentRepository.findByTransactionId(vnp_TransactionNo).isPresent();
        // if(status){
        // model.addAttribute("error", "Thanh toán thất bại");
        // return "payment-failed";
        // }
        String paymentCode = vnp_TxnRef;
        PaymentEntity paymentEntity = paymentRepository.findByCode(paymentCode)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_EXIST));

        if ("00".equals(vnp_ResponseCode)) {
            model.addAttribute("transactionId", vnp_TransactionNo);
            model.addAttribute("amount", formatAmount(vnp_Amount));
            model.addAttribute("paymentTime", formatPayDate(vnp_PayDate));
            paymentEntity.setStatus(PaymentStatus.SUCCESS.toString());
            this.paymentRepository.save(paymentEntity);
            BookingEntity booking = paymentEntity.getBooking();
            booking.setBookingStatus(BookingStatus.PAID.toString());
            this.bookingRepository.save(booking);
            // update to inactive listing
            ListingEntity listingEntity = paymentEntity.getBooking().getListing();
            listingEntity.setStatus(ListingStatus.OCCUPIED.toString());
            this.listingsRepository.save(listingEntity);
            return "vnpay-success";
        } else {
            paymentEntity.setStatus(PaymentStatus.FAILED.toString());
            this.paymentRepository.save(paymentEntity);
            //
            BookingEntity booking = paymentEntity.getBooking();
            booking.setBookingStatus(BookingStatus.FAILED.toString());
            this.bookingRepository.save(booking);
            model.addAttribute("error", "Thanh toán thất bại. Mã lỗi: " + vnp_ResponseCode);
            return "payment-failed";
        }
    }

    private String formatAmount(String rawAmount) {
        long amount = Long.parseLong(rawAmount) / 100;
        return String.format("%,d VND", amount).replace(",", ".");
    }

    private String formatPayDate(String payDate) {
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyyMMddHHmmss");
            SimpleDateFormat output = new SimpleDateFormat("dd/MM/yyyy - HH:mm");
            return output.format(input.parse(payDate));
        } catch (Exception e) {
            return "Không xác định";
        }
    }
}
