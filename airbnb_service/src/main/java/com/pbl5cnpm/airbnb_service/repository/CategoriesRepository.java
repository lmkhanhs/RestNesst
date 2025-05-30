package com.pbl5cnpm.airbnb_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.CategoriesEntity;
@Repository
public interface CategoriesRepository extends JpaRepository<CategoriesEntity, Long> {
    Optional<CategoriesEntity> findByName(String name);
    List<CategoriesEntity> findByIsActiveTrueAndDeletedFalseOrderByPositionAsc();
    List<CategoriesEntity> findAllByDeletedFalseOrderByPositionAsc();
}
