package com.pbl5cnpm.airbnb_service.repository.Custom.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.dto.Response.ReveneuStatistic;
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
        sql.append(" SELECT DATE(p.created_at) AS day, SUM(b.total_price) ");
        sql.append(" FROM booked AS b JOIN payments AS p ON b.id = p.booking_id ");
        sql.append(" WHERE DATE(p.created_at) BETWEEN :startDate and :endDate ");
        sql.append(" GROUP BY DATE(p.created_at) ");
        sql.append(" ORDER BY day ASC ");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("startDate", java.sql.Date.valueOf(startDate));
        query.setParameter("endDate", java.sql.Date.valueOf(endDate));

        List<Object[]> rawResult = query.getResultList();
        List<ReveneuStatistic> result = new ArrayList<>();
        for (Object[] row : rawResult) {
            LocalDate day =  ( (java.sql.Date) row[0]).toLocalDate();
            Double sum = ((Number) row[1]).doubleValue();

            result.add(ReveneuStatistic.builder()
                        .day(day)
                        .sumRevenue(sum)
                        .build());
        }
        return result;
    }
    
}
