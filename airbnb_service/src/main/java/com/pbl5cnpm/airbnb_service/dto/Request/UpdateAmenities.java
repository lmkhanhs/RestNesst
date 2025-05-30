package com.pbl5cnpm.airbnb_service.dto.Request;

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
public class UpdateAmenities {
    MultipartFile thumbnail;
    String name;
    Boolean deleted;
    String description;
    Long position;
    Boolean isActive;
}
