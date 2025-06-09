package com.pbl5cnpm.airbnb_service.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

import io.github.cdimascio.dotenv.Dotenv;

@Configuration
public class CloudinaryConfig {

    
    // @Bean
    // public Cloudinary cloudinary() {
    //    Dotenv dotenv = Dotenv.load();
    //    return new Cloudinary(dotenv.get("CLOUDINARY_URL"));
    // }
    @Value("${CLOUDINARY_URL}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(cloudinaryUrl);
    }
}

