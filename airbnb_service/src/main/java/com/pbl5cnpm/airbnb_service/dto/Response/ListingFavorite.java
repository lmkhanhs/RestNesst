package com.pbl5cnpm.airbnb_service.dto.Response;

import java.time.LocalDate;
import java.util.Date;

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
}
