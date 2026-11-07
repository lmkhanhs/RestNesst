package com.pbl5cnpm.airbnb_service.language.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;

@Repository
public interface LanguageRepository extends JpaRepository<LanguageEntity, Long> {
    Optional<LanguageEntity> findByName(String name);

    Optional<LanguageEntity> findByNameIgnoreCase(String name);

    List<LanguageEntity> findAllByDeletedFalseOrderByIdAsc();

    List<LanguageEntity> findAllByDeletedFalseAndIsActiveTrueOrderByIdAsc();
}
