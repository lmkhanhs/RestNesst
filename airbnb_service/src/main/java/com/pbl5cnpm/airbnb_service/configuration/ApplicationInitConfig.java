package com.pbl5cnpm.airbnb_service.configuration;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.pbl5cnpm.airbnb_service.entity.AmenitesEntity;
import com.pbl5cnpm.airbnb_service.entity.CategoriesEntity;
import com.pbl5cnpm.airbnb_service.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.entity.ImagesEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.enums.ListingStatus;
import com.pbl5cnpm.airbnb_service.enums.RoleName;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.repository.AmenitiesRepository;
import com.pbl5cnpm.airbnb_service.repository.CategoriesRepository;
import com.pbl5cnpm.airbnb_service.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.repository.ReviewsRepository;
import com.pbl5cnpm.airbnb_service.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;
import com.pbl5cnpm.airbnb_service.service.RoleService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Configuration
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class ApplicationInitConfig {

    RoleService roleService;
    RoleRepository roleRepository;
    PasswordEncoder encoder;
    CategoriesRepository categoriesRepository;
    AmenitiesRepository amenitiesRepository;
    CountriesRepository countriesRepository;
    ListingsRepository listingsRepository;
    UserRepository userRepository;
    ReviewsRepository reviewsRepository;

    @Bean
    ApplicationRunner applicationRunner() {
        return args -> {
            createFullRole();
            createBaseCategoies();

            createdBaseAmenities();
            createdBaseCountries();
            if (userRepository.findByUsername("admin").isEmpty()) {
                Set<RoleEntity> roles = new HashSet<>(this.roleRepository.findAll());

                UserEntity userOrigin = UserEntity.builder()
                        .username("admin")
                        .password(encoder.encode("12345678"))
                        .roles(roles)
                        .build();
                userRepository.save(userOrigin);
                log.warn("User admin created with full Role");
            }//

            if (userRepository.findByUsername("host").isEmpty()) {
                RoleEntity host = this.roleRepository.findByRoleName(RoleName.HOST.toString()).get();
                Set<RoleEntity> roless = new HashSet<>();
                roless.add(host);

                UserEntity userOrigin = UserEntity.builder()
                        .username("host")
                        .password(encoder.encode("12345678"))
                        .roles(roless)
                        .build();
                userRepository.save(userOrigin);
                log.warn("User admin created with full Role");
            }
            //
            if (this.listingsRepository.findAll().size() == 0) {
                createdBaseListing();
                createdBaseListing2();
                createdReview();
            }

        };
    }

    private void createFullRole() {
        createRole(RoleName.ADMIN.name());
        createRole(RoleName.GUEST.name());
        createRole(RoleName.HOST.name());
    }

    private void createRole(String name) {
        if (this.roleRepository.findByRoleName(name).isEmpty()) {
            this.roleService.handleCreateRole(name);
        }
    }

    private void createBaseCategoies() {
        createBaseCategory("Công viên quốc gia", "congvienquocgia.png", 1);
        createBaseCategory("Biểu tượng", "bieutuong.png", 2);
        createBaseCategory("Thiết kế", "thietke.png", 3);
        createBaseCategory("Mới", "moi.png", 4);
        createBaseCategory("Vui chơi", "vuichoi.png", 5);
        createBaseCategory("Hướng biển", "huongbien.png", 6);
        createBaseCategory("Phòng", "phong.png", 7);
        createBaseCategory("Hồ bơi tuyệt đẹp", "hoboituyetdep.png", 8);
    }

    private void createBaseCategory(String name, String thumnailUrl, Integer position) {
        if (this.categoriesRepository.findByName(name).isEmpty()) {
            CategoriesEntity entity = CategoriesEntity.builder()
                    .name(name)
                    .thumnailUrl("/uploads/" + thumnailUrl)
                    .deleted(false)
                    .position(position)
                    .build();
            this.categoriesRepository.save(entity);
        }
    }

    private void createdBaseAmenities() {
        createdBaseAmenity("Hướng nhìn ra vườn", "huongnhinravuon.png");
        createdBaseAmenity("Hướng nhìn ra núi", "huongnhinranuii.png");
        createdBaseAmenity("Bếp", "bep.png");
        createdBaseAmenity("Chỗ đỗ xe miễn phí tại nơi ở", "chodoxxemienphi.png");
        createdBaseAmenity("Máy giặt", "maygiat.png");
        createdBaseAmenity("Wifi", "output_wifi.png");
        createdBaseAmenity("Hồ bơi chung", "hoboichung.png");
        createdBaseAmenity("Ti vi", "tivi.png");
    }

    private void createdBaseAmenity(String name, String thumnailUrl) {
        if (this.amenitiesRepository.findByName(name).isEmpty()) {
            AmenitesEntity entity = AmenitesEntity.builder()
                    .name(name)
                    .thumnailUrl("/uploads/" + thumnailUrl)
                    .deleted(false)
                    .build();
            this.amenitiesRepository.save(entity);
        }
    }

    private void createdBaseCountries() {
        createdBaseCountry("Việt Nam");
    }

    private void createdBaseCountry(String name) {
        if (this.countriesRepository.findByName(name).isEmpty()) {
            CountriesEntity entity = CountriesEntity.builder()
                    .name(name)
                    .thumbnail("https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/19/a5/0c/get-relaxing-with-your.jpg?w=700&h=700&s=1")
                    .description("Du lịch Việt Nam là một trải nghiệm phong phú và đa dạng, thu hút du khách bởi vẻ đẹp thiên nhiên hùng vĩ, nền văn hóa đậm đà bản sắc dân tộc và ẩm thực độc đáo. Từ vịnh Hạ Long – di sản thiên nhiên thế giới với hàng ngàn đảo đá vôi kỳ thú, đến phố cổ Hội An cổ kính, hay cố đô Huế trầm mặc mang đậm dấu ấn lịch sử, mỗi vùng miền đều mang một vẻ đẹp riêng. Việt Nam còn nổi tiếng với những bãi biển trải dài như Nha Trang, Đà Nẵng, Phú Quốc và những vùng cao nguyên thơ mộng như Đà Lạt, Sa Pa. Không chỉ có phong cảnh, du khách còn được hòa mình vào những lễ hội truyền thống đặc sắc, khám phá nền ẩm thực đa dạng với các món ăn như phở, bún chả, bánh mì, gỏi cuốn... Du lịch Việt Nam đang ngày càng phát triển, trở thành điểm đến hấp dẫn đối với cả du khách trong nước và quốc tế.")
                    .deleted(false)
                    .isActive(true)
                    .build();
            this.countriesRepository.save(entity);
        }
    }

    private void createdBaseListing() {
        ImagesEntity image1 = ImagesEntity.builder()
                .imageUrl("uploads/anh1.png")
                .deleted(false)
                .build();
        ImagesEntity image2 = ImagesEntity.builder()
                .imageUrl("uploads/anh2.png")
                .deleted(false)
                .build();
        UserEntity host = this.userRepository.findByUsername("admin")
                .orElseThrow(() -> new AppException(ErrorCode.USERNAME_VALID));
        List<CategoriesEntity> categoriesEntities = this.categoriesRepository.findAll();
        List<AmenitesEntity> amenitesEntities = null;
        List<ImagesEntity> imagesEntities = List.of(image1, image2);
        CountriesEntity countriesEntity = this.countriesRepository.findByName("Việt Nam")
                .orElseThrow(() -> new RuntimeException("k tim thay country viet nam trong database"));
        ListingEntity entity = ListingEntity.builder()
                .title("Nhà cho thuê")
                .address(" Số 140 Võ Nguyên Giáp, Ngũ Hành Sơn")
                .city("Đà Nẵng")
                .price(450000.0)
                .access(true)
                .area("50 m2")
                .deleted(false)
                .popular(true)
                .startDate(LocalDate.parse("2025-04-15"))
                .endDate(LocalDate.parse("2025-07-01"))
                .host(host)
                .status(ListingStatus.ACTIVE.toString())
                .categoriesEntities(categoriesEntities)
                .amenitesEntities(amenitesEntities)
                .imagesEntities(imagesEntities)
                .countriesEntity(countriesEntity)
                .position(1)
                .avgStart(4.9)
                .build();
        // Gán listing cho từng ảnh
        imagesEntities.forEach(img -> img.setListingEntity(entity));
        entity.setImagesEntities(imagesEntities);

        // Lưu listing (và cascade ảnh nếu có)
        this.listingsRepository.save(entity);
    }

    private void createdBaseListing2() {
        String description = """
                Có 5 loại phòng trong biệt thự Ngân Phú: Phòng đôi, phòng 3 người, phòng đơn, phòng 2 giường đơn và phòng 4 người.
                Nằm ở vị trí lý tưởng ở một vị trí tuyệt vời chỉ cách trung tâm Hội An 2 km và cách bãi biển Cửa Đại 2 km,
                với phòng hiện đại đẹp mắt và hiện đại yên tĩnh tuyệt đẹp, nhà của chúng tôi là nơi tốt nhất ở Hội An
                cho những ai muốn tận hưởng một kỳ nghỉ thoải mái trong bầu không khí ấm cúng như ở nhà.
                """;
        ImagesEntity image1 = ImagesEntity.builder()
                .imageUrl("uploads/anh11.png")
                .deleted(false)
                .build();
        ImagesEntity image2 = ImagesEntity.builder()
                .imageUrl("uploads/anh22.png")
                .deleted(false)
                .build();
        UserEntity host = this.userRepository.findByUsername("admin")
                .orElseThrow(() -> new AppException(ErrorCode.USERNAME_VALID));
        List<CategoriesEntity> categoriesEntities = this.categoriesRepository.findAll();
        List<AmenitesEntity> amenitesEntities = this.amenitiesRepository.findAll();
        List<ImagesEntity> imagesEntities = List.of(image1, image2);
        CountriesEntity countriesEntity = this.countriesRepository.findByName("Việt Nam")
                .orElseThrow(() -> new RuntimeException("k tim thay country viet nam trong database"));
        ListingEntity entity = ListingEntity.builder()
                .title("Nhà cho thuê")
                .address("Phố Cổ Hội An")
                .city("Quảng Nam")
                .price(300000.0)
                .access(true)
                .area("75 m2")
                .deleted(false)
                .popular(true)
                .startDate(LocalDate.parse("2025-04-13"))
                .endDate(LocalDate.parse("2025-07-01"))
                .host(host)
                .status(ListingStatus.ACTIVE.toString())
                .categoriesEntities(categoriesEntities)
                .amenitesEntities(amenitesEntities)
                .imagesEntities(imagesEntities)
                .countriesEntity(countriesEntity)
                .position(2)
                .avgStart(4.5)
                .description(description)
                .build();

        imagesEntities.forEach(img -> img.setListingEntity(entity));
        entity.setImagesEntities(imagesEntities);

        // Lưu listing (và cascade ảnh nếu có)
        this.listingsRepository.save(entity);
    }

    private void createdReview() {
        UserEntity host = this.userRepository.findByUsername("admin")
                .orElseThrow(() -> new AppException(ErrorCode.USERNAME_VALID));
        ListingEntity listingEntity = this.listingsRepository.findById(2L)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));
        ReviewEntity reviewEntity = ReviewEntity.builder()
                .comment("Phòng đẹp, thoáng mát")
                .rating(5.0)
                .userEntity(host)
                .listingEntity(listingEntity)
                .build();
        this.reviewsRepository.save(reviewEntity);
    }
}
