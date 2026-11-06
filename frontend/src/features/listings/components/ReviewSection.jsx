import { Avatar, Box, Grid, Rating, Stack, Typography } from "@mui/material";
import GuestFavorite from "./GuestFavorite.jsx";
import RatingDisplay from "./RatingDisplay.jsx";
import PropertyDescription from "./PropertyDescription.jsx";
import { BACKEND_URL } from "@/shared/config/environment.js";
import PropTypes from "prop-types";

const getImageUrl = (img) => {
  if (!img || typeof img !== "string") return "";
  const trimmed = img.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `${BACKEND_URL}/${trimmed.replace(/^\/+/, "")}`;
};

const ReviewSection = ({ property }) => {
  const reviews = Array.isArray(property?.reviews) ? property.reviews : [];
  const previewReviews = reviews.slice(0, 4);

  return (
    <Box sx={{ my: 3.5 }}>
      {/* Khung tổng quan điểm đánh giá & AI Tóm tắt */}
      <Box
        sx={{
          p: { xs: 2.25, md: 3 },
          borderRadius: "18px",
          bgcolor: "var(--rn-surface-2)",
          color: "var(--rn-text-primary)",
          border: "1px solid var(--rn-border-subtle)",
        }}
      >
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={4}>
            <GuestFavorite isPopular={Boolean(property?.popular)} />
          </Grid>

          <Grid item xs={12} md={4.5}>
            <RatingDisplay
              listingId={property?.id}
              rating={property?.avgStart}
              reviewCount={reviews.length}
              reviews={reviews}
            />
          </Grid>

          <Grid item xs={12} md={3.5}>
            <PropertyDescription />
          </Grid>
        </Grid>
      </Box>

      {/* Danh sách đánh giá nổi bật từ khách hàng hiển thị trực tiếp */}
      {previewReviews.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Grid container spacing={2}>
            {previewReviews.map((review, idx) => {
              const reviewerName =
                review.username || review.userName || "Khách lưu trú";
              const rawAvatar = review.avatarlUrl || review.avatarUser;
              const avatarUrl = rawAvatar
                ? getImageUrl(rawAvatar)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    reviewerName
                  )}&background=FF385C&color=fff`;
              const photoUrl = review.reviewUrl || review.imageUrl;

              return (
                <Grid item xs={12} sm={6} key={review.id || idx}>
                  <Box
                    sx={{
                      p: 2.25,
                      height: "100%",
                      borderRadius: "16px",
                      bgcolor: "var(--rn-surface-card)",
                      border: "1px solid var(--rn-border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ mb: 1.25 }}
                      >
                        <Avatar
                          src={avatarUrl}
                          alt={reviewerName}
                          sx={{ width: 40, height: 40 }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: "var(--rn-text-primary)",
                            }}
                          >
                            {reviewerName}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                          >
                            <Rating
                              value={Number(review.rating) || 5}
                              precision={0.5}
                              readOnly
                              size="small"
                            />
                            {review.reviewDate && (
                              <Typography
                                variant="caption"
                                sx={{ color: "var(--rn-text-secondary)" }}
                              >
                                • {review.reviewDate}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--rn-text-secondary)",
                          lineHeight: 1.65,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {review.comment}
                      </Typography>
                    </Box>

                    {photoUrl && (
                      <Box
                        component="img"
                        src={getImageUrl(photoUrl)}
                        alt="Ảnh thực tế từ khách"
                        sx={{
                          mt: 1.5,
                          width: 96,
                          height: 68,
                          objectFit: "cover",
                          borderRadius: "10px",
                          border: "1px solid var(--rn-border-subtle)",
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

ReviewSection.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.number,
    avgStart: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    reviews: PropTypes.array,
    popular: PropTypes.bool,
  }).isRequired,
};

export default ReviewSection;
