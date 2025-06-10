package com.pbl5cnpm.airbnb_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AirbnbServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AirbnbServiceApplication.class, args);
    }

}
