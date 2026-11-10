package com.pbl5cnpm.airbnb_service.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pbl5cnpm.airbnb_service.country.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.country.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.language.repository.LanguageRepository;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.role.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.shared.mail.MailerService;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;
import com.pbl5cnpm.airbnb_service.user.dto.request.ApplyHostResquest;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.mapper.UserMapper;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Unit cases only: object state and repository interactions do not prove DB rollback. */
class HostApplicationSpecTest {
    private final RoleRepository roles = mock(RoleRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final CountriesRepository countries = mock(CountriesRepository.class);
    private final LanguageRepository languages = mock(LanguageRepository.class);
    private final ListingsRepository listings = mock(ListingsRepository.class);
    private final MailerService mailer = mock(MailerService.class);
    private final CloudinaryService cloudinary = mock(CloudinaryService.class);
    private final UserMapper mapper = Mappers.getMapper(UserMapper.class);
    private UserService service;
    private UserEntity user;
    private CountriesEntity country;
    private LanguageEntity vi;
    private LanguageEntity en;
    private ApplyHostResquest request;

    @BeforeEach
    void setUp() {
        service = new UserService(roles, users, mapper, mailer, mock(PasswordEncoder.class), cloudinary,
                countries, listings, languages);
        user = UserEntity.builder().id(91001L).username("qa_guest_a").fullname("Original QA")
                .isActive(true).roles(new HashSet<>(Set.of(role(1L, "GUEST")))).build();
        country = new CountriesEntity();
        country.setName("QA Country");
        vi = LanguageEntity.builder().id(94001L).name("QA Vietnamese").deleted(false).isActive(true).build();
        en = LanguageEntity.builder().id(94002L).name("QA English").deleted(false).isActive(true).build();
        request = ApplyHostResquest.builder().userId(91001L).fullname("  QA Host  ").country("QA Country")
                .languageIds(List.of(94001L, 94002L)).description("QA description")
                .experience("  2 năm kinh nghiệm  ").didHostYear(2).build();
    }

    private void applicationDependencies() {
        when(users.findById(91001L)).thenReturn(Optional.of(user));
        when(countries.findByName("QA Country")).thenReturn(Optional.of(country));
    }

    @Test
    void HOST_UT_001_applicationUpdatesOnlyApplicantWithoutGrantingHost() {
        applicationDependencies();
        when(languages.findAllById(any())).thenReturn(List.of(vi, en));
        assertTrue(service.handleApply(request));
        assertEquals("QA Host", user.getFullname());
        assertEquals("QA description", user.getDescription());
        assertEquals("2 năm kinh nghiệm", user.getHostExperience());
        assertEquals(2, user.getDidHostYear());
        assertSame(country, user.getCountry());
        assertTrue(user.isHostApplicationPending());
        assertEquals(Set.of("GUEST"), roleNames(user));
        assertEquals(Set.of(vi, en), user.getLanguageEntities());
        verify(users).save(same(user));
        verifyNoInteractions(roles, mailer, cloudinary, listings);
    }

    @Test
    void HOST_UT_002_existingHostIsRejectedBeforeCountryOrLanguageLookup() {
        user.getRoles().add(role(2L, "HOST"));
        when(users.findById(91001L)).thenReturn(Optional.of(user));
        assertEquals(ErrorCode.INVALID, assertThrows(AppException.class, () -> service.handleApply(request)).getErrorcode());
        verify(users, never()).save(any());
        verifyNoInteractions(countries, languages, roles);
        assertEquals("Original QA", user.getFullname());
        assertFalse(user.isHostApplicationPending());
    }

    @Test
    void HOST_UT_003_experienceNormalizationIncludesNumericTextAndCalendarBoundaries() {
        LocalDate fixedDate = LocalDate.of(2026, 6, 1);
        Object[][] variants = {{null, null}, {-1, 0}, {0, 0}, {80, 80}, {81, 81}, {2.9, 2},
                {"81 năm", 80}, {"từ 2020", 6}, {"không có", 0}};
        try (var clock = mockStatic(LocalDate.class, CALLS_REAL_METHODS)) {
            clock.when(LocalDate::now).thenReturn(fixedDate);
            assertAll(Arrays.stream(variants).map(variant -> () -> {
                ApplyHostResquest input = new ApplyHostResquest();
                input.setDidHostYear(variant[0]);
                assertEquals(variant[1], input.getDidHostYear(), "input=" + variant[0]);
            }));
            assertNull(ApplyHostResquest.extractYearsFromText(null));
            assertEquals(1, ApplyHostResquest.extractYearsFromText("từ 2026"));
        }
        verifyNoInteractions(users, languages, countries, roles);
    }

    @Test
    void HOST_UT_004_deduplicatesLanguageIdsAndRejectsMissingDeletedOrInactive() {
        applicationDependencies();
        request.setLanguageIds(List.of(94001L, 94002L, 94001L));
        when(languages.findAllById(any())).thenReturn(List.of(vi, en));
        assertTrue(service.handleApply(request));
        verify(languages).findAllById(new LinkedHashSet<>(List.of(94001L, 94002L)));
        assertEquals(Set.of(vi, en), user.getLanguageEntities());
        verify(users).save(user);

        assertAll(java.util.stream.Stream.of("missing", "deleted", "inactive").map(variant -> () -> {
            clearInvocations(users, languages);
            en.setDeleted("deleted".equals(variant));
            en.setIsActive(!"inactive".equals(variant));
            when(languages.findAllById(any())).thenReturn("missing".equals(variant) ? List.of(vi) : List.of(vi, en));
            assertEquals(ErrorCode.LANGUAGE_NOT_EXISTED,
                    assertThrows(AppException.class, () -> service.handleApply(request), variant).getErrorcode());
            verify(users, never()).save(any());
        }));
    }

    @Test
    void HOST_UT_005_cannotApproveUserWithoutPendingApplication() {
        when(users.findById(91001L)).thenReturn(Optional.of(user));
        assertEquals(ErrorCode.INVALID,
                assertThrows(AppException.class, () -> service.handleAccsetHost(91001L)).getErrorcode());
        assertEquals(Set.of("GUEST"), roleNames(user));
        assertFalse(user.isHostApplicationPending());
        verify(users, never()).save(any());
        verifyNoInteractions(roles);
    }

    @Test
    void HOST_UT_006_approvalAddsHostWhileRejectionPreservesExistingHostRole() {
        user.setHostApplicationPending(true);
        var hostRole = role(2L, "HOST");
        UserEntity existingHost = UserEntity.builder().id(91004L).username("qa_host")
                .roles(new HashSet<>(Set.of(hostRole))).hostApplicationPending(true).build();
        when(users.findById(91001L)).thenReturn(Optional.of(user));
        when(users.findById(91004L)).thenReturn(Optional.of(existingHost));
        when(roles.findByRoleName("HOST")).thenReturn(Optional.of(hostRole));
        assertTrue(service.handleAccsetHost(91001L));
        assertEquals(Set.of("GUEST", "HOST"), roleNames(user));
        assertFalse(user.isHostApplicationPending());
        service.handleRejectAccess(91004L);
        assertEquals(Set.of("HOST"), roleNames(existingHost));
        assertFalse(existingHost.isHostApplicationPending());
        verify(users).save(same(user));
        verify(users).save(same(existingHost));
    }

    @Test
    void HOST_UT_007_realMapperDoesNotExposeCredentialsOrInternalFlags() {
        user.setPassword("test-only-hash");
        user.setCountry(country);
        user.setLanguageEntities(new LinkedHashSet<>(List.of(vi, en)));
        user.setListings(List.of());
        var response = mapper.toHostProfile(user);
        assertEquals(91001L, response.getId());
        assertEquals("QA Country", response.getCountry());
        assertEquals(Set.of(94001L, 94002L), new HashSet<>(response.getLanguageIds()));
        assertEquals(0, response.getTotalListings());
        assertEquals(0, response.getTotalReviews());
        assertNull(response.getAvgRating());
        var json = new ObjectMapper().valueToTree(response);
        for (String field : List.of("password", "hash", "roles", "hostApplicationPending")) {
            assertFalse(json.has(field), field);
        }
        assertEquals("test-only-hash", user.getPassword());
        assertEquals(Set.of("GUEST"), roleNames(user));
        assertFalse(user.isHostApplicationPending());
        assertEquals(Set.of(vi, en), user.getLanguageEntities());
        verifyNoInteractions(users, languages, countries, roles);
    }

    private static RoleEntity role(Long id, String name) {
        return RoleEntity.builder().id("qa-role-" + id).roleName(name).build();
    }

    private static Set<String> roleNames(UserEntity entity) {
        return entity.getRoles().stream().map(RoleEntity::getRoleName).collect(Collectors.toSet());
    }
}
