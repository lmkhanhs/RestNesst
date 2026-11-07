package com.pbl5cnpm.airbnb_service.architecture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.AnnotatedBeanDefinitionReader;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.annotation.ConfigurationClassPostProcessor;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypesScanner;

import com.pbl5cnpm.airbnb_service.AirbnbServiceApplication;
import com.pbl5cnpm.airbnb_service.auth.service.AuthenticationService;
import com.pbl5cnpm.airbnb_service.booking.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.booking.mapper.BookingMapper;
import com.pbl5cnpm.airbnb_service.language.controller.LanguageController;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.language.mapper.LanguageMapper;
import com.pbl5cnpm.airbnb_service.listing.controller.ListingsController;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.listing.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.listing.repository.custom.impl.ListingsRepositoryCustomImpl;
import com.pbl5cnpm.airbnb_service.payment.entity.PaymentEntity;
import com.pbl5cnpm.airbnb_service.shared.entity.BaseEntity;
import com.pbl5cnpm.airbnb_service.statistics.repository.custom.impl.StatisticsRepositoryCustomImpl;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.user.mapper.UserMapper;
import com.pbl5cnpm.airbnb_service.user.repository.custom.impl.UserRepositoryCustomImpl;

class BackendPackageDiscoveryTest {
    private static final String ROOT_PACKAGE = AirbnbServiceApplication.class.getPackageName();

    @Test
    void applicationRootDiscoversComponentsAndGeneratedMappers() {
        var scanner = new ClassPathScanningCandidateComponentProvider(true);
        Set<String> components = scanner.findCandidateComponents(ROOT_PACKAGE).stream()
                .map(definition -> definition.getBeanClassName())
                .collect(Collectors.toSet());

        assertTrue(components.contains(AuthenticationService.class.getName()));
        assertTrue(components.contains(ListingsController.class.getName()));
        assertTrue(components.contains(LanguageController.class.getName()));
        for (Class<?> mapper : List.of(UserMapper.class, ListingMapper.class, BookingMapper.class, LanguageMapper.class)) {
            assertTrue(components.contains(mapper.getName() + "Impl"), mapper.getName());
        }
    }

    @Test
    void applicationRootDiscoversJpaEntitiesAcrossFeatures() {
        var managedTypes = new PersistenceManagedTypesScanner(new DefaultResourceLoader()).scan(ROOT_PACKAGE);

        for (Class<?> entity : List.of(UserEntity.class, ListingEntity.class, BookingEntity.class,
                PaymentEntity.class, LanguageEntity.class, BaseEntity.class)) {
            assertTrue(managedTypes.getManagedClassNames().contains(entity.getName()), entity.getName());
        }
    }

    @Test
    void springDataRegistersRepositoriesAndTheirCustomImplementationsWithoutDatabase() {
        var registry = new DefaultListableBeanFactory();
        new AnnotatedBeanDefinitionReader(registry).register(RepositoryScanConfiguration.class);
        new ConfigurationClassPostProcessor().postProcessBeanDefinitionRegistry(registry);

        for (String name : List.of("userRepository", "listingsRepository", "bookingRepository",
                "paymentRepository", "statisticRepository", "languageRepository")) {
            assertTrue(registry.containsBeanDefinition(name), name);
        }
        assertEquals(UserRepositoryCustomImpl.class.getName(),
                registry.getBeanDefinition("userRepositoryCustomImpl").getBeanClassName());
        assertEquals(ListingsRepositoryCustomImpl.class.getName(),
                registry.getBeanDefinition("listingsRepositoryCustomImpl").getBeanClassName());
        assertEquals(StatisticsRepositoryCustomImpl.class.getName(),
                registry.getBeanDefinition("statisticsRepositoryCustomImpl").getBeanClassName());
    }

    @TestConfiguration
    @EnableJpaRepositories(basePackageClasses = AirbnbServiceApplication.class)
    static class RepositoryScanConfiguration {
    }
}
