package com.pbl5cnpm.airbnb_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.pbl5cnpm.airbnb_service.dto.Request.MessageRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.MessageResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.UserResponse;
import com.pbl5cnpm.airbnb_service.entity.MessageEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.MessageMapper;
import com.pbl5cnpm.airbnb_service.mapper.UserMapper;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class MessageService {
    private final com.pbl5cnpm.airbnb_service.repository.MessageRepository messageRepository;
    private final MessageMapper messageMapper;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public List<MessageResponse> getMessageWithPerson(String username, Long recieveId) {
        UserEntity userEntity = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        UserEntity recievEntity = this.userRepository.findById(recieveId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        List<MessageEntity> enti = this.messageRepository.findBySenderAndReceiver(userEntity, recievEntity);
        List<MessageEntity> enti2 = this.messageRepository.findBySenderAndReceiver(recievEntity, userEntity);
        enti.addAll(enti2);

        List<MessageEntity> sortedMessages = enti.stream()
                .sorted((m1, m2) -> m1.getTimestamp().compareTo(m2.getTimestamp()))
                .toList();

        return sortedMessages.stream()
                .map(this.messageMapper::toResponse)
                .toList();
    }

    public MessageResponse createMeassge(MessageRequest messageRequest) {
        MessageEntity messageEntity = this.messageMapper.toEntity(messageRequest);
        messageEntity = this.messageRepository.save(messageEntity);
        return this.messageMapper.toResponse(messageEntity);
    }

    public void deleteMeasage(String username, Long id) {
        String userSender = this.userRepository.findByUsername(username).get().getUsername();
        MessageEntity messageEntity = this.messageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID));
        if (messageEntity.getSender().getUsername().equals(userSender)) {
            messageEntity.setDeleted(true);
        } else {
            throw new AppException(ErrorCode.INVALID);
        }
    }

    public List<UserResponse> getMessageVPersons(String username) {
        UserEntity user = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        UserEntity adminEntity = this.userRepository.findByUsername("admin")
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<MessageEntity> messagesFromSender = this.messageRepository.findBySender(user);
        List<MessageEntity> messagesFromReceiver = this.messageRepository.findByReceiver(user);

        List<MessageEntity> allMessages = new ArrayList<>();
        allMessages.addAll(messagesFromSender);
        allMessages.addAll(messagesFromReceiver);

        Map<UserEntity, LocalDateTime> partnerLastMessageMap = new HashMap<>();

        for (MessageEntity msg : allMessages) {
            UserEntity partner = msg.getSender().equals(user) ? msg.getReceiver() : msg.getSender();
            if (!partner.equals(user)) {
                LocalDateTime currentTime = partnerLastMessageMap.getOrDefault(partner, LocalDateTime.MIN);
                if (msg.getTimestamp().isAfter(currentTime)) {
                    partnerLastMessageMap.put(partner, msg.getTimestamp());
                }
            }
        }
        List<UserResponse> result = new ArrayList<>();

        if (user != adminEntity) {
            result.add(this.userMapper.toUserResponse(adminEntity));
        }
        partnerLastMessageMap.remove(adminEntity);
        List<UserResponse> sortedPartners = partnerLastMessageMap.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .map(entry -> this.userMapper.toUserResponse(entry.getKey()))
                .toList();
        result.addAll(sortedPartners);
        return result;
    }

}
