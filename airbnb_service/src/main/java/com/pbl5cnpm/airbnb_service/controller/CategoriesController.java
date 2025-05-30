package com.pbl5cnpm.airbnb_service.controller;

import org.springframework.web.bind.annotation.RestController;

import com.pbl5cnpm.airbnb_service.dto.Request.CategoriesRequest;
import com.pbl5cnpm.airbnb_service.dto.Request.UpdateCategoryRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.ApiResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CategoriesResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CategoriesResponseForAdmin;
import com.pbl5cnpm.airbnb_service.service.CategoriesService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;



@RestController
public class CategoriesController {
    @Autowired
    private CategoriesService categoriesService;
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(value =  "/api/categories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CategoriesResponseForAdmin>> createCategories(@ModelAttribute CategoriesRequest request) {
        CategoriesResponseForAdmin data = this.categoriesService.handleCreateCategories(request);
        ApiResponse<CategoriesResponseForAdmin> apiResponse = new ApiResponse<>();
                                    apiResponse.setResult(data);
                                    apiResponse.setCode(201);
                                    apiResponse.setMessage("Created categorry succcess!");
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }
    @GetMapping("/api/categories")
    public ApiResponse<List<CategoriesResponse>> findAll(){
        var data = this.categoriesService.handleFindAll();
        ApiResponse<List<CategoriesResponse>> apiResponse = new ApiResponse<>();
                                    apiResponse.setResult(data);
                                    apiResponse.setCode(200);
                                    apiResponse.setMessage("Fetch data succcesfully!");
        System.out.println("API get Categories!");
        return apiResponse ;
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/api/categories/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id){
        this.categoriesService.handleDeleteCatagory(id);
        return ApiResponse.<Void>builder()
                        .code(200)
                        .message("delete category successfully!")
                        .build() ;
    } 
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping(value = "api/categories/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CategoriesResponse> putMethodName(@PathVariable Long id, @ModelAttribute UpdateCategoryRequest request ) {
        // handleGetAllForAdmin
        return ApiResponse.<CategoriesResponse>builder()
                .code(200)
                .message("update category have id: "+ id)
                .result(this.categoriesService.handleUpdateCategory(id, request))
                .build();
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/api/categories/index")
    public ApiResponse<List<CategoriesResponseForAdmin>> getAllforAdmin(){
        return ApiResponse.<List<CategoriesResponseForAdmin>>builder()
                .code(200)
                .message("get all for admin")
                .result(this.categoriesService.handleGetAllForAdmin())
                .build();
    }

}
