package com.pbl5cnpm.airbnb_service.user.service;

import com.pbl5cnpm.airbnb_service.shared.mail.MailerService;
import com.pbl5cnpm.airbnb_service.shared.storage.CloudinaryService;

import java.text.ParseException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.pbl5cnpm.airbnb_service.user.dto.request.ApplyHostResquest;
import com.pbl5cnpm.airbnb_service.user.dto.request.PasswordChangeRequest;
import com.pbl5cnpm.airbnb_service.user.dto.request.UpdateProFileHost;
import com.pbl5cnpm.airbnb_service.user.dto.request.UpdateUserProfileByAdminiRequest;
import com.pbl5cnpm.airbnb_service.user.dto.request.UserProfileRequset;
import com.pbl5cnpm.airbnb_service.user.dto.request.UserRequest;
import com.pbl5cnpm.airbnb_service.user.dto.response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.statistics.dto.response.StatisticCountUser;
import com.pbl5cnpm.airbnb_service.user.dto.response.UserInfor;
import com.pbl5cnpm.airbnb_service.user.dto.response.UserResponse;
import com.pbl5cnpm.airbnb_service.country.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.language.entity.LanguageEntity;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.role.entity.RoleEntity;
import com.pbl5cnpm.airbnb_service.user.entity.UserEntity;
import com.pbl5cnpm.airbnb_service.role.enums.RoleName;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.user.mapper.UserMapper;
import com.pbl5cnpm.airbnb_service.country.repository.CountriesRepository;
import com.pbl5cnpm.airbnb_service.language.repository.LanguageRepository;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;
import com.pbl5cnpm.airbnb_service.role.repository.RoleRepository;
import com.pbl5cnpm.airbnb_service.user.repository.UserRepository;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserMapper mapper;
    private final MailerService mailerService;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;
    private final CountriesRepository countriesRepository;
    private final ListingsRepository listingsRepository;
    private final LanguageRepository languageRepository;
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

    @Transactional(readOnly = true)
    public HostProfileResponse handlegetHost(Long id) {
        UserEntity entity = this.userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return this.mapper.toHostProfile(entity);
    }

    @Transactional
    public Boolean handleApply(ApplyHostResquest applyHostResquest) {
        if (applyHostResquest.getUserId() == null) {
            throw new AppException(ErrorCode.INVALID);
        }
        UserEntity entity = this.userRepository.findById(applyHostResquest.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (hasHostRole(entity)) {
            throw new AppException(ErrorCode.INVALID);
        }
        String countryName = applyHostResquest.getCountry() == null ? "" : applyHostResquest.getCountry().trim();
        CountriesEntity countriesEntity = this.countriesRepository.findByName(countryName)
                .orElseThrow(() -> new AppException(ErrorCode.COUNTRY_NOT_EXISTED));

        if (applyHostResquest.getFullname() != null && !applyHostResquest.getFullname().isBlank()) {
            entity.setFullname(applyHostResquest.getFullname().trim());
        }
        entity.setDescription(applyHostResquest.getDescription());
        syncUserLanguages(entity, applyHostResquest.getLanguageIds(), applyHostResquest.getLanguage());

        String normalizedExperience = applyHostResquest.getExperience() == null
                ? null
                : applyHostResquest.getExperience().trim();
        if (normalizedExperience != null && !normalizedExperience.isEmpty()) {
            entity.setHostExperience(normalizedExperience);
            if (applyHostResquest.getDidHostYear() == null) {
                entity.setDidHostYear(ApplyHostResquest.extractYearsFromText(normalizedExperience));
            } else {
                entity.setDidHostYear(applyHostResquest.getDidHostYear());
            }
        } else {
            entity.setDidHostYear(applyHostResquest.getDidHostYear());
            if (applyHostResquest.getDidHostYear() != null) {
                entity.setHostExperience(applyHostResquest.getDidHostYear() + " năm kinh nghiệm");
            }
        }

        entity.setCountry(countriesEntity);
        entity.setHostApplicationPending(true);
        this.userRepository.save(entity);
        return true;
    }

    @Transactional(readOnly = true)
    public List<HostProfileResponse> handleGetApplyPerson() {
        return userRepository.findAllByHostApplicationPendingTrue().stream()
                .map(mapper::toHostProfile)
                .toList();
    }

    @Transactional
    public boolean handleAccsetHost(Long host_id) {
        UserEntity userEntity = this.userRepository.findById(host_id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (hasHostRole(userEntity)) {
            if (userEntity.isHostApplicationPending()) {
                userEntity.setHostApplicationPending(false);
                this.userRepository.save(userEntity);
            }
            return false;
        }
        if (!userEntity.isHostApplicationPending()) {
            throw new AppException(ErrorCode.INVALID);
        }
        RoleEntity roleHost = this.roleRepository.findByRoleName(RoleName.HOST.name())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        userEntity.getRoles().add(roleHost);
        userEntity.setHostApplicationPending(false);
        this.userRepository.save(userEntity);
        return true;
    }

    @Transactional
    public void handleRejectAccess(Long host_id) {
        UserEntity userEntity = this.userRepository.findById(host_id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        userEntity.setHostApplicationPending(false);
        this.userRepository.save(userEntity);
    }

    private boolean hasHostRole(UserEntity user) {
        return user.getRoles().stream()
                .anyMatch(role -> RoleName.HOST.name().equals(role.getRoleName()));
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
            userEntity.setHostApplicationPending(false);

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
        if (fileHost.getLanguages() != null || (fileHost.getLanguageIds() != null && !fileHost.getLanguageIds().isEmpty())) {
            syncUserLanguages(entity, fileHost.getLanguageIds(), fileHost.getLanguages());
        }
        if (fileHost.getDidHostYear() != null) {
            entity.setDidHostYear(fileHost.getDidHostYear());
        }
        if (fileHost.getHostExperience() != null) {
            entity.setHostExperience(fileHost.getHostExperience());
        }
        if (fileHost.getDescription() != null) {
            entity.setDescription(fileHost.getDescription());
        }
        if (fileHost.getThumnail() != null) {
            entity.setThumnailUrl(this.cloudinaryService.uploadImageCloddy(fileHost.getThumnail()));
        }
        this.userRepository.save(entity);
    }

    private void syncUserLanguages(UserEntity entity, List<Long> languageIds, String rawLanguages) {
        if (languageIds != null && !languageIds.isEmpty()) {
            Set<Long> uniqueIds = new LinkedHashSet<>(languageIds);
            List<LanguageEntity> found = this.languageRepository.findAllById(uniqueIds).stream()
                    .filter(lang -> lang != null
                            && !Boolean.TRUE.equals(lang.getDeleted())
                            && !Boolean.FALSE.equals(lang.getIsActive()))
                    .toList();
            if (found.size() != uniqueIds.size()) {
                throw new AppException(ErrorCode.LANGUAGE_NOT_EXISTED);
            }
            Set<LanguageEntity> ordered = new LinkedHashSet<>();
            for (Long id : uniqueIds) {
                found.stream().filter(item -> id.equals(item.getId())).findFirst().ifPresent(ordered::add);
            }
            entity.setLanguageEntities(ordered);
            entity.setLanguages(ordered.stream().map(LanguageEntity::getName).collect(Collectors.joining(", ")));
            return;
        }

        if (rawLanguages == null) {
            entity.setLanguages(null);
            entity.setLanguageEntities(new HashSet<>());
            return;
        }

        List<String> tokens = Arrays.stream(rawLanguages.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .distinct()
                .toList();
        Set<LanguageEntity> matched = new LinkedHashSet<>();
        if (this.languageRepository != null) {
            for (String token : tokens) {
                this.languageRepository.findByNameIgnoreCase(token)
                        .filter(lang -> !Boolean.TRUE.equals(lang.getDeleted())
                                && !Boolean.FALSE.equals(lang.getIsActive()))
                        .ifPresent(matched::add);
            }
        }
        entity.setLanguageEntities(matched);
        entity.setLanguages(tokens.isEmpty() ? rawLanguages.trim() : String.join(", ", tokens));
    }

}
