import BookedRooms from "@/features/profile/components/BookedRooms.jsx";
import FavoriteRooms from "@/features/profile/components/FavoriteRooms.jsx";
import { BACKEND_URL } from "@/shared/config/environment.js";
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
  Checkbox,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  Message as MessageIcon,
  Hotel as HotelIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  Translate as TranslateIcon,
} from "@mui/icons-material";
import axiosInstance from "@/shared/api/httpClient.js";
import PropTypes from "prop-types";
import SendIcon from "@mui/icons-material/Send";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import Rating from "@mui/material/Rating";
import { analyzeSentiment } from "@/features/reviews/api/sentimentAnalysis.js";
import { summarizeReviewComment } from "@/features/reviews/api/summarizeReview.js";

const UserProfile = () => {
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
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [bookingsReload, setBookingsReload] = useState(0);
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
  const [summarizingComment, setSummarizingComment] = useState(false);
  const [reviewSummaryResult, setReviewSummaryResult] = useState(null);
  const [summarizeCommentError, setSummarizeCommentError] = useState("");
  const [countryOptions, setCountryOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [selectedHostLanguages, setSelectedHostLanguages] = useState([]);
  const [hostRequestSubmitting, setHostRequestSubmitting] = useState(false);

  const handleSummarizeUserComment = async () => {
    const commentText = (reviewForm.comment || "").trim();
    if (!commentText) {
      setSummarizeCommentError("Vui lòng nhập nội dung bình luận trước khi tóm tắt.");
      return;
    }
    setSummarizingComment(true);
    setSummarizeCommentError("");
    try {
      const result = await summarizeReviewComment(commentText);
      setReviewSummaryResult(result);
    } catch (err) {
      setSummarizeCommentError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tóm tắt bình luận lúc này."
      );
    } finally {
      setSummarizingComment(false);
    }
  };

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


  useEffect(() => {
    if (currentTab !== 1) return undefined;
    const controller = new AbortController();
    setBookingsLoading(true);
    setBookingsError("");
    const fetchBookedRooms = async () => {
      try {
        const res = await axiosInstance.get("/api/bookings/my", { signal: controller.signal });
        if (!Array.isArray(res.data?.result)) throw new Error("Invalid booking response");
        if (!controller.signal.aborted) setBookedRooms(res.data.result);
      } catch {
        if (!controller.signal.aborted) setBookingsError("Không thể tải phòng đã đặt. Vui lòng thử lại.");
      } finally {
        if (!controller.signal.aborted) setBookingsLoading(false);
      }
    };
    fetchBookedRooms();
    return () => controller.abort();
  }, [currentTab, bookingsReload]);

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
    if (hostRequestError) {
      setHostRequestError("");
    }
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
    fullname,
    country,
    language,
    languageIds,
    didHostYear,
    experience,
    description,
  }) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id)
      throw new Error("Không tìm thấy thông tin người dùng");
    const payload = {
      userId: user.id,
      fullname,
      country,
      language,
      languageIds,
      didHostYear,
      experience,
      description,
    };
    return axiosInstance.post("/api/users/host/apply", payload);
  };

  const handleHostRequestSubmit = async (e) => {
    e.preventDefault();
    setHostRequestError("");
    setHostRequestSuccess(false);

    if (!hostRequestData.fullname?.trim()) {
      setHostRequestError("Vui lòng nhập họ và tên.");
      return;
    }
    if (!hostRequestData.description?.trim()) {
      setHostRequestError("Vui lòng nhập mô tả bản thân hoặc đội nhóm.");
      return;
    }
    if (selectedHostLanguages.length === 0) {
      setHostRequestError("Vui lòng chọn ít nhất một ngôn ngữ có thể giao tiếp.");
      return;
    }
    if (!hostRequestData.address?.trim()) {
      setHostRequestError("Vui lòng chọn quốc gia.");
      return;
    }
    if (!hostRequestData.experience?.trim()) {
      setHostRequestError("Vui lòng nhập kinh nghiệm đón tiếp hoặc vận hành chỗ ở.");
      return;
    }

    try {
      setHostRequestSubmitting(true);
      const languageNames = selectedHostLanguages
        .map((item) => item.name)
        .filter(Boolean);
      const languageIds = selectedHostLanguages
        .map((item) => item.id)
        .filter((id) => typeof id === "number");

      const res = await applyHostRequest({
        fullname: hostRequestData.fullname.trim(),
        country: hostRequestData.address.trim(),
        language: languageNames.join(", "),
        languageIds,
        didHostYear: hostRequestData.experience.trim(),
        experience: hostRequestData.experience.trim(),
        description: hostRequestData.description.trim(),
      });
      console.log("Kết quả trả về từ API apply host:", res.data);
      setHostRequestSuccess(true);
      setTimeout(() => setHostRequestSuccess(false), 3500);
      setSelectedHostLanguages([]);
      setHostRequestData({
        fullname: formData.fullname || hostRequestData.fullname.trim(),
        description: "",
        languages: "",
        address: "",
        experience: "",
        avatar: null,
      });
      setHostRequestPreview(formData.thumnailUrl || "");
    } catch (err) {
      setHostRequestError(
        err.response?.data?.message ||
          err.message ||
          "Gửi yêu cầu thất bại, vui lòng thử lại."
      );
    } finally {
      setHostRequestSubmitting(false);
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
    const socket = new SockJS((BACKEND_URL + "/ws"));
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
    <>
      <BookedRooms rooms={bookedRooms} error={error} success={success} loading={loading}
        fetching={bookingsLoading} loadError={bookingsError} onReload={() => setBookingsReload((value) => value + 1)}
        onConfirmCheckout={handleConfirmCheckout}
        onReview={(room) => { setSelectedBookingForReview(room); setOpenReviewDialog(true); }} />
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
          <Box sx={{ mb: 3, p: 2, bgcolor: "background.neutral", borderRadius: 2 }}>
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
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <Box component="span" sx={{ fontSize: 15, color: "text.primary", minWidth: 90 }}>
                      {c.label}
                    </Box>
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
              bgcolor: "background.neutral",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Box component="span" sx={{ fontSize: 16, color: "text.secondary" }}>
              Số sao tổng quát:{" "}
            </Box>
            <span style={{ color: "#2196F3", fontWeight: 600, fontSize: 18 }}>
              {calcAvgRating()}
            </span>
            <Box component="span" sx={{ color: "text.secondary" }}>/5</Box>
          </Box>
          <Box sx={{ mb: 3, p: 2, bgcolor: "background.neutral", borderRadius: 2 }}>
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
                bgcolor: "background.paper",
                borderRadius: 2,
                input: { color: "text.primary" },
                textarea: { color: "text.primary" },
              }}
            />
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
              sx={{ mt: 2 }}
            >
              <Button variant="outlined" component="label">
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
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSummarizeUserComment}
                disabled={summarizingComment || !reviewForm.comment?.trim()}
              >
                {summarizingComment ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Đang tóm tắt...
                  </>
                ) : (
                  "✨ Tóm tắt bình luận"
                )}
              </Button>
            </Stack>
            {summarizeCommentError && (
              <Alert
                severity="warning"
                sx={{ mt: 1.5 }}
                onClose={() => setSummarizeCommentError("")}
              >
                {summarizeCommentError}
              </Alert>
            )}
            {reviewSummaryResult && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  border: "1px solid rgba(33, 150, 243, 0.5)",
                }}
              >
                <Typography
                  sx={{ fontWeight: 700, fontSize: 14, color: "#64b5f6", mb: 1 }}
                >
                  ✨ Bản tóm tắt từ AI:
                </Typography>
                <Typography sx={{ color: "text.primary", fontSize: 14, lineHeight: 1.6 }}>
                  {reviewSummaryResult.summary}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setReviewForm((f) => ({
                        ...f,
                        comment: reviewSummaryResult.summary,
                      }));
                      setReviewSummaryResult(null);
                    }}
                  >
                    Dùng bản tóm tắt này
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setReviewSummaryResult(null)}
                    sx={{ color: "text.secondary" }}
                  >
                    Đóng
                  </Button>
                </Stack>
              </Box>
            )}
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
    </>
  );

  const renderFavoriteRooms = () => <FavoriteRooms />;

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
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={languageOptions}
            value={selectedHostLanguages}
            onChange={(_, newValue) => {
              if (hostRequestError) {
                setHostRequestError("");
              }
              setSelectedHostLanguages(newValue);
              setHostRequestData((prev) => ({
                ...prev,
                languages: newValue.map((item) => item.name).join(", "),
              }));
            }}
            getOptionLabel={(option) => option?.name || ""}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            noOptionsText="Chưa có ngôn ngữ khả dụng"
            renderOption={(optionProps, option, { selected }) => (
              <li {...optionProps} key={option.id ?? option.name}>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ width: "100%" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: selected ? 600 : 400 }}>
                    {option.name}
                  </Typography>
                  {option.code && (
                    <Chip
                      label={option.code.toUpperCase()}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                    />
                  )}
                </Stack>
              </li>
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id ?? option.name}
                  icon={<TranslateIcon sx={{ fontSize: "16px !important" }} />}
                  label={
                    option.code
                      ? `${option.name} (${option.code.toUpperCase()})`
                      : option.name
                  }
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ngôn ngữ có thể giao tiếp"
                placeholder={
                  selectedHostLanguages.length === 0
                    ? "Chọn một hoặc nhiều ngôn ngữ..."
                    : "Thêm ngôn ngữ..."
                }
                helperText="Chọn các ngôn ngữ bạn có thể sử dụng để hỗ trợ khách lưu trú"
                fullWidth
                sx={{ bgcolor: "background.paper" }}
              />
            )}
          />
          <Autocomplete
            options={countryOptions}
            value={hostRequestData.address || null}
            onChange={(_, newValue) => {
              if (hostRequestError) {
                setHostRequestError("");
              }
              setHostRequestData((prev) => ({
                ...prev,
                address: newValue || "",
              }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Quốc gia"
                placeholder="Chọn quốc gia..."
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
            label="Kinh nghiệm (VD: 2 năm quản lý căn hộ ngắn hạn, 5 năm ngành khách sạn...)"
            value={hostRequestData.experience}
            onChange={handleHostRequestChange}
            multiline
            minRows={2}
          />
          <Button
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            disabled={hostRequestSubmitting}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {hostRequestSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
        </Stack>
      </form>
    </Card>
  );

  useEffect(() => {
    axiosInstance
      .get("/api/countries")
      .then((res) => {
        setCountryOptions((res.data?.result || []).map((c) => c.name));
      })
      .catch(() => setCountryOptions([]));

    axiosInstance
      .get("/api/languages")
      .then((res) => {
        setLanguageOptions(res.data?.result || []);
      })
      .catch(() => setLanguageOptions([]));
  }, []);

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          py: { xs: 3, md: 4 },
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
        }}
      >
        <Typography variant="h4" sx={{ mb: 3 }}>
          Thông tin cá nhân
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="Các mục tài khoản"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
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
