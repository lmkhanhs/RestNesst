package com.pbl5cnpm.airbnb_service.repository.Custom;

import java.time.LocalDate;
import java.util.List;

import com.pbl5cnpm.airbnb_service.dto.Response.RatingPersentage;
import com.pbl5cnpm.airbnb_service.dto.Response.ReveneuStatistic;
import com.pbl5cnpm.airbnb_service.dto.Response.StatusReview;

public interface StatisticsRepositoryCustom {
    List<ReveneuStatistic> statisticSumRevenue(LocalDate startDate, LocalDate endDate);
    List<RatingPersentage> statisticRatingPersentage();
    List<StatusReview> statisticStatusReviewPersentage();
}
