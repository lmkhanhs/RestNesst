package com.pbl5cnpm.airbnb_service.favorite.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.ActiveProfiles;

import com.pbl5cnpm.airbnb_service.AirbnbServiceApplication;
import com.pbl5cnpm.airbnb_service.favorite.entity.FavoriteEntity;
import com.pbl5cnpm.airbnb_service.favorite.entity.FavoriteKey;
import com.pbl5cnpm.airbnb_service.favorite.service.FavoriteService;
import com.pbl5cnpm.airbnb_service.listing.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.listing.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.review.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

// A forced embedded database and an explicit slice config exclude the real datasource and startup seed.
@DataJpaTest(showSql = false, properties = {
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.hibernate.SQL=OFF",
        "logging.level.org.hibernate.orm.jdbc.bind=OFF"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ContextConfiguration(classes = FavoriteRepositoryTest.JpaConfiguration.class)
@ActiveProfiles("favorite-repository-test")
class FavoriteRepositoryTest {
    @Autowired TestEntityManager entities;
    @Autowired FavoriteRepository favorites;
    @Autowired FavoriteService service;

    private UserEntity user(String username) {
        return entities.persist(UserEntity.builder().username(username).build());
    }

    private ListingEntity listing(UserEntity host, String title) {
        return entities.persist(ListingEntity.builder().host(host).title(title).price(500000d)
                .deleted(false).imagesEntities(new ArrayList<>()).build());
    }

    private void favorite(UserEntity user, ListingEntity listing, boolean removed) {
        entities.persist(FavoriteEntity.builder().id(new FavoriteKey(user.getId(), listing.getId()))
                .user(user).listing(listing).createdAt(LocalDateTime.now()).deteted(removed).build());
    }

    private void flushAndClear() {
        entities.flush();
        entities.clear();
    }

    @Test
    void returnsFavoritesWithListingsForOnlyTheRequestedUsersActiveFavorites() {
        var firstUser = user("favorite-test-a");
        var secondUser = user("favorite-test-b");
        var active = listing(firstUser, "Active favorite");
        var removed = listing(firstUser, "Removed favorite");
        var otherUsersListing = listing(secondUser, "Another users favorite");
        favorite(firstUser, active, false);
        favorite(firstUser, removed, true);
        favorite(secondUser, otherUsersListing, false);
        Long userId = firstUser.getId();
        Long listingId = active.getId();
        flushAndClear();

        var result = favorites.findActiveFavoritesByUserId(userId);

        assertEquals(1, result.size());
        assertInstanceOf(FavoriteEntity.class, result.get(0));
        assertEquals(listingId, result.get(0).getListing().getId());
        assertEquals("Active favorite", result.get(0).getListing().getTitle());
    }

    @Test
    void addReadRemoveAndRestoreKeepOneRecordAndTheExistingResponseContract() {
        var user = user("favorite-test-flow");
        var listing = listing(user, "Room for favorite flow");
        var image = entities.persist(ImagesEntity.builder().listingEntity(listing)
                .imageUrl("/uploads/favorite-test.png").deleted(false).build());
        listing.setImagesEntities(List.of(image));
        Long listingId = listing.getId();
        Long userId = user.getId();
        flushAndClear();

        service.addFavorite(listingId, "favorite-test-flow");
        flushAndClear();
        var response = service.getFavorites("favorite-test-flow");
        assertEquals(userId, response.getUserId());
        assertEquals(1, response.getFavorites().size());
        assertEquals(listingId, response.getFavorites().get(0).getId());
        assertEquals("/uploads/favorite-test.png", response.getFavorites().get(0).getPrimaryThumnail());
        assertNotNull(response.getFavorites().get(0).getSavedAt());
        assertNull(response.getFavorites().get(0).getAvgStart());
        assertEquals(0, response.getFavorites().get(0).getReviewCount());
        assertEquals(0, response.getFavorites().get(0).getPositiveReviewCount());

        service.addFavorite(listingId, "favorite-test-flow");
        flushAndClear();
        assertEquals(1, favorites.count());

        service.deleteFavorite(listingId, "favorite-test-flow");
        flushAndClear();
        assertTrue(service.getFavorites("favorite-test-flow").getFavorites().isEmpty());

        service.addFavorite(listingId, "favorite-test-flow");
        flushAndClear();
        assertEquals(1, favorites.count());
        assertEquals(listingId, service.getFavorites("favorite-test-flow").getFavorites().get(0).getId());
    }

    @Test
    void returnsSavedDateAndRealReviewStatisticsNewestFavoriteFirstWithoutDuplicateRows() {
        var user = user("favorite-statistics");
        var reviewed = listing(user, "Reviewed room");
        var empty = listing(user, "No reviews yet");
        // A stale/default listing average must not replace real review data.
        reviewed.setAvgStart(4.9);
        favorite(user, reviewed, false);
        var savedAt = LocalDateTime.of(2026, 11, 1, 9, 30);
        entities.find(FavoriteEntity.class, new FavoriteKey(user.getId(), reviewed.getId())).setCreatedAt(savedAt);
        favorite(user, empty, false);
        entities.find(FavoriteEntity.class, new FavoriteKey(user.getId(), empty.getId())).setCreatedAt(savedAt.plusDays(1));
        for (var status : new String[] { "POSITIVE", " negative ", "NEUTRAL", "POSITIVE" }) {
            entities.persist(ReviewEntity.builder().comment("Test review").rating(4d).status(status)
                    .userEntity(user).listingEntity(reviewed).build());
        }
        entities.persist(ReviewEntity.builder().comment("Not classified").rating(2d)
                .userEntity(user).listingEntity(reviewed).build());
        flushAndClear();

        var result = service.getFavorites("favorite-statistics").getFavorites();

        assertEquals(2, result.size());
        assertEquals(empty.getId(), result.get(0).getId());
        var room = result.get(1);
        assertEquals(reviewed.getId(), room.getId());
        assertEquals(savedAt, room.getSavedAt());
        assertEquals(3.6, room.getAvgStart(), 0.001);
        assertEquals(5, room.getReviewCount());
        assertEquals(2, room.getPositiveReviewCount());
        assertEquals(1, room.getNegativeReviewCount());
        assertEquals(2, room.getUnclassifiedReviewCount());
    }

    @Configuration(proxyBeanMethods = false)
    @Profile("favorite-repository-test")
    @EntityScan(basePackageClasses = AirbnbServiceApplication.class)
    @EnableJpaRepositories(basePackageClasses = { FavoriteRepository.class, UserRepository.class, ListingsRepository.class })
    static class JpaConfiguration {
        @Bean
        FavoriteService favoriteService(FavoriteRepository favorites, UserRepository users, ListingsRepository listings) {
            return new FavoriteService(favorites, users, listings, Mappers.getMapper(ListingMapper.class));
        }
    }
}
