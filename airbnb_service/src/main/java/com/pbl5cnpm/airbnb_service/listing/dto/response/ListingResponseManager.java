package com.pbl5cnpm.airbnb_service.listing.dto.response;

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
public class ListingResponseManager {
    Long id;
    String name;
    String address;
    String city;
    String country;
    Double latitude;
    Double longitude;
    List<String> images;
    Boolean popular;
    LocalDate startDate;
    LocalDate endDate;
    Double price;
    Long hostId;
    String hostName;
    String hostThumnailUrl;
    Integer position;
    Double avgStart;
    String status;
    Boolean access;
    
}
