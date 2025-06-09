package com.pbl5cnpm.airbnb_service.dto.Response;

import java.time.LocalDate;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewResponse {
    String username;
    String comment;
    Double rating;
    LocalDate reviewDate;
    String avatarlUrl;
    String reviewUrl;
    String status;
}
