package com.pbl5cnpm.airbnb_service.controller;

import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.dto.Request.MessageRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.MessageResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.UserResponse;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;
import com.pbl5cnpm.airbnb_service.service.MessageService;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@AllArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final MessageService messageService;

    @MessageMapping("/chat")
    public void processMessage(@Payload MessageRequest request) {
        UserEntity sender = userRepository.findById(request.getSenderID()).orElse(null);
        UserEntity receiver = userRepository.findById(request.getReceiverID()).orElse(null);

        if (sender == null || receiver == null) {
            System.out.println("Looooooooooi");
            return;
        }
        System.out.println("checkkkk---");
        this.messageService.createMeassge(request);
        boolean callback = true;
        // Gửi tin nhắn về client người nhận qua /user/{receiver}/queue/messages
        messagingTemplate.convertAndSendToUser(
                receiver.getUsername(),
                "/queue/messages",
                callback);
    }

    @GetMapping("/api/chat/simple/{receiverId}")
    public ApiResponse<List<MessageResponse>> getMethodName(@PathVariable Long receiverId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return ApiResponse.<List<MessageResponse>>builder()
                .code(200)
                .message("get all message")
                .result(this.messageService.getMessageWithPerson(username, receiverId))
                .build();
    }

    @GetMapping("/api/chat/persons")
    public ApiResponse<List<UserResponse>> getPerson() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        List<UserResponse> res = this.messageService.getMessageVPersons(username);

        return ApiResponse.<List<UserResponse>>builder()
                    .code(200)
                    .message("get users chat with " + username)
                    .result(res)
                    .build();
    }

    @PostMapping("/api/chat")
    public MessageResponse postMethodName(@RequestBody MessageRequest request) {

        return this.messageService.createMeassge(request);
    }

    @DeleteMapping("/api/chat/{idMessage}")
    public ApiResponse<Void> deleteMeage(@PathVariable Long idMessage) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        this.messageService.deleteMeasage(username, idMessage);
        return ApiResponse.<Void>builder()
                .message("deleete succcesfully")
                .code(200)
                .build();
    }

}
