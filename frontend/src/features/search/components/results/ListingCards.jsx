import { getMediaUrl } from "@/shared/utils/mediaUrl.js";
import { Alert, Card, Box, Typography, IconButton, Button, Stack } from "@mui/material";
import Slider from "react-slick";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useFavorites from "@/features/favorites/hooks/useFavorites.js";
import { useState } from "react";
import PropTypes from "prop-types";
import "./SearchMap.css";

const FALLBACK_ROOM_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E2E8F0"/>
          <stop offset="50%" stop-color="#F1F5F9"/>
          <stop offset="100%" stop-color="#FFE4E8"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#bg)"/>
      <g fill="none" stroke="#94A3B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(340, 175)">
        <path d="M10 60 L60 15 L110 60"/>
        <path d="M24 52 V105 H96 V52"/>
        <rect x="48" y="72" width="24" height="33" rx="3"/>
      </g>
      <text x="400" y="325" text-anchor="middle" fill="#475569" font-family="Be Vietnam Pro, sans-serif" font-size="20" font-weight="600">RestNesst Stay</text>
    </svg>`
  );

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 350,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: false,
  swipeToSlide: true,
};

export const getImageUrl = (img) => {
  return getMediaUrl(img) || FALLBACK_ROOM_IMAGE;
};

export const formatNightlyPrice = (price) => {
  const num = Number(price);
  if (!Number.isFinite(num)) return String(price || "0");
  return num.toLocaleString("vi-VN");
};

const Properties = ({ properties, compact = false }) => {
  const { isSaved, isPending, setSaved, loading, error, reload } = useFavorites();
  const [favoriteError, setFavoriteError] = useState("");
  const navigate = useNavigate();

  const handleFavorite = async (listingId) => {
    setFavoriteError("");
    try { await setSaved(listingId, !isSaved(listingId)); }
    catch (failure) { setFavoriteError(failure.message); }
  };

  if (!properties || properties.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        Không có chỗ ở phù hợp.
      </Typography>
    );
  }

  return (
    <>
    {(favoriteError || error) && <Alert severity="error" sx={{ mb: 2 }}
      action={<Button color="inherit" onClick={() => { setFavoriteError(''); reload(); }} sx={{ minHeight: 44 }}>Thử lại</Button>}>
      {favoriteError || error}
    </Alert>}
    <Box
      className={compact ? "rn-room-grid rn-room-grid--compact" : "rn-room-grid"}
      role="list"
      aria-label="Danh sách phòng nghỉ"
    >
      {properties.map((property) => {
        const isFav = isSaved(property.id);
        const roomName = property.name || property.title || "Chỗ ở RestNesst";
        const images =
          Array.isArray(property.images) && property.images.length > 0
            ? property.images
            : [null];
        const locationLabel =
          [property.city, property.country].filter(Boolean).join(", ") ||
          property.address ||
          "Việt Nam";
        const ratingValue =
          Number(property.avgStart) > 0
            ? Number(property.avgStart).toFixed(1)
            : "Mới";

        return (
          <Card
            key={property.id}
            component="article"
            role="listitem"
            elevation={0}
            className="rn-room-card"
          >
            {/* Media Region */}
            <Box
              className="rn-room-card__media"
              onClick={() => navigate(`/property/${property.id}`)}
              sx={{ cursor: "pointer" }}
            >
              {images.length > 1 ? (
                <Slider {...sliderSettings}>
                  {images.map((image, index) => (
                    <div key={index}>
                      <img
                        src={getImageUrl(image)}
                        alt={`${roomName} - ảnh ${index + 1}`}
                        loading="lazy"
                        className="rn-room-card__img"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_ROOM_IMAGE;
                        }}
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <img
                  src={getImageUrl(images[0])}
                  alt={roomName}
                  loading="lazy"
                  className="rn-room-card__img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_ROOM_IMAGE;
                  }}
                />
              )}

              {property.popular && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    zIndex: 2,
                    bgcolor: "rgba(255, 255, 255, 0.95)",
                    color: "#0F172A",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "0.01em",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.14)",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    maxWidth: "calc(100% - 68px)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Được khách yêu thích
                </Box>
              )}

              <IconButton
                type="button"
                aria-label={
                  isFav
                    ? `Bỏ lưu ${roomName} khỏi danh sách yêu thích`
                    : `Lưu ${roomName} vào danh sách yêu thích`
                }
                aria-pressed={isFav}
                disabled={isPending(property.id) || loading}
                className="rn-interactive-btn"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 2,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "rgba(15, 23, 42, 0.45)",
                  backdropFilter: "blur(6px)",
                  color: isFav ? "#FB7185" : "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.28)",
                  "&:hover": {
                    bgcolor: "rgba(15, 23, 42, 0.68)",
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavorite(property.id);
                }}
              >
                {isFav ? (
                  <FavoriteIcon sx={{ fontSize: 22 }} />
                ) : (
                  <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                )}
              </IconButton>
            </Box>

            {/* Body Region */}
            <Stack
              spacing={1}
              sx={{
                p: { xs: 2, sm: 2.25 },
                flex: 1,
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                {/* Location & Rating Row */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 0.75 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ minWidth: 0, flex: 1 }}
                  >
                    <PlaceOutlinedIcon
                      aria-hidden="true"
                      sx={{
                        fontSize: 16,
                        color: "primary.main",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        fontSize: "0.8125rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {locationLabel}
                    </Typography>
                  </Stack>

                  <Box
                    aria-label={`Đánh giá ${ratingValue} sao`}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.375,
                      px: 1,
                      py: 0.25,
                      borderRadius: "999px",
                      bgcolor: "#FEF3C7",
                      color: "#78350F",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      flexShrink: 0,
                    }}
                  >
                    <StarRoundedIcon
                      aria-hidden="true"
                      sx={{ color: "#D97706", fontSize: 16 }}
                    />
                    <span>{ratingValue}</span>
                  </Box>
                </Stack>

                {/* Room Name Heading with accessible link */}
                <Typography
                  component="h3"
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1.05rem", sm: "1.1rem" },
                    fontWeight: 700,
                    lineHeight: 1.35,
                    mb: 0.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component={RouterLink}
                    to={`/property/${property.id}`}
                    sx={{
                      color: "text.primary",
                      textDecoration: "none",
                      borderRadius: 0.5,
                      "&:hover": {
                        color: "primary.main",
                      },
                    }}
                  >
                    {roomName}
                  </Box>
                </Typography>

                {/* Full Address */}
                {property.address && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      mb: 1,
                    }}
                  >
                    {property.address}
                  </Typography>
                )}

                {/* Availability Window */}
                {(property.startDate || property.endDate) && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    sx={{
                      mt: 0.5,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1.5,
                      bgcolor: "#F1F5F9",
                      color: "text.secondary",
                      width: "fit-content",
                      maxWidth: "100%",
                    }}
                  >
                    <CalendarTodayOutlinedIcon
                      aria-hidden="true"
                      sx={{ fontSize: 14, color: "secondary.main", flexShrink: 0 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        color: "text.secondary",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Trống: {property.startDate || "Hôm nay"} –{" "}
                      {property.endDate || "Linh hoạt"}
                    </Typography>
                  </Stack>
                )}
              </Box>

              {/* Footer: Nightly Price + Primary Action Button */}
              <Box
                component="footer"
                className="rn-room-card__footer"
                sx={{
                  pt: 1.5,
                  mt: 1,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "text.secondary",
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}
                  >
                    Giá mỗi đêm
                  </Typography>
                  <Typography
                    component="p"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.05rem", sm: "1.125rem" },
                      color: "text.primary",
                      lineHeight: 1.3,
                    }}
                  >
                    {formatNightlyPrice(property.price)} ₫
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.8125rem",
                        color: "text.secondary",
                      }}
                    >
                      {" "}
                      / đêm
                    </Box>
                  </Typography>
                </Box>

                <Button
                  component={RouterLink}
                  to={`/property/${property.id}`}
                  variant="contained"
                  color="primary"
                  size="medium"
                  endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                  aria-label={`Xem chi tiết và đặt phòng ${roomName}`}
                  className="rn-interactive-btn"
                  sx={{
                    minHeight: 42,
                    px: 2,
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    boxShadow: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Đặt phòng
                </Button>
              </Box>
            </Stack>
          </Card>
        );
      })}
    </Box>
    </>
  );
};

Properties.propTypes = {
  properties: PropTypes.array.isRequired,
  compact: PropTypes.bool,
};

export default Properties;
