package com.pbl5cnpm.airbnb_service.booking.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.booking.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    List<BookingEntity> findByUser(UserEntity user);

    Page<BookingEntity> findAllByDeleted(Boolean deleted, Pageable pageable);

    @Query("SELECT b FROM BookingEntity b "
            + "JOIN FETCH b.listing l "
            + "LEFT JOIN FETCH b.user u "
            + "LEFT JOIN FETCH b.payment p "
            + "WHERE l.host = :host AND (b.deleted IS NULL OR b.deleted = false) "
            + "ORDER BY b.createdAt DESC")
    List<BookingEntity> findAllByListingHost(@Param("host") UserEntity host);
}
