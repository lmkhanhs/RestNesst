package com.pbl5cnpm.airbnb_service.review.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.review.entity.ReviewEntity;
@Repository
public interface ReviewsRepository extends JpaRepository<ReviewEntity, Long> {
    
}
