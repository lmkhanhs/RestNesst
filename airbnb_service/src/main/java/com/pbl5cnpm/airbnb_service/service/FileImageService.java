package com.pbl5cnpm.airbnb_service.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.repository.ImageRepository;

@Service
public class FileImageService {

    @Value("${upload.directory}")
    private String UPLOAD_DIR;
    @Value("${upload.prefix}")
    private String DIR_PREFIX;

    public String saveImageFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Only image files are allowed");
        }
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String fileName = UUID.randomUUID().toString() + "&" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);
        return "/uploads/" + fileName;
    }

    public void deleteImageFile(String fileName) throws IOException {
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("Tên file không được để trống");
        }

       
        Path filePath = Paths.get(UPLOAD_DIR).resolve(fileName);

        if (Files.exists(filePath)) {
            Files.delete(filePath);
            System.out.println("File đã được xóa: " + filePath.toAbsolutePath());
        } else {
            System.out.println("File không tồn tại: " + filePath.toAbsolutePath());
        }
    }

}
