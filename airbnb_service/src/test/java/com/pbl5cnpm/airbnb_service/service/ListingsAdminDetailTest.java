package com.pbl5cnpm.airbnb_service.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pbl5cnpm.airbnb_service.entity.AmenitesEntity;
import com.pbl5cnpm.airbnb_service.entity.CategoriesEntity;
import com.pbl5cnpm.airbnb_service.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;

@ExtendWith(MockitoExtension.class)
class ListingsAdminDetailTest {
    @Mock private ListingsRepository listings;
    @Spy private ListingMapper mapper = Mappers.getMapper(ListingMapper.class);
    @InjectMocks private ListingsServices service;

    @Test
    void returnsCompleteDetailWithoutExposingTheUserEntity() throws Exception {
        UserEntity host = UserEntity.builder().id(3L).fullname("  Chủ nhà  ").username("host-user")
                .thumnailUrl("/uploads/host.png").password("not-for-response").build();
        ListingEntity listing = ListingEntity.builder().id(7L).title("Chỗ ở mẫu")
                .address("12 Phố Mẫu").city("Hà Nội").description("Mô tả đầy đủ")
                .area("40").price(800000d).avgStart(4.8).status("ACTIVE").access(true).popular(true)
                .position(4L).host(host).deleted(false)
                .countriesEntity(CountriesEntity.builder().name("Việt Nam").build())
                .imagesEntities(List.of(ImagesEntity.builder().imageUrl("uploads/room.jpg").build()))
                .amenitesEntities(List.of(AmenitesEntity.builder().id(2L).name("Wifi").thumnailUrl("/uploads/wifi.png").build()))
                .categoriesEntities(List.of(CategoriesEntity.builder().id(5L).name("Nhà riêng").thumnailUrl("/uploads/house.png").build()))
                .startDate(LocalDate.of(2026, 11, 10)).endDate(LocalDate.of(2026, 12, 10)).build();
        LocalDateTime createdAt = LocalDateTime.of(2026, 11, 1, 9, 0);
        listing.setCreatedAt(createdAt);
        listing.setUpdatedAt(createdAt.plusDays(1));
        when(listings.findById(7L)).thenReturn(Optional.of(listing));

        var result = service.getAdminDetail(7L);

        assertEquals("Chủ nhà", result.getHostName());
        assertEquals(3L, result.getHostId());
        assertEquals("/uploads/host.png", result.getHostThumnailUrl());
        assertEquals("12 Phố Mẫu", result.getAddress());
        assertEquals("Hà Nội", result.getCity());
        assertEquals("Việt Nam", result.getCountry());
        assertEquals("Mô tả đầy đủ", result.getDescription());
        assertEquals("40", result.getArea());
        assertEquals(List.of("uploads/room.jpg"), result.getImages());
        assertEquals("Wifi", result.getAmenites().get(0).getName());
        assertEquals("/uploads/wifi.png", result.getAmenites().get(0).getThumnailUrl());
        assertEquals("Nhà riêng", result.getCategories().get(0).getName());
        assertEquals("/uploads/house.png", result.getCategories().get(0).getThumnailUrl());
        assertEquals(createdAt, result.getCreatedAt());
        assertEquals(listing.getStartDate(), result.getStartDate());
        assertEquals(4.8, result.getAvgStart());
        assertTrue(result.getAccess());
        var json = new ObjectMapper().findAndRegisterModules().valueToTree(result);
        assertFalse(json.has("password"));
        assertFalse(json.has("host"));
        verify(listings, never()).save(any());
    }

    @Test
    void toleratesMissingOptionalInformationAndUsesTheHostUsername() {
        ListingEntity listing = ListingEntity.builder().id(7L).deleted(false)
                .host(UserEntity.builder().fullname(" ").username("host-user").build()).build();
        when(listings.findById(7L)).thenReturn(Optional.of(listing));
        var result = service.getAdminDetail(7L);
        assertEquals("host-user", result.getHostName());
        assertNull(result.getHostThumnailUrl());
        assertNull(result.getCountry());
        assertNull(result.getImages());
        assertNull(result.getAmenites());
        assertNull(result.getCategories());
    }

    @Test
    void rejectsMissingAndSoftDeletedListings() {
        when(listings.findById(1L)).thenReturn(Optional.empty());
        when(listings.findById(2L)).thenReturn(Optional.of(ListingEntity.builder().id(2L).deleted(true).build()));
        assertThrows(AppException.class, () -> service.getAdminDetail(1L));
        assertThrows(AppException.class, () -> service.getAdminDetail(2L));
        verifyNoInteractions(mapper);
    }
}
