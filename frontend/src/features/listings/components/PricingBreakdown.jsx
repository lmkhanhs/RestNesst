import { Box, Divider, Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";

const formatCurrency = (val) => `${Number(val || 0).toLocaleString("vi-VN")} ₫`;

const PricingBreakdown = ({ price, nights, total }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1.25}>
        {nights > 0 ? (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="body2"
              sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
            >
              {formatCurrency(price)} × {nights} đêm
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--rn-text-primary)", fontWeight: 600 }}
            >
              {formatCurrency(total)}
            </Typography>
          </Stack>
        ) : (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="body2"
              sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
            >
              Giá tiêu chuẩn mỗi đêm
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--rn-text-primary)", fontWeight: 600 }}
            >
              {formatCurrency(price)}
            </Typography>
          </Stack>
        )}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="body2"
            sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
          >
            Phí dịch vụ đặt phòng
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#10B981", fontWeight: 700 }}
          >
            Miễn phí
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.75, borderColor: "var(--rn-border-subtle)" }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            fontFamily: "var(--rn-font-display)",
            color: "var(--rn-text-primary)",
          }}
        >
          Tổng cộng {nights > 0 ? `(${nights} đêm)` : "(tạm tính 1 đêm)"}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontFamily: "var(--rn-font-display)",
            color: "var(--rn-brand-primary)",
          }}
        >
          {formatCurrency(total)}
        </Typography>
      </Stack>
    </Box>
  );
};

PricingBreakdown.propTypes = {
  price: PropTypes.number.isRequired,
  nights: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

export default PricingBreakdown;
