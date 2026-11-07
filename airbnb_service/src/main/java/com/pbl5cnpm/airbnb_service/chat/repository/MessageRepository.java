package com.pbl5cnpm.airbnb_service.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pbl5cnpm.airbnb_service.chat.entity.MessageEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {
    List<MessageEntity> findBySenderAndReceiver(UserEntity sender, UserEntity receiver);
    List<MessageEntity> findBySender(UserEntity sender);
    List<MessageEntity> findByReceiver(UserEntity receiver);

}
