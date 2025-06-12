import React, { useState } from "react";
import { Box, Typography, Button, Divider, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DateRangeSelector from "./DateRangeSelector";
import PricingBreakdown from "./PricingBreakdown";
import PropTypes from "prop-types";
import axiosInstance from "../../../api/axiosConfig";

const BookingCard = ({
  id,
  price,
  startDate,
  endDate,
  images,
  title,
  avgStart,
  reviews,
  popular,
}) => {
  const [value, setValue] = useState([null, null]);
  const navigate = useNavigate();

  const calculateTotal = () => {
    if (!value[0] || !value[1]) return price;
    const numberOfNights = Math.ceil(
      (value[1] - value[0]) / (1000 * 60 * 60 * 24)
    );
    return price * numberOfNights;
  };

  const handleReserveClick = async () => {
    if (!value[0] || !value[1]) {
      alert("Vui lòng chọn ngày nhận phòng và trả phòng");
      return;
    }

    const numberOfNights = Math.ceil(
      (value[1] - value[0]) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = price * numberOfNights;

    // Chuẩn bị dữ liệu gửi lên server
    const bookingData = {
      listingId: id,
      checkInDate: value[0].toISOString().split("T")[0],
      checkOutDate: value[1].toISOString().split("T")[0],
      totalPrice: totalPrice,
      content: "Xin chào! Tôi muốn đặt phòng này.", // hoặc cho phép nhập message nếu muốn
    };

    try {
      const response = await axiosInstance.post("/api/bookings", bookingData);
      if (response.data && response.data.result) {
        // Chuyển sang trang reservation với dữ liệu booking trả về
        navigate("/reservation", {
          state: {
            roomData: {
              ...response.data.result,
              checkIn: response.data.result.checkInDate,
              checkOut: response.data.result.checkOutDate,
              numberOfNights: numberOfNights,
              totalPrice: response.data.result.totalPrice,
              images: images,
              title: response.data.result.title || title,
              avgStart: response.data.result.avgStart || avgStart,
              reviews: response.data.result.reviews || reviews,
              popular: response.data.result.popular || popular,
              guests: response.data.result.guests || 1,
              price: response.data.result.price || price,
              bookingId:
                response.data.result.bookingId || response.data.result.id,
              id: id,
            },
          },
        });
      } else {
        alert("Đặt phòng thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt phòng.");
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#2d2d2d", color: "white", borderRadius: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        ₹{price} / đêm
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <DateRangeSelector
        value={value}
        setValue={setValue}
        startDate={startDate}
        endDate={endDate}
      />

      <Divider sx={{ my: 2 }} />

      <Button
        fullWidth
        variant="contained"
        onClick={handleReserveClick}
        sx={{
          bgcolor: "#e53935",
          "&:hover": { bgcolor: "#c62828" },
          py: 1.5,
          fontSize: "1rem",
          fontWeight: 600,
        }}
      >
        Đặt ngay
      </Button>

      <Divider sx={{ my: 2 }} />

      <PricingBreakdown
        price={price}
        nights={
          value[0] && value[1]
            ? Math.ceil((value[1] - value[0]) / (1000 * 60 * 60 * 24))
            : 0
        }
        total={calculateTotal()}
      />
    </Box>
  );
};

BookingCard.propTypes = {
  id: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired,
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  title: PropTypes.string.isRequired,
  avgStart: PropTypes.number.isRequired,
  reviews: PropTypes.number.isRequired,
  popular: PropTypes.bool,
};

export default BookingCard;
