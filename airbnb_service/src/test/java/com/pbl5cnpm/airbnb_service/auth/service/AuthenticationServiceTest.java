package com.pbl5cnpm.airbnb_service.auth.service;

import com.pbl5cnpm.airbnb_service.shared.mail.MailerService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Date;
import java.util.HashSet;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.pbl5cnpm.airbnb_service.auth.dto.request.IntrospectRequest;
import com.pbl5cnpm.airbnb_service.auth.dto.request.LogoutRequest;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.auth.repository.InvalidTokenRepository;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

class AuthenticationServiceTest {
    private static final String SECRET = "test-only-secret-".repeat(8);
    private InvalidTokenRepository blacklist;
    private UserRepository users;
    private AuthenticationService service;

    @BeforeEach
    void setUp() {
        blacklist = mock(InvalidTokenRepository.class);
        users = mock(UserRepository.class);
        service = new AuthenticationService(users, mock(PasswordEncoder.class), blacklist, mock(MailerService.class));
        ReflectionTestUtils.setField(service, "SIGNER_KEY", SECRET);
        ReflectionTestUtils.setField(service, "DURATION_ACCESS", "600");
        ReflectionTestUtils.setField(service, "DURATION_REFRESH", "3600");
    }

    @Test
    void rejectsBlacklistedAccessToken() throws Exception {
        when(blacklist.existsById("access-id")).thenReturn(true);
        String token = token("access-id", "access", 60);
        assertThrows(AppException.class, () -> service.introspect(IntrospectRequest.builder().token(token).build()));
    }

    @Test
    void acceptsUnblockedAccessToken() throws Exception {
        assertTrue(service.introspect(IntrospectRequest.builder().token(token("id", "access", 60)).build()).getVaild());
    }

    @Test
    void rejectsBlacklistedRefreshTokenBeforeIssuingTokens() throws Exception {
        when(blacklist.existsById("refresh-id")).thenReturn(true);
        String token = token("refresh-id", "refresh", 60);
        assertThrows(AppException.class, () -> service.handleRefreshToken(token));
        verifyNoInteractions(users);
    }

    @Test
    void refreshesUnblockedToken() throws Exception {
        when(users.findByUsername("tester")).thenReturn(Optional.of(UserEntity.builder()
                .username("tester").roles(new HashSet<>()).build()));
        var response = service.handleRefreshToken(token("refresh-id", "refresh", 60));
        assertNotNull(response.getAccess_token());
        assertNotNull(response.getRefresh_token());
    }

    @Test
    void logoutInvalidatesAccessAndRefreshTokens() throws Exception {
        service.handleLogout(LogoutRequest.builder().access_token(token("access-id", "access", 60))
                .refresh_token(token("refresh-id", "refresh", 120)).build());
        verify(blacklist).invalidate(eq("access-id"), any(Date.class));
        verify(blacklist).invalidate(eq("refresh-id"), any(Date.class));
    }

    @Test
    void expiredTokensNeverReachRedis() throws Exception {
        String token = token("expired", "refresh", -60);
        assertThrows(AppException.class, () -> service.handleRefreshToken(token));
        verifyNoInteractions(blacklist, users);
    }

    private String token(String id, String type, long seconds) throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS512), new JWTClaimsSet.Builder()
                .jwtID(id).subject("tester").expirationTime(Date.from(Instant.now().plusSeconds(seconds)))
                .claim("type_token", type).build());
        jwt.sign(new MACSigner(SECRET));
        return jwt.serialize();
    }
}
