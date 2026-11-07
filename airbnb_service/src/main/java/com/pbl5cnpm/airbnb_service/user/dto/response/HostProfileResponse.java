package com.pbl5cnpm.airbnb_service.user.dto.response;

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
public class HostProfileResponse {
    Long id;
    String username;
    String fullname;
    String thumnailUrl;
    String email;
    String phone;
    String address;
    String country;
    String languages;
    List<Long> languageIds;
    Integer didHostYear;
    String hostExperience;
    String description;
    Integer totalListings;
    Integer totalReviews;
    Double avgRating;
}
