package com.pbl5cnpm.airbnb_service.chat.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;

import com.pbl5cnpm.airbnb_service.chat.dto.request.MessageRequest;
import com.pbl5cnpm.airbnb_service.chat.dto.response.MessageResponse;
import com.pbl5cnpm.airbnb_service.chat.entity.MessageEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

@Mapper(componentModel = "spring")
public abstract class MessageMapper {

    @Autowired
    private UserRepository userRepository;

    @Mappings({
        @Mapping(source = "senderID", target = "sender", qualifiedByName = "toUserEntity"),
        @Mapping(source = "receiverID", target = "receiver", qualifiedByName = "toUserEntity"),
        @Mapping(source = "content", target = "content")
    })
    public abstract MessageEntity toEntity(MessageRequest messageRequest);

    @Mapping(source = "sender.username", target = "senderUsername")
    @Mapping(source = "receiver.username", target = "receiverUsername")
    public abstract MessageResponse toResponse(MessageEntity messageEntity); 
//
    @Named("toUserEntity")
    protected UserEntity toUserEntity(Long id) {
        if (id == null ) return null;
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
