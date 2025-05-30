package com.pbl5cnpm.airbnb_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Request.CategoriesRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitiesResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CategoriesResponse;
import com.pbl5cnpm.airbnb_service.mapper.AmenitiesMapper;
import com.pbl5cnpm.airbnb_service.repository.AmenitiesRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AmenitiesService {
    final AmenitiesRepository amenitiesRepository;
    final AmenitiesMapper amenitiesMapper;

    public List<AmenitiesResponse> handleGetALlAmenities() {
        return this.amenitiesRepository.findAll().stream()
                .map(data -> this.amenitiesMapper.toAmenitiesResponse(data))
                .toList();
    }

    public AmenitiesResponse handleCreateAmenities(AmenitiesResponse amenitiesResponse) {

        return null;
    }
}
