package com.pbl5cnpm.airbnb_service.review.service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.pbl5cnpm.airbnb_service.review.dto.request.SummarizeReviewRequest;
import com.pbl5cnpm.airbnb_service.review.dto.response.SummarizeReviewResponse;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;
import com.pbl5cnpm.airbnb_service.review.entity.ReviewEntity;
import com.pbl5cnpm.airbnb_service.shared.exception.AppException;
import com.pbl5cnpm.airbnb_service.shared.exception.ErrorCode;
import com.pbl5cnpm.airbnb_service.listing.repository.ListingsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSummarizeService {

    private final ListingsRepository listingsRepository;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    private RestClient buildRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofSeconds(60).toMillis());
        return RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Tóm tắt một đoạn văn bản hoặc bình luận đánh giá của người dùng.
     */
    public SummarizeReviewResponse summarizeText(SummarizeReviewRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            throw new AppException(ErrorCode.SUMMARIZE_TEXT_EMPTY);
        }

        String cleanedText = request.getText().trim();
        Map<String, Object> payload = new HashMap<>();
        payload.put("text", cleanedText);
        payload.put("max_input_length", request.getMaxInputLength() != null ? request.getMaxInputLength() : 512);
        payload.put("max_output_length", request.getMaxOutputLength() != null ? request.getMaxOutputLength() : 160);
        payload.put("ratio", request.getRatio() != null ? request.getRatio() : 0.35);
        payload.put("min_summary_length", request.getMinSummaryLength() != null ? request.getMinSummaryLength() : 10);

        try {
            SummarizeReviewResponse response = buildRestClient()
                    .post()
                    .uri("/api/summarize-text")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(SummarizeReviewResponse.class);

            if (response == null) {
                throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
            }
            return response;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Không thể gọi sang AI Service tại {}: {}", aiServiceUrl, e.getMessage());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    /**
     * Tóm tắt toàn bộ các bình luận đánh giá của một phòng (listingId).
     */
    public SummarizeReviewResponse summarizeListingReviews(Long listingId) {
        ListingEntity listing = listingsRepository.findById(listingId)
                .orElseThrow(() -> new AppException(ErrorCode.LISTING_NOT_EXISTED));

        List<ReviewEntity> reviews = listing.getReviews();
        if (reviews == null || reviews.isEmpty()) {
            throw new AppException(ErrorCode.SUMMARIZE_TEXT_EMPTY);
        }

        List<String> comments = reviews.stream()
                .map(ReviewEntity::getComment)
                .filter(c -> c != null && !c.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toList());

        if (comments.isEmpty()) {
            throw new AppException(ErrorCode.SUMMARIZE_TEXT_EMPTY);
        }

        String combinedText = comments.stream()
                .map(c -> c.endsWith(".") || c.endsWith("!") || c.endsWith("?") ? c : c + ".")
                .collect(Collectors.joining(" "));

        SummarizeReviewRequest request = SummarizeReviewRequest.builder()
                .text(combinedText)
                .maxInputLength(512)
                .maxOutputLength(200)
                .ratio(0.35)
                .minSummaryLength(15)
                .build();

        return summarizeText(request);
    }
}
