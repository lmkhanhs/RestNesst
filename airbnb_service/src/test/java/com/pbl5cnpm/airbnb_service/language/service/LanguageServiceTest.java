package com.pbl5cnpm.airbnb_service.language.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pbl5cnpm.airbnb_service.language.dto.request.LanguageRequest;
import com.pbl5cnpm.airbnb_service.language.dto.request.UpdateLanguageRequest;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.language.mapper.LanguageMapper;
import com.pbl5cnpm.airbnb_service.language.repository.LanguageRepository;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;

@ExtendWith(MockitoExtension.class)
class LanguageServiceTest {
    @Mock private LanguageRepository languageRepository;

    private final LanguageMapper mapper = Mappers.getMapper(LanguageMapper.class);

    @Test
    void createUpdateAndSoftDeleteLanguage() {
        LanguageService service = new LanguageService(languageRepository, mapper);
        when(languageRepository.findByNameIgnoreCase("Tiếng Ý")).thenReturn(Optional.empty());
        when(languageRepository.save(any(LanguageEntity.class))).thenAnswer(inv -> {
            LanguageEntity saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(11L);
            }
            return saved;
        });

        var created = service.handleCreateLanguage(LanguageRequest.builder()
                .name("  Tiếng Ý ")
                .code("IT")
                .description("Ngôn ngữ Ý")
                .build());
        assertEquals(11L, created.getId());
        assertEquals("Tiếng Ý", created.getName());
        assertEquals("it", created.getCode());
        assertTrue(created.getIsActive());

        LanguageEntity existing = LanguageEntity.builder()
                .id(11L).name("Tiếng Ý").code("it").deleted(false).isActive(true).build();
        when(languageRepository.findById(11L)).thenReturn(Optional.of(existing));

        var updated = service.handleUpdate(UpdateLanguageRequest.builder()
                .id(11L)
                .name("Tiếng Ý (Italiano)")
                .code("it")
                .description("Cập nhật mô tả")
                .isActive(false)
                .build());
        assertEquals("Tiếng Ý (Italiano)", updated.getName());
        assertFalse(updated.getIsActive());

        assertTrue(service.handleDeleted(11L));
        assertTrue(existing.getDeleted());
        assertFalse(existing.getIsActive());

        assertThrows(AppException.class, () -> service.handleDeleted(11L));
    }
}
