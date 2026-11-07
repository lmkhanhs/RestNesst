package com.pbl5cnpm.airbnb_service.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.pbl5cnpm.airbnb_service.amenity.repository.AmenitiesRepository;
import com.pbl5cnpm.airbnb_service.category.repository.CategoriesRepository;
import com.pbl5cnpm.airbnb_service.country.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.language.repository.LanguageRepository;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.review.repository.ReviewsRepository;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.role.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.role.service.RoleService;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ApplicationInitConfigTest {
    @Mock private RoleService roleService;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private CategoriesRepository categoriesRepository;
    @Mock private AmenitiesRepository amenitiesRepository;
    @Mock private CountriesRepository countriesRepository;
    @Mock private LanguageRepository languageRepository;
    @Mock private ListingsRepository listingsRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReviewsRepository reviewsRepository;

    @Test
    void applicationInitConfigSeedsTenLanguagesIdempotently() throws Exception {
        List<LanguageEntity> seeded = new ArrayList<>();
        when(roleRepository.findByRoleName(anyString())).thenReturn(Optional.of(new RoleEntity()));
        when(categoriesRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(amenitiesRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(countriesRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(new UserEntity()));
        when(languageRepository.findByName(anyString())).thenAnswer(inv -> {
            String name = inv.getArgument(0);
            return seeded.stream().filter(l -> name.equals(l.getName())).findFirst();
        });
        when(languageRepository.save(any(LanguageEntity.class))).thenAnswer(inv -> {
            LanguageEntity entity = inv.getArgument(0);
            seeded.add(entity);
            return entity;
        });

        ApplicationInitConfig initConfig = new ApplicationInitConfig(
                roleService, roleRepository, passwordEncoder, categoriesRepository,
                amenitiesRepository, countriesRepository, languageRepository,
                listingsRepository, userRepository, reviewsRepository);

        initConfig.applicationRunner().run(new DefaultApplicationArguments());
        assertEquals(10, seeded.size());

        // Chạy lại lần 2 bỏ qua toàn bộ bản ghi đã tồn tại
        initConfig.applicationRunner().run(new DefaultApplicationArguments());
        assertEquals(10, seeded.size());
    }
}
