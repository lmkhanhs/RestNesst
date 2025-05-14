package com.pbl5cnpm.airbnb_service.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Request.ListingRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingDetailResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingResponseManager;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingsResponse;
import com.pbl5cnpm.airbnb_service.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.enums.ListingStatus;
import com.pbl5cnpm.airbnb_service.enums.RoleName;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ListingsServices {
    private final ListingsRepository listingsRepository;
    private final ListingMapper listingMapper;
    private final UserRepository userRepository;

    public List<ListingsResponse> handleGetAll() {
        List<ListingEntity> entitys = this.listingsRepository.findAllAndStatus(ListingStatus.ACTIVE.toString(), false,
                true, LocalDate.now(), true);

        return entitys.stream().map(listingMapper::toResponse).toList();
    }

    public ListingDetailResponse getDetail(Long id) {
        ListingEntity entity = this.listingsRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        return this.listingMapper.toDetailResponse(entity);
    }

    public ListingsResponse handlleCreate(ListingRequest listingRequest, String username) {
        UserEntity host = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        ListingEntity entity = this.listingMapper.toEntity(listingRequest);

        entity.setHost(host);
        entity.setDeleted(false);
        entity.setStatus(ListingStatus.ACTIVE.toString());
        entity.setAvgStart(4.9);
        entity.setPosition(this.listingsRepository.count());
        entity.setPopular(true);
        if (entity.getImagesEntities() != null) {
            for (ImagesEntity img : entity.getImagesEntities()) {
                img.setListingEntity(entity);
            }
        }
        boolean isAdmin = host.getRoles().stream()
                .anyMatch(role -> role.getRoleName().equals(RoleName.ADMIN.toString()));
        entity.setAccess(isAdmin);

        var enti = this.listingsRepository.save(entity);
        return this.listingMapper.toResponse(enti);
    }

    public Long getCount() {
        return this.listingsRepository.countByDeletedFalse();
    }

    public List<ListingsResponse> handlerSearch(String keyword) {
        List<ListingEntity> listingEntities = this.listingsRepository.searchByKey(keyword);
        return listingEntities.stream()
                .map(data -> this.listingMapper.toResponse(data))
                .toList();
    }

    public List<ListingsResponse> handlerfilter(Map<String, String> args, List<String> amenities) {
        List<ListingEntity> listingEntities = this.listingsRepository.filter(args, amenities);
        return listingEntities.stream()
                .map(data -> this.listingMapper.toResponse(data))
                .toList();
    }

    public boolean handleAccessStatus(Boolean status, Long listingId) {
        ListingEntity listingEntity = this.listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        if (status == true) {
            listingEntity.setAccess(true);
            this.listingsRepository.save(listingEntity);
            return true;
        }
        listingEntity.setAccess(false);
        this.listingsRepository.save(listingEntity);
        return false;
    }

    public List<ListingResponseManager> handlegetfullAll() {
        List<ListingEntity> entities = this.listingsRepository.findAllByDeletedOrderByPositionAsc(false);
        return entities.stream()
                .map(data -> this.listingMapper.toLisingResposeManager(data))
                .toList();
    }

    public void handleDelete(Long listingId) {
        ListingEntity listingEntity = this.listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        listingEntity.setDeleted(true);
        this.listingsRepository.save(listingEntity);
    }

    public void handleChangePosition(Long listingId, Long position) {
        ListingEntity listingEntity = this.listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        listingEntity.setPosition(position);
        this.listingsRepository.save(listingEntity);
    }

}
