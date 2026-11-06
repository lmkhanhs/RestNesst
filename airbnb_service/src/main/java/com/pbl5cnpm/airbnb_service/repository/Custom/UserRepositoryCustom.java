package com.pbl5cnpm.airbnb_service.repository.Custom;

import java.time.LocalDate;
import java.util.List;

import com.pbl5cnpm.airbnb_service.dto.Response.StatisticCountUser;

public interface UserRepositoryCustom {
    List<StatisticCountUser> statisticCountUserByDay(LocalDate statDate, LocalDate endDate);
}
