package com.pbl5cnpm.airbnb_service.service;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl5cnpm.airbnb_service.dto.Request.BookingRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.BookingResponse;
import com.pbl5cnpm.airbnb_service.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.enums.BookingStatus;
import com.pbl5cnpm.airbnb_service.enums.ListingStatus;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.BookingMapper;
import com.pbl5cnpm.airbnb_service.repository.BookingRepository;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingMapper bookingMapper;
    private final UserRepository userRepository;
    private final ListingsRepository listingsRepository;

    public BookingResponse handleBooking(BookingRequest bookingRequest, String username) {
        UserEntity userEntity = this.userRepository.findByUsername(username).get();

        BookingEntity bookingEntity = bookingMapper.toBookingEntity(bookingRequest);
        bookingEntity.setBookingStatus("PENDING");
        bookingEntity.setUser(userEntity);
        bookingEntity.setCommented(false);
        bookingEntity.setDeleted(false);
        BookingEntity savedEntity = bookingRepository.save(bookingEntity);

        return bookingMapper.toBookingResponse(savedEntity);
    }

    public List<BookingResponse> bookingResponse(String username) {
        var user = this.userRepository.findByUsername(username).get();
        List<BookingEntity> bookingEntities = this.bookingRepository.findByUser(user);

        return bookingEntities.stream()
                .map(data -> this.bookingMapper.toBookingResponse(data))
                .toList();
    }

    public BookingResponse handlePressReturn(String username, Long booking_id) {
        UserEntity userEntity = this.userRepository.findByUsername(username).get();
        BookingEntity bookingEntity = this.bookingRepository.findById(booking_id)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXIT));

        if (userEntity.equals(bookingEntity.getUser())
                && BookingStatus.PAID.toString().equals(bookingEntity.getBookingStatus()) == true) {
            bookingEntity.setBookingStatus(BookingStatus.SUCCESS.toString());
            ListingEntity listingEntity = bookingEntity.getListing();
            listingEntity.setStatus(ListingStatus.AVAILABLE.toString());

            bookingEntity = this.bookingRepository.save(bookingEntity);
            this.listingsRepository.save(listingEntity);

            return this.bookingMapper.toBookingResponse(bookingEntity);
        } else {
            throw new AppException(ErrorCode.INVALID);
        }
    }

    public List<BookingResponse> handlerGetBookingForAdmin(Pageable pageable) {
        var entyties = this.bookingRepository.findAllByDeleted(false, pageable);
        List<BookingEntity> bookings = entyties.getContent();
        return bookings.stream()
                .map(item -> this.bookingMapper.toBookingResponse(item))
                .toList();
    }

}
