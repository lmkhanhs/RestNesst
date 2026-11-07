package com.pbl5cnpm.airbnb_service.auth.repository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class InvalidTokenRepositoryTest {
    private StringRedisTemplate redis;
    private InvalidTokenRepository repository;

    @BeforeEach
    void setUp() {
        redis = mock(StringRedisTemplate.class);
        repository = new InvalidTokenRepository(redis);
    }

    @Test
    @SuppressWarnings("unchecked")
    void storesOnlyTokenIdWithRemainingLifetime() {
        ValueOperations<String, String> values = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        repository.invalidate("token-id", Date.from(Instant.now().plusSeconds(60)));
        ArgumentCaptor<Duration> ttl = ArgumentCaptor.forClass(Duration.class);
        verify(values).set(eq("restnesst:auth:blacklist:token-id"), eq("1"), ttl.capture());
        assertTrue(ttl.getValue().toMillis() > 0);
        assertTrue(ttl.getValue().toMillis() <= 60000);
    }

    @Test
    void doesNotStoreExpiredToken() {
        repository.invalidate("expired", Date.from(Instant.now().minusSeconds(1)));
        verifyNoInteractions(redis);
    }

    @Test
    void checksBlacklistByKey() {
        when(redis.hasKey("restnesst:auth:blacklist:blocked")).thenReturn(true);
        assertTrue(repository.existsById("blocked"));
        when(redis.hasKey("restnesst:auth:blacklist:missing")).thenReturn(false);
        assertFalse(repository.existsById("missing"));
    }

    @Test
    void doesNotTreatRedisOutageAsUnblockedToken() {
        when(redis.hasKey(anyString())).thenThrow(new RedisConnectionFailureException("offline"));
        assertThrows(RedisConnectionFailureException.class, () -> repository.existsById("id"));
    }
}
