import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  Container,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Paper,
  Tooltip,
  Card,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import Image from "../components/Image";
import { keyframes } from "@mui/system";
import axiosInstance from "../api/axiosConfig";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ReservationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomData } = location.state || {};
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    postalCode: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const message =
    "Tôi muốn đặt phòng này cho chuyến đi của mình. Mong được phục vụ tốt nhất.";
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const totalSteps = 2;
  const progress = (currentStep / totalSteps) * 100;

  if (!roomData) {
    return (
      <Container>
        <Typography variant="h5" sx={{ textAlign: "center", mt: 4 }}>
          Không tìm thấy thông tin đặt phòng. Vui lòng quay lại trang chủ và thử
          lại.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{ display: "block", mx: "auto", mt: 2 }}
        >
          Quay lại trang chủ
        </Button>
      </Container>
    );
  }

  if (!roomData.images || !roomData.title || !roomData.price) {
    return (
      <Container>
        <Typography variant="h5" sx={{ textAlign: "center", mt: 4 }}>
          Dữ liệu phòng không hợp lệ. Vui lòng thử lại.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{ display: "block", mx: "auto", mt: 2 }}
        >
          Quay lại trang chủ
        </Button>
      </Container>
    );
  }

  const handleInputChange = (e) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePayment = async () => {
    try {
      // Lấy bookingId từ roomData đã truyền sang
      const bookingId = roomData.bookingId || roomData.id;
      if (!bookingId) {
        console.error("Không tìm thấy bookingId.");
        return;
      }
      // Gửi payment với bookingId đã có
      const paymentData = {
        bookingId,
        content: message,
      };

      const paymethodMap = {
        VNPAY: "VnPay",
        MOMO: "Momo",
        PAYPAL: "Paypal",
        CREDIT_CARD: "CreditCard",
      };
      const paymethod =
        paymethodMap[selectedPaymentMethod] || selectedPaymentMethod;

      const response = await axiosInstance.post(
        "/api/payment/create-payment",
        paymentData,
        {
          params: { paymethod },
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data?.result) {
        window.location.href = response.data.result;
      } else {
        console.error("Không tìm thấy URL thanh toán trong response");
      }
    } catch (error) {
      console.error("Có lỗi xảy ra khi thanh toán:", error);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 1:
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              1. Chọn phương thức thanh toán
            </Typography>
            {currentStep >= 1 && (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Phương thức thanh toán</InputLabel>
                      <Select
                        value={selectedPaymentMethod}
                        onChange={(e) =>
                          setSelectedPaymentMethod(e.target.value)
                        }
                        label="Phương thức thanh toán"
                      >
                        <MenuItem value="VNPAY">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <img
                              src="data:image/png;base64,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"
                              alt="VNPAY"
                              height="24"
                            />
                            <Typography>VNPAY</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="MOMO">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <img
                              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnV4cUM7jBauINof35Yn_unOz976Iz5okV8A&s"
                              alt="MOMO"
                              height="24"
                            />
                            <Typography>MOMO</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="PAYPAL">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <img
                              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKSwjMDS0Nd7pv0QoYHkS9GR6U6xbS_dlLzA&s"
                              alt="PayPal"
                              height="24"
                            />
                            <Typography>PayPal</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="CREDIT_CARD">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <img
                              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfHDGEwpXk9e_ish-dLaBN7K2zujElgQ18Xw&s"
                              alt="Credit Card"
                              height="24"
                            />
                            <Typography>Thẻ tín dụng</Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleNext}
                  disabled={!selectedPaymentMethod}
                  sx={{
                    mt: 2,
                    backgroundColor: "#000000",
                    "&:hover": {
                      backgroundColor: "#333333",
                    },
                    padding: 1.5,
                  }}
                >
                  Tiếp theo
                </Button>
              </>
            )}
          </Paper>
        );

      case 2:
        return (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "#2C3E50",
              }}
            >
              2. Xem lại yêu cầu của bạn
            </Typography>
            {currentStep >= 2 && (
              <>
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    backgroundColor: "#F8F9FA",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "#2C3E50",
                      fontWeight: 500,
                      mb: 2,
                    }}
                  >
                    Bằng việc chọn nút bên dưới, bạn đồng ý với:
                  </Typography>
                  <ul
                    style={{
                      paddingLeft: "25px",
                      color: "#546E7A",
                      "& li": {
                        marginBottom: "8px",
                      },
                    }}
                  >
                    <li>Nội quy nhà</li>
                    <li>Chính sách hủy phòng</li>
                    <li>Quy chuẩn an toàn</li>
                  </ul>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handlePayment}
                  sx={{
                    mt: 2,
                    backgroundColor: "#FF385C",
                    "&:hover": {
                      backgroundColor: "#E61E4D",
                    },
                    padding: "14px",
                    fontSize: "16px",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(255, 56, 92, 0.3)",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 16px rgba(255, 56, 92, 0.4)",
                    },
                  }}
                >
                  Thanh toán ngay
                </Button>
              </>
            )}
          </Paper>
        );

      default:
        return null;
    }
  };

  const renderGuestInfo = () => {
    if (!roomData.guests) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Khách
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {roomData.guests > 1 ? <GroupIcon /> : <PersonIcon />}
          <Tooltip title="Số người trong phòng" placement="top">
            <Typography>
              {roomData.guests} {roomData.guests > 1 ? "người" : "người"}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  const fetchFavoriteRooms = async () => {
    try {
      const res = await axiosInstance.get("/api/users/favorites");
      if (res.data?.result?.favorites) {
        setFavoriteRooms(res.data.result.favorites);
        setFavoriteIds(res.data.result.favorites.map((fav) => fav.id || fav));
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchFavoriteRooms();
  }, []);

  const addFavorite = async (listingId) => {
    try {
      const res = await axiosInstance.post("/api/users/favorites", {
        listingId,
      });
      if (res.data.code === 200) {
        fetchFavoriteRooms();
      }
    } catch (err) {}
  };

  const deleteFavorite = async (listingId) => {
    try {
      const res = await axiosInstance.delete("/api/users/favorites", {
        data: { listingId },
      });
      if (res.data.code === 200) {
        fetchFavoriteRooms();
      }
    } catch (err) {}
  };

  const renderFavoriteRooms = () => {
    console.log("favoriteRooms", favoriteRooms);
    if (favoriteRooms.length === 0) return null;

    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Your Favorite Rooms
        </Typography>
        <Grid container spacing={3}>
          {favoriteRooms.map((room) => (
            <Grid item xs={12} md={6} key={room.id}>
              <Paper sx={{ p: 2, display: "flex", alignItems: "center" }}>
                <Image
                  src={
                    room.primaryThumbnail.startsWith("http")
                      ? room.primaryThumbnail
                      : `http://175.41.233.105:8080/${room.primaryThumbnail}`
                  }
                  alt={room.title}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginRight: 16,
                  }}
                />
                <div>
                  <Typography variant="subtitle1">{room.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Giá: {room.price} VND / đêm
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Từ {room.startDate} đến {room.endDate}
                  </Typography>
                </div>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>
    );
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        bgcolor: "#fff",
        animation: `${fadeIn} 0.5s ease-out`,
        "& .MuiPaper-root": {
          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: "#f5f5f5",
          zIndex: 1100,
        }}
      >
        <Box
          sx={{
            height: "100%",
            background: "linear-gradient(90deg, #FF385C 0%, #E61E4D 100%)",
            width: `${progress}%`,
            transition: "width 0.4s ease-in-out",
            borderRadius: "0 2px 2px 0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography
            variant="h4"
            sx={{
              mb: 4,
              textAlign: "center",
              color: "primary.main",
              fontWeight: 600,
            }}
          >
            Đặt phòng
          </Typography>

          {[1, 2].map((step) => (
            <React.Fragment key={`step-${step}`}>
              {renderStepContent(step)}
            </React.Fragment>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              position: "sticky",
              top: 24,
              bgcolor: "#fff",
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
              border: "1px solid #e0e0e0",
              "&:hover": {
                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Thông tin chuyến đi
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ position: "relative" }}>
                <Image
                  src={
                    roomData?.images?.[0]
                      ? roomData.images[0].startsWith("http")
                        ? roomData.images[0]
                        : `http://175.41.233.105:8080/${roomData.images[0]}`
                      : ""
                  }
                  alt="Room Preview"
                  sx={{
                    width: "100%",
                    height: 200,
                    borderRadius: 2,
                    objectFit: "cover",
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontSize: "1.2rem", fontWeight: 600 }}
                >
                  {roomData.title}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <Typography sx={{ fontSize: "0.9rem" }}>
                    {`⭐ ${roomData.avgStart || 0} (${roomData.reviews || 0})`}
                  </Typography>
                  {roomData.popular && (
                    <Typography
                      sx={{ ml: 1, fontSize: "0.9rem", color: "#666" }}
                    >
                      • Được khách yêu thích
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Hủy miễn phí
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hủy trước {roomData.checkIn} để được hoàn tiền đầy đủ.
              </Typography>
              <Button
                sx={{
                  textDecoration: "underline",
                  p: 0,
                  mt: 0.5,
                  color: "text.primary",
                  "&:hover": { background: "none" },
                }}
              >
                Toàn bộ chính sách
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Thông tin chuyến đi
              </Typography>
              {roomData.bookingId && (
                <Typography color="primary" sx={{ fontWeight: 600 }}>
                  Mã booking: {roomData.bookingId}
                </Typography>
              )}
              <Typography>
                Ngày: {roomData.checkIn} - {roomData.checkOut}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {`${roomData.numberOfNights} đêm • ${roomData.guests} người`}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Chi tiết giá
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography>
                  đ{roomData.price.toLocaleString()} × {roomData.numberOfNights}{" "}
                  đêm
                </Typography>
                <Typography>đ{roomData.totalPrice.toLocaleString()}</Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography>Thuế</Typography>
                <Typography>
                  đ{(roomData.totalPrice * 0.1).toLocaleString()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 600 }}>Tổng (VND)</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  đ{(roomData.totalPrice * 1.1).toLocaleString()}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, textAlign: "right" }}
              >
                Chi tiết giá
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

ReservationPage.propTypes = {
  roomData: PropTypes.shape({
    price: PropTypes.number,
    checkIn: PropTypes.string,
    checkOut: PropTypes.string,
    guests: PropTypes.number,
    numberOfNights: PropTypes.number,
    totalPrice: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    title: PropTypes.string,
    avgStart: PropTypes.number,
    reviews: PropTypes.number,
    popular: PropTypes.bool,
  }),
};

export default ReservationPage;
