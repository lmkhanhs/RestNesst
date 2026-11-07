package com.pbl5cnpm.airbnb_service.user.dto.request;

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
public class UpdateProFileHost {
    String fullname;
    String email;
    String phone;
    MultipartFile thumnail;
    String country;
    String languages;
    List<Long> languageIds;
    Integer didHostYear;
    String hostExperience;
    String description;
}
