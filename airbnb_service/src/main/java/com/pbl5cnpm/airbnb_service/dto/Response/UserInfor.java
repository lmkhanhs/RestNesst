package com.pbl5cnpm.airbnb_service.dto.Response;

import java.util.Set;

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
public class UserInfor {
    Long id;
    String username;
    String fullname;
    String email;
    String phone;
    String address;
    String thumnailUrl;
    Set<String> roles;
}
