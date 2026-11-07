package com.pbl5cnpm.airbnb_service.language.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl5cnpm.airbnb_service.language.dto.request.LanguageRequest;
import com.pbl5cnpm.airbnb_service.language.dto.request.UpdateLanguageRequest;
import com.pbl5cnpm.airbnb_service.language.dto.response.LanguageDetailResponse;
import com.pbl5cnpm.airbnb_service.language.dto.response.LanguageResponse;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.language.mapper.LanguageMapper;
import com.pbl5cnpm.airbnb_service.language.repository.LanguageRepository;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class LanguageService {
    LanguageRepository languageRepository;
    LanguageMapper mapper;

    @Transactional
    public LanguageDetailResponse handleCreateLanguage(LanguageRequest request) {
        String normalizedName = request.getName() == null ? "" : request.getName().trim();
        if (normalizedName.isEmpty()) {
            throw new AppException(ErrorCode.INVALID);
        }

        var existingOpt = this.languageRepository.findByNameIgnoreCase(normalizedName);
        if (existingOpt.isPresent()) {
            LanguageEntity existing = existingOpt.get();
            if (!Boolean.TRUE.equals(existing.getDeleted())) {
                throw new AppException(ErrorCode.LANGUAGE_EXISTED);
            }
            existing.setName(normalizedName);
            existing.setCode(normalizeCode(request.getCode()));
            existing.setDescription(request.getDescription());
            existing.setDeleted(false);
            existing.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
            return mapper.toLanguageDetailResponse(this.languageRepository.save(existing));
        }

        LanguageEntity entity = mapper.toLanguageEntity(request);
        entity.setName(normalizedName);
        entity.setCode(normalizeCode(request.getCode()));
        entity.setDeleted(false);
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        return mapper.toLanguageDetailResponse(this.languageRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<LanguageResponse> handleGetAll() {
        return this.languageRepository.findAllByDeletedFalseAndIsActiveTrueOrderByIdAsc()
                .stream()
                .map(mapper::toLanguageResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LanguageDetailResponse> handleGetDetail() {
        return this.languageRepository.findAllByDeletedFalseOrderByIdAsc()
                .stream()
                .map(mapper::toLanguageDetailResponse)
                .toList();
    }

    @Transactional
    public LanguageDetailResponse handleUpdate(UpdateLanguageRequest request) {
        if (request.getId() == null) {
            throw new AppException(ErrorCode.INVALID);
        }
        LanguageEntity entity = this.languageRepository.findById(request.getId())
                .filter(item -> !Boolean.TRUE.equals(item.getDeleted()))
                .orElseThrow(() -> new AppException(ErrorCode.LANGUAGE_NOT_EXISTED));

        String normalizedName = request.getName() == null ? "" : request.getName().trim();
        if (normalizedName.isEmpty()) {
            throw new AppException(ErrorCode.INVALID);
        }

        var duplicateOpt = this.languageRepository.findByNameIgnoreCase(normalizedName);
        if (duplicateOpt.isPresent() && !duplicateOpt.get().getId().equals(entity.getId())
                && !Boolean.TRUE.equals(duplicateOpt.get().getDeleted())) {
            throw new AppException(ErrorCode.LANGUAGE_EXISTED);
        }

        entity.setName(normalizedName);
        if (request.getCode() != null) {
            entity.setCode(normalizeCode(request.getCode()));
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        entity.setDeleted(false);

        return mapper.toLanguageDetailResponse(this.languageRepository.save(entity));
    }

    @Transactional
    public Boolean handleDeleted(Long languageId) {
        LanguageEntity entity = this.languageRepository.findById(languageId)
                .filter(item -> !Boolean.TRUE.equals(item.getDeleted()))
                .orElseThrow(() -> new AppException(ErrorCode.LANGUAGE_NOT_EXISTED));
        entity.setDeleted(true);
        entity.setIsActive(false);
        this.languageRepository.save(entity);
        return true;
    }

    private String normalizeCode(String code) {
        if (code == null) {
            return null;
        }
        String trimmed = code.trim().toLowerCase();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
