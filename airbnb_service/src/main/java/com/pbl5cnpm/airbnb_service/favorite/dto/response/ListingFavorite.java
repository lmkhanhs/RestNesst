package com.pbl5cnpm.airbnb_service.favorite.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
public class ListingFavorite {
    Long id;
    String title;
    String primaryThumnail;
    Double price;
    LocalDate startDate;
    LocalDate endDate;
    String address;
    String area;
    String city;
    LocalDateTime savedAt;
    Double avgStart;
    Integer reviewCount;
    Integer positiveReviewCount;
    Integer negativeReviewCount;
    Integer unclassifiedReviewCount;
}
