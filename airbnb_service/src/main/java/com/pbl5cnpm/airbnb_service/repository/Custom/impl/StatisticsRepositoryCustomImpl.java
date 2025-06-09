package com.pbl5cnpm.airbnb_service.repository.Custom.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.dto.Response.RatingPersentage;
import com.pbl5cnpm.airbnb_service.dto.Response.ReveneuStatistic;
import com.pbl5cnpm.airbnb_service.dto.Response.StatusReview;
import com.pbl5cnpm.airbnb_service.repository.Custom.StatisticsRepositoryCustom;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

@Repository
public class StatisticsRepositoryCustomImpl implements StatisticsRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<ReveneuStatistic> statisticSumRevenue(LocalDate startDate, LocalDate endDate) {
        StringBuilder sql = new StringBuilder();
        sql.append(" SELECT DATE(p.created_date) AS day, SUM(b.total_price) ");
        sql.append(" FROM booked AS b JOIN payments AS p ON b.id = p.booking_id ");
        sql.append(" WHERE DATE(p.created_date) BETWEEN :startDate and :endDate ");
        sql.append(" GROUP BY DATE(p.created_date) ");
        sql.append(" ORDER BY day ASC ");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("startDate", java.sql.Date.valueOf(startDate));
        query.setParameter("endDate", java.sql.Date.valueOf(endDate));

        List<Object[]> rawResult = query.getResultList();
        List<ReveneuStatistic> result = new ArrayList<>();
        for (Object[] row : rawResult) {
            LocalDate day = ((java.sql.Date) row[0]).toLocalDate();
            Double sum = ((Number) row[1]).doubleValue();

            result.add(ReveneuStatistic.builder()
                    .day(day)
                    .sumRevenue(sum)
                    .build());
        }
        return result;
    }

    @Override
    public List<RatingPersentage> statisticRatingPersentage() {
        StringBuilder sql = new StringBuilder();
        sql.append(" SELECT rating , ");
        sql.append("        ROUND(  COUNT(rating) * 100.0 / (SELECT COUNT(*) FROM reviews ), 2   ");
        sql.append("              ) AS percentage ");
        sql.append(" FROM reviews");
        sql.append(" GROUP BY rating");

        Query query = entityManager.createNativeQuery(sql.toString());
        List<Object[]> rawResult = query.getResultList();
        List<RatingPersentage> reuslt = new ArrayList<>();
        for (Object[] row : rawResult) {
            Integer rating = ((Number) row[0]).intValue();
            Double persentage = ((Number) row[1]).doubleValue();

            reuslt.add(RatingPersentage.builder()
                    .rating(rating)
                    .persentage(persentage)
                    .build());
        }
        return reuslt;
    }

    @Override
    public List<StatusReview> statisticStatusReviewPersentage() {
        StringBuilder sql = new StringBuilder();
        sql.append(" SELECT status , ");
        sql.append("      ROUND( COUNT(*) * 100.0 / ( SELECT COUNT(*) FROM reviews ), 2 ) AS percentage ");
        sql.append(" FROM reviews AS r ");
        sql.append(" GROUP BY status ");

        Query query = entityManager.createNativeQuery(sql.toString());
        List<Object[]> rawResult = query.getResultList();
        List<StatusReview> reuslt = new ArrayList<>();
        for (Object[] row : rawResult) {
            String status = ((String) row[0]).toString();
            Double persentage = ((Number) row[1]).doubleValue();

            reuslt.add(StatusReview.builder()
                    .status(status)
                    .persentage(persentage)
                    .build());
        }
        return reuslt;
    }

}
