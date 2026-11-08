package com.pbl5cnpm.airbnb_service.listing.mapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.listing.dto.request.ListingRequest;
import com.pbl5cnpm.airbnb_service.listing.dto.request.UpdateListingRequest;
import com.pbl5cnpm.airbnb_service.amenity.dto.response.AmenitiesForListingRespose;
import com.pbl5cnpm.airbnb_service.category.dto.response.CategoryResponseForListing;
import com.pbl5cnpm.airbnb_service.listing.dto.response.ListingDetailResponse;
import com.pbl5cnpm.airbnb_service.listing.dto.response.ListingAdminDetailResponse;
import com.pbl5cnpm.airbnb_service.favorite.dto.response.ListingFavorite;
import com.pbl5cnpm.airbnb_service.listing.dto.response.ListingResponseManager;
import com.pbl5cnpm.airbnb_service.listing.dto.response.ListingResponseManagerForHost;
import com.pbl5cnpm.airbnb_service.listing.dto.response.ListingsResponse;
import com.pbl5cnpm.airbnb_service.review.dto.response.ReviewResponse;
import com.pbl5cnpm.airbnb_service.amenity.entity.AmenitesEntity;
import com.pbl5cnpm.airbnb_service.category.entity.CategoriesEntity;
import com.pbl5cnpm.airbnb_service.country.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.review.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.amenity.repository.AmenitiesRepository;
import com.pbl5cnpm.airbnb_service.category.repository.CategoriesRepository;
import com.pbl5cnpm.airbnb_service.country.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.listing.repository.ImageRepository;
import com.pbl5cnpm.airbnb_service.listing.service.ListingGeocodingService;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

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
            @Mapping(source = "host.id", target = "hostId"),
            @Mapping(source = "host.thumnailUrl", target = "hostThumnailUrl"),
            @Mapping(source = "host", target = "hostName", qualifiedByName = "mapHostName")
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
            @Mapping(source = "categoriesEntities", target = "categories", qualifiedByName = "mapCategories"),
            @Mapping(source = "reviews", target = "reviews", qualifiedByName = "mapReviews"),
            @Mapping(source = "host.id", target = "hostId"),
            @Mapping(source = "host.thumnailUrl", target = "hostThumnailUrl"),
            @Mapping(source = "host", target = "hostName", qualifiedByName = "mapHostName")
    })
    public abstract ListingDetailResponse toDetailResponse(ListingEntity entity);

    @Mappings({
            @Mapping(source = "countriesEntity.name", target = "country"),
            @Mapping(source = "imagesEntities", target = "images", qualifiedByName = "mapImages"),
            @Mapping(source = "amenitesEntities", target = "amenites", qualifiedByName = "mapAmenites"),
            @Mapping(source = "categoriesEntities", target = "categories", qualifiedByName = "mapCategories"),
            @Mapping(source = "host.id", target = "hostId"),
            @Mapping(source = "host.thumnailUrl", target = "hostThumnailUrl"),
            @Mapping(source = "host", target = "hostName", qualifiedByName = "mapHostName")
    })
    public abstract ListingAdminDetailResponse toAdminDetailResponse(ListingEntity entity);

    @Named("mapHostName")
    protected String mapHostName(UserEntity host) {
        if (host == null) return null;
        if (host.getFullname() != null && !host.getFullname().isBlank()) {
            return host.getFullname().trim();
        }
        return host.getUsername();
    }

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
                        .description(amenitesEntitie.getDescription())
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

    @AfterMapping
    protected void fillResponseCoordinates(ListingEntity entity, @MappingTarget ListingsResponse target) {
        ListingGeocodingService.Coordinates coords = ListingGeocodingService.resolveOrFallback(entity);
        if (coords != null) {
            target.setLatitude(coords.latitude());
            target.setLongitude(coords.longitude());
        }
    }

    @AfterMapping
    protected void fillDetailCoordinates(ListingEntity entity, @MappingTarget ListingDetailResponse target) {
        ListingGeocodingService.Coordinates coords = ListingGeocodingService.resolveOrFallback(entity);
        if (coords != null) {
            target.setLatitude(coords.latitude());
            target.setLongitude(coords.longitude());
        }
    }

    @AfterMapping
    protected void fillAdminDetailCoordinates(ListingEntity entity, @MappingTarget ListingAdminDetailResponse target) {
        ListingGeocodingService.Coordinates coords = ListingGeocodingService.resolveOrFallback(entity);
        if (coords != null) {
            target.setLatitude(coords.latitude());
            target.setLongitude(coords.longitude());
        }
    }

    @AfterMapping
    protected void fillManagerCoordinates(ListingEntity entity, @MappingTarget ListingResponseManager target) {
        ListingGeocodingService.Coordinates coords = ListingGeocodingService.resolveOrFallback(entity);
        if (coords != null) {
            target.setLatitude(coords.latitude());
            target.setLongitude(coords.longitude());
        }
    }

    @AfterMapping
    protected void fillHostManagerCoordinates(ListingEntity entity, @MappingTarget ListingResponseManagerForHost target) {
        ListingGeocodingService.Coordinates coords = ListingGeocodingService.resolveOrFallback(entity);
        if (coords != null) {
            target.setLatitude(coords.latitude());
            target.setLongitude(coords.longitude());
        }
    }
    
}
