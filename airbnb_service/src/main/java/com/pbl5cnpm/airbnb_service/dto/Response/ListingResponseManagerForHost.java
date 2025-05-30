package com.pbl5cnpm.airbnb_service.dto.Response;

import java.time.LocalDate;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ListingResponseManagerForHost {
    Long id;
    String name;
    String address;
    String city;
    String country;
    List<String> images;
    List<AmenitiesForListingRespose> amenites;
    LocalDate startDate;
    LocalDate endDate;
    Double price;
    Double avgStart;
    String status;
    String area;
    String description;
    List<CategoryResponseForListing> categories;
    List<ReviewResponse> reviews;
}
