import { useState, useEffect, useRef } from "react";
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
  Grid,
  Paper,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  Message as MessageIcon,
  Hotel as HotelIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  RateReview as RateReviewIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosConfig";
import PropTypes from "prop-types";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import SendIcon from "@mui/icons-material/Send";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import CheckIcon from "@mui/icons-material/Check";
import Rating from "@mui/material/Rating";
import { analyzeSentiment } from "../api/sentimentAnalysis";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [hostRequestData, setHostRequestData] = useState({
    fullname: "",
    description: "",
    languages: "",
    address: "",
    experience: "",
    avatar: null,
  });
  const [hostRequestPreview, setHostRequestPreview] = useState("");
  const [hostRequestSuccess, setHostRequestSuccess] = useState(false);
  const [hostRequestError, setHostRequestError] = useState("");
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const stompClient = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
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
  const [countryOptions, setCountryOptions] = useState([]);

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
  const calcAvgRating = () => {
    const arr = Object.values(criteriaRatings);
    const filled = arr.filter((v) => v > 0);
    if (filled.length === 0) return 0;
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  };

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
          setHostRequestData((prev) => ({
            ...prev,
            fullname: userData.fullname || "",
          }));
          setHostRequestPreview(userData.thumnailUrl || "");
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
        console.log("favoriteRooms", res.data.result.favorites);
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

  const handleHostRequestChange = (e) => {
    const { name, value } = e.target;
    setHostRequestData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHostRequestFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHostRequestData((prev) => ({ ...prev, avatar: file }));
      setHostRequestPreview(URL.createObjectURL(file));
    }
  };

  const applyHostRequest = async ({
    country,
    language,
    didHostYear,
    description,
  }) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id)
      throw new Error("Không tìm thấy thông tin người dùng");
    const payload = {
      userId: user.id,
      country,
      language,
      didHostYear,
      description,
    };
    return axiosInstance.post("/api/users/host/apply", payload);
  };

  const handleHostRequestSubmit = async (e) => {
    e.preventDefault();
    setHostRequestError("");
    setHostRequestSuccess(false);

    // Validate
    if (
      !hostRequestData.fullname ||
      !hostRequestData.description ||
      !hostRequestData.languages ||
      !hostRequestData.experience
    ) {
      setHostRequestError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      // Gọi API apply host
      const res = await applyHostRequest({
        country: hostRequestData.address,
        language: hostRequestData.languages,
        didHostYear: hostRequestData.experience,
        description: hostRequestData.description,
      });
      console.log("Kết quả trả về từ API apply host:", res.data);
      setHostRequestSuccess(true);
      setTimeout(() => setHostRequestSuccess(false), 3000);
      setHostRequestData({
        fullname: "",
        description: "",
        languages: "",
        address: "",
        experience: "",
        avatar: null,
      });
      setHostRequestPreview("");
    } catch (err) {
      setHostRequestError(
        err.response?.data?.message || "Gửi yêu cầu thất bại, vui lòng thử lại."
      );
    }
  };

  // Lấy danh sách người đã chat
  useEffect(() => {
    axiosInstance.get("/api/chat/persons").then((res) => {
      setPersons(res.data.result || []);
    });
  }, []);

  // Lấy lịch sử chat khi chọn người
  useEffect(() => {
    if (selectedPerson) {
      axiosInstance.get(`/api/chat/simple/${selectedPerson.id}`).then((res) => {
        setMessages(res.data.result || []);
      });
    }
  }, [selectedPerson]);

  // Kết nối websocket
  useEffect(() => {
    const socket = new SockJS("http://175.41.233.105:8080/ws");
    stompClient.current = Stomp.over(socket);

    stompClient.current.connect(
      { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      () => {
        stompClient.current.subscribe(
          `/user/${user.username}/queue/messages`,
          (msg) => {
            // Khi có tin nhắn mới, tự động reload lại lịch sử chat
            if (selectedPerson) {
              axiosInstance
                .get(`/api/chat/simple/${selectedPerson.id}`)
                .then((res) => {
                  setMessages(res.data.result || []);
                });
            }
          }
        );
      }
    );

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [user.username, selectedPerson]);

  // Gửi tin nhắn
  const handleSend = () => {
    if (!message.trim() || !selectedPerson) return;
    const newMsg = {
      id: Date.now(), // hoặc để undefined, backend sẽ trả về id thật sau
      senderUsername: user.username,
      receiverUsername: selectedPerson.username, // hoặc selectedPerson.fullname nếu backend dùng fullname
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    stompClient.current.send(
      "/app/chat",
      {},
      JSON.stringify({
        senderID: user.id,
        receiverID: selectedPerson.id,
        content: message,
      })
    );
    setMessage("");
  };

  // Thêm hàm xác nhận trả phòng
  const handleConfirmCheckout = async (bookingId) => {
    setLoading(true);
    setError("");
    try {
      // Gửi yêu cầu xác nhận trả phòng
      const res = await axiosInstance.put(`/api/bookings/${bookingId}`, {
        bookingStatus: "SUCCESS",
      });
      if (res.data.code === 200) {
        // Cập nhật lại danh sách phòng đã đặt
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

  const handleSubmitReview = async () => {
    setReviewLoading(true);
    setReviewError("");
    try {
      console.log("Bắt đầu submit review");
      console.log("Review form data:", reviewForm);
      console.log("Criteria ratings:", criteriaRatings);

      // Validate đủ 6 tiêu chí và có bình luận
      if (
        Object.values(criteriaRatings).some((v) => v === 0) ||
        !reviewForm.comment.trim()
      ) {
        console.log("Validation failed");
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
      formData.append(
        "status",
        sentiment ? sentiment.toUpperCase() : "NEUTRAL"
      );
      if (reviewForm.image) formData.append("image", reviewForm.image);

      console.log("FormData trước khi gửi:", {
        comment: reviewForm.comment,
        rating: calcAvgRating(),
        status: sentiment ? sentiment.toUpperCase() : "NEUTRAL",
        hasImage: !!reviewForm.image,
      });

      console.log("Đang gửi request đến API...");
      const response = await axiosInstance.post(
        `/api/listings/reviews/${selectedBookingForReview.bookingId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("Response từ API:", response.data);

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
            </TableRow>
          </TableHead>
          <TableBody>
            {bookedRooms.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
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
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={room.bookingStatus}
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          bgcolor:
                            room.bookingStatus === "PENDING"
                              ? "#fbc02d"
                              : room.bookingStatus === "CONFIRMED"
                              ? "#1976d2"
                              : room.bookingStatus === "PAID"
                              ? "#43a047"
                              : room.bookingStatus === "CANCELLED"
                              ? "#d32f2f"
                              : room.bookingStatus === "SUCCESS"
                              ? "#1976d2"
                              : "#757575",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      />
                      {room.bookingStatus &&
                        room.bookingStatus.trim().toUpperCase() === "PAID" && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CheckIcon />}
                            sx={{
                              ml: 1,
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
                        room.primaryThumnail
                          ? room.primaryThumnail.startsWith("http")
                            ? room.primaryThumnail
                            : `http://175.41.233.105:8080/${room.primaryThumnail}`
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

  const renderHostRequest = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Yêu cầu lên host
      </Typography>
      {hostRequestError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {hostRequestError}
        </Alert>
      )}
      {hostRequestSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Gửi yêu cầu thành công!
        </Alert>
      )}
      <form onSubmit={handleHostRequestSubmit}>
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Avatar
              alt={hostRequestData.fullname || "Avatar"}
              src={hostRequestPreview || "/default-avatar.png"}
              sx={{ width: 100, height: 100, mb: 1 }}
            />
            <Button variant="outlined" component="label" sx={{ mb: 1 }}>
              Chọn ảnh đại diện
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleHostRequestFile}
              />
            </Button>
            {hostRequestData.avatar && (
              <Typography variant="caption" color="text.secondary">
                {hostRequestData.avatar.name}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            name="fullname"
            label="Họ và tên"
            value={hostRequestData.fullname}
            onChange={handleHostRequestChange}
          />
          <TextField
            fullWidth
            name="description"
            label="Mô tả bản thân / Đội nhóm"
            value={hostRequestData.description}
            onChange={handleHostRequestChange}
            multiline
            minRows={3}
          />
          <TextField
            fullWidth
            name="languages"
            label="Ngôn ngữ sử dụng (VD: Tiếng Việt, English, ... )"
            value={hostRequestData.languages}
            onChange={handleHostRequestChange}
          />
          <Autocomplete
            options={countryOptions}
            value={hostRequestData.address || ""}
            onChange={(_, newValue) =>
              setHostRequestData((prev) => ({
                ...prev,
                address: newValue || "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Quốc gia"
                placeholder="Chọn quốc gia..."
                size="small"
                fullWidth
                sx={{ borderRadius: 2, bgcolor: "background.paper" }}
                InputProps={{ ...params.InputProps, sx: { borderRadius: 2 } }}
              />
            )}
            isOptionEqualToValue={(option, val) => option === val}
            autoHighlight
            clearOnEscape
          />
          <TextField
            fullWidth
            name="experience"
            label="Kinh nghiệm (VD: 8 năm Host, 24 năm ngành khách sạn, ... )"
            value={hostRequestData.experience}
            onChange={handleHostRequestChange}
          />
          <Button
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Gửi yêu cầu
          </Button>
        </Stack>
      </form>
    </Card>
  );

  useEffect(() => {
    axiosInstance.get("/api/countries").then((res) => {
      setCountryOptions(res.data.result.map((c) => c.name));
    });
  }, []);

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
            <Tab
              icon={<AdminPanelSettingsIcon />}
              label="Yêu cầu lên host"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {currentTab === 0 && renderEditProfile()}
        {currentTab === 1 && renderBookedRooms()}
        {currentTab === 2 && renderFavoriteRooms()}
        {currentTab === 3 && (
          <Grid container spacing={2}>
            {/* Danh sách chat */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  height: "calc(100vh - 200px)",
                  overflow: "auto",
                  bgcolor: "#18191a",
                }}
              >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm tin nhắn..."
                    InputProps={{
                      startAdornment: (
                        <MessageIcon sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                    sx={{
                      input: { color: "#fff" },
                      "& .MuiOutlinedInput-root": { bgcolor: "#232323" },
                    }}
                  />
                </Box>
                <List>
                  {persons.map((person) => (
                    <ListItem
                      key={person.id}
                      button
                      selected={selectedPerson?.id === person.id}
                      onClick={() => setSelectedPerson(person)}
                      sx={{
                        bgcolor:
                          selectedPerson?.id === person.id
                            ? "#232323"
                            : "inherit",
                        "&:hover": { bgcolor: "#232323" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>{person.fullname?.[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: "#fff" }}>
                            {person.fullname}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: "#bdbdbd" }}>
                            {person.email}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            {/* Cửa sổ chat */}
            <Grid item xs={12} md={8}>
              <Paper
                sx={{
                  height: "calc(100vh - 200px)",
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "#18191a",
                }}
              >
                {/* Header chat */}
                {selectedPerson && (
                  <Box
                    sx={{
                      p: 2,
                      borderBottom: 1,
                      borderColor: "divider",
                      bgcolor: "#232323",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Avatar>{selectedPerson.fullname?.[0]}</Avatar>
                    <Box>
                      <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                        {selectedPerson.fullname}
                      </Typography>
                      <Typography sx={{ color: "#bdbdbd", fontSize: 14 }}>
                        {selectedPerson.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {/* Tin nhắn */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    p: 2,
                    bgcolor: "#18191a",
                  }}
                >
                  <Stack spacing={2}>
                    {messages.map((msg) => (
                      <Box
                        key={msg.id}
                        sx={{
                          display: "flex",
                          justifyContent:
                            msg.senderUsername === user.username
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: "70%",
                            bgcolor:
                              msg.senderUsername === user.username
                                ? "#d32f2f"
                                : "#232323",
                            color: "#fff",
                            p: 2,
                            borderRadius: 3,
                            boxShadow: 1,
                          }}
                        >
                          <Typography variant="body1">{msg.content}</Typography>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.7, display: "block", mt: 0.5 }}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                {/* Input */}
                <Box
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: "divider",
                    bgcolor: "#232323",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconButton>
                    <span role="img" aria-label="attach">
                      📎
                    </span>
                  </IconButton>
                  <IconButton>
                    <span role="img" aria-label="emoji">
                      😊
                    </span>
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    sx={{
                      input: { color: "#fff" },
                      "& .MuiOutlinedInput-root": { bgcolor: "#232323" },
                    }}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleSend}
                    disabled={!message.trim() || !selectedPerson}
                    sx={{ ml: 1, bgcolor: "#d32f2f" }}
                  >
                    Gửi
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        {currentTab === 4 && renderHostRequest()}
      </Box>
    </Container>
  );
};

UserProfile.propTypes = {
  // Xoá dòng này nếu không dùng:
  // properties: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default UserProfile;
