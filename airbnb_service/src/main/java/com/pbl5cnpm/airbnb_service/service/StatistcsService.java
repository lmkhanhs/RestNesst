package com.pbl5cnpm.airbnb_service.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Response.RatingPersentage;
import com.pbl5cnpm.airbnb_service.dto.Response.ReveneuStatistic;
import com.pbl5cnpm.airbnb_service.dto.Response.StatisticCountUser;
import com.pbl5cnpm.airbnb_service.dto.Response.StatusReview;
import com.pbl5cnpm.airbnb_service.repository.StatisticRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StatistcsService {
    private final UserRepository userRepository;
    private final StatisticRepository statisticRepository;

    public List<StatisticCountUser> handleCountUserStatisticByDay(LocalDate startDate, LocalDate endDate) {
        if (endDate == null)
            endDate = LocalDate.now();

        return this.userRepository.statisticCountUserByDay(startDate, endDate);
    }

    public List<ReveneuStatistic> handRevenueStatisticByDay(LocalDate startDate, LocalDate endDate) {
        if (endDate == null)
            endDate = LocalDate.now();
        return this.statisticRepository.statisticSumRevenue(startDate, endDate);
    }

    public List<RatingPersentage> handleRatingPersentage() {
        return this.statisticRepository.statisticRatingPersentage();
    }

    public List<StatusReview> handleStatusReview(){
        return this.statisticRepository.statisticStatusReviewPersentage();
    }
}
