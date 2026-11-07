package com.pbl5cnpm.airbnb_service.user.mapper;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;

import com.pbl5cnpm.airbnb_service.user.dto.request.UpdateProFileHost;
import com.pbl5cnpm.airbnb_service.user.dto.request.UserRequest;
import com.pbl5cnpm.airbnb_service.user.dto.response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.user.dto.response.UserInfor;
import com.pbl5cnpm.airbnb_service.user.dto.response.UserResponse;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.review.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

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
    @Mapping(target = "languages", expression = "java(mapHostLanguages(entity))")
    @Mapping(target = "languageIds", expression = "java(mapHostLanguageIds(entity))")
    @Mapping(target = "totalListings", expression = "java(mapHostTotalListings(entity))")
    @Mapping(target = "totalReviews", expression = "java(mapHostTotalReviews(entity))")
    @Mapping(target = "avgRating", expression = "java(mapHostAvgRating(entity))")
    public abstract HostProfileResponse toHostProfile(UserEntity entity);

    protected String mapHostLanguages(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        if (entity.getLanguageEntities() != null && !entity.getLanguageEntities().isEmpty()) {
            String joined = entity.getLanguageEntities().stream()
                    .filter(lang -> lang != null && !Boolean.TRUE.equals(lang.getDeleted())
                            && lang.getName() != null && !lang.getName().isBlank())
                    .map(LanguageEntity::getName)
                    .collect(Collectors.joining(", "));
            if (!joined.isEmpty()) {
                return joined;
            }
        }
        return entity.getLanguages();
    }

    protected List<Long> mapHostLanguageIds(UserEntity entity) {
        if (entity == null || entity.getLanguageEntities() == null || entity.getLanguageEntities().isEmpty()) {
            return Collections.emptyList();
        }
        return entity.getLanguageEntities().stream()
                .filter(lang -> lang != null && !Boolean.TRUE.equals(lang.getDeleted()) && lang.getId() != null)
                .map(LanguageEntity::getId)
                .toList();
    }

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
