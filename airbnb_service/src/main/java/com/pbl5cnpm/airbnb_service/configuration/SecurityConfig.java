package com.pbl5cnpm.airbnb_service.configuration;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final String[] PUBLIC_POST = { "/api/users", "/auth/login", "/auth/introspect", "/auth/logout",
                        "auth/refresh", "/auth/forget" };
        private final String[] PUBLIC_END_POINT_TEST = { "/api/categories", "/api/countries" };
        private final String[] PULIC_GET = { "/test", "/api/categories", "/api/amenities", "/api/countries",
                        "/api/listings", "/api/listings/{id}", "api/payment/vnpay-return", "/api/listings/search",
                        "/api/listings/filter", "/api/users/host/{id}" };
        private final String[] PULIC_PUT = { "/api/users/password" };
        @Autowired
        private CustomJwtDecoder customJwtDecoder;

        @Bean
        SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
                httpSecurity
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(AbstractHttpConfigurer::disable)
                                .authorizeHttpRequests(request -> request
                                                .requestMatchers("/uploads/**").permitAll()
                                                .requestMatchers("/ws/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, PULIC_GET).permitAll()
                                                .requestMatchers(HttpMethod.PUT, PULIC_PUT).permitAll()
                                                .requestMatchers(HttpMethod.POST, PUBLIC_END_POINT_TEST).permitAll()
                                                .requestMatchers(HttpMethod.POST, PUBLIC_POST).permitAll() // main
                                                // .requestMatchers(HttpMethod.GET, "/api/users").hasAuthority("ADMIN")
                                                .anyRequest().authenticated())
                                .oauth2ResourceServer(
                                                auth2 -> auth2.jwt(JwtConfigurer -> JwtConfigurer
                                                                .decoder(customJwtDecoder)
                                                                .jwtAuthenticationConverter(authenticationConverter()))
                                                                .authenticationEntryPoint(
                                                                                new JwtAuthenticationEntryPoint()));

                return httpSecurity.build();
        }

        @Bean
        JwtAuthenticationConverter authenticationConverter() {
                JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
                authoritiesConverter.setAuthorityPrefix("");
                JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
                converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
                return converter;
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(
                                List.of("http://localhost:5173", 
                                        "http://localhost:5000",
                                         "http://127.0.0.1:5500",                                    
                                         "http://localhost:5500"));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
