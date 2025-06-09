package com.pbl5cnpm.airbnb_service.dto.Response;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

import com.pbl5cnpm.airbnb_service.enums.RoleName;

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
public class UserResponse {
    Long id;
    String username;
    String fullname;
    String email;
    String phone;
    Set<String> roles;
    LocalDateTime lastLogin;
    String address;
    String thumnailUrl;
    LocalDateTime createdAt;
    Boolean isActive;
}
