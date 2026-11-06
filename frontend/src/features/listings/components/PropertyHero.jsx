import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { Export, Heart } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Images from "./PropertyImages.jsx";
import Details from "./PropertyDetails.jsx";
import axiosInstance from "@/shared/api/httpClient.js";

const Hero = ({ property }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !property?.id) return;

    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get("/api/users/favorites");
        if (res.data?.result?.favorites) {
          setIsFavorite(
            res.data.result.favorites.some((fav) => fav.id === property.id)
          );
        }
      } catch {
        // Không yêu cầu đăng nhập khi chỉ xem trang chi tiết
      }
    };
    fetchFavorites();
  }, [property?.id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast({
        open: true,
        message: "Đã sao chép liên kết phòng vào bộ nhớ tạm!",
        severity: "success",
      });
    } catch {
      setToast({
        open: true,
        message: "Không thể sao chép liên kết tự động.",
        severity: "info",
      });
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setToast({
        open: true,
        message: "Vui lòng đăng nhập để lưu chỗ nghỉ yêu thích.",
        severity: "info",
      });
      return;
    }

    if (isFavorite) {
      setIsFavorite(false);
      try {
        await axiosInstance.delete("/api/users/favorites", {
          data: { listingId: property.id },
        });
        setToast({
          open: true,
          message: "Đã bỏ lưu khỏi danh sách yêu thích.",
          severity: "info",
        });
      } catch {
        setIsFavorite(true);
      }
    } else {
      setIsFavorite(true);
      try {
        await axiosInstance.post("/api/users/favorites", {
          listingId: property.id,
        });
        setToast({
          open: true,
          message: "Đã lưu vào danh sách yêu thích!",
          severity: "success",
        });
      } catch {
        setIsFavorite(false);
      }
    }
  };

  const ratingValue = Number(property?.avgStart || 0);
  const reviewCount = Array.isArray(property?.reviews)
    ? property.reviews.length
    : Number(property?.reviews) || 0;
  const fullLocation = [property?.address, property?.city, property?.country]
    .filter(Boolean)
    .join(", ");
  const categories = Array.isArray(property?.categories)
    ? property.categories
    : [];

  return (
    <Box>
      {/* Thanh điều hướng phụ & nhãn phân loại */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1.5}
        sx={{ mb: 1.5 }}
      >
        <Button
          size="small"
          startIcon={<ArrowBackRoundedIcon fontSize="small" />}
          onClick={() => navigate("/")}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--rn-text-secondary)",
            borderRadius: "999px",
            px: 1.5,
            "&:hover": {
              color: "var(--rn-brand-primary)",
              bgcolor: "var(--rn-brand-soft)",
            },
          }}
        >
          Quay lại danh sách phòng
        </Button>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {property?.popular && (
            <Chip
              size="small"
              icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: 16 }} />}
              label="Được khách yêu thích"
              sx={{
                fontWeight: 700,
                bgcolor: "rgba(245, 158, 11, 0.14)",
                color: "#D97706",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                "& .MuiChip-icon": { color: "#D97706" },
              }}
            />
          )}
          {categories.map((cat) => (
            <Chip
              key={cat.id || cat.name}
              size="small"
              label={cat.name}
              sx={{
                fontWeight: 600,
                bgcolor: "var(--rn-surface-2)",
                color: "var(--rn-text-secondary)",
                border: "1px solid var(--rn-border-subtle)",
              }}
            />
          ))}
        </Stack>
      </Stack>

      {/* Tiêu đề phòng & cụm nút Chia sẻ / Lưu */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "flex-end" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontFamily: "var(--rn-font-display)",
              color: "var(--rn-text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              mb: 1,
              fontSize: { xs: "1.55rem", sm: "1.85rem", md: "2.1rem" },
            }}
          >
            {property?.title}
          </Typography>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StarRoundedIcon sx={{ color: "#F59E0B", fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "var(--rn-text-primary)" }}
              >
                {ratingValue > 0 ? ratingValue.toFixed(1) : "Mới"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
              >
                ({reviewCount} đánh giá)
              </Typography>
            </Stack>

            {fullLocation && (
              <>
                <Typography sx={{ color: "var(--rn-text-muted)" }}>•</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PlaceOutlinedIcon
                    sx={{ fontSize: 18, color: "var(--rn-brand-primary)" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "var(--rn-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {fullLocation}
                  </Typography>
                </Stack>
              </>
            )}

            {property?.area && (
              <>
                <Typography sx={{ color: "var(--rn-text-muted)" }}>•</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <SquareFootRoundedIcon
                    sx={{ fontSize: 18, color: "var(--rn-text-secondary)" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--rn-text-secondary)", fontWeight: 600 }}
                  >
                    Diện tích {property.area} m²
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Button
            variant="outlined"
            startIcon={<Export size={18} />}
            onClick={handleShare}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "12px",
              px: 2,
              py: 0.85,
              color: "var(--rn-text-primary)",
              borderColor: "var(--rn-border-subtle)",
              bgcolor: "var(--rn-surface-card)",
              "&:hover": {
                borderColor: "var(--rn-brand-primary)",
                bgcolor: "var(--rn-brand-soft)",
              },
            }}
          >
            Chia sẻ
          </Button>
          <Button
            variant="outlined"
            onClick={handleSave}
            startIcon={
              <Heart
                weight={isFavorite ? "fill" : "regular"}
                color={isFavorite ? "#E11D48" : undefined}
                size={19}
              />
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "12px",
              px: 2,
              py: 0.85,
              color: isFavorite ? "#E11D48" : "var(--rn-text-primary)",
              borderColor: isFavorite
                ? "rgba(225, 29, 72, 0.36)"
                : "var(--rn-border-subtle)",
              bgcolor: isFavorite
                ? "rgba(225, 29, 72, 0.08)"
                : "var(--rn-surface-card)",
              "&:hover": {
                borderColor: "#E11D48",
                bgcolor: "rgba(225, 29, 72, 0.12)",
              },
            }}
          >
            {isFavorite ? "Đã lưu" : "Lưu"}
          </Button>
        </Stack>
      </Stack>

      {/* Lưới 5 ảnh chuẩn Airbnb */}
      <Images images={property?.images || []} title={property?.title} />

      {/* Nội dung chi tiết 2 cột */}
      <Details property={property} />

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: "12px", fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

Hero.propTypes = {
  property: PropTypes.object.isRequired,
};

export default Hero;
