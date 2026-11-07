package com.pbl5cnpm.airbnb_service.listing.service;

import java.io.File;
import java.nio.file.Path;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.pbl5cnpm.airbnb_service.listing.repository.ImageRepository;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingImageUploadService {
    private final ImageRepository imageRepository;
    private final CloudinaryService cloudinaryService;

    @Value("${upload.directory}")
    private String uploadDirectory;

    public void uploadImages(List<Long> imageIds) {
        for (Long imageId : imageIds) {
            try {
                var image = imageRepository.findById(imageId).orElse(null);
                if (image == null || image.getImageUrl() == null
                        || !image.getImageUrl().startsWith("/uploads/")) {
                    continue;
                }
                String fileName = Path.of(image.getImageUrl()).getFileName().toString();
                File file = Path.of(uploadDirectory).resolve(fileName).toFile();
                if (!file.isFile()) {
                    continue;
                }
                String cloudUrl = cloudinaryService.uploadImageCloddy(file);
                if (!StringUtils.hasText(cloudUrl)) {
                    continue;
                }
                image.setImageUrl(cloudUrl);
                imageRepository.save(image);
                // Existing responses may still reference /uploads/...; keep that URL readable.
            } catch (RuntimeException exception) {
                log.warn("Không thể chuyển ảnh {} lên cloud ({}); giữ bản local", imageId,
                        exception.getClass().getSimpleName());
            }
        }
    }
}
