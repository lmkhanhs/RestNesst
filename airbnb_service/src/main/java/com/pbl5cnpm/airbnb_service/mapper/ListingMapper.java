package com.pbl5cnpm.airbnb_service.mapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.dto.Request.ListingRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateListingRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.AmenitiesForListingRespose;
import com.pbl5cnpm.airbnb_service.dto.Response.CategoryResponseForListing;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingDetailResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingFavorite;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingResponseManager;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingResponseManagerForHost;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingsResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ReviewResponse;
import com.pbl5cnpm.airbnb_service.entity.AmenitesEntity;
import com.pbl5cnpm.airbnb_service.entity.CategoriesEntity;
import com.pbl5cnpm.airbnb_service.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.repository.AmenitiesRepository;
import com.pbl5cnpm.airbnb_service.repository.CategoriesRepository;
import com.pbl5cnpm.airbnb_service.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.repository.ImageRepository;
import com.pbl5cnpm.airbnb_service.service.CloudinaryService;

@Mapper(componentModel = "spring")
public abstract class ListingMapper {
    
    @Autowired
    protected AmenitiesRepository amenitiesRepository;
    @Autowired
    protected ImageRepository imageRepository;
    @Autowired
    protected CloudinaryService cloudinaryService;
    @Autowired
    protected CountriesRepository countriesRepository;
    @Autowired
    protected CategoriesRepository categoriesRepository;
    @Mappings({
            @Mapping(source = "title", target = "name"),
            @Mapping(source = "countriesEntity.name", target = "country"),
            @Mapping(source = "imagesEntities", target = "images", qualifiedByName = "mapImages"),
            @Mapping(source = "host.id", target = "hostId")
    })
    public abstract ListingsResponse toResponse(ListingEntity entity);
    ///
    @Mappings({
            @Mapping(source = "title", target = "name"),
            @Mapping(source = "countriesEntity.name", target = "country"),
            @Mapping(source = "imagesEntities", target = "images", qualifiedByName = "mapImages"),
            @Mapping(source = "host.id", target = "hostId")
    })
    public abstract ListingResponseManager toLisingResposeManager(ListingEntity entity);

    @Mappings({
            @Mapping(source = "title", target = "name"),
            @Mapping(source = "countriesEntity.name", target = "country"),
            @Mapping(source = "imagesEntities", target = "images", qualifiedByName = "mapImages"),
            @Mapping(source = "amenitesEntities", target = "amenites", qualifiedByName = "mapAmenites"),
            @Mapping(source = "reviews", target = "reviews", qualifiedByName = "mapReviews"),
            @Mapping(source = "categoriesEntities", target = "categories", qualifiedByName="mapCategories")
    })
    public abstract ListingResponseManagerForHost toListingResponseManagerForHost(ListingEntity entity);
/// v1
    @Mappings({
            @Mapping(source = "countriesEntity.name", target = "country"),
            @Mapping(source = "imagesEntities", target = "images", qualifiedByName = "mapImages"),
            @Mapping(source = "amenitesEntities", target = "amenites", qualifiedByName = "mapAmenites"),
            @Mapping(source = "reviews", target = "reviews", qualifiedByName = "mapReviews"),
            @Mapping(source = "host.id", target = "hostId")
    })
    public abstract ListingDetailResponse toDetailResponse(ListingEntity entity);

    @Named("mapImages")
    protected List<String> mapImages(List<ImagesEntity> imagesEntities) {
        if (imagesEntities == null)
            return null;
        return imagesEntities.stream()
                .map(ImagesEntity::getImageUrl)
                .collect(Collectors.toList());
    }

