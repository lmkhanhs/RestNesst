package com.pbl5cnpm.airbnb_service.service;

import java.util.List;

import org.springframework.stereotype.Service;
import com.pbl5cnpm.airbnb_service.AirbnbServiceApplication;
import com.pbl5cnpm.airbnb_service.dto.Request.CountryResquest;
import com.pbl5cnpm.airbnb_service.dto.Request.CoutriesRequest;
import com.pbl5cnpm.airbnb_service.dto.Response.CountryDetailResponse;
import com.pbl5cnpm.airbnb_service.dto.Response.CoutriesResponse;
import com.pbl5cnpm.airbnb_service.entity.CountriesEntity;
import com.pbl5cnpm.airbnb_service.exception.AppException;
import com.pbl5cnpm.airbnb_service.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.mapper.CountriesMapper;
import com.pbl5cnpm.airbnb_service.repository.CountriesRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CoutriesService {
    CountriesRepository coutriesRepository;
    CountriesMapper mapper;

    
    public CountryDetailResponse handleCreateCounties(CountryResquest coutryRequest){
        String name = coutryRequest.getName();
        if (this.coutriesRepository.findByName(name).isPresent()) {
            throw new AppException(ErrorCode.COUNTRY_EXISTED);
        }
        CountriesEntity coutriesEntity = mapper.toCoutriesEntity(coutryRequest);
                        coutriesEntity.setDeleted(false);
                        
        return mapper.toCountryDetailResponse(this.coutriesRepository.save(coutriesEntity));
    }
    public List<CoutriesResponse> handleGetAll(){
        var result = this.coutriesRepository.findAll();
        return result.stream()
                .filter(data -> (data.getDeleted() == false))
                .map(data -> mapper.toCoutriesResponse(data))
                .toList();
    }
    public List<CountryDetailResponse> handlegetDetail(){
        var result = this.coutriesRepository.findAll();
        return result.stream()
                    .filter(data -> (data.getDeleted() == false))
                    .map(data -> mapper.toCountryDetailResponse(data))
                    .toList();
                
    }
}
