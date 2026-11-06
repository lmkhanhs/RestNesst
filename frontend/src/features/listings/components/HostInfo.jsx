import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import axiosInstance from "@/shared/api/httpClient.js";
import { BACKEND_URL } from "@/shared/config/environment.js";

const getImageUrl = (img) => {
  if (!img || typeof img !== "string") return "";
  const trimmed = img.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `${BACKEND_URL}/${trimmed.replace(/^\/+/, "")}`;
};

const MAX_DESC = 200;

const parseLanguages = (rawLanguages) => {
  if (Array.isArray(rawLanguages) && rawLanguages.length > 0) {
    return rawLanguages.filter(Boolean);
  }
  if (typeof rawLanguages === "string" && rawLanguages.trim()) {
    return rawLanguages
      .split(/[,;|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return ["Tiếng Việt"];
};

const HostInfo = ({
  hostId,
  fallbackHostName,
  fallbackHostAvatar,
  fallbackRating,
  fallbackReviewCount,
  fallbackCountry,
}) => {
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const fetchHostInfo = async () => {
      try {
        setLoading(true);
        if (!hostId) throw new Error("Không có hostId");
        const res = await axiosInstance.get(`/api/users/host/${hostId}`, {
          headers: { Authorization: undefined },
        });
        const data = res.data?.result;
        if (data) {
          const resolvedName =
            data.fullname?.trim() ||
            data.username?.trim() ||
            fallbackHostName ||
            "Chủ nhà RestNesst";
          const rawAvatar = data.thumnailUrl || fallbackHostAvatar;
          const resolvedAvatar = rawAvatar
            ? getImageUrl(rawAvatar)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                resolvedName
              )}&background=FF385C&color=fff`;

          setHost({
            name: resolvedName,
            username: data.username || "",
            avatar: resolvedAvatar,
            reviews:
              typeof data.totalReviews === "number"
                ? data.totalReviews
                : Number(fallbackReviewCount) || 0,
            rating:
              typeof data.avgRating === "number" && data.avgRating > 0
                ? data.avgRating
                : Number(fallbackRating) || 4.9,
            yearsHosting:
              typeof data.didHostYear === "number" && data.didHostYear > 0
                ? data.didHostYear
                : 1,
            totalListings:
              typeof data.totalListings === "number" && data.totalListings > 0
                ? data.totalListings
                : 1,
            languages: parseLanguages(data.languages),
            country:
              [data.address, data.country].filter(Boolean).join(", ") ||
              fallbackCountry ||
              "Việt Nam",
            email: data.email || "",
            phone: data.phone || "",
            description:
              data.description?.trim() ||
              "Chủ nhà thân thiện, phản hồi nhanh và luôn sẵn sàng hỗ trợ khách lưu trú trong suốt kỳ nghỉ.",
          });
        } else {
          throw new Error("Không có dữ liệu host");
        }
      } catch {
        const fallbackName = fallbackHostName || "Chủ nhà RestNesst";
        setHost({
          name: fallbackName,
          username: "",
          avatar: fallbackHostAvatar
            ? getImageUrl(fallbackHostAvatar)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                fallbackName
              )}&background=FF385C&color=fff`,
          reviews: Number(fallbackReviewCount) || 0,
          rating: Number(fallbackRating) || 4.9,
          yearsHosting: 1,
          totalListings: 1,
          languages: ["Tiếng Việt"],
          country: fallbackCountry || "Việt Nam",
          email: "",
          phone: "",
          description:
            "Chủ nhà thân thiện, phản hồi nhanh và luôn sẵn sàng hỗ trợ khách lưu trú trong suốt kỳ nghỉ.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHostInfo();
  }, [
    hostId,
    fallbackHostName,
    fallbackHostAvatar,
    fallbackRating,
    fallbackReviewCount,
    fallbackCountry,
  ]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!host) {
    return null;
  }

  const desc = host.description || "";
  const isLong = desc.length > MAX_DESC;
  const displayDesc =
    showMore || !isLong ? desc : `${desc.slice(0, MAX_DESC)}...`;

  return (
    <Box sx={{ my: 3.5 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 800,
          fontFamily: "var(--rn-font-display)",
          color: "var(--rn-text-primary)",
          fontSize: "1.25rem",
        }}
      >
        Thông tin chủ nhà
      </Typography>

      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: "20px",
          bgcolor: "var(--rn-surface-2)",
          border: "1px solid var(--rn-border-subtle)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Cột trái: Avatar + Tên + Thống kê thực tế */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: "18px",
                bgcolor: "var(--rn-surface-card)",
                border: "1px solid var(--rn-border-subtle)",
                boxShadow: "var(--rn-shadow-sm)",
                textAlign: "center",
              }}
            >
              <Avatar
                src={host.avatar}
                alt={host.name}
                sx={{
                  width: 84,
                  height: 84,
                  mx: "auto",
                  mb: 1.5,
                  fontSize: 32,
                  border: "3px solid var(--rn-brand-primary)",
                }}
              />
              <Stack
                direction="row"
                spacing={0.75}
                justifyContent="center"
                alignItems="center"
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontFamily: "var(--rn-font-display)",
                    color: "var(--rn-text-primary)",
                  }}
                >
                  {host.name}
                </Typography>
                <VerifiedRoundedIcon
                  sx={{ fontSize: 18, color: "var(--rn-brand-primary)" }}
                />
              </Stack>

              <Chip
                size="small"
                label="Chủ nhà đã xác minh"
                sx={{
                  mt: 0.75,
                  mb: 2,
                  fontWeight: 600,
                  bgcolor: "var(--rn-brand-soft)",
                  color: "var(--rn-brand-primary)",
                }}
              />

              <Divider sx={{ borderColor: "var(--rn-border-subtle)", mb: 2 }} />

              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      color: "var(--rn-text-primary)",
                      lineHeight: 1.2,
                    }}
                  >
                    {host.reviews}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--rn-text-secondary)", fontWeight: 600 }}
                  >
                    Đánh giá
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Stack
                    direction="row"
                    spacing={0.25}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 800,
                        color: "var(--rn-text-primary)",
                        lineHeight: 1.2,
                      }}
                    >
                      {Number(host.rating || 0).toFixed(1)}
                    </Typography>
                    <StarRoundedIcon
                      sx={{ color: "#F59E0B", fontSize: 17 }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--rn-text-secondary)", fontWeight: 600 }}
                  >
                    Xếp hạng
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      color: "var(--rn-text-primary)",
                      lineHeight: 1.2,
                    }}
                  >
                    {host.yearsHosting} năm
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--rn-text-secondary)", fontWeight: 600 }}
                  >
                    Đón khách
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Cột phải: Thông tin chi tiết & giới thiệu của chủ nhà */}
          <Grid item xs={12} md={7}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <LanguageRoundedIcon
                  sx={{ fontSize: 20, color: "var(--rn-brand-primary)" }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "var(--rn-text-primary)", fontWeight: 600 }}
                >
                  Ngôn ngữ giao tiếp:{" "}
                  <Box
                    component="span"
                    sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
                  >
                    {host.languages.join(", ")}
                  </Box>
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <LocationOnOutlinedIcon
                  sx={{ fontSize: 20, color: "var(--rn-brand-primary)" }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "var(--rn-text-primary)", fontWeight: 600 }}
                >
                  Khu vực hoạt động:{" "}
                  <Box
                    component="span"
                    sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
                  >
                    {host.country}
                  </Box>
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <HomeWorkOutlinedIcon
                  sx={{ fontSize: 20, color: "var(--rn-brand-primary)" }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "var(--rn-text-primary)", fontWeight: 600 }}
                >
                  Quy mô vận hành:{" "}
                  <Box
                    component="span"
                    sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
                  >
                    {host.totalListings} chỗ nghỉ đang mở đặt
                  </Box>
                </Typography>
              </Stack>

              {host.email && (
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <EmailOutlinedIcon
                    sx={{ fontSize: 20, color: "var(--rn-brand-primary)" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--rn-text-primary)", fontWeight: 600 }}
                  >
                    Email liên hệ:{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "var(--rn-text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {host.email}
                    </Box>
                  </Typography>
                </Stack>
              )}

              {host.phone && (
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <PhoneOutlinedIcon
                    sx={{ fontSize: 20, color: "var(--rn-brand-primary)" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--rn-text-primary)", fontWeight: 600 }}
                  >
                    Điện thoại hỗ trợ:{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "var(--rn-text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {host.phone}
                    </Box>
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ borderColor: "var(--rn-border-subtle)", my: 0.5 }} />

              <Typography
                variant="body2"
                sx={{
                  color: "var(--rn-text-secondary)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}
              >
                {displayDesc}
              </Typography>

              {isLong && (
                <Box>
                  <Button
                    size="small"
                    sx={{
                      color: "var(--rn-brand-primary)",
                      textTransform: "none",
                      fontWeight: 700,
                      px: 0,
                    }}
                    endIcon={
                      showMore ? (
                        <ExpandLessRoundedIcon />
                      ) : (
                        <ExpandMoreRoundedIcon />
                      )
                    }
                    onClick={() => setShowMore((v) => !v)}
                  >
                    {showMore ? "Thu gọn" : "Xem thêm"}
                  </Button>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

HostInfo.propTypes = {
  hostId: PropTypes.string,
  fallbackHostName: PropTypes.string,
  fallbackHostAvatar: PropTypes.string,
  fallbackRating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fallbackReviewCount: PropTypes.number,
  fallbackCountry: PropTypes.string,
};

export default HostInfo;
