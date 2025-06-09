package com.pbl5cnpm.airbnb_service.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl5cnpm.airbnb_service.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    List<BookingEntity> findByUser(UserEntity user);

    Page<BookingEntity> findAllByDeleted(Boolean deleted, Pageable pageable);
}
