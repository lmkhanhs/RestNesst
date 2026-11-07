package com.pbl5cnpm.airbnb_service.favorite.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl5cnpm.airbnb_service.favorite.dto.response.ListingFavorite;
import com.pbl5cnpm.airbnb_service.favorite.dto.response.UserFavoriteResponse;
import com.pbl5cnpm.airbnb_service.favorite.entity.FavoriteEntity;
import com.pbl5cnpm.airbnb_service.favorite.entity.FavoriteKey;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.listing.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.review.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.favorite.repository.FavoriteRepository;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ListingsRepository listingsRepository;
    private final ListingMapper listingMapper;

    @Transactional(readOnly = true)
    public UserFavoriteResponse getFavorites(String username) {
        UserEntity user = findUserByUsername(username);
        List<ListingFavorite> favorites = favoriteRepository.findActiveFavoritesByUserId(user.getId()).stream()
                .map(this::toFavoriteResponse)
                .toList();
        return UserFavoriteResponse.builder()
                .userId(user.getId())
                .favorites(favorites)
                .build();
    }

    private ListingFavorite toFavoriteResponse(FavoriteEntity favorite) {
        var listing = favorite.getListing();
        var response = listingMapper.toLitingFavorite(listing);
        List<ReviewEntity> reviews = listing.getReviews() == null ? List.of() : listing.getReviews();
        int positive = (int) reviews.stream().filter(review -> "POSITIVE".equalsIgnoreCase(
                review.getStatus() == null ? "" : review.getStatus().trim())).count();
        int negative = (int) reviews.stream().filter(review -> "NEGATIVE".equalsIgnoreCase(
                review.getStatus() == null ? "" : review.getStatus().trim())).count();
        var average = reviews.stream().map(ReviewEntity::getRating).filter(java.util.Objects::nonNull)
                .mapToDouble(Double::doubleValue).average();
        response.setSavedAt(favorite.getCreatedAt());
        response.setAvgStart(average.isPresent() ? average.getAsDouble() : null);
        response.setReviewCount(reviews.size());
        response.setPositiveReviewCount(positive);
        response.setNegativeReviewCount(negative);
        response.setUnclassifiedReviewCount(reviews.size() - positive - negative);
        return response;
    }

    @Transactional
    public void addFavorite(Long listingId, String username) {
        var userOptional = userRepository.findByUsername(username);
        var listingOptional = listingsRepository.findById(listingId);

        if (userOptional.isEmpty() || listingOptional.isEmpty()) {
            throw new AppException(ErrorCode.INVALID);
        }
        var user = userOptional.get();
        var userId = user.getId();
        var favoriteKey = new FavoriteKey(userId, listingId);
        var favorite = FavoriteEntity.builder()
                .id(favoriteKey)
                .user(user)
                .listing(listingOptional.get())
                .createdAt(LocalDateTime.now())
                .deteted(false)
                .build();

        favoriteRepository.save(favorite);
    }

    @Transactional
    public void deleteFavorite(Long listingId, String username) {
        var user = findUserByUsername(username);
        listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID));

        var favoriteKey = new FavoriteKey(user.getId(), listingId);
        var favorite = favoriteRepository.findById(favoriteKey)
                .orElseThrow(() -> new AppException(ErrorCode.FAVORITE_NOT_EXISTED));

        favorite.setDeteted(true);
        favoriteRepository.save(favorite);
    }

    private UserEntity findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
