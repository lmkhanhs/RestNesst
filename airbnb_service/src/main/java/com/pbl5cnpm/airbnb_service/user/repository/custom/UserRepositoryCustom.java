package com.pbl5cnpm.airbnb_service.user.repository.custom;

import java.time.LocalDate;
import java.util.List;

import com.pbl5cnpm.airbnb_service.statistics.dto.response.StatisticCountUser;

public interface UserRepositoryCustom {
    List<StatisticCountUser> statisticCountUserByDay(LocalDate statDate, LocalDate endDate);
}
