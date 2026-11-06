import { Box, Stack, Typography } from "@mui/material";
import { Crown } from "@phosphor-icons/react";
import PropTypes from "prop-types";

const GuestFavorite = ({ isPopular = false }) => {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          bgcolor: isPopular
            ? "rgba(245, 158, 11, 0.14)"
            : "var(--rn-brand-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Crown
          weight="fill"
          style={{
            width: 24,
            height: 24,
            color: isPopular ? "#F59E0B" : "var(--rn-brand-primary)",
          }}
        />
      </Box>
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            fontFamily: "var(--rn-font-display)",
            color: "var(--rn-text-primary)",
            lineHeight: 1.25,
          }}
        >
          {isPopular ? "Được khách yêu thích" : "Chỗ nghỉ tiêu chuẩn cao"}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
        >
          Đánh giá xác thực từ khách đã lưu trú
        </Typography>
      </Box>
    </Stack>
  );
};

GuestFavorite.propTypes = {
  isPopular: PropTypes.bool,
};

export default GuestFavorite;
