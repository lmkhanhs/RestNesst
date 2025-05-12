package com.pbl5cnpm.airbnb_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.ApplyHostEntity;

import java.lang.StackWalker.Option;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplyHostListRepository extends MongoRepository<ApplyHostEntity, String> {
    List<ApplyHostEntity> findAllByDeleted(Boolean deleted);
    Optional<ApplyHostEntity> findByHostId(Long hostId);
}
