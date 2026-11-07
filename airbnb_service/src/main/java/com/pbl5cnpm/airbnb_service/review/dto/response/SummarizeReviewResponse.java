package com.pbl5cnpm.airbnb_service.review.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummarizeReviewResponse {
    private boolean success;

    @JsonProperty("original_text")
    private String originalText;

    private String summary;

    @JsonProperty("summary_points")
    private List<String> summaryPoints;

    @JsonProperty("input_word_count")
    private Integer inputWordCount;

    @JsonProperty("summary_word_count")
    private Integer summaryWordCount;
}
