package com.pbl5cnpm.airbnb_service.listing.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.pbl5cnpm.airbnb_service.listing.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.listing.repository.ImageRepository;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

@ExtendWith(MockitoExtension.class)
class ListingImageUploadServiceTest {
    @TempDir Path directory;
    @Mock ImageRepository repository;
    @Mock CloudinaryService cloudinary;
    @InjectMocks ListingImageUploadService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "uploadDirectory", directory.toString());
    }

    private ImagesEntity localImage(long id, String name) throws Exception {
        Files.write(directory.resolve(name), new byte[] { 1, 2, 3 });
        var image = ImagesEntity.builder().id(id).imageUrl("/uploads/" + name).build();
        when(repository.findById(id)).thenReturn(Optional.of(image));
        return image;
    }

    @Test
    void savesTheFullCloudUrlAndKeepsExistingLocalUrlsReadable() throws Exception {
        var image = localImage(1L, "room.png");
        String cloudUrl = "https://res.cloudinary.com/demo/image/upload/room.png";
        when(cloudinary.uploadImageCloddy(any(File.class))).thenReturn(cloudUrl);

        service.uploadImages(List.of(1L));

        assertEquals(cloudUrl, image.getImageUrl());
        verify(repository).save(image);
        assertTrue(Files.isRegularFile(directory.resolve("room.png")));
    }

    @Test
    void leavesTheLocalUrlAndFileIntactWhenCloudUploadReturnsNoUrl() throws Exception {
        var first = localImage(1L, "first.png");
        var second = localImage(2L, "second.png");
        when(cloudinary.uploadImageCloddy(any(File.class))).thenReturn(null, " ");

        service.uploadImages(List.of(1L, 2L));

        assertEquals("/uploads/first.png", first.getImageUrl());
        assertEquals("/uploads/second.png", second.getImageUrl());
        verify(repository, never()).save(any());
        assertTrue(Files.exists(directory.resolve("first.png")));
        assertTrue(Files.exists(directory.resolve("second.png")));
    }

    @Test
    void continuesWithOtherImagesAfterAnUploadFailure() throws Exception {
        var first = localImage(1L, "first.png");
        var second = localImage(2L, "second.png");
        String cloudUrl = "https://res.cloudinary.com/demo/image/upload/second.png";
        when(cloudinary.uploadImageCloddy(any(File.class)))
                .thenThrow(new IllegalStateException("upload failed")).thenReturn(cloudUrl);

        service.uploadImages(List.of(1L, 2L));

        assertEquals("/uploads/first.png", first.getImageUrl());
        assertEquals(cloudUrl, second.getImageUrl());
        verify(repository).save(second);
        verify(repository, never()).save(first);
    }

    @Test
    void skipsMissingFilesAndImagesAlreadyOnCloud() {
        when(repository.findById(1L)).thenReturn(Optional.of(ImagesEntity.builder()
                .id(1L).imageUrl("/uploads/missing.png").build()));
        when(repository.findById(2L)).thenReturn(Optional.of(ImagesEntity.builder()
                .id(2L).imageUrl("https://res.cloudinary.com/demo/image/upload/room.png").build()));

        service.uploadImages(List.of(1L, 2L));

        verifyNoInteractions(cloudinary);
        verify(repository, never()).save(any());
    }
}
