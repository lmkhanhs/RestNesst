package com.pbl5cnpm.airbnb_service.repository.Custom;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.pbl5cnpm.airbnb_service.entity.ListingEntity;

public interface ListingsRepositoryCustom {
    List<ListingEntity> findAllAndStatus(String status, boolean deleted, boolean access, LocalDate now, boolean sort) ;
    List<ListingEntity> searchByKey(String key);
    List<ListingEntity> filter(Map<String, String> args, List<String> amenities);
    void updateAvgStart();
    void updatePopular();
}
