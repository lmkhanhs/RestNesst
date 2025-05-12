package com.pbl5cnpm.airbnb_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pbl5cnpm.airbnb_service.entity.ApplyHostEntity;

public interface ApplyHostListRepository extends MongoRepository<ApplyHostEntity, String> {
    
}
