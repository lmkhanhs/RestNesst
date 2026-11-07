package com.pbl5cnpm.airbnb_service.booking.mapper;

import com.pbl5cnpm.airbnb_service.booking.dto.request.BookingRequest;
import com.pbl5cnpm.airbnb_service.booking.dto.response.BookingResponse;
import com.pbl5cnpm.airbnb_service.booking.dto.response.HostBookingResponse;
import com.pbl5cnpm.airbnb_service.booking.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class BookingMapper {

    @Autowired
    protected ListingsRepository listingsRepository;

    @Mapping(source = "listingId", target = "listing", qualifiedByName = "toListingEntity")
    public abstract BookingEntity toBookingEntity(BookingRequest request);

    @Named("toListingEntity")
    protected ListingEntity toListingEntity(Long listingId) {
        if (listingId == null)
            return null;
        return listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
    }

    @Mapping(source = "id", target = "bookingId")
    @Mapping(source = "listing.id", target = "listingId")
    @Mapping(source = "listing", target = "primaryUrl", qualifiedByName = "toPrimaryUrl")
    @Mapping(source = "listing.title", target = "title")
    @Mapping(source = "listing.avgStart", target = "avgStart")
    @Mapping(source = "listing.popular", target = "popular")
    @Mapping(source = "listing.address", target = "address")
    @Mapping(source = "listing.city", target = "city")
    @Mapping(source = "listing.price", target = "price")
    @Mapping(source = "listing.area", target = "area")
    @Mapping(source = "checkInDate", target = "checkInDate")
    @Mapping(source = "checkOutDate", target = "checkOutDate")
    @Mapping(source = "totalPrice", target = "totalPrice")
    @Mapping(source = "content", target = "content")
    @Mapping(source = "payment.status", target = "paymentStatus")
    public abstract BookingResponse toBookingResponse(BookingEntity bookingEntity);

    @Named("toPrimaryUrl")
    protected String toPrimaryUrl(ListingEntity listing) {
        if (listing == null || listing.getImagesEntities() == null || listing.getImagesEntities().isEmpty()) {
            return null;
        }
        return listing.getImagesEntities().get(0).getImageUrl(); 
    }

    @Mapping(source = "id", target = "bookingId")
    @Mapping(source = "listing.id", target = "listingId")
    @Mapping(source = "listing", target = "primaryUrl", qualifiedByName = "toPrimaryUrl")
    @Mapping(source = "listing.title", target = "title")
    @Mapping(source = "listing.address", target = "address")
    @Mapping(source = "listing.city", target = "city")
    @Mapping(source = "listing.price", target = "price")
    @Mapping(source = "user.id", target = "guestId")
    @Mapping(source = "user", target = "guestName", qualifiedByName = "toGuestName")
    @Mapping(source = "user.username", target = "guestUsername")
    @Mapping(source = "user.email", target = "guestEmail")
    @Mapping(source = "user.thumnailUrl", target = "guestAvatar")
    @Mapping(source = "checkInDate", target = "checkInDate")
    @Mapping(source = "checkOutDate", target = "checkOutDate")
    @Mapping(source = "totalPrice", target = "totalPrice")
    @Mapping(source = "content", target = "content")
    @Mapping(source = "bookingStatus", target = "bookingStatus")
    @Mapping(source = "payment.status", target = "paymentStatus")
    @Mapping(source = "commented", target = "commented")
    @Mapping(source = "createdAt", target = "createdAt")
    public abstract HostBookingResponse toHostBookingResponse(BookingEntity bookingEntity);

    @Named("toGuestName")
    protected String toGuestName(UserEntity user) {
        if (user == null) {
            return null;
        }
        if (user.getFullname() != null && !user.getFullname().isBlank()) {
            return user.getFullname().trim();
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim();
        }
        return user.getEmail();
    }

}
