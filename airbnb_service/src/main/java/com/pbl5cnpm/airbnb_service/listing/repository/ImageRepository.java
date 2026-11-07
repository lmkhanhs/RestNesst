package com.pbl5cnpm.airbnb_service.listing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.listing.entity.ImagesEntity;
@Repository
public interface ImageRepository extends JpaRepository<ImagesEntity, Long> {
    
}
