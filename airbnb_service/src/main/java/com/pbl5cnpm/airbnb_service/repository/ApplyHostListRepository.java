package com.pbl5cnpm.airbnb_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.ApplyHostEntity;
import java.util.List;

@Repository
public interface ApplyHostListRepository extends MongoRepository<ApplyHostEntity, String> {
    List<ApplyHostEntity> findAllByDeleted(Boolean deleted);
}
