import axiosInstance from "@/shared/api/httpClient.js";

/**
 * Gọi API Backend để tóm tắt một đoạn bình luận hoặc đánh giá.
 *
 * @param {string} text - Nội dung bình luận đánh giá cần tóm tắt
 * @param {object} options - Các tùy chọn độ dài tóm tắt (ratio, maxOutputLength, minSummaryLength)
 * @returns {Promise<{ summary: string, summaryPoints: string[], originalText: string }>}
 */
export async function summarizeReviewComment(text, options = {}) {
  const trimmedText = (text || "").trim();
  if (!trimmedText) {
    throw new Error("Vui lòng nhập hoặc chọn nội dung bình luận để tóm tắt.");
  }

  const response = await axiosInstance.post("/api/listings/reviews/summarize", {
    text: trimmedText,
    maxInputLength: options.maxInputLength ?? 512,
    maxOutputLength: options.maxOutputLength ?? 160,
    ratio: options.ratio ?? 0.35,
    minSummaryLength: options.minSummaryLength ?? 10,
  });

  if (response.data?.code === 200 && response.data?.result) {
    const result = response.data.result;
    return {
      summary: result.summary || "",
      summaryPoints: result.summary_points || result.summaryPoints || [],
      originalText: result.original_text || result.originalText || trimmedText,
      inputWordCount: result.input_word_count ?? result.inputWordCount ?? 0,
      summaryWordCount: result.summary_word_count ?? result.summaryWordCount ?? 0,
    };
  }

  throw new Error(
    response.data?.message || "Không thể tóm tắt bình luận lúc này."
  );
}

/**
 * Gọi API Backend để tóm tắt toàn bộ bình luận đánh giá của một phòng (listingId).
 *
 * @param {number|string} listingId - ID của phòng
 * @returns {Promise<{ summary: string, summaryPoints: string[], originalText: string }>}
 */
export async function summarizeAllListingReviews(listingId) {
  if (!listingId) {
    throw new Error("Không tìm thấy mã phòng cần tóm tắt đánh giá.");
  }

  const response = await axiosInstance.post(
    `/api/listings/${listingId}/reviews/summarize`
  );

  if (response.data?.code === 200 && response.data?.result) {
    const result = response.data.result;
    return {
      summary: result.summary || "",
      summaryPoints: result.summary_points || result.summaryPoints || [],
      originalText: result.original_text || result.originalText || "",
      inputWordCount: result.input_word_count ?? result.inputWordCount ?? 0,
      summaryWordCount: result.summary_word_count ?? result.summaryWordCount ?? 0,
    };
  }

  throw new Error(
    response.data?.message || "Không thể tóm tắt danh sách đánh giá lúc này."
  );
}
