package com.pbl5cnpm.airbnb_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Request.MessageRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.MessageResponse;
import com.pbl5cnpm.airbnb_service.entity.MessageEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.MessageMapper;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class MessageService {
    private final com.pbl5cnpm.airbnb_service.repository.MessageRepository messageRepository;
    private final MessageMapper messageMapper;
    private final UserRepository userRepository;

    public List<MessageResponse> getMessageWithRecieve(String username, Long recieveId) {
        UserEntity userEntity = this.userRepository.findByUsername(username).get();
        UserEntity recievEntity = this.userRepository.findById(recieveId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        var enti = this.messageRepository.findBySenderAndReceiver(userEntity, recievEntity);
        return enti.stream()
                .map(data -> this.messageMapper.toResponse(data))
                .toList();
    }

    public MessageResponse createMeassge(MessageRequest messageRequest) {
        MessageEntity messageEntity = this.messageMapper.toEntity(messageRequest);
        messageEntity = this.messageRepository.save(messageEntity);
        return this.messageMapper.toResponse(messageEntity);
    }
    public void deleteMeasage(String username,Long id){
        String userSender = this.userRepository.findByUsername(username).get().getUsername();
        MessageEntity messageEntity = this.messageRepository.findById(id)
                                        .orElseThrow(()-> new AppException(ErrorCode.INVALID));
        if(messageEntity.getSender().getUsername().equals(userSender)){
            messageEntity.setDeleted(true);
        }      
        else{
            new AppException(ErrorCode.INVALID);
        }
    }
}
