package com.pbl5cnpm.airbnb_service.favorite.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.favorite.entity.FavoriteEntity;
import com.pbl5cnpm.airbnb_service.favorite.entity.FavoriteKey;

@Repository
public interface FavoriteRepository extends JpaRepository<FavoriteEntity, FavoriteKey> {
    @Query("SELECT DISTINCT f FROM FavoriteEntity f JOIN FETCH f.listing l " +
            "LEFT JOIN FETCH l.reviews " +
            "WHERE f.user.id = :userId AND f.deteted = false " +
            "ORDER BY f.createdAt DESC, l.id DESC")
    List<FavoriteEntity> findActiveFavoritesByUserId(@Param("userId") Long userId);
}
