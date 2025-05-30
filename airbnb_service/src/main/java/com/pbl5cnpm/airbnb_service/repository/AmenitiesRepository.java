package com.pbl5cnpm.airbnb_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.AmenitesEntity;

@Repository
public interface AmenitiesRepository extends JpaRepository<AmenitesEntity, Long> {
    Optional<AmenitesEntity> findByName(String name);
    List<AmenitesEntity> findAllByDeletedFalseAndIsActiveTrueOrderByPositionDesc();

    List<AmenitesEntity> findAllByDeletedFalseOrderByPositionDesc();
}
