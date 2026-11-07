package com.pbl5cnpm.airbnb_service.listing.repository;


import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.listing.repository.custom.ListingsRepositoryCustom;

@Repository
public interface ListingsRepository extends JpaRepository<ListingEntity, Long>, ListingsRepositoryCustom {
    Page<ListingEntity> findAll(Pageable pageable);
    List<ListingEntity> findAllByDeletedOrderByPositionAsc(Boolean deleted);
    Long countByDeletedFalse();
    List<ListingEntity> findByHostAndDeleted(UserEntity host, Boolean deleted);
}
