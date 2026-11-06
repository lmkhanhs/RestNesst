import PropTypes from "prop-types";
import { Avatar, Box, Grid, Stack, Typography } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SquareFootRoundedIcon from "@mui/icons-material/SquareFootRounded";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { BACKEND_URL } from "@/shared/config/environment.js";

const getImageUrl = (img) => {
  if (!img || typeof img !== "string") return "";
  const trimmed = img.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `${BACKEND_URL}/${trimmed.replace(/^\/+/, "")}`;
};

const PropertyHeader = ({
  title,
  address,
  city,
  country,
  area,
  categories = [],
  startDate,
  endDate,
  hostName,
  hostThumnailUrl,
}) => {
  const locationLabel = [city, country].filter(Boolean).join(", ") || country || "Việt Nam";
  const fullAddress = [address, city, country].filter(Boolean).join(", ");
  const categoryNames =
    Array.isArray(categories) && categories.length > 0
      ? categories.map((c) => c.name).filter(Boolean).join(" • ")
      : "Chỗ nghỉ nguyên căn";

  const resolvedHostName = hostName || "Chủ nhà RestNesst";
  const resolvedHostAvatar = hostThumnailUrl
    ? getImageUrl(hostThumnailUrl)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        resolvedHostName
      )}&background=FF385C&color=fff`;

  const highlights = [
    {
      icon: <SquareFootRoundedIcon sx={{ color: "var(--rn-brand-primary)" }} />,
      label: "Diện tích sử dụng",
      value: area ? `${area} m² rộng rãi` : "Không gian thoáng đãng",
    },
    {
      icon: <CategoryOutlinedIcon sx={{ color: "var(--rn-brand-primary)" }} />,
      label: "Loại hình lưu trú",
      value: categoryNames,
    },
    {
      icon: (
        <EventAvailableRoundedIcon sx={{ color: "var(--rn-brand-primary)" }} />
      ),
      label: "Khung lịch mở đặt",
      value:
        startDate && endDate
          ? `${startDate} → ${endDate}`
          : "Sẵn sàng đón khách",
    },
    {
      icon: (
        <VerifiedUserOutlinedIcon sx={{ color: "var(--rn-brand-primary)" }} />
      ),
      label: "Nhận phòng linh hoạt",
      value: "Hỗ trợ tự nhận phòng & tư vấn 24/7",
    },
  ];

  return (
    <Box sx={{ mb: 3.5 }}>
      {/* Hàng thông tin tóm tắt chỗ ở & chủ nhà */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ pb: 3, borderBottom: "1px solid var(--rn-border-subtle)" }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontFamily: "var(--rn-font-display)",
              color: "var(--rn-text-primary)",
              mb: 0.75,
              fontSize: { xs: "1.25rem", md: "1.45rem" },
            }}
          >
            Toàn bộ chỗ ở tại {locationLabel}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <PlaceOutlinedIcon
              sx={{ fontSize: 18, color: "var(--rn-brand-primary)" }}
            />
            <Typography
              variant="body2"
              sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
            >
              {fullAddress || title}
            </Typography>
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            px: 2,
            py: 1.1,
            borderRadius: "14px",
            bgcolor: "var(--rn-surface-2)",
            border: "1px solid var(--rn-border-subtle)",
            flexShrink: 0,
          }}
        >
          <Avatar
            src={resolvedHostAvatar}
            alt={resolvedHostName}
            sx={{
              width: 44,
              height: 44,
              border: "2px solid var(--rn-brand-primary)",
            }}
          />
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "var(--rn-text-secondary)",
                display: "block",
                fontWeight: 600,
              }}
            >
              Chủ nhà đón tiếp
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ color: "var(--rn-text-primary)", fontWeight: 700 }}
            >
              {resolvedHostName}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* 4 thẻ điểm nổi bật của phòng */}
      <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
        {highlights.map((item) => (
          <Grid item xs={12} sm={6} key={item.label}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              sx={{
                p: 1.75,
                height: "100%",
                borderRadius: "14px",
                bgcolor: "var(--rn-surface-2)",
                border: "1px solid var(--rn-border-subtle)",
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: "var(--rn-brand-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--rn-text-secondary)",
                    fontWeight: 600,
                    display: "block",
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--rn-text-primary)",
                    fontWeight: 700,
                    mt: 0.25,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

PropertyHeader.propTypes = {
  title: PropTypes.string.isRequired,
  address: PropTypes.string,
  city: PropTypes.string,
  country: PropTypes.string,
  area: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  categories: PropTypes.array,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  hostName: PropTypes.string,
  hostThumnailUrl: PropTypes.string,
};

export default PropertyHeader;
