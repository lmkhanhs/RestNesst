package com.pbl5cnpm.airbnb_service.mapper;

import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;

import com.pbl5cnpm.airbnb_service.dto.Request.UpdateProFileHost;
import com.pbl5cnpm.airbnb_service.dto.Request.UserRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.UserInfor;
import com.pbl5cnpm.airbnb_service.dto.Response.UserResponse;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.service.CloudinaryService;

@Mapper(componentModel = "spring")
public abstract class UserMapper {
    @Autowired
    private CloudinaryService cloudinaryService;
    @Mapping(target = "hostApplicationPending", ignore = true)
    public abstract UserEntity toUserEntity(UserRequest request);
    ///
    @Mapping(target = "roles", expression = "java(mapRoles(userEntity))")
    public abstract UserInfor toUserInfor (UserEntity userEntity);
    /// 
    @Mapping(target = "roles", expression = "java(mapRoles(userEntity))")
    public abstract UserResponse toUserResponse(UserEntity userEntity);

    protected Set<String> mapRoles(UserEntity userEntity) {
        return userEntity.getRoles()
                .stream()
                .map(role -> role.getRoleName()) 
                .collect(Collectors.toSet());
    }
    @Mapping(source = "country.name", target = "country")
    @Mapping(target = "totalListings", expression = "java(mapHostTotalListings(entity))")
    @Mapping(target = "totalReviews", expression = "java(mapHostTotalReviews(entity))")
    @Mapping(target = "avgRating", expression = "java(mapHostAvgRating(entity))")
    public abstract HostProfileResponse toHostProfile(UserEntity entity);

    protected Integer mapHostTotalListings(UserEntity entity) {
        if (entity == null || entity.getListings() == null) {
            return 0;
        }
        return (int) entity.getListings().stream()
                .filter(listing -> listing != null && !Boolean.TRUE.equals(listing.getDeleted()))
                .count();
    }

    protected Integer mapHostTotalReviews(UserEntity entity) {
        if (entity == null || entity.getListings() == null) {
            return 0;
        }
        return entity.getListings().stream()
                .filter(listing -> listing != null && !Boolean.TRUE.equals(listing.getDeleted()) && listing.getReviews() != null)
                .mapToInt(listing -> listing.getReviews().size())
                .sum();
    }

    protected Double mapHostAvgRating(UserEntity entity) {
        if (entity == null || entity.getListings() == null) {
            return null;
        }
        var activeListings = entity.getListings().stream()
                .filter(listing -> listing != null && !Boolean.TRUE.equals(listing.getDeleted()))
                .toList();
        var reviewRatings = activeListings.stream()
                .filter(listing -> listing.getReviews() != null)
                .flatMap(listing -> listing.getReviews().stream())
                .filter(review -> review != null && review.getRating() != null)
                .mapToDouble(ReviewEntity::getRating)
                .toArray();
        if (reviewRatings.length > 0) {
            double avg = java.util.Arrays.stream(reviewRatings).average().orElse(0.0);
            return Math.round(avg * 100.0) / 100.0;
        }
        var listingRatings = activeListings.stream()
                .filter(listing -> listing.getAvgStart() != null && listing.getAvgStart() > 0)
                .mapToDouble(ListingEntity::getAvgStart)
                .toArray();
        if (listingRatings.length > 0) {
            double avg = java.util.Arrays.stream(listingRatings).average().orElse(0.0);
            return Math.round(avg * 100.0) / 100.0;
        }
        return null;
    }

    // to update profile host
    // public abstract UserEntity toEntityFormHostProfile(UpdateProFileHost proFileHost);

}
