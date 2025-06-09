package com.pbl5cnpm.airbnb_service.controller;

import java.text.ParseException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nimbusds.jose.JOSEException;
import com.pbl5cnpm.airbnb_service.dto.Request.ApplyHostResquest;
import com.pbl5cnpm.airbnb_service.dto.Request.FavoriteRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.PasswordChangeRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateProFileHost;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateUserProfileByAdminiRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UserProfileRequset;
import com.pbl5cnpm.airbnb_service.dto.Request.UserRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.HostProfileResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.StatisticCountUser;
import com.pbl5cnpm.airbnb_service.dto.Response.UserFavoriteResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.UserInfor;
import com.pbl5cnpm.airbnb_service.dto.Response.UserResponse;
import com.pbl5cnpm.airbnb_service.service.FavoriteService;
import com.pbl5cnpm.airbnb_service.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final FavoriteService favoriteService;
    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserResponse>> created(@RequestBody @Valid UserRequest request) {
        UserResponse userResponse = userService.handleCreateUser(request);

        ApiResponse<UserResponse> apiResponse = ApiResponse.<UserResponse>builder()
                .code(201)
                .message("Created user successfully!")
                .result(userResponse)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getALL() {
        List<UserResponse> userResponses = this.userService.handleGetAll();

        ApiResponse<List<UserResponse>> apiResponse = ApiResponse.<List<UserResponse>>builder()
                .code(200)
                .message("Fetched users successfully!")
                .result(userResponses)
                .build();

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/users/myInformation")
    public ApiResponse getMethodName(HttpServletRequest request) throws ParseException, JOSEException {
        String authorization = request.getHeader("Authorization");
        String token = "";
        if (authorization != null && authorization.startsWith("Bearer ")) {
            token = authorization.substring(7);
        }
        return ApiResponse.<UserInfor>builder()
                .result(this.userService.handleInfor(token))
                .build();
    }

    @GetMapping("/users/favorites") // lây full
    public ApiResponse<UserFavoriteResponse> getMethodName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        var UserFavoriteResponse = this.userService.getFavorites(username);
        return ApiResponse.<UserFavoriteResponse>builder()
                .message("fetch favorite for user")
                .code(200)
                .result(UserFavoriteResponse)
                .build();
    }

    @PostMapping("/users/favorites") // tạo
    public ResponseEntity<Void> postMethodName(@RequestBody FavoriteRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long listingId = request.getListingId();
        this.favoriteService.addFavorite(listingId, username);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/users/favorites") // xóa
    public ApiResponse<Void> handleDelete(@RequestBody FavoriteRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long listingId = request.getListingId();
        this.favoriteService.deleteFavorite(listingId, username);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("delete succesfully")
                .build();
    }

    @PutMapping(value = "/users", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserInfor> updateUser(@ModelAttribute UserProfileRequset request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return ApiResponse.<UserInfor>builder()
                .message("Update success")
                .code(200)
                .result(this.userService.handleUpdateProfile(request, username))
                .build();
    }

    @GetMapping("/users/booked")
    public String getMethodName(@RequestParam String param) {
        return new String();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/users/counts")
    public ApiResponse<Long> countUsser() {
        return ApiResponse.<Long>builder()
                .code(200)
                .message(" users counts ")
                .result(this.userService.handleCountUser())
                .build();
    }

    @PutMapping("/users/password")
    public ApiResponse<UserInfor> changePasss(@RequestBody PasswordChangeRequest request) {
        return ApiResponse.<UserInfor>builder()
                .code(200)
                .message("change password succcessfully!")
                .result(this.userService.handleChangePass(request))
                .build();
    }

    @GetMapping("/users/host/{id}")
    public ApiResponse<HostProfileResponse> getMethodName(@PathVariable Long id) {
        return ApiResponse.<HostProfileResponse>builder()
                .code(200)
                .message("get profile host")
                .result(this.userService.handlegetHost(id))
                .build();
    }

    @PostMapping("/users/host/apply")
    public ApiResponse<Void> postMethodName(@RequestBody ApplyHostResquest applyHostResquest) {
        this.userService.handleApply(applyHostResquest);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Apply to host success")
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/users/host/apply")
    public ApiResponse<List<HostProfileResponse>> getApplyPerson() {
        return ApiResponse.<List<HostProfileResponse>>builder()
                .code(200)
                .message("get user want to apply host")
                .result(this.userService.handleGetApplyPerson())
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/users/host/status/{id}")
    public ApiResponse<Void> updateStstusAccess(@PathVariable Long id) {
        boolean status = this.userService.handleAccsetHost(id);
        String str = status ? "add role host successfully" : "user had role host";

        return ApiResponse.<Void>builder()
                .code(200)
                .message(str)
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/users/host/status/{id}")
    public ApiResponse<Void> handleReject(@PathVariable Long id) {

        this.userService.handleRejectAccess(id);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Reject to host ")
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/users/{id}")
    public ApiResponse<UserResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UserResponse>builder()
                .code(200)
                .message("get user by api")
                .result(this.userService.handleGetInforByID(id))
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/users/active/{id}/{status}")
    public ApiResponse<UserResponse> changeStatusAccess(@PathVariable Long id, @PathVariable Boolean status) {

        return ApiResponse.<UserResponse>builder()
                .code(200)
                .message("chang status access")
                .result(this.userService.handleChangeActive(id, status))
                .build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/users/admin/change/profile")
    public ApiResponse<UserResponse> changeProfile(@RequestBody UpdateUserProfileByAdminiRequest request) {
        return ApiResponse.<UserResponse>builder()
                .code(200)
                .message("chang profile access")
                .result(this.userService.handleChangeProfileUser(request))
                .build();
    }

    @PreAuthorize("hasAuthority('HOST')")
    @PutMapping(value = "/users/host/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> putMethodName(@ModelAttribute UpdateProFileHost proFileHost) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        this.userService.handleUpdateHost(proFileHost, username);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("update profile host")
                .build();
    }
}
