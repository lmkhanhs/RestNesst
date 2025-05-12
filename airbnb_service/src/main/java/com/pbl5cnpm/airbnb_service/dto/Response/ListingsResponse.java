package com.pbl5cnpm.airbnb_service.dto.Response;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import com.pbl5cnpm.airbnb_service.entity.AmenitesEntity;

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
public class ListingsResponse {
    Long id;
    String name;
    String address;
    String city;
    String country;
    String avgStart;
    List<String> images;
    Boolean popular;
    LocalDate startDate;
    LocalDate endDate;
    Double price; 
    String hostId;
}
