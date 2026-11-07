package com.pbl5cnpm.airbnb_service.category.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.category.dto.request.CategoriesRequest;
import com.pbl5cnpm.airbnb_service.category.dto.request.UpdateCategoryRequest;
import com.pbl5cnpm.airbnb_service.category.dto.response.CategoriesResponse;
import com.pbl5cnpm.airbnb_service.category.dto.response.CategoriesResponseForAdmin;
import com.pbl5cnpm.airbnb_service.category.entity.CategoriesEntity;
import com.pbl5cnpm.airbnb_service.category.repository.CategoriesRepository;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

@Mapper(componentModel = "spring")
public abstract class CategoriesMapper {
    @Autowired
    protected CategoriesRepository categoriesRepository;
    @Autowired
    protected CloudinaryService cloudinaryService;
    @Mapping(source = "thumbnail", target = "thumnailUrl", qualifiedByName = "mapThumbnail" )
    public abstract CategoriesEntity toCategoriesEntity(CategoriesRequest categoriesRequest);
    public abstract CategoriesResponse toCategoriesResponse (CategoriesEntity categoriesEntity);
    @Mapping(source = "thumbnail", target = "thumnailUrl", qualifiedByName = "mapThumbnail")
    public abstract CategoriesEntity tocaCategoriesEntityForUpdate(UpdateCategoryRequest categoryRequest);

    @Named("mapThumbnail")
    protected String mapThumbnail(MultipartFile thumbnailFile){
        if (thumbnailFile == null) {
            return null;
        }
        return this.cloudinaryService.uploadImageCloddy(thumbnailFile);
    }
    public abstract CategoriesResponseForAdmin toCategoriesResponseForAdmin(CategoriesEntity entity);
}
