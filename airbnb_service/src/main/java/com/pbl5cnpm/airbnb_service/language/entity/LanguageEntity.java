package com.pbl5cnpm.airbnb_service.language.entity;

import java.util.List;

import com.pbl5cnpm.airbnb_service.shared.entity.BaseEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
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
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "languages")
public class LanguageEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(unique = true, nullable = false)
    String name;

    @Column(length = 20)
    String code;

    @Column(columnDefinition = "TEXT")
    String description;

    Boolean deleted;

    Boolean isActive;

    @ManyToMany(mappedBy = "languageEntities")
    List<UserEntity> users;
}
