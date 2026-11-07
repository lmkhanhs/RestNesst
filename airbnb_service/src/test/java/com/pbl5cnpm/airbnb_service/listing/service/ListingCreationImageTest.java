package com.pbl5cnpm.airbnb_service.listing.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.pbl5cnpm.airbnb_service.listing.dto.request.ListingRequest;
import com.pbl5cnpm.airbnb_service.listing.dto.response.ListingsResponse;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.listing.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.shared.storage.FileImageService;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ListingCreationImageTest {
    @Mock ListingsRepository repository;
    @Mock ListingMapper mapper;
    @Mock UserRepository users;
    @Mock FileImageService files;
    @Mock ListingImageUploadService uploadService;
    @InjectMocks ListingsServices service;

    @BeforeEach
    void setUp() {
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        TransactionSynchronizationManager.clearSynchronization();
    }

    private ListingsResponse createRoom() throws Exception {
        var file = new MockMultipartFile("imgs", "room.png", "image/png", new byte[] { 1 });
        var request = ListingRequest.builder().imgs(List.of(file)).build();
        var entity = new ListingEntity();
        when(users.findByUsername("host")).thenReturn(Optional.of(UserEntity.builder().roles(Set.of()).build()));
        when(mapper.toEntity(request)).thenReturn(entity);
        when(files.saveImageFile(file)).thenReturn("/uploads/room.png");
        when(repository.save(entity)).thenAnswer(invocation -> {
            entity.setId(1L);
            entity.getImagesEntities().get(0).setId(7L);
            return entity;
        });
        when(mapper.toResponse(entity)).thenAnswer(invocation -> ListingsResponse.builder()
                .images(entity.getImagesEntities().stream().map(image -> image.getImageUrl()).toList()).build());
        return service.handlleCreate(request, "host");
    }

    @Test
    void returnsLocalImagesAndUploadsOnlyAfterCommit() throws Exception {
        CountDownLatch uploaded = new CountDownLatch(1);
        doAnswer(invocation -> { uploaded.countDown(); return null; }).when(uploadService).uploadImages(List.of(7L));

        var response = createRoom();

        assertEquals(List.of("/uploads/room.png"), response.getImages());
        verifyNoInteractions(uploadService);
        for (var synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }
        assertTrue(uploaded.await(2, TimeUnit.SECONDS));
        verify(uploadService).uploadImages(List.of(7L));
    }

    @Test
    void doesNotUploadWhenTheCreationTransactionRollsBack() throws Exception {
        createRoom();
        for (var synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }
        verifyNoInteractions(uploadService);
    }
}
