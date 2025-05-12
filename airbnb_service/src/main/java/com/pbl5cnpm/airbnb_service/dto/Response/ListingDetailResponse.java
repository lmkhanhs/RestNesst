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
    String avgStart;
    String hostThumnailUrl;
    Boolean popular;
    LocalDate startDate;
    LocalDate endDate;
    Double price;
    List<String> images;
    List<AmenitiesForListingRespose> amenites;
    List<ReviewResponse> reviews;
    Long hostId;
}
