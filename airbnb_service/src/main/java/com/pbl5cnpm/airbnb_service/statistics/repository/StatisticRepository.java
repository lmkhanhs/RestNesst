package com.pbl5cnpm.airbnb_service.statistics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.statistics.repository.custom.StatisticsRepositoryCustom;

@Repository
public interface StatisticRepository  extends JpaRepository<UserEntity, Long>, StatisticsRepositoryCustom {
}