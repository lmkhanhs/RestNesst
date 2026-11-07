package com.pbl5cnpm.airbnb_service.favorite.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.favorite.dto.request.FavoriteRequest;
import com.pbl5cnpm.airbnb_service.shared.dto.response.ApiResponse;
import com.pbl5cnpm.airbnb_service.favorite.dto.response.UserFavoriteResponse;
import com.pbl5cnpm.airbnb_service.favorite.service.FavoriteService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FavoriteController {
    private final FavoriteService favoriteService;

    @GetMapping("/users/favorites")
    public ApiResponse<UserFavoriteResponse> getFavorites() {
        UserFavoriteResponse favorites = favoriteService.getFavorites(currentUsername());
        return ApiResponse.<UserFavoriteResponse>builder()
                .message("fetch favorite for user")
                .code(200)
                .result(favorites)
                .build();
    }

    @PostMapping("/users/favorites")
    public ResponseEntity<Void> addFavorite(@RequestBody FavoriteRequest request) {
        String username = currentUsername();
        favoriteService.addFavorite(request.getListingId(), username);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/users/favorites")
    public ApiResponse<Void> deleteFavorite(@RequestBody FavoriteRequest request) {
        String username = currentUsername();
        favoriteService.deleteFavorite(request.getListingId(), username);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("delete succesfully")
                .build();
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
