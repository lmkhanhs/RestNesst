package com.pbl5cnpm.airbnb_service.spec;

import java.util.Properties;
import java.util.UUID;
import javax.sql.DataSource;

import com.pbl5cnpm.airbnb_service.auth.controller.AuthenticationController;
import com.pbl5cnpm.airbnb_service.auth.repository.InvalidTokenRepository;
import com.pbl5cnpm.airbnb_service.auth.service.AuthenticationService;
import com.pbl5cnpm.airbnb_service.booking.controller.BookingController;
import com.pbl5cnpm.airbnb_service.booking.mapper.BookingMapper;
import com.pbl5cnpm.airbnb_service.booking.repository.BookingRepository;
import com.pbl5cnpm.airbnb_service.booking.service.BookingService;
import com.pbl5cnpm.airbnb_service.configuration.CustomJwtDecoder;
import com.pbl5cnpm.airbnb_service.configuration.SecurityConfig;
import com.pbl5cnpm.airbnb_service.country.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.language.repository.LanguageRepository;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.role.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.shared.exception.GlobalExceptionHandler;
import com.pbl5cnpm.airbnb_service.shared.mail.MailerService;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;
import com.pbl5cnpm.airbnb_service.user.controller.UserController;
import com.pbl5cnpm.airbnb_service.user.mapper.UserMapper;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;
import com.pbl5cnpm.airbnb_service.user.service.UserService;
import jakarta.persistence.EntityManagerFactory;
import org.mapstruct.factory.Mappers;
import org.mockito.Mockito;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewInterceptor;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Explicit whitelist: never loads application.yml, component scans, startup seed or a dev datasource. */
@Configuration
@EnableWebMvc
@EnableWebSecurity
@EnableTransactionManagement
@EnableJpaRepositories(basePackageClasses = {UserRepository.class, RoleRepository.class,
        CountriesRepository.class, LanguageRepository.class, ListingsRepository.class, BookingRepository.class})
@Import({SecurityConfig.class, CustomJwtDecoder.class, GlobalExceptionHandler.class,
        AuthenticationController.class, UserController.class, BookingController.class,
        AuthenticationService.class, UserService.class, BookingService.class})
public class SpecIntegrationConfig {
    @Bean
    DataSource dataSource() {
        return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2)
                .setName("restnesst-spec-" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1")
                .build();
    }

    @Bean
    LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        var factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(dataSource);
        factory.setPackagesToScan("com.pbl5cnpm.airbnb_service");
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        var properties = new Properties();
        properties.setProperty("hibernate.hbm2ddl.auto", "create-drop");
        properties.setProperty("hibernate.physical_naming_strategy",
                "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");
        properties.setProperty("hibernate.show_sql", "false");
        factory.setJpaProperties(properties);
        return factory;
    }

    @Bean
    PlatformTransactionManager transactionManager(EntityManagerFactory factory) {
        return new JpaTransactionManager(factory);
    }

    @Bean
    WebMvcConfigurer openEntityManagerInView(EntityManagerFactory factory) {
        return new WebMvcConfigurer() {
            @Override
            public void extendMessageConverters(java.util.List<org.springframework.http.converter.HttpMessageConverter<?>> converters) {
                for (var converter : converters) {
                    if (converter instanceof org.springframework.http.converter.json.MappingJackson2HttpMessageConverter jackson) {
                        // Match Spring Boot's default JSON date format without loading application.yml.
                        jackson.getObjectMapper().disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
                    }
                }
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                var interceptor = new OpenEntityManagerInViewInterceptor();
                interceptor.setEntityManagerFactory(factory);
                registry.addWebRequestInterceptor(interceptor);
            }
        };
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(4); }
    @Bean BookingMapper bookingMapper() { return Mockito.spy(Mappers.getMapper(BookingMapper.class)); }
    @Bean UserMapper userMapper() { return Mappers.getMapper(UserMapper.class); }
    @Bean InvalidTokenRepository invalidTokenRepository() { return Mockito.mock(InvalidTokenRepository.class); }
    @Bean MailerService mailerService() { return Mockito.mock(MailerService.class); }
    @Bean org.springframework.mail.javamail.JavaMailSender javaMailSender() {
        return Mockito.mock(org.springframework.mail.javamail.JavaMailSender.class);
    }
    @Bean CloudinaryService cloudinaryService() { return Mockito.mock(CloudinaryService.class); }
}
