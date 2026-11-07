package com.pbl5cnpm.airbnb_service.language.dto.response;

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
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LanguageDetailResponse {
    Long id;
    String name;
    String code;
    String description;
    Boolean isActive;
    Integer totalHosts;
}
