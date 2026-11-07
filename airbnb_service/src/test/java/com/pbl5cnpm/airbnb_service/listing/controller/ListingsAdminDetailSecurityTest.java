package com.pbl5cnpm.airbnb_service.listing.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;

import com.pbl5cnpm.airbnb_service.listing.dto.response.ListingAdminDetailResponse;
import com.pbl5cnpm.airbnb_service.review.service.AiSummarizeService;
import com.pbl5cnpm.airbnb_service.listing.service.ListingsServices;

class ListingsAdminDetailSecurityTest {
    private AnnotationConfigApplicationContext context;
    private ListingsController controller;
    private ListingsServices service;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigApplicationContext(MethodSecurityConfiguration.class);
        controller = context.getBean(ListingsController.class);
        service = context.getBean(ListingsServices.class);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        context.close();
    }

    @Test
    void adminReceivesTheDetailEnvelope() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("admin", "", "ADMIN"));
        var detail = new ListingAdminDetailResponse();
        when(service.getAdminDetail(7L)).thenReturn(detail);
        var result = controller.getAdminDetail(7L);
        assertEquals(200, result.getCode());
        assertSame(detail, result.getResult());
    }

    @Test
    void hostAndGuestCannotAccessAdminDetail() {
        for (String authority : new String[] { "HOST", "GUEST" }) {
            SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("user", "", authority));
            assertThrows(AccessDeniedException.class, () -> controller.getAdminDetail(7L));
        }
        verifyNoInteractions(service);
    }

    @Test
    void anonymousCannotAccessAdminDetail() {
        SecurityContextHolder.clearContext();
        assertThrows(AuthenticationCredentialsNotFoundException.class, () -> controller.getAdminDetail(7L));
        verifyNoInteractions(service);
    }

    @Test
    void onlyAdminCanUpdateListingPosition() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("admin", "", "ADMIN"));
        var response = controller.changPosition(7L, 1L);
        assertEquals(200, response.getCode());
        verify(service).handleChangePosition(7L, 1L);

        for (String authority : new String[] { "HOST", "GUEST" }) {
            SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("user", "", authority));
            assertThrows(AccessDeniedException.class, () -> controller.changPosition(7L, 1L));
        }
    }

    @Configuration
    @EnableMethodSecurity
    static class MethodSecurityConfiguration {
        @Bean
        ListingsServices listingsServices() { return mock(ListingsServices.class); }

        @Bean
        ListingsController listingsController(ListingsServices listingsServices) {
            return new ListingsController(listingsServices, mock(AiSummarizeService.class));
        }
    }
}
