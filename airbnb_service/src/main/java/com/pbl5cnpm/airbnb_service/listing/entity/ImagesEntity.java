package com.pbl5cnpm.airbnb_service.listing.entity;

import com.pbl5cnpm.airbnb_service.shared.entity.BaseEntity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "images")
public class ImagesEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(unique = true)
    String imageUrl;
    Boolean deleted;
    @ManyToOne
    @JoinColumn(name = "listing_id") 
    private ListingEntity listingEntity; 
}
