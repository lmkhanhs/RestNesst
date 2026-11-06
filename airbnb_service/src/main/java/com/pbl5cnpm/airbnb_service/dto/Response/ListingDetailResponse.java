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
public class ListingDetailResponse {
    Long id;
    String title;
    String description;
    String address;
    String country;
    String city;
    String area;
    String status;
    String avgStart;
    String hostThumnailUrl;
    String hostName;
    Boolean popular;
    LocalDate startDate;
    LocalDate endDate;
    Double price;
    List<String> images;
    List<AmenitiesForListingRespose> amenites;
    List<CategoryResponseForListing> categories;
    List<ReviewResponse> reviews;
    Long hostId;
}
