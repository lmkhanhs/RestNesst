    package com.pbl5cnpm.airbnb_service.dto.Request;

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
    public class MessageRequest {
        String senderUsername;
        String receiverUsername;
        String content; 
    }
