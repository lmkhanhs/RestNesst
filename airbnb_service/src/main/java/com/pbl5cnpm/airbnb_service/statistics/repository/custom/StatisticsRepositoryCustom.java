package com.pbl5cnpm.airbnb_service.statistics.repository.custom;

import java.time.LocalDate;
import java.util.List;

import com.pbl5cnpm.airbnb_service.statistics.dto.response.RatingPersentage;
import com.pbl5cnpm.airbnb_service.statistics.dto.response.ReveneuStatistic;
import com.pbl5cnpm.airbnb_service.statistics.dto.response.StatusReview;

public interface StatisticsRepositoryCustom {
    List<ReveneuStatistic> statisticSumRevenue(LocalDate startDate, LocalDate endDate);
    List<RatingPersentage> statisticRatingPersentage();
    List<StatusReview> statisticStatusReviewPersentage();
}
