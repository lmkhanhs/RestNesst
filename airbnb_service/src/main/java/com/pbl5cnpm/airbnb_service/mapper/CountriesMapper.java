package com.pbl5cnpm.airbnb_service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.dto.Request.CountryResquest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateCountryRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.CountryDetailResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CoutriesResponse;
import com.pbl5cnpm.airbnb_service.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.service.CloudinaryService;

@Mapper(componentModel = "spring")
public abstract class CountriesMapper {
    @Autowired
    protected CloudinaryService cloudinaryService;
    public abstract CoutriesResponse toCoutriesResponse(CountriesEntity coutriesEntity);
    @Mapping(source = "thumbnail", target = "thumbnail", qualifiedByName = "thumbnail" )
    public abstract  CountriesEntity toCoutriesEntity(CountryResquest coutryRequest);
    @Named("thumbnail")
    protected String thumbnail(MultipartFile multipartFile){
        if(multipartFile == null) return null;
        return cloudinaryService.uploadImageCloddy(multipartFile);
    }

    public abstract CountryDetailResponse toCountryDetailResponse(CountriesEntity coutriesEntity);

    @Mapping(source = "thumbnail", target = "thumbnail", qualifiedByName = "thumbnail" )
    public abstract CountriesEntity toCoutriesEntityForUpdate(UpdateCountryRequest countryRequest);
}
