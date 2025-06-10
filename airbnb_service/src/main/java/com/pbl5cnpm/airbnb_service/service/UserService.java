package com.pbl5cnpm.airbnb_service.service;

import java.text.ParseException;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.pbl5cnpm.airbnb_service.dto.Request.ApplyHostResquest;
import com.pbl5cnpm.airbnb_service.dto.Request.PasswordChangeRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateProFileHost;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateUserProfileByAdminiRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UserProfileRequset;
import com.pbl5cnpm.airbnb_service.dto.Request.UserRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.ListingFavorite;
import com.pbl5cnpm.airbnb_service.dto.Response.StatisticCountUser;
import com.pbl5cnpm.airbnb_service.dto.Response.UserFavoriteResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.UserInfor;
import com.pbl5cnpm.airbnb_service.dto.Response.UserResponse;
import com.pbl5cnpm.airbnb_service.entity.ApplyHostEntity;
import com.pbl5cnpm.airbnb_service.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.enums.RoleName;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.ListingMapper;
import com.pbl5cnpm.airbnb_service.mapper.UserMapper;
import com.pbl5cnpm.airbnb_service.repository.ApplyHostListRepository;
import com.pbl5cnpm.airbnb_service.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.repository.UserRepository;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final ApplyHostListRepository applyHostListRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserMapper mapper;
    private final MailerService mailerService;
    private final PasswordEncoder passwordEncoder;
    private final ListingMapper listingMapper;
    private final CloudinaryService cloudinaryService;
    private final CountriesRepository countriesRepository;
    private final ListingsRepository listingsRepository;
    @Value("${security.secret}")
    private String SIGNER_KEY;
    @Value("${image.customer}")
    private String THUMNAIL;

    public UserResponse handleGetInforByID(Long id) {
        UserEntity entity = this.userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return this.mapper.toUserResponse(entity);
    }

    public UserResponse handleCreateUser(UserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }

        new Thread(() -> {
            try {
                String name = request.getFullname();
                mailerService.sendHtmlEmail(request.getEmail(), "Welcome to Airbnb",
                        "Thank " + name + " for choosing our service!");
            } catch (MessagingException e) {
                log.error("Send mail fail!");
                e.printStackTrace();
            }
        }).start();

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        Set<RoleEntity> roles = new HashSet<>();
        roles.add(roleRepository.findByRoleName(RoleName.GUEST.name())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED)));

        UserEntity userEntity = mapper.toUserEntity(request);
        userEntity.setPassword(encodedPassword);
        userEntity.setRoles(roles);
        userEntity.setThumnailUrl(THUMNAIL);
        userEntity.setIsActive(true);
        return mapper.toUserResponse(userRepository.save(userEntity));
    }

    public List<UserResponse> handleGetAll() {
        List<UserEntity> users = userRepository.findAll();
        return users.stream()
                .map(mapper::toUserResponse)
                .collect(Collectors.toList());
    }

    public String getUserNameJwt(String token) throws ParseException, JOSEException {
        JWSVerifier jwsVerifier = new MACVerifier(SIGNER_KEY);
        SignedJWT jwt = SignedJWT.parse(token);
        boolean verifed = jwt.verify(jwsVerifier);
        if (!verifed) {
            return null;
        } else {
            return jwt.getJWTClaimsSet().getSubject();
        }
    }

    public UserInfor handleInfor(String token) throws ParseException, JOSEException {
        String username = getUserNameJwt(token);
        UserEntity user = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return this.mapper.toUserInfor(user);
    }

    public UserFavoriteResponse getFavorites(String username) {
        UserEntity user = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Long userId = user.getId();
        List<ListingEntity> favoriteEntity = this.userRepository.findFavorites(userId);
        List<ListingFavorite> favorites = favoriteEntity.stream()
                .map(data -> this.listingMapper.toLitingFavorite(data))
                .toList();
        return UserFavoriteResponse.builder()
                .userId(userId)
                .favorites(favorites)
                .build();
    }

    public UserInfor handleUpdateProfile(UserProfileRequset profileRequset, String username) {
        UserEntity userEntity = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (!profileRequset.getEmail().isBlank()) {
            userEntity.setEmail(profileRequset.getEmail());
        }
        if (!profileRequset.getFullname().isBlank()) {
            userEntity.setFullname(profileRequset.getFullname());
        }
        if (!profileRequset.getPhone().isBlank()) {
            userEntity.setPhone(profileRequset.getPhone());
        }
        if (profileRequset.getThumnail() != null) {
            var url = this.cloudinaryService.uploadImageCloddy(profileRequset.getThumnail());
            userEntity.setThumnailUrl(url);
        }
        if (profileRequset.getAddress() != null) {
            userEntity.setAddress(profileRequset.getAddress());
        }
        return this.mapper.toUserInfor(this.userRepository.save(userEntity));
    }

    public Long handleCountUser() {
        return this.userRepository.count();
    }

    public UserInfor handleChangePass(PasswordChangeRequest request) {
        String username = request.getUsername();
        UserEntity userEntity = this.userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USERNAME_VALID));

        String oldPassword = request.getPassword();
        if (!this.passwordEncoder.matches(oldPassword, userEntity.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }

        if (!request.getNewPassword().equals(request.getVerifyPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_NOT_MATCH);
        }

        userEntity.setPassword(this.passwordEncoder.encode(request.getNewPassword()));
        return this.mapper.toUserInfor(this.userRepository.save(userEntity));
    }

    public HostProfileResponse handlegetHost(Long id) {
        UserEntity entity = this.userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return this.mapper.toHostProfile(entity);
    }

    public Boolean handleApply(ApplyHostResquest applyHostResquest) {
        UserEntity entity = this.userRepository.findById(applyHostResquest.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        entity.setDescription(applyHostResquest.getDescription());
        entity.setLanguages(applyHostResquest.getLanguage());
        entity.setLanguages(applyHostResquest.getLanguage());
        entity.setDidHostYear(applyHostResquest.getDidHostYear());
        String country = applyHostResquest.getCountry();
        CountriesEntity countriesEntity = this.countriesRepository.findByName(country)
                .orElseThrow(() -> new AppException(ErrorCode.COUNTRY_NOT_EXISTED));
        entity.setCountry(countriesEntity);
        ApplyHostEntity entityApl = ApplyHostEntity.builder()
                .hostId(entity.getId())
                .deleted(false)
                .build();
        this.applyHostListRepository.save(entityApl);
        this.userRepository.save(entity);
        return true;
    }

    public List<HostProfileResponse> handleGetApplyPerson() {
        // Lấy danh sách các apply request chưa xóa
        List<ApplyHostEntity> applyToHosts = applyHostListRepository.findAllByDeleted(false);
        List<UserEntity> allUsers = userRepository.findAll();

        Set<Long> appliedHostIds = applyToHosts.stream()
                .map(ApplyHostEntity::getHostId)
                .collect(Collectors.toSet());
        List<HostProfileResponse> result = allUsers.stream()
                .filter(user -> appliedHostIds.contains(user.getId()))
                .map(user -> mapper.toHostProfile(user))
                .toList();
        return result;
    }

    public boolean handleAccsetHost(Long host_id) {
        UserEntity userEntity = this.userRepository.findById(host_id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Set<RoleEntity> roles = userEntity.getRoles();
        RoleEntity roleHost = this.roleRepository.findByRoleName(RoleName.HOST.toString()).get();
        if (!roles.contains(roleHost)) {
            roles.add(this.roleRepository.findByRoleName(RoleName.HOST.toString()).get());
            userEntity.setRoles(roles);
            userEntity = this.userRepository.save(userEntity);

            // xóa ra khỏi danh sach tohost
            ApplyHostEntity applyHostEntity = this.applyHostListRepository.findByHostId(userEntity.getId()).get();
            this.applyHostListRepository.delete(applyHostEntity);
            return true;
        }

        return false;
    }

    public void handleRejectAccess(Long host_id) {
        UserEntity userEntity = this.userRepository.findById(host_id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        ApplyHostEntity applyHostEntity = this.applyHostListRepository.findByHostId(userEntity.getId()).get();
        this.applyHostListRepository.delete(applyHostEntity);

    }

    public UserResponse handleChangeActive(Long user_id, boolean status) {
        UserEntity userEntity = this.userRepository.findById(user_id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        userEntity.setIsActive(status);

        userEntity = this.userRepository.save(userEntity);

        List<ListingEntity> listingEntitys = this.listingsRepository.findByHostAndDeleted(userEntity, false);
        listingEntitys = listingEntitys.stream()
                .map(item -> {
                    item.setAccess(false);
                    return item;
                })
                .collect(Collectors.toList());
        this.listingsRepository.saveAll(listingEntitys);
        return this.mapper.toUserResponse(userEntity);

    }

    public UserResponse handleChangeProfileUser(UpdateUserProfileByAdminiRequest newProfile) {
        UserEntity userEntity = this.userRepository.findById(newProfile.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (newProfile.getAddress() != null) {
            userEntity.setAddress(newProfile.getAddress());
        }
        if (newProfile.getEmail() != null) {
            userEntity.setEmail(newProfile.getEmail());
        }
        if (newProfile.getFullname() != null) {
            userEntity.setFullname(userEntity.getFullname());
        }
        if (newProfile.getPhone() != null) {
            userEntity.setPhone(newProfile.getPhone());
        }
        if (newProfile.getRole().equals("HOST")) {
            Set<RoleEntity> roles = userEntity.getRoles();
            RoleEntity host = this.roleRepository.findByRoleName(RoleName.HOST.toString()).get();

            roles.add(host);
            userEntity.setRoles(roles);

        } else if (newProfile.getRole().equals("GUEST")) {
            Set<RoleEntity> roles = new HashSet<>();
            RoleEntity host = this.roleRepository.findByRoleName(RoleName.GUEST.toString()).get();
            roles.add(host);
            userEntity.setRoles(roles);
            List<ListingEntity> listingEntitys = this.listingsRepository.findByHostAndDeleted(userEntity, false);
            listingEntitys = listingEntitys.stream()
                    .map(item -> {
                        item.setAccess(false);
                        return item;
                    })
                    .collect(Collectors.toList());
            this.listingsRepository.saveAll(listingEntitys);
        }

        return this.mapper.toUserResponse(this.userRepository.save(userEntity));
    }

    public void handleUpdateHost(UpdateProFileHost fileHost, String username) {
        UserEntity entity = this.userRepository.findByUsername(username).get();
        if (fileHost.getCountry() != null) {
            var coutry = this.countriesRepository.findByName(fileHost.getCountry())
                    .orElseThrow(() -> new AppException(ErrorCode.COUNTRY_NOT_EXISTED));
            entity.setCountry(coutry);
        }
        if (fileHost.getEmail() != null) {
            entity.setEmail(fileHost.getEmail());
        }
        if (fileHost.getPhone() != null) {
            entity.setEmail(fileHost.getEmail());
        }
        if (fileHost.getLanguages() != null) {
            entity.setLanguages(fileHost.getLanguages());
        }
        if (fileHost.getDidHostYear() != null) {
            entity.setDidHostYear(fileHost.getDidHostYear());
        }
        if (fileHost.getDescription() != null) {
            entity.setDescription(fileHost.getDescription());
        }
        if (fileHost.getThumnail() != null) {
            entity.setThumnailUrl(this.cloudinaryService.uploadImageCloddy(fileHost.getThumnail()));
        }
        this.userRepository.save(entity);
    }

}
