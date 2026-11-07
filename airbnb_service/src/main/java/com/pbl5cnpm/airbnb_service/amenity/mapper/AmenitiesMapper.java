package com.pbl5cnpm.airbnb_service.amenity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.amenity.dto.request.AmenitiesRequest;
import com.pbl5cnpm.airbnb_service.amenity.dto.request.UpdateAmenities;
import com.pbl5cnpm.airbnb_service.amenity.dto.response.AmenitesForAdmin;
import com.pbl5cnpm.airbnb_service.amenity.dto.response.AmenitiesResponse;
import com.pbl5cnpm.airbnb_service.amenity.entity.AmenitesEntity;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

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
