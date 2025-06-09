package com.pbl5cnpm.airbnb_service.mapper;

import com.pbl5cnpm.airbnb_service.dto.Request.BookingRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.BookingResponse;
import com.pbl5cnpm.airbnb_service.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;

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

}
