package com.pbl5cnpm.airbnb_service.user.service;

import com.pbl5cnpm.airbnb_service.shared.mail.MailerService;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pbl5cnpm.airbnb_service.user.dto.request.ApplyHostResquest;
import com.pbl5cnpm.airbnb_service.user.dto.response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.country.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.listing.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.user.mapper.UserMapper;
import com.pbl5cnpm.airbnb_service.country.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.language.repository.LanguageRepository;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.role.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceHostApplicationTest {
    @Mock private RoleRepository roles;
    @Mock private UserRepository users;
    @Mock private UserMapper mapper;
    @Mock private MailerService mailer;
    @Mock private PasswordEncoder passwords;
    @Mock private ListingMapper listingsMapper;
    @Mock private CloudinaryService cloudinary;
    @Mock private CountriesRepository countries;
    @Mock private ListingsRepository listings;
    @Mock private LanguageRepository languages;
    @InjectMocks private UserService service;

    private UserEntity user;
    private ApplyHostResquest request;

    @BeforeEach
    void setUp() {
        user = UserEntity.builder().id(1L).roles(new HashSet<>()).build();
        request = ApplyHostResquest.builder().userId(1L).country("Việt Nam")
                .language("Tiếng Việt").description("Host profile").didHostYear(2).build();
    }

    @Test
    void newUsersAreNotPending() {
        assertFalse(user.isHostApplicationPending());
        assertFalse(new UserEntity().isHostApplicationPending());
    }

    @Test
    void applicationStoresProfileAndPendingFlagOnUser() {
        CountriesEntity country = new CountriesEntity();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(countries.findByName("Việt Nam")).thenReturn(Optional.of(country));
        assertTrue(service.handleApply(request));
        assertTrue(user.isHostApplicationPending());
        assertSame(country, user.getCountry());
        assertEquals("Tiếng Việt", user.getLanguages());
        assertEquals("Host profile", user.getDescription());
        assertEquals(2, user.getDidHostYear());
        verify(users).save(user);
    }

    @Test
    void repeatApplicationUpdatesSameUser() {
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(countries.findByName("Việt Nam")).thenReturn(Optional.of(new CountriesEntity()));
        service.handleApply(request);
        request.setDescription("Updated profile");
        service.handleApply(request);
        assertTrue(user.isHostApplicationPending());
        assertEquals("Updated profile", user.getDescription());
        verify(users, times(2)).save(user);
    }

    @Test
    void missingCountryDoesNotMarkApplicationPending() {
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(countries.findByName("Việt Nam")).thenReturn(Optional.empty());
        assertThrows(AppException.class, () -> service.handleApply(request));
        assertFalse(user.isHostApplicationPending());
        verify(users, never()).save(any());
    }

    @Test
    void pendingListUsesDatabaseFilterAndPreservesResponse() {
        HostProfileResponse response = HostProfileResponse.builder().id(1L).build();
        when(users.findAllByHostApplicationPendingTrue()).thenReturn(List.of(user));
        when(mapper.toHostProfile(user)).thenReturn(response);
        assertEquals(List.of(response), service.handleGetApplyPerson());
        verify(users, never()).findAll();
    }

    @Test
    void approvalGrantsHostAndClearsPendingInSameSave() {
        user.setHostApplicationPending(true);
        RoleEntity host = hostRole();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(roles.findByRoleName("HOST")).thenReturn(Optional.of(host));
        assertTrue(service.handleAccsetHost(1L));
        assertFalse(user.isHostApplicationPending());
        assertTrue(user.getRoles().contains(host));
        verify(users).save(user);
    }

    @Test
    void cannotApproveUserWithoutApplication() {
        when(users.findById(1L)).thenReturn(Optional.of(user));
        assertThrows(AppException.class, () -> service.handleAccsetHost(1L));
        verify(users, never()).save(any());
    }

    @Test
    void missingHostRoleKeepsApplicationPending() {
        user.setHostApplicationPending(true);
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(roles.findByRoleName("HOST")).thenReturn(Optional.empty());
        assertThrows(AppException.class, () -> service.handleAccsetHost(1L));
        assertTrue(user.isHostApplicationPending());
        verify(users, never()).save(any());
    }

    @Test
    void rejectionClearsPendingAndAllowsReapplication() {
        user.setHostApplicationPending(true);
        when(users.findById(1L)).thenReturn(Optional.of(user));
        service.handleRejectAccess(1L);
        assertFalse(user.isHostApplicationPending());
        assertTrue(user.getRoles().isEmpty());
        when(countries.findByName("Việt Nam")).thenReturn(Optional.of(new CountriesEntity()));
        service.handleApply(request);
        assertTrue(user.isHostApplicationPending());
    }

    @Test
    void existingHostCannotApplyAgain() {
        user.getRoles().add(hostRole());
        when(users.findById(1L)).thenReturn(Optional.of(user));
        assertThrows(AppException.class, () -> service.handleApply(request));
        verify(users, never()).save(any());
    }

    @Test
    void alreadyApprovedHostDoesNotReceiveDuplicateRole() {
        user.getRoles().add(hostRole());
        when(users.findById(1L)).thenReturn(Optional.of(user));
        assertFalse(service.handleAccsetHost(1L));
        assertEquals(1, user.getRoles().size());
        verify(users, never()).save(any());
    }

    @Test
    void jsonDeserializesNaturalLanguageExperienceAndSyncsSelectedLanguageEntities() throws Exception {
        String json = """
                {
                  "userId": 1,
                  "fullname": "Lê Minh Khánh",
                  "country": "Việt Nam",
                  "languageIds": [1, 2],
                  "didHostYear": "Có 2 năm hỗ trợ quản lý căn hộ cho thuê ngắn hạn, gồm tư vấn khách, chuẩn bị phòng và xử lý các yêu cầu trong thời gian lưu trú.",
                  "description": "Chủ nhà thân thiện, phản hồi nhanh."
                }
                """;
        ApplyHostResquest parsed = new ObjectMapper().readValue(json, ApplyHostResquest.class);
        assertEquals(2, parsed.getDidHostYear());
        assertTrue(parsed.getExperience().startsWith("Có 2 năm hỗ trợ quản lý căn hộ"));

        LanguageEntity vi = LanguageEntity.builder().id(1L).name("Tiếng Việt").deleted(false).isActive(true).build();
        LanguageEntity en = LanguageEntity.builder().id(2L).name("Tiếng Anh").deleted(false).isActive(true).build();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(countries.findByName("Việt Nam")).thenReturn(Optional.of(new CountriesEntity()));
        when(languages.findAllById(any())).thenReturn(List.of(vi, en));

        assertTrue(service.handleApply(parsed));
        assertEquals("Lê Minh Khánh", user.getFullname());
        assertEquals("Tiếng Việt, Tiếng Anh", user.getLanguages());
        assertEquals(2, user.getLanguageEntities().size());
        assertEquals(2, user.getDidHostYear());
        assertTrue(user.getHostExperience().startsWith("Có 2 năm hỗ trợ quản lý căn hộ"));
    }

    private RoleEntity hostRole() {
        RoleEntity host = new RoleEntity();
        host.setRoleName("HOST");
        return host;
    }
}
