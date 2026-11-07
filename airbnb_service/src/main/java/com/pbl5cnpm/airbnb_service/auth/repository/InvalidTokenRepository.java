package com.pbl5cnpm.airbnb_service.auth.repository;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class InvalidTokenRepository {
    private static final String KEY_PREFIX = "restnesst:auth:blacklist:";
    private final StringRedisTemplate redisTemplate;

    public boolean existsById(String id) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + id));
    }

    public void invalidate(String id, Date expirationTime) {
        Duration ttl = Duration.between(Instant.now(), expirationTime.toInstant());
        if (!ttl.isNegative() && !ttl.isZero()) {
            redisTemplate.opsForValue().set(KEY_PREFIX + id, "1", ttl);
        }
    }
}
