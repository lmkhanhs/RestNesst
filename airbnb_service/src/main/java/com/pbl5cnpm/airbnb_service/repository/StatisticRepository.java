package com.pbl5cnpm.airbnb_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.repository.Custom.StatisticsRepositoryCustom;

@Repository
public interface StatisticRepository  extends JpaRepository<UserEntity, Long>, StatisticsRepositoryCustom {
}