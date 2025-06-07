package com.pbl5cnpm.airbnb_service.dto.Request;

import java.time.LocalDate;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

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
public class UpdateListingRequest {
    Long id;
    String title;
    String description;
    String address;
    String city;
    String area;
    String country;
    List<MultipartFile> imgs;
    List<String> amenites;
    List<String> categories;
    LocalDate startDate;
    LocalDate endDate;
    Double price;
    String status;
}
