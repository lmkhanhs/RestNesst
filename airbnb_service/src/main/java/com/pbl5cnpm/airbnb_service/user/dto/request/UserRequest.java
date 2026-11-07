package com.pbl5cnpm.airbnb_service.user.dto.request;

import jakarta.validation.constraints.Size;
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
public class UserRequest {
    @Size(min = 8, message = "USERNAME_INVALID")
    String username;
    String fullname;
    String email;
    @Size(min = 6, message = "PASSWORD_VALID")
    String password;
    String phone;
}
