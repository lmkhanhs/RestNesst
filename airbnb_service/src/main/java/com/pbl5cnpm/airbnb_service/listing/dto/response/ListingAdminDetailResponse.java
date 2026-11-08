package com.pbl5cnpm.airbnb_service.listing.dto.response;

import com.pbl5cnpm.airbnb_service.amenity.dto.response.AmenitiesForListingRespose;
import com.pbl5cnpm.airbnb_service.category.dto.response.CategoryResponseForListing;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ListingAdminDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String address;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private String area;
    private Double price;
    private Double avgStart;
    private String status;
    private Boolean access;
    private Boolean popular;
    private Long position;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long hostId;
    private String hostName;
    private String hostThumnailUrl;
    private List<String> images;
    private List<AmenitiesForListingRespose> amenites;
    private List<CategoryResponseForListing> categories;
}
