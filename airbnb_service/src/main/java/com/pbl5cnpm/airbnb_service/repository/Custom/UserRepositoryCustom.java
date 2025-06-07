package com.pbl5cnpm.airbnb_service.repository.Custom;

import java.time.LocalDate;
import java.util.List;

import com.pbl5cnpm.airbnb_service.dto.Response.StatisticCountUser;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;

public interface UserRepositoryCustom {
    List<ListingEntity> findFavorites(Long userId);
    List<StatisticCountUser> statisticCountUserByDay(LocalDate statDate, LocalDate endDate);
}