    @Named("mapAmenites")
    protected List<AmenitiesForListingRespose> mapAmenites(List<AmenitesEntity> amenitesEntities) {
        if (amenitesEntities == null)
            return null;
        return amenitesEntities.stream()
                .map(amenitesEntitie -> AmenitiesForListingRespose.builder()
                        .id(amenitesEntitie.getId())
                        .name(amenitesEntitie.getName())
                        .thumnailUrl(amenitesEntitie.getThumnailUrl())
                        .build())
                .collect(Collectors.toList());
    }
    @Named("mapCategories")
    protected List<CategoryResponseForListing> mapCategories(List<CategoriesEntity> categoriesEntities){
        if(categoriesEntities == null) return null;
        return categoriesEntities.stream()
                .map(category -> CategoryResponseForListing.builder()
                                .id(category.getId())
                                .name(category.getName())
                                .thumnailUrl(category.getThumnailUrl())
                            .build()
                ).collect(Collectors.toList());
    }
    @Named("mapReviews")
    protected List<ReviewResponse> mapReviews(List<ReviewEntity> reviewEntities) {
        if (reviewEntities == null)
            return null;
        List<ReviewResponse> result = new ArrayList<>();
        for (int i = 0; i < reviewEntities.size(); i++) {
            ReviewEntity reviewEntity = reviewEntities.get(i);
            ReviewResponse res = ReviewResponse.builder()
                    .username(reviewEntity.getUserEntity().getUsername())
                    .comment(reviewEntity.getComment())
                    .rating(reviewEntity.getRating())
                    .reviewDate(reviewEntity.getReviewDate())
                    .avatarlUrl(reviewEntity.getUserEntity().getThumnailUrl())
                    .reviewUrl(reviewEntity.getImageUrl())
                    .status(reviewEntity.getStatus())
                    .build();
            result.add(res);
        }
        return result;
    }

    @Mappings({
        @Mapping(source = "imagesEntities", target = "primaryThumnail", qualifiedByName = "primaryThumnail")
    })
    public abstract ListingFavorite toLitingFavorite(ListingEntity listingEntity);

    @Named("primaryThumnail")
    protected String primaryThumnail(List<ImagesEntity> imagesEntities){
        if(imagesEntities == null || imagesEntities.isEmpty()) return null;
        return imagesEntities.get(0).getImageUrl();
    }

    @Mappings({
        @Mapping(source = "amenites", target = "amenitesEntities", qualifiedByName = "toAmenitesEntities"),
       // @Mapping(source = "imgs",  target = "imagesEntities", qualifiedByName = "toImagesEntities" ),
        @Mapping(source= "country", target = "countriesEntity", qualifiedByName = "toCountriesEntity" ),
         @Mapping(source = "categories", target = "categoriesEntities", qualifiedByName = "toCategoryEntities" )
    })
    public abstract ListingEntity toEntity(ListingRequest listingRequest);

    @Mappings({
        @Mapping(source  = "amenites", target = "amenitesEntities", qualifiedByName = "toAmenitesEntities"),
        @Mapping(source = "imgs",  target = "imagesEntities", qualifiedByName = "toImagesEntities" ),
        @Mapping(source= "country", target = "countriesEntity", qualifiedByName = "toCountriesEntity" ),
        @Mapping(source = "categories", target = "categoriesEntities", qualifiedByName = "toCategoryEntities" )
    })
// main
    public abstract ListingEntity toListingEntityForUpdate(UpdateListingRequest listingRequest);
// 
    @Named("toCategoryEntities")
    protected List<CategoriesEntity> categoriesEntities(List<String> categories){
        if (categories == null) return null;
        List<CategoriesEntity> results = new ArrayList<>();
        for (String category : categories) {
            categoriesRepository.findByName(category).ifPresent(results::add);
        }
        return results;
    }
    @Named("toAmenitesEntities")
    protected List<AmenitesEntity> toAmenitesEntities(List<String> amenites){
        if (amenites == null) return null;
        List<AmenitesEntity> results = new ArrayList<>();
        for (String name : amenites) {
            amenitiesRepository.findByName(name).ifPresent(results::add);
        }
        return results;
    }
    @Named("toImagesEntities")
    protected List<ImagesEntity> toImagesEntities(List<MultipartFile> imgs){
        if (imgs == null) return null;
        List<ImagesEntity> results = new ArrayList<>();
        for (MultipartFile file : imgs) {
            ImagesEntity entity = ImagesEntity.builder()
                    .imageUrl(this.cloudinaryService.uploadImageCloddy(file))
                    .build();
            results.add(entity);
        }
        return results;
    }
    @Named("toCountriesEntity")
    protected CountriesEntity toCountriesEntity(String country){
        var enti = this.countriesRepository.findByName(country).orElseThrow(()-> new AppException(ErrorCode.COUNTRY_NOT_EXISTED));
        return enti;
    }
    
}