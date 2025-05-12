package com.pbl5cnpm.airbnb_service.mapper;

import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;

import com.pbl5cnpm.airbnb_service.dto.Request.UpdateProFileHost;
import com.pbl5cnpm.airbnb_service.dto.Request.UserRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.UserInfor;
import com.pbl5cnpm.airbnb_service.dto.Response.UserResponse;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.service.CloudinaryService;

@Mapper(componentModel = "spring")
public abstract class UserMapper {
    @Autowired
    private CloudinaryService cloudinaryService;
    public abstract UserEntity toUserEntity(UserRequest request);
    ///
    @Mapping(target = "roles", expression = "java(mapRoles(userEntity))")
    public abstract UserInfor toUserInfor (UserEntity userEntity);
    /// 
    @Mapping(target = "roles", expression = "java(mapRoles(userEntity))")
    public abstract UserResponse toUserResponse(UserEntity userEntity);

    protected Set<String> mapRoles(UserEntity userEntity) {
        return userEntity.getRoles()
                .stream()
                .map(role -> role.getRoleName()) 
                .collect(Collectors.toSet());
    }
    @Mapping(source = "country.name", target = "country")
    public abstract HostProfileResponse toHostProfile(UserEntity entity);

    // to update profile host
    // public abstract UserEntity toEntityFormHostProfile(UpdateProFileHost proFileHost);

}
