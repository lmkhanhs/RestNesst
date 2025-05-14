package com.pbl5cnpm.airbnb_service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;

import com.pbl5cnpm.airbnb_service.dto.Request.MessageRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.MessageResponse;
import com.pbl5cnpm.airbnb_service.entity.MessageEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

@Mapper(componentModel = "spring")
public abstract class MessageMapper {

    @Autowired
    private UserRepository userRepository;

    @Mappings({
        @Mapping(source = "senderUsername", target = "sender", qualifiedByName = "toUserEntity"),
        @Mapping(source = "receiverUsername", target = "receiver", qualifiedByName = "toUserEntity"),
        @Mapping(source = "content", target = "content")
    })
    public abstract MessageEntity toEntity(MessageRequest messageRequest);

    @Mapping(source = "sender.username", target = "senderUsername")
    @Mapping(source = "receiver.username", target = "receiverUsername")
    public abstract MessageResponse toResponse(MessageEntity messageEntity); 
//
    @Named("toUserEntity")
    protected UserEntity toUserEntity(String username) {
        if (username == null || username.isEmpty()) return null;
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
