package com.pbl5cnpm.airbnb_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Request.AmenitiesRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateAmenities;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitesForAdmin;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitiesResponse;
import com.pbl5cnpm.airbnb_service.entity.AmenitesEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
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

    public List<AmenitiesResponse> handleGetAll() {
        return this.amenitiesRepository.findAllByDeletedFalseAndIsActiveTrueOrderByPositionDesc()
                .stream()
                .map(element -> this.amenitiesMapper.toAmenitiesResponse(element))
                .toList();

    }

    public AmenitiesResponse handleCreateAmenities(AmenitiesRequest amenitiesRequest) {
        AmenitesEntity amenitesEntity = this.amenitiesMapper.toAmenitiesEntity(amenitiesRequest);
        amenitesEntity.setDeleted(false);
        amenitesEntity.setIsActive(true);
        amenitesEntity.setPosition(this.amenitiesRepository.count() + 1);

        var res = this.amenitiesRepository.save(amenitesEntity);
        return this.amenitiesMapper.toAmenitiesResponse(res);
    }

    public List<AmenitesForAdmin> handleGetAllForAdmin() {
        List<AmenitesEntity> entities = this.amenitiesRepository.findAllByDeletedFalseOrderByPositionDesc();
        return entities.stream()
                .map(element -> this.amenitiesMapper.toAmenitesForAdmin(element))
                .toList();
    }

    public AmenitesForAdmin handleUpdate(Long id, UpdateAmenities amenities) {
        AmenitesEntity mapby = this.amenitiesMapper.toAmenitiesEntityUpdate(amenities);
        AmenitesEntity entity = this.amenitiesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EMENITIES_NOT_EXIT));
        if (mapby.getDeleted() != null) {
            entity.setDeleted(mapby.getDeleted());
        }
        if (mapby.getName() != null) {
            entity.setName(mapby.getName());
        }
        if (mapby.getDescription() != null) {
            entity.setDescription(mapby.getDescription());
        }
        if (mapby.getPosition() != null) {
            entity.setPosition(mapby.getPosition());
        }
        if (mapby.getThumnailUrl() != null) {
            entity.setThumnailUrl(mapby.getThumnailUrl());
        }
        if (mapby.getIsActive() != null) {
            entity.setIsActive(mapby.getIsActive());
        }

        return this.amenitiesMapper.toAmenitesForAdmin(this.amenitiesRepository.save(entity));
    }
    public void handleDeleted(Long id){
        AmenitesEntity entity = this.amenitiesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EMENITIES_NOT_EXIT));
        entity.setDeleted(true);
        this.amenitiesRepository.save(entity);
        
    }
}
