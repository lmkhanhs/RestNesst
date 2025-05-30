package com.pbl5cnpm.airbnb_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Request.CategoriesRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateCategoryRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.CategoriesResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CategoriesResponseForAdmin;
import com.pbl5cnpm.airbnb_service.entity.CategoriesEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.CategoriesMapper;
import com.pbl5cnpm.airbnb_service.repository.CategoriesRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CategoriesService {
    CategoriesRepository categoriesRepository;
    CategoriesMapper categoriesMapper;

    public CategoriesResponseForAdmin handleCreateCategories(CategoriesRequest categoriesRequest){
        CategoriesEntity categoriesEntity = categoriesMapper.toCategoriesEntity(categoriesRequest);
                    categoriesEntity.setDeleted(false);
                    categoriesEntity.setIsActive(true);
                    categoriesEntity.setPosition(this.categoriesRepository.count()+1);
        return this.categoriesMapper.toCategoriesResponseForAdmin(this.categoriesRepository.save(categoriesEntity));
    }

    public List<CategoriesResponse> handleFindAll(){
        return this.categoriesRepository
                    .findByIsActiveTrueAndDeletedFalseOrderByPositionAsc()
                    .stream()
                    .map(category -> categoriesMapper.toCategoriesResponse(category) )
                    .toList();
    }
    public void handleDeleteCatagory(Long id){
        CategoriesEntity entity = this.categoriesRepository.findById(id)
                    .orElseThrow( () -> new AppException(ErrorCode.CATEGORY_NOT_EXIT));
        entity.setDeleted(true);
        this.categoriesRepository.save(entity);     
    }

    public CategoriesResponse handleUpdateCategory( Long id, UpdateCategoryRequest categoryRequest){
        CategoriesEntity entity = this.categoriesRepository.findById(id)
                            .orElseThrow( () -> new AppException(ErrorCode.CATEGORY_NOT_EXIT));
        CategoriesEntity mapby = this.categoriesMapper.tocaCategoriesEntityForUpdate(categoryRequest);
        entity.setName(mapby.getName());
        entity.setDescription(mapby.getDescription());
        entity.setIsActive(mapby.getIsActive());
        entity.setPosition(mapby.getPosition());
        if(mapby.getThumnailUrl() != null){
            entity.setThumnailUrl(mapby.getThumnailUrl());
        }
        return this.categoriesMapper.toCategoriesResponse(this.categoriesRepository.save(entity) );
    }

    public List<CategoriesResponseForAdmin> handleGetAllForAdmin(){
        List<CategoriesEntity> entities = this.categoriesRepository.findAllByDeletedFalseOrderByPositionAsc();
        return entities.stream()
                        .map(category -> this.categoriesMapper.toCategoriesResponseForAdmin(category))
                        .toList();

    }
}
