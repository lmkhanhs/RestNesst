package com.pbl5cnpm.airbnb_service.country.entity;

import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.shared.entity.BaseEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "countries")
public class CountriesEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(unique = true)
    String name;
    Boolean deleted;
    @Column(columnDefinition = "TEXT")
    String description;
    String thumbnail;
    Boolean isActive;
    @OneToMany(mappedBy = "countriesEntity")
    List<ListingEntity> listings;

    // Một quốc gia có thể có nhiều user
    @OneToMany(mappedBy = "country")
    private List<UserEntity> users;
}

