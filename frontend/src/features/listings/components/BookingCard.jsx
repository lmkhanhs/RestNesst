import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useNavigate } from "react-router-dom";
import DateRangeSelector from "./DateRangeSelector.jsx";
import PricingBreakdown from "./PricingBreakdown.jsx";
import PropTypes from "prop-types";
import axiosInstance from "@/shared/api/httpClient.js";
import dayjs from "dayjs";

const BookingCard = ({
  id,
  price,
  startDate,
  endDate,
  images = [],
  title,
  avgStart,
  reviews,
  popular,
}) => {
  const [value, setValue] = useState([null, null]);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bookingPending = useRef(false);
  const navigate = useNavigate();

  const numericPrice = Number(price || 0);
  const ratingValue = Number(avgStart || 0);
  const reviewCount = Array.isArray(reviews)
    ? reviews.length
    : Number(reviews) || 0;

  const nights =
    value[0] && value[1]
      ? Math.max(
          1,
          Math.ceil((value[1] - value[0]) / (1000 * 60 * 60 * 24))
        )
      : 0;

  const calculateTotal = () => {
    if (nights <= 0) return numericPrice;
    return numericPrice * nights;
  };

  const handleReserveClick = async () => {
    if (bookingPending.current) return;
    setErrorMsg("");
    if (!value[0] || !value[1]) {
      setErrorMsg("Vui lòng chọn ngày nhận phòng và ngày trả phòng.");
      return;
    }
    const firstAvailable = startDate ? dayjs(startDate) : dayjs();
    const lastAvailable = endDate ? dayjs(endDate) : dayjs().add(6, "months");
    if (!value[0].isValid() || !value[1].isValid()
        || value[1].isBefore(value[0], "day")
        || value[0].isBefore(firstAvailable, "day")
        || value[1].isAfter(lastAvailable, "day")) {
      setErrorMsg("Vui lòng chọn ngày hợp lệ trong lịch trống của chỗ ở.");
      return;
    }

    const totalPrice = numericPrice * nights;

    const bookingData = {
      listingId: id,
      checkInDate: value[0].format("YYYY-MM-DD"),
      checkOutDate: value[1].format("YYYY-MM-DD"),
      totalPrice: totalPrice,
      content: "Xin chào! Tôi muốn đặt phòng này.",
    };

    bookingPending.current = true;
    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/api/bookings", bookingData);
      if (response.data && response.data.result) {
        navigate("/reservation", {
          state: {
            roomData: {
              ...response.data.result,
              checkIn: response.data.result.checkInDate,
              checkOut: response.data.result.checkOutDate,
              numberOfNights: nights,
              totalPrice: response.data.result.totalPrice,
              images: images,
              title: response.data.result.title || title,
              avgStart: response.data.result.avgStart ?? avgStart,
              reviews: response.data.result.reviews ?? reviewCount,
              popular: response.data.result.popular ?? popular,
              guests: response.data.result.guests ?? 1,
              price: response.data.result.price ?? numericPrice,
              bookingId:
                response.data.result.bookingId ?? response.data.result.id,
              id: id,
            },
          },
        });
      } else {
        setErrorMsg("Đặt phòng thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
          "Vui lòng đăng nhập hoặc kiểm tra lại ngày đặt phòng."
      );
    } finally {
      bookingPending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        position: { md: "sticky" },
        top: { md: 96 },
        p: { xs: 2.5, md: 3 },
        bgcolor: "var(--rn-surface-card)",
        color: "var(--rn-text-primary)",
        borderRadius: "20px",
        border: "1px solid var(--rn-border-subtle)",
        boxShadow: "var(--rn-shadow-md)",
      }}
    >
      {/* Hàng giá phòng & đánh giá */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={0.75} alignItems="baseline">
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontFamily: "var(--rn-font-display)",
              color: "var(--rn-text-primary)",
            }}
          >
            {numericPrice.toLocaleString("vi-VN")} ₫
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "var(--rn-text-secondary)", fontWeight: 600 }}
          >
            / đêm
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <StarRoundedIcon sx={{ color: "#F59E0B", fontSize: 18 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "var(--rn-text-primary)" }}
          >
            {ratingValue > 0 ? ratingValue.toFixed(1) : "Mới"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "var(--rn-text-secondary)", fontWeight: 600 }}
          >
            ({reviewCount})
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2, borderColor: "var(--rn-border-subtle)" }} />

      <DateRangeSelector
        value={value}
        setValue={(nextVal) => {
          setErrorMsg("");
          setValue(nextVal);
        }}
        startDate={startDate}
        endDate={endDate}
      />

      {errorMsg && (
        <Alert
          severity="warning"
          onClose={() => setErrorMsg("")}
          sx={{ mt: 1.75, borderRadius: "12px", fontSize: "0.82rem" }}
        >
          {errorMsg}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleReserveClick}
        disabled={submitting}
        sx={{
          mt: 2.25,
          bgcolor: "primary.main",
          "&:hover": { bgcolor: "primary.dark" },
          minHeight: 48,
          py: 1.4,
          borderRadius: "14px",
          fontSize: "0.98rem",
          fontWeight: 700,
          textTransform: "none",
          boxShadow: "0 8px 20px rgba(255, 56, 92, 0.25)",
        }}
      >
        {submitting ? "Đang đặt phòng..." : "Đặt phòng ngay"}
      </Button>

      <Stack
        direction="row"
        spacing={0.75}
        justifyContent="center"
        alignItems="center"
        sx={{ mt: 1.5 }}
      >
        <ShieldOutlinedIcon
          sx={{ fontSize: 16, color: "var(--rn-text-secondary)" }}
        />
        <Typography
          variant="caption"
          sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}
        >
          Bạn chưa bị trừ tiền ở bước xác nhận này
        </Typography>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "var(--rn-border-subtle)" }} />

      <PricingBreakdown
        price={numericPrice}
        nights={nights}
        total={calculateTotal()}
      />
    </Box>
  );
};

BookingCard.propTypes = {
  id: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  images: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired,
  avgStart: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  reviews: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
  popular: PropTypes.bool,
};

export default BookingCard;
