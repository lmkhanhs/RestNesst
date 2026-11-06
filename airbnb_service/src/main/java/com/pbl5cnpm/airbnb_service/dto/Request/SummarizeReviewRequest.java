package com.pbl5cnpm.airbnb_service.dto.Request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummarizeReviewRequest {
    private String text;
    private Integer maxInputLength;
    private Integer maxOutputLength;
    private Double ratio;
    private Integer minSummaryLength;
}
