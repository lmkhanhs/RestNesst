package com.pbl5cnpm.airbnb_service.mapper;

import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.pbl5cnpm.airbnb_service.dto.Request.UserRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.UserInfor;
import com.pbl5cnpm.airbnb_service.dto.Response.UserResponse;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserEntity toUserEntity(UserRequest request);
    ///
    @Mapping(target = "roles", expression = "java(mapRoles(userEntity))")
    UserInfor toUserInfor (UserEntity userEntity);
    /// 
    @Mapping(target = "roles", expression = "java(mapRoles(userEntity))")
    UserResponse toUserResponse(UserEntity userEntity);

    default Set<String> mapRoles(UserEntity userEntity) {
        return userEntity.getRoles()
                .stream()
                .map(role -> role.getRoleName()) 
                .collect(Collectors.toSet());
    }
    @Mapping(source = "country.name", target = "country")
    public abstract HostProfileResponse toHostProfile(UserEntity entity);
}
