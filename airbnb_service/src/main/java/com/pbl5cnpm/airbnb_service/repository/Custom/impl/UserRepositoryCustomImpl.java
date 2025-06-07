package com.pbl5cnpm.airbnb_service.repository.Custom.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.dto.Response.StatisticCountUser;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.repository.Custom.UserRepositoryCustom;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

@Repository
public class UserRepositoryCustomImpl implements UserRepositoryCustom {
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<ListingEntity> findFavorites(Long userId) {
        String sql = "SELECT l.* FROM favorites f " +
                "JOIN listings l ON f.listing_id = l.id " +
                "WHERE f.user_id = :userId AND f.deteted = false";

        Query query = entityManager.createNativeQuery(sql, ListingEntity.class);
        query.setParameter("userId", userId);

        return query.getResultList();
    }

    @Override
    public List<StatisticCountUser> statisticCountUserByDay(LocalDate startDate, LocalDate endDate) {
        String sql = "SELECT DATE(created_at) AS day, COUNT(*) AS total_users " +
                "FROM users " +
                "WHERE DATE(created_at) BETWEEN :startDate AND :endDate " +
                "GROUP BY day " +
                "ORDER BY day ASC";

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", java.sql.Date.valueOf(startDate));
        query.setParameter("endDate", java.sql.Date.valueOf(endDate));

        List<Object[]> rawResult = query.getResultList();
        List<StatisticCountUser> result = new ArrayList<>();
        for (Object[] row : rawResult) {
       
            LocalDate day = ((java.sql.Date) row[0]).toLocalDate();
            Long totalUsers = ((Number) row[1]).longValue();

            result.add(StatisticCountUser.builder()
                    .day(day)
                    .totalUsers(totalUsers)
                    .build());
        }

        return result;
    }

}
