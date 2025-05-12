package com.pbl5cnpm.airbnb_service.dto.Response;

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
    String fullname;
    String thumnailUrl;
    String email;
    String phone;
    String country;
    String languages;
    Integer didHostYear;
    String description;
}
