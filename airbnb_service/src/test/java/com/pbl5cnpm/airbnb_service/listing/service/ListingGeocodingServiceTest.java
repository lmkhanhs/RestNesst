package com.pbl5cnpm.airbnb_service.listing.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import com.pbl5cnpm.airbnb_service.country.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.listing.mapper.ListingMapper;

class ListingGeocodingServiceTest {

    private final ListingMapper mapper = Mappers.getMapper(ListingMapper.class);

    @Test
    void preservesExplicitCoordinatesOnMapperResponses() {
        ListingEntity entity = ListingEntity.builder()
                .id(10L)
                .title("Villa Mỹ Khê")
                .address("140 Võ Nguyên Giáp")
                .city("Đà Nẵng")
                .latitude(16.058812)
                .longitude(108.245801)
                .countriesEntity(CountriesEntity.builder().name("Việt Nam").build())
                .build();

        var summary = mapper.toResponse(entity);
        var detail = mapper.toDetailResponse(entity);

        assertEquals(16.058812, summary.getLatitude());
        assertEquals(108.245801, summary.getLongitude());
        assertEquals(16.058812, detail.getLatitude());
        assertEquals(108.245801, detail.getLongitude());
    }

    @Test
    void resolvesHoChiMinhLandmarksAndPartialCityNamesWithoutStackingAtHanoi() {
        ListingEntity listing1 = ListingEntity.builder()
                .id(1L)
                .title("Luxury Pool Villa")
                .address("Bến")
                .city("Hồ Chí")
                .countriesEntity(CountriesEntity.builder().name("Việt Nam").build())
                .build();
        ListingEntity listing2 = ListingEntity.builder()
                .id(2L)
                .title("Luxury Villa center")
                .address("Ba Son")
                .city("Hồ Chí Minh")
                .countriesEntity(CountriesEntity.builder().name("Việt Nam").build())
                .build();

        var res1 = mapper.toResponse(listing1);
        var res2 = mapper.toResponse(listing2);

        assertNotNull(res1.getLatitude());
        assertNotNull(res1.getLongitude());
        assertNotNull(res2.getLatitude());
        assertNotNull(res2.getLongitude());

        // Cả 2 đều thuộc khu vực trung tâm TP.HCM (~10.7x, 106.69-106.72), không rơi về Hà Nội (21.0285)
        assertTrue(res1.getLatitude() > 10.70 && res1.getLatitude() < 10.85);
        assertTrue(res1.getLongitude() > 106.65 && res1.getLongitude() < 106.75);
        assertTrue(res2.getLatitude() > 10.75 && res2.getLatitude() < 10.82);
        assertTrue(res2.getLongitude() > 106.68 && res2.getLongitude() < 106.74);

        // Hai phòng khác nhau không bị chồng khít lên đúng 1 điểm
        assertNotEquals(res1.getLatitude(), res2.getLatitude());
        assertNotEquals(res1.getLongitude(), res2.getLongitude());
    }

    @Test
    void returnsNullCoordinatesWhenAllLocationFieldsAreBlank() {
        ListingEntity empty = ListingEntity.builder().id(99L).title("Draft").build();
        var res = mapper.toResponse(empty);
        assertNull(res.getLatitude());
        assertNull(res.getLongitude());
    }

    @Test
    void offlineResolveForPersistUsesRequestedCoordinatesOrStaticFallback() {
        ListingGeocodingService service = new ListingGeocodingService(false);

        var explicit = service.resolveForPersist(11.940412, 108.458312, "1 Trần Phú", "Đà Lạt", "Việt Nam", 5L);
        assertEquals(11.940412, explicit.latitude());
        assertEquals(108.458312, explicit.longitude());

        var fallback = service.resolveForPersist(null, null, "Phố cổ", "Hội An", "Việt Nam", 6L);
        assertNotNull(fallback);
        assertTrue(fallback.latitude() > 15.85 && fallback.latitude() < 15.92);
        assertTrue(fallback.longitude() > 108.30 && fallback.longitude() < 108.37);
    }
}
