package com.pbl5cnpm.airbnb_service.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.pbl5cnpm.airbnb_service.dto.Request.ListingRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.ReviewRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateListingRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingDetailResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingResponseManager;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingResponseManagerForHost;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingsResponse;
import com.pbl5cnpm.airbnb_service.entity.BookingEntity;
import com.pbl5cnpm.airbnb_service.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.enums.BookingStatus;
import com.pbl5cnpm.airbnb_service.enums.ListingStatus;
import com.pbl5cnpm.airbnb_service.enums.RoleName;
import com.pbl5cnpm.airbnb_service.enums.StatusComment;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.repository.BookingRepository;
import com.pbl5cnpm.airbnb_service.repository.ImageRepository;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.repository.ReviewsRepository;
import com.pbl5cnpm.airbnb_service.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ListingsServices {
    private final ListingsRepository listingsRepository;
    private final ListingMapper listingMapper;
    private final UserRepository userRepository;
    private final FileImageService fileImageService;
    private final BookingRepository bookingRepository;
    private final CloudinaryService cloudinaryService;
    private final ReviewsRepository reviewsRepository;
    private final ImageRepository imageRepository;
    private final RoleRepository roleRepository;
    @Value("${upload.directory}")
    private String UPLOAD_DIR;

    public List<ListingsResponse> handleGetAll() {
        List<ListingEntity> entitys = this.listingsRepository.findAllAndStatus(ListingStatus.ACTIVE.toString(), false,
                true, LocalDate.now(), true);

        return entitys.stream().map(listingMapper::toResponse).toList();
    }

    public ListingDetailResponse getDetail(Long id) {
        ListingEntity entity = this.listingsRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        return this.listingMapper.toDetailResponse(entity);
    }

    public ListingsResponse handlleCreate(ListingRequest listingRequest, String username) throws IOException {
        UserEntity host = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        ListingEntity entity = this.listingMapper.toEntity(listingRequest);

        entity.setHost(host);
        entity.setDeleted(false);
        entity.setStatus(ListingStatus.ACTIVE.toString());
        entity.setAvgStart(4.9);
        entity.setPosition(this.listingsRepository.count());
        entity.setPopular(true);
        boolean isAdmin = host.getRoles().stream()
                .anyMatch(role -> role.getRoleName().equals(RoleName.ADMIN.toString()));
        entity.setAccess(isAdmin);
        // UPDATE
        List<ImagesEntity> imagesEntities = new ArrayList<>();
        List<MultipartFile> imgs = listingRequest.getImgs();
        for (MultipartFile multipartFile : imgs) {
            ImagesEntity imagesEntity = ImagesEntity.builder()
                    .imageUrl(this.fileImageService.saveImageFile(multipartFile))
                    .deleted(false)
                    .listingEntity(entity)
                    .build();

            imagesEntities.add(imagesEntity);
        }
        entity.setImagesEntities(imagesEntities);
        new Thread(() -> {
            try {
                handleThread(entity, imagesEntities);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();

        var enti = this.listingsRepository.save(entity);
        return this.listingMapper.toResponse(enti);
    }

    private void handleThread(ListingEntity listingEntity, List<ImagesEntity> imagesEntities) throws IOException {
        System.out.println("checkkk");
        for (int i = 0; i < imagesEntities.size(); i++) {
            ImagesEntity imagesEntity = imagesEntities.get(i);

            // Lấy file từ DB
            String imageUrl = imagesEntity.getImageUrl();
            String fileName = Paths.get(imageUrl).getFileName().toString();
            Path filePath = Paths.get(UPLOAD_DIR).resolve(fileName);
            File file = filePath.toFile();

            if (!file.exists()) {
                System.out.println("File not exits " + filePath.toAbsolutePath());
                continue;
            }
            // add file lên server
            String newUrl = this.cloudinaryService.uploadImageCloddy(file);
            imagesEntity.setImageUrl(newUrl);
            // delete file after uplaod
            this.fileImageService.deleteImageFile(fileName);
        }

        this.imageRepository.saveAll(imagesEntities);
    }

    public Long getCount() {
        return this.listingsRepository.countByDeletedFalse();
    }

    public List<ListingsResponse> handlerSearch(String keyword) {
        List<ListingEntity> listingEntities = this.listingsRepository.searchByKey(keyword);
        return listingEntities.stream()
                .map(data -> this.listingMapper.toResponse(data))
                .toList();
    }

    public List<ListingsResponse> handlerfilter(Map<String, String> args, List<String> amenities) {
        List<ListingEntity> listingEntities = this.listingsRepository.filter(args, amenities);
        return listingEntities.stream()
                .map(data -> this.listingMapper.toResponse(data))
                .toList();
    }

    public boolean handleAccessStatus(Boolean status, Long listingId) {
        ListingEntity listingEntity = this.listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        UserEntity userEntity = listingEntity.getHost();
        Set<RoleEntity> roles = userEntity.getRoles();
        RoleEntity admin = this.roleRepository.findByRoleName(RoleName.ADMIN.toString())
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        RoleEntity host = this.roleRepository.findByRoleName(RoleName.HOST.toString())
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        if (status == true) {
            // v1
            if (roles.contains(host) == false && roles.contains(admin) == false) {
                throw new AppException(ErrorCode.LISTING_NOT_ADMIN_OR_HOST);
            }
            // v1
            listingEntity.setAccess(true);
            this.listingsRepository.save(listingEntity);
            return true;
        }
        listingEntity.setAccess(false);
        this.listingsRepository.save(listingEntity);
        return false;
    }

    public List<ListingResponseManager> handlegetfullAll() {
        List<ListingEntity> entities = this.listingsRepository.findAllByDeletedOrderByPositionAsc(false);
        return entities.stream()
                .map(data -> this.listingMapper.toLisingResposeManager(data))
                .toList();
    }

    public void handleDelete(Long listingId) {
        ListingEntity listingEntity = this.listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        listingEntity.setDeleted(true);
        this.listingsRepository.save(listingEntity);
    }

    public void handleChangePosition(Long listingId, Long position) {
        ListingEntity listingEntity = this.listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        listingEntity.setPosition(position);
        this.listingsRepository.save(listingEntity);
    }

    public List<ListingResponseManagerForHost> getListingHost(String username) {
        UserEntity userEntity = this.userRepository.findByUsername(username).get();
        List<ListingEntity> entities = this.listingsRepository.findByHostAndDeleted(userEntity, false);
        return entities.stream()
                .map(data -> this.listingMapper.toListingResponseManagerForHost(data))
                .toList();
    }

    public ListingsResponse handleUpdateListingByHost(String username, UpdateListingRequest listingRequest) {
        UserEntity host = this.userRepository.findByUsername(username).get();
        ListingEntity listinginfor = this.listingMapper.toListingEntityForUpdate(listingRequest);

        ListingEntity entity = this.listingsRepository.findById(listinginfor.getId())
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        String status = listinginfor.getStatus().equals(ListingStatus.ACTIVE.toString())
                ? ListingStatus.ACTIVE.toString()
                : ListingStatus.INACTIVE.toString();
        entity.setTitle(listinginfor.getTitle());
        entity.setDescription(listinginfor.getDescription());
        entity.setAddress(listinginfor.getAddress());
        entity.setCity(listinginfor.getCity());
        entity.setArea(listinginfor.getArea());
        entity.setCountriesEntity(listinginfor.getCountriesEntity());
        entity.setCategoriesEntities(listinginfor.getCategoriesEntities());

        if (listinginfor.getImagesEntities() != null) {
            entity.getImagesEntities().clear();
            entity.setImagesEntities(listinginfor.getImagesEntities());
            for (ImagesEntity imagesEntity : listinginfor.getImagesEntities()) {
                imagesEntity.setListingEntity(entity);
            }
        }
        entity.setCategoriesEntities(listinginfor.getCategoriesEntities());
        entity.setStartDate(listinginfor.getStartDate());
        entity.setEndDate(listinginfor.getEndDate());
        entity.setPrice(listinginfor.getPrice());
        entity.setStatus(status);
        boolean isAdmin = host.getRoles().stream()
                .anyMatch(role -> role.getRoleName().equals(RoleName.ADMIN.toString()));
        entity.setAccess(isAdmin);
        return this.listingMapper.toResponse(this.listingsRepository.save(entity));
    }

    public void handleAddReview(ReviewRequest reviewRequest, String username, Long id_booking) {
        BookingEntity bookingEntity = this.bookingRepository.findById(id_booking)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXIT));
        UserEntity userEntity = this.userRepository.findByUsername(username).get();
        if (userEntity.equals(bookingEntity.getUser())
                && bookingEntity.getBookingStatus().equals(BookingStatus.SUCCESS.toString())
                && bookingEntity.getCommented() == false) {
            ListingEntity listingEntity = bookingEntity.getListing();

            ReviewEntity reviewEntity = convertoReviewEntity(reviewRequest);
            reviewEntity.setUserEntity(userEntity);
            reviewEntity.setListingEntity(listingEntity);

            this.reviewsRepository.save(reviewEntity);
            bookingEntity.setCommented(true);
            this.bookingRepository.save(bookingEntity);
        } else {
            throw new AppException(ErrorCode.INVALID);
        }
    }

    private ReviewEntity convertoReviewEntity(ReviewRequest request) {
        ReviewEntity reviewEntity = new ReviewEntity();
        reviewEntity.setComment(request.getComment());
        reviewEntity.setRating(request.getRating());
        String imageURL = this.cloudinaryService.uploadImageCloddy(request.getImage());
        reviewEntity.setImageUrl(imageURL);
        reviewEntity.setReviewDate(LocalDate.now());
        if (request.getStatus().equals(StatusComment.NEGATIVE.toString())) {
            reviewEntity.setStatus("NEGATIVE");
        }
        if (request.getStatus().equals(StatusComment.POSITIVE.toString())) {
            reviewEntity.setStatus("POSITIVE");
        }
        return reviewEntity;
    }

    @Scheduled(fixedRateString = "${schedule.AvgStart}")
    public void updateAvgStart() {
        this.listingsRepository.updateAvgStart();
    }

    @Scheduled(fixedRateString = "${schedule.Popular}")
    public void updatePopular() {
        this.listingsRepository.updatePopular();
    }

}