package com.pbl5cnpm.airbnb_service.user.entity;

import com.pbl5cnpm.airbnb_service.booking.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.country.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.favorite.entity.FavoriteEntity;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.review.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.shared.entity.BaseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode
@Entity
@Table(name = "users")
public class UserEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String fullname;
    String email;
    String phone;
    String password;
    String thumnailUrl;
    String address;
    LocalDateTime lastLogin;
    @ManyToOne
    @JoinColumn(name = "country_id")
    CountriesEntity country;
    Boolean isActive;
    @Column(name = "host_application_pending", nullable = false, columnDefinition = "boolean default false")
    boolean hostApplicationPending;
    String languages;
    Integer didHostYear;
    @Column(name = "host_experience", columnDefinition = "TEXT")
    String hostExperience;
    @Column(columnDefinition = "TEXT")
    String description;
    @Column(nullable = false, unique = true)
    String username;
    @ManyToMany
    @JoinTable(name = "user_languages", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "language_id"))
    @Builder.Default
    @EqualsAndHashCode.Exclude
    Set<LanguageEntity> languageEntities = new HashSet<>();
    @ManyToMany
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    Set<RoleEntity> roles = new HashSet<>();
    @OneToMany(mappedBy = "host")
    List<ListingEntity> listings = new ArrayList<>();

    @OneToMany(mappedBy = "userEntity", cascade = CascadeType.ALL)
    List<ReviewEntity> reviews;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    List<FavoriteEntity> favoriteListings;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<BookingEntity> bookings = new ArrayList<>();
}
