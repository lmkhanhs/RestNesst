package com.pbl5cnpm.airbnb_service.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.RatingPersentage;
import com.pbl5cnpm.airbnb_service.dto.Response.ReveneuStatistic;
import com.pbl5cnpm.airbnb_service.dto.Response.StatisticCountUser;
import com.pbl5cnpm.airbnb_service.dto.Response.StatusReview;
import com.pbl5cnpm.airbnb_service.service.StatistcsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@PreAuthorize("hasAuthority('ADMIN')")
public class StatisticsController {
    private final StatistcsService statistcsService;

    @GetMapping("/statistic/users/counts")
    public ApiResponse<List<StatisticCountUser>> getCountUserStatistics(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        return ApiResponse.<List<StatisticCountUser>>builder()
                .code(200)
                .message("Statistic count users by day")
                .result(this.statistcsService.handleCountUserStatisticByDay(start, end))
                .build();
    }

    @GetMapping("/statistic/payments/revenue")
    public ApiResponse<List<ReveneuStatistic>> getRevenueStatics(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ApiResponse.<List<ReveneuStatistic>>builder()
                .code(200)
                .message("Statistic revenue by day")
                .result(this.statistcsService.handRevenueStatisticByDay(start, end))
                .build();
    }

    @GetMapping("/statistic/rating")
    public ApiResponse<List<RatingPersentage>> getRatingPersentage() {
        return ApiResponse.<List<RatingPersentage>>builder()
                .code(200)
                .message("Statistic rating persentage")
                .result(this.statistcsService.handleRatingPersentage())
                .build();
    }

    @GetMapping("/statistic/reviews/status")
    public ApiResponse<List<StatusReview>> handleStatisReviews( ) {
        return ApiResponse.<List<StatusReview>>builder()
                .code(200)
                .message("Statisic status review")
                .result(this.statistcsService.handleStatusReview())
                .build();
    }

}
