import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Stack,
  Button,
  Container,
  TextField,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Badge,
} from "@mui/material";
import {
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  Message as MessageIcon,
  Hotel as HotelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/shared/api/httpClient.js";
import PropTypes from "prop-types";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import CheckIcon from "@mui/icons-material/Check";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Rating from "@mui/material/Rating";
import Grid from "@mui/material/Grid";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { analyzeSentiment } from "@/features/reviews/api/sentimentAnalysis.js";

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [editTab, setEditTab] = useState(0);
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
    thumnailUrl: "", // Changed from thumbnailUrl to thumnailUrl to match API response
    address: "", // Thêm address
  });
  const [bookedRooms, setBookedRooms] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [messages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState(null);
  const [reviewForm, setReviewForm] = useState({
    comment: "",
    rating: 5,
    image: null,
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const criteriaList = [
    { key: "cleanliness", label: "Vệ sinh", icon: "🧹" },
    { key: "accuracy", label: "Đúng mô tả", icon: "✓" },
    { key: "checkin", label: "Dễ nhận phòng", icon: "🔑" },
    { key: "support", label: "Hỗ trợ", icon: "💬" },
    { key: "location", label: "Xung quanh", icon: "📍" },
    { key: "value", label: "Đáng tiền", icon: "💰" },
  ];
  const [criteriaRatings, setCriteriaRatings] = useState({
    cleanliness: 0,
    accuracy: 0,
    checkin: 0,
    support: 0,
    location: 0,
    value: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (userData) {
          setFormData({
            username: userData.username || "",
            fullname: userData.fullname || "",
            email: userData.email || "",
            phone: userData.phone || "",
            thumnailUrl: userData.thumnailUrl || "",
            address: userData.address || "", // Thêm address
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      }
    };

    fetchUserData();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await axiosInstance.get("/api/users/favorites");
      if (res.data?.result?.favorites) {
        setFavoriteRooms(res.data.result.favorites);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (currentTab === 1) {
      const fetchBookedRooms = async () => {
        try {
          const res = await axiosInstance.get("/api/bookings/my");
          if (res.data?.result) {
            setBookedRooms(res.data.result);
          }
        } catch (err) {
          setBookedRooms([]);
        }
      };
      fetchBookedRooms();
    }
  }, [currentTab]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, thumbnailUrl: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const form = new FormData();
      form.append("fullname", formData.fullname);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("address", formData.address); // Thêm address
      if (selectedFile) {
        form.append("thumnail", selectedFile);
      }

      const response = await axiosInstance.put("/api/users", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.code === 200) {
        const updatedUserData = response.data.result;
        setFormData((prev) => ({
          ...prev,
          fullname: updatedUserData.fullname,
          email: updatedUserData.email,
          phone: updatedUserData.phone,
          thumnailUrl: updatedUserData.thumnailUrl,
          address: updatedUserData.address, // Thêm address
        }));
        setPreviewUrl("");
        setSelectedFile(null);
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        setSuccess(true);
        window.dispatchEvent(new Event("storage"));
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteFavorite = async (listingId) => {
    try {
      const res = await axiosInstance.delete("/api/users/favorites", {
        data: { listingId },
      });
      if (res.data.code === 200) {
        fetchFavorites();
      }
    } catch (err) {
      // Có thể hiển thị thông báo lỗi nếu cần
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData) throw new Error("Không tìm thấy thông tin người dùng");
      const payload = {
        username: userData.username,
        password: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        verifyPassword: passwordData.confirmPassword,
      };
      const res = await axiosInstance.put("/api/users/password", payload);
      if (res.data.code === 200) {
        setSuccess(true);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.data.message || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Đổi mật khẩu thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckout = async (bookingId) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.put(`/api/bookings/${bookingId}`, {
        bookingStatus: "SUCCESS",
      });
      if (res.data.code === 200) {
        setBookedRooms((prev) =>
          prev.map((room) =>
            room.bookingId === bookingId
              ? { ...room, bookingStatus: "SUCCESS" }
              : room
          )
        );
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(res.data.message || "Xác nhận trả phòng thất bại");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Xác nhận trả phòng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const calcAvgRating = () => {
    const arr = Object.values(criteriaRatings);
    const filled = arr.filter((v) => v > 0);
    if (filled.length === 0) return 0;
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  };

  const handleSubmitReview = async () => {
    setReviewLoading(true);
    setReviewError("");
    try {
      // Validate đủ 6 tiêu chí và có bình luận
      if (
        Object.values(criteriaRatings).some((v) => v === 0) ||
        !reviewForm.comment.trim()
      ) {
        setReviewError("Vui lòng đánh giá đủ 6 tiêu chí và nhập bình luận!");
        setReviewLoading(false);
        return;
      }

      // Phân tích sentiment trước khi gửi review
      console.log("Đang phân tích sentiment...");
      const sentiment = await analyzeSentiment(reviewForm.comment);
      console.log("Kết quả sentiment:", sentiment);

      const formData = new FormData();
      formData.append("comment", reviewForm.comment);
      formData.append("rating", calcAvgRating());

      // Thêm log để debug
      console.log("Sentiment trước khi xử lý:", sentiment);

      // Xử lý sentiment an toàn hơn
      let status = "NEUTRAL";
      if (sentiment && typeof sentiment === "string") {
        status = sentiment.toUpperCase();
      } else if (sentiment && sentiment.status) {
        status = sentiment.status.toUpperCase();
      }

      console.log("Status cuối cùng:", status);
      formData.append("status", status);

      if (reviewForm.image) formData.append("image", reviewForm.image);

      await axiosInstance.post(
        `/api/listings/reviews/${selectedBookingForReview.bookingId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setBookedRooms((prev) =>
        prev.map((room) =>
          room.bookingId === selectedBookingForReview.bookingId
            ? { ...room, commented: false }
            : room
        )
      );
      setOpenReviewDialog(false);
      setReviewForm({ comment: "", rating: 5, image: null });
      setCriteriaRatings({
        cleanliness: 0,
        accuracy: 0,
        checkin: 0,
        support: 0,
        location: 0,
        value: 0,
      });
    } catch (err) {
      console.error("Lỗi khi submit review:", err);
      console.error("Chi tiết lỗi:", err.response?.data);
      setReviewError(err.response?.data?.message || "Gửi đánh giá thất bại");
    } finally {
      setReviewLoading(false);
    }
  };

  const renderEditProfile = () => (
    <Card sx={{ p: 3 }}>
      <Tabs
        value={editTab}
        onChange={(_, v) => setEditTab(v)}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab label="Chỉnh sửa thông tin" />
        <Tab label="Đổi mật khẩu" />
      </Tabs>
      {editTab === 0 ? (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Cập nhật thông tin thành công!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Avatar
                  alt={formData.username || "User"}
                  src={
                    previewUrl || formData.thumnailUrl || "/default-avatar.png"
                  }
                  sx={{ width: 100, height: 100, mb: 1 }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </Button>
                {selectedFile && (
                  <Typography variant="caption" color="text.secondary">
                    {selectedFile.name}
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                name="username"
                label="Tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                disabled={true}
              />

              <TextField
                fullWidth
                name="fullname"
                label="Họ và tên"
                value={formData.fullname}
                onChange={handleChange}
                disabled={loading}
              />

              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />

              <TextField
                fullWidth
                name="phone"
                label="Số điện thoại"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />

              <TextField
                fullWidth
                name="address"
                label="Địa chỉ"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Cập nhật thông tin"
                )}
              </Button>
            </Stack>
          </form>
        </>
      ) : (
        <form onSubmit={handleChangePassword}>
          <Stack spacing={3}>
            <TextField
              label="Mật khẩu cũ"
              name="oldPassword"
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  oldPassword: e.target.value,
                }))
              }
              required
              disabled={loading}
            />
            <TextField
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              required
              disabled={loading}
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
              disabled={loading}
            />
            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">Đổi mật khẩu thành công!</Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đổi mật khẩu"
              )}
            </Button>
          </Stack>
        </form>
      )}
    </Card>
  );

  const renderBookedRooms = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Phòng đã đặt
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Xác nhận trả phòng thành công!
        </Alert>
      )}
      <TableContainer
        component={Paper}
        sx={{ background: "#232323", borderRadius: 3 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#232323" }}>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Ảnh</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Tên chỗ ở
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Địa chỉ
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Khu vực
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Giá/đêm
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Tổng tiền
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Nhận phòng
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Trả phòng
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                bookingStatus
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Hành động
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookedRooms.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
                  sx={{ color: "#bdbdbd", py: 6 }}
                >
                  Bạn chưa đặt phòng nào.
                </TableCell>
              </TableRow>
            ) : (
              bookedRooms.map((room) => (
                <TableRow
                  key={room.bookingId}
                  sx={{
                    background: "#18191a",
                    "&:hover": { background: "#232323" },
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/property/${room.listingId}`)}
                >
                  <TableCell>
                    <Avatar
                      variant="rounded"
                      src={
                        room.primaryUrl
                          ? room.primaryUrl.startsWith("http")
                            ? room.primaryUrl
                            : `http://175.41.233.105:8080/${room.primaryUrl}`
                          : "/default-room.jpg"
                      }
                      alt={room.title}
                      sx={{ width: 56, height: 56 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 500 }}>
                    {room.title}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>{room.address}</TableCell>
                  <TableCell sx={{ color: "#fff" }}>{room.city}</TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.price ? room.price.toLocaleString() : ""} VND
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.totalPrice ? room.totalPrice.toLocaleString() : ""}{" "}
                    VND
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.checkInDate}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.checkOutDate}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={room.bookingStatus}
                      sx={{
                        fontWeight: 600,
                        color: "#fff",
                        bgcolor:
                          room.bookingStatus &&
                          room.bookingStatus.trim().toUpperCase() === "PENDING"
                            ? "#fbc02d"
                            : room.bookingStatus &&
                              room.bookingStatus.trim().toUpperCase() ===
                                "CONFIRMED"
                            ? "#1976d2"
                            : room.bookingStatus &&
                              room.bookingStatus.trim().toUpperCase() === "PAID"
                            ? "#43a047"
                            : room.bookingStatus &&
                              room.bookingStatus.trim().toUpperCase() ===
                                "CANCELLED"
                            ? "#d32f2f"
                            : room.bookingStatus &&
                              room.bookingStatus.trim().toUpperCase() ===
                                "SUCCESS"
                            ? "#1976d2"
                            : "#757575",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {room.bookingStatus &&
                        room.bookingStatus.trim().toUpperCase() === "PAID" && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CheckIcon />}
                            sx={{
                              borderRadius: 99,
                              borderColor: "#43a047",
                              color: "#43a047",
                              fontWeight: 700,
                              fontSize: 13,
                              px: 2,
                              py: 0.5,
                              minWidth: 0,
                              background: "rgba(67, 160, 71, 0.08)",
                              transition: "all 0.2s",
                              "&:hover": {
                                background: "#43a047",
                                color: "#fff",
                                borderColor: "#43a047",
                              },
                            }}
                            disabled={loading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmCheckout(room.bookingId);
                            }}
                          >
                            Xác nhận trả phòng
                          </Button>
                        )}
                      {room.bookingStatus &&
                        room.bookingStatus.trim().toUpperCase() === "SUCCESS" &&
                        room.commented === false && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="large"
                            startIcon={<RateReviewIcon />}
                            sx={{
                              ml: 1,
                              borderRadius: 99,
                              borderColor: "#1976d2",
                              color: "#1976d2",
                              fontWeight: 700,
                              fontSize: 16,
                              px: 3,
                              py: 1.5,
                              minWidth: 0,
                              background: "rgba(25, 118, 210, 0.08)",
                              transition: "all 0.2s",
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              lineHeight: 1.2,
                              "&:hover": {
                                background: "#1976d2",
                                color: "#fff",
                                borderColor: "#1976d2",
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookingForReview(room);
                              setOpenReviewDialog(true);
                            }}
                          >
                            Đánh Giá
                          </Button>
                        )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  const renderFavoriteRooms = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 900, fontSize: 32 }}>
        Danh sách phòng yêu thích
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ background: "#232323", borderRadius: 3 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#232323" }}>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Ảnh</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Tên chỗ ở
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Địa chỉ
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Khu vực
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Giá/đêm
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Chủ sở hữu
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                Hành động
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {favoriteRooms.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ color: "#bdbdbd", py: 6 }}
                >
                  Bạn chưa thêm phòng nào vào danh sách yêu thích.
                </TableCell>
              </TableRow>
            ) : (
              favoriteRooms.map((room) => (
                <TableRow
                  key={room.id}
                  sx={{
                    background: "#18191a",
                    "&:hover": { background: "#232323" },
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/property/${room.id}`)}
                >
                  <TableCell>
                    <Avatar
                      variant="rounded"
                      src={
                        room.primaryUrl
                          ? room.primaryUrl.startsWith("http")
                            ? room.primaryUrl
                            : `http://175.41.233.105:8080/${room.primaryUrl}`  
                          : "/default-room.jpg"
                      }
                      alt={room.title}
                      sx={{ width: 56, height: 56 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 500 }}>
                    {room.title}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.address || "-"}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.city || "-"}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.price ? room.price.toLocaleString() : ""} VND
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {room.owner || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="error"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFavorite(room.id);
                      }}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2,
                        background: "#b71c1c",
                        "&:hover": { background: "#c62828" },
                      }}
                    >
                      Bỏ yêu thích
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  const renderMessages = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Tin nhắn với chủ nhà
      </Typography>
      {messages.length === 0 ? (
        <Typography color="text.secondary">
          Bạn chưa có tin nhắn nào.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {messages.map((message) => (
            <Paper key={message.id} sx={{ p: 2 }}>
              <Typography variant="subtitle1">{message.hostName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {message.lastMessage}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {message.timestamp}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          py: 8,
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
        }}
      >
        <Typography variant="h4" sx={{ mb: 5 }}>
          Thông tin cá nhân
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<EditIcon />}
              label="Chỉnh sửa thông tin"
              iconPosition="start"
            />
            <Tab
              icon={<HotelIcon />}
              label="Phòng đã đặt"
              iconPosition="start"
            />
            <Tab
              icon={<FavoriteIcon />}
              label="Yêu thích"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={messages.length} color="error">
                  <MessageIcon />
                </Badge>
              }
              label="Tin nhắn"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {currentTab === 0 && renderEditProfile()}
        {currentTab === 1 && renderBookedRooms()}
        {currentTab === 2 && renderFavoriteRooms()}
        {currentTab === 3 && renderMessages()}
      </Box>
      {/* Dialog đánh giá */}
      <Dialog
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <span style={{ fontSize: 28, color: "#FFD600" }}>⭐</span> Đánh giá
          của khách
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, p: 2, bgcolor: "#18191a", borderRadius: 2 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 18,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 22, color: "#FFD600" }}>⭐</span> Đánh
              giá từng tiêu chí
            </Typography>
            <Grid container spacing={2}>
              {criteriaList.map((c) => (
                <Grid item xs={12} sm={6} key={c.key}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      bgcolor: "#232323",
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <span style={{ fontSize: 15, color: "#fff", minWidth: 90 }}>
                      {c.label}
                    </span>
                    <Rating
                      value={criteriaRatings[c.key]}
                      onChange={(_, v) =>
                        setCriteriaRatings((r) => ({ ...r, [c.key]: v }))
                      }
                      size="medium"
                      sx={{ ml: "auto" }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "#18191a",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 16, color: "#bdbdbd" }}>
              Số sao tổng quát:{" "}
            </span>
            <span style={{ color: "#2196F3", fontWeight: 600, fontSize: 18 }}>
              {calcAvgRating()}
            </span>
            <span style={{ color: "#bdbdbd" }}>/5</span>
          </Box>
          <Box sx={{ mb: 3, p: 2, bgcolor: "#18191a", borderRadius: 2 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 16,
                mb: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 20 }}>✍️</span> Để lại bình luận & đánh
              giá
            </Typography>
            <TextField
              label="Chia sẻ trải nghiệm của bạn..."
              multiline
              minRows={3}
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm((f) => ({ ...f, comment: e.target.value }))
              }
              fullWidth
              sx={{
                mt: 1,
                bgcolor: "#232323",
                borderRadius: 2,
                input: { color: "#fff" },
                textarea: { color: "#fff" },
              }}
            />
            <Button variant="outlined" component="label" sx={{ mt: 2 }}>
              {reviewForm.image ? reviewForm.image.name : "Chọn ảnh (tùy chọn)"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  setReviewForm((f) => ({ ...f, image: e.target.files[0] }))
                }
              />
            </Button>
          </Box>
          {reviewError && <Alert severity="error">{reviewError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenReviewDialog(false)}
            disabled={reviewLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            color="primary"
            disabled={reviewLoading}
          >
            {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

UserProfile.propTypes = {
  properties: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default UserProfile;
