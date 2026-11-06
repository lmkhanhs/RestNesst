import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";
import {
  summarizeAllListingReviews,
  summarizeReviewComment,
} from "@/features/reviews/api/summarizeReview.js";
import { BACKEND_URL } from "@/shared/config/environment.js";

const getImageUrl = (img) => {
  if (!img || typeof img !== "string") return "";
  const trimmed = img.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `${BACKEND_URL}/${trimmed.replace(/^\/+/, "")}`;
};

const resolveAvatarUrl = (url, name = "Khách") => {
  if (!url) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=FF385C&color=fff`;
  }
  return getImageUrl(url);
};

const RatingDisplay = ({ listingId, rating, avgStart, reviewCount, reviews = [] }) => {
  const displayRating = rating ?? avgStart ?? 0;
  const totalReviews = reviewCount ?? reviews.length;
  const [openDialog, setOpenDialog] = useState(false);

  // State lưu kết quả tóm tắt của từng bình luận theo index/id
  const [itemSummaries, setItemSummaries] = useState({});
  const [itemLoading, setItemLoading] = useState({});
  const [itemError, setItemError] = useState({});

  // State lưu kết quả tóm tắt tổng hợp tất cả bình luận của phòng
  const [overallSummary, setOverallSummary] = useState(null);
  const [overallLoading, setOverallLoading] = useState(false);
  const [overallError, setOverallError] = useState("");

  const handleSummarizeSingleReview = async (key, commentText) => {
    if (!commentText || !commentText.trim()) {
      return;
    }

    setItemLoading((prev) => ({ ...prev, [key]: true }));
    setItemError((prev) => ({ ...prev, [key]: "" }));

    try {
      const result = await summarizeReviewComment(commentText);
      setItemSummaries((prev) => ({
        ...prev,
        [key]: result,
      }));
    } catch (err) {
      setItemError((prev) => ({
        ...prev,
        [key]:
          err.response?.data?.message ||
          err.message ||
          "Không thể kết nối tới AI Service để tóm tắt bình luận.",
      }));
    } finally {
      setItemLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSummarizeAllReviews = async () => {
    if (!reviews || reviews.length === 0) {
      return;
    }

    setOverallLoading(true);
    setOverallError("");

    try {
      let result;
      if (listingId) {
        result = await summarizeAllListingReviews(listingId);
      } else {
        const combinedText = reviews
          .map((r) => (r.comment || "").trim())
          .filter(Boolean)
          .join(". ");
        result = await summarizeReviewComment(combinedText, {
          maxOutputLength: 200,
        });
      }
      setOverallSummary(result);
    } catch (err) {
      setOverallError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tóm tắt danh sách đánh giá lúc này."
      );
    } finally {
      setOverallLoading(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          onClick={() => setOpenDialog(true)}
          sx={{
            textAlign: "right",
            cursor: "pointer",
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            transition: "background-color 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold", mr: 1 }}>
              {displayRating}
            </Typography>
            <Rating value={Number(displayRating) || 0} precision={0.1} readOnly size="small" />
          </Box>
          <Typography
            variant="caption"
            color="primary"
            sx={{ fontWeight: 600, textDecoration: "underline" }}
          >
            {totalReviews} đánh giá (Xem & Tóm tắt)
          </Typography>
        </Box>

        {reviews.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => {
              setOpenDialog(true);
              if (!overallSummary && !overallLoading) {
                handleSummarizeAllReviews();
              }
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              whiteSpace: "nowrap",
            }}
          >
            ✨ Tóm tắt đánh giá
          </Button>
        )}
      </Stack>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            pb: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Đánh giá từ khách hàng ({totalReviews})
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Rating value={Number(displayRating) || 0} precision={0.1} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                Trung bình {displayRating}/5 sao
              </Typography>
            </Stack>
          </Box>

          {reviews.length > 0 && (
            <Button
              variant="contained"
              size="small"
              onClick={handleSummarizeAllReviews}
              disabled={overallLoading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              {overallLoading ? (
                <>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  Đang tóm tắt tất cả...
                </>
              ) : (
                "✨ Tóm tắt tất cả bình luận"
              )}
            </Button>
          )}
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ py: 2.5 }}>
          {/* Khung hiển thị kết quả tóm tắt tổng hợp tất cả bình luận */}
          <Collapse in={Boolean(overallSummary || overallError)}>
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(25, 118, 210, 0.08)",
                border: "1px solid rgba(25, 118, 210, 0.25)",
              }}
            >
              {overallError ? (
                <Alert severity="error" onClose={() => setOverallError("")}>
                  {overallError}
                </Alert>
              ) : (
                overallSummary && (
                  <>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Chip
                        label="✨ AI Tóm tắt toàn bộ đánh giá"
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Button
                        size="small"
                        onClick={() => setOverallSummary(null)}
                        sx={{ textTransform: "none", fontSize: 12 }}
                      >
                        Ẩn tóm tắt
                      </Button>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
                      {overallSummary.summary}
                    </Typography>
                    {overallSummary.summaryPoints?.length > 1 && (
                      <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
                        {overallSummary.summaryPoints.map((pt, idx) => (
                          <Typography
                            component="li"
                            variant="body2"
                            key={idx}
                            sx={{ color: "text.secondary", mb: 0.5 }}
                          >
                            {pt}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </>
                )
              )}
            </Box>
          </Collapse>

          {/* Danh sách từng bình luận */}
          {reviews.length === 0 ? (
            <Typography
              variant="body1"
              color="text.secondary"
              align="center"
              sx={{ py: 4 }}
            >
              Chưa có bình luận đánh giá nào cho phòng này.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {reviews.map((review, index) => {
                const reviewKey = review.id || `review-${index}`;
                const summaryData = itemSummaries[reviewKey];
                const isSummarizing = Boolean(itemLoading[reviewKey]);
                const errorMsg = itemError[reviewKey];

                return (
                  <Box
                    key={reviewKey}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1.5}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={resolveAvatarUrl(
                            review.avatarlUrl || review.avatarUser,
                            review.username || review.userName || "Khách"
                          )}
                          alt={review.username || review.userName || "Khách"}
                          sx={{ width: 42, height: 42 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {review.username || review.userName || "Khách hàng"}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Rating
                              value={Number(review.rating) || 5}
                              precision={0.5}
                              readOnly
                              size="small"
                            />
                            {review.reviewDate && (
                              <Typography variant="caption" color="text.secondary">
                                • {review.reviewDate}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      {review.comment && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            handleSummarizeSingleReview(reviewKey, review.comment)
                          }
                          disabled={isSummarizing}
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            fontSize: 12,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {isSummarizing ? (
                            <>
                              <CircularProgress
                                size={14}
                                color="inherit"
                                sx={{ mr: 0.75 }}
                              />
                              Đang tóm tắt...
                            </>
                          ) : (
                            "✨ Tóm tắt"
                          )}
                        </Button>
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ mt: 1.5, lineHeight: 1.6, whiteSpace: "pre-line" }}
                    >
                      {review.comment}
                    </Typography>

                    {(review.reviewUrl || review.imageUrl) && (
                      <Box
                        component="img"
                        src={getImageUrl(review.reviewUrl || review.imageUrl)}
                        alt="Ảnh đánh giá"
                        sx={{
                          mt: 1.5,
                          maxWidth: 160,
                          maxHeight: 120,
                          borderRadius: 1.5,
                          objectFit: "cover",
                          border: "1px solid var(--rn-border-subtle)",
                        }}
                      />
                    )}

                    {errorMsg && (
                      <Alert
                        severity="error"
                        sx={{ mt: 1.5 }}
                        onClose={() =>
                          setItemError((prev) => ({ ...prev, [reviewKey]: "" }))
                        }
                      >
                        {errorMsg}
                      </Alert>
                    )}

                    <Collapse in={Boolean(summaryData)}>
                      {summaryData && (
                        <Box
                          sx={{
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "rgba(46, 125, 50, 0.08)",
                            border: "1px solid rgba(46, 125, 50, 0.25)",
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 0.5 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, color: "success.main" }}
                            >
                              ✨ Bản tóm tắt bình luận (AI):
                            </Typography>
                            <Button
                              size="small"
                              onClick={() =>
                                setItemSummaries((prev) => {
                                  const next = { ...prev };
                                  delete next[reviewKey];
                                  return next;
                                })
                              }
                              sx={{
                                textTransform: "none",
                                fontSize: 11,
                                minWidth: "auto",
                                py: 0,
                              }}
                            >
                              Đóng
                            </Button>
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {summaryData.summary}
                          </Typography>
                        </Box>
                      )}
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

RatingDisplay.propTypes = {
  listingId: PropTypes.number,
  rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  avgStart: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  reviewCount: PropTypes.number,
  reviews: PropTypes.array.isRequired,
};

export default RatingDisplay;
