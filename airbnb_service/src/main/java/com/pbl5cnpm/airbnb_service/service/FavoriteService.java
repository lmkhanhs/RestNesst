package com.pbl5cnpm.airbnb_service.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl5cnpm.airbnb_service.dto.Response.ListingFavorite;
import com.pbl5cnpm.airbnb_service.dto.Response.UserFavoriteResponse;
import com.pbl5cnpm.airbnb_service.entity.FavoriteEntity;
import com.pbl5cnpm.airbnb_service.entity.FavoriteKey;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.repository.FavoriteRepository;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ListingsRepository listingsRepository;
    private final ListingMapper listingMapper;

    public UserFavoriteResponse getFavorites(String username) {
        UserEntity user = findUserByUsername(username);
        List<ListingFavorite> favorites = favoriteRepository.findActiveListingsByUserId(user.getId()).stream()
                .map(listingMapper::toLitingFavorite)
                .toList();
        return UserFavoriteResponse.builder()
                .userId(user.getId())
                .favorites(favorites)
                .build();
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
