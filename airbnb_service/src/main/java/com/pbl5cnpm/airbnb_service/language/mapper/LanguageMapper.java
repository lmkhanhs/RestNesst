package com.pbl5cnpm.airbnb_service.language.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.pbl5cnpm.airbnb_service.language.dto.request.LanguageRequest;
import com.pbl5cnpm.airbnb_service.language.dto.response.LanguageDetailResponse;
import com.pbl5cnpm.airbnb_service.language.dto.response.LanguageResponse;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;

@Mapper(componentModel = "spring")
public abstract class LanguageMapper {
    public abstract LanguageResponse toLanguageResponse(LanguageEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "users", ignore = true)
    public abstract LanguageEntity toLanguageEntity(LanguageRequest request);

    @Mapping(target = "totalHosts", expression = "java(mapTotalHosts(entity))")
    public abstract LanguageDetailResponse toLanguageDetailResponse(LanguageEntity entity);

    protected Integer mapTotalHosts(LanguageEntity entity) {
        if (entity == null || entity.getUsers() == null) {
            return 0;
        }
        return entity.getUsers().size();
    }
}
