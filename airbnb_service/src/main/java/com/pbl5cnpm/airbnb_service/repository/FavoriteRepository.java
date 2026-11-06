package com.pbl5cnpm.airbnb_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.FavoriteEntity;
import com.pbl5cnpm.airbnb_service.entity.FavoriteKey;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;

@Repository
public interface FavoriteRepository extends JpaRepository<FavoriteEntity, FavoriteKey> {
    @Query(value = "SELECT l.* FROM favorites f " +
            "JOIN listings l ON f.listing_id = l.id " +
            "WHERE f.user_id = :userId AND f.deteted = false", nativeQuery = true)
    List<ListingEntity> findActiveListingsByUserId(@Param("userId") Long userId);
}
