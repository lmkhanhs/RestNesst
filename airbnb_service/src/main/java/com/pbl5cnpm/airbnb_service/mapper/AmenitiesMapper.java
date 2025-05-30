package com.pbl5cnpm.airbnb_service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.dto.Request.AmenitiesRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateAmenities;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitesForAdmin;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitiesResponse;
import com.pbl5cnpm.airbnb_service.entity.AmenitesEntity;
import com.pbl5cnpm.airbnb_service.service.CloudinaryService;

@Mapper(componentModel = "spring")
public abstract class AmenitiesMapper {
    @Autowired
    protected CloudinaryService cloudinaryService;
    public abstract AmenitiesResponse toAmenitiesResponse(AmenitesEntity amenitesEntity);

    public abstract AmenitesForAdmin toAmenitesForAdmin(AmenitesEntity amenitesEntity);

    @Mapping(source = "thumbnail", target = "thumnailUrl", qualifiedByName = "mapImageUrl")
    public abstract AmenitesEntity toAmenitiesEntity(AmenitiesRequest amenitiesRequest);

    @Mapping(source = "thumbnail", target = "thumnailUrl", qualifiedByName = "mapImageUrl")
    public abstract AmenitesEntity toAmenitiesEntityUpdate(UpdateAmenities UpdateAmenities);


    @Named("mapImageUrl")
     protected String mapImageUrl(MultipartFile multipartFile){
        if(multipartFile == null) return null;
        return cloudinaryService.uploadImageCloddy(multipartFile);
    }
    
}
