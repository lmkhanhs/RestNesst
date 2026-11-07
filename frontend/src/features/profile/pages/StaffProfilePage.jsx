import BookedRooms from "@/features/profile/components/BookedRooms.jsx";
import FavoriteRooms from "@/features/profile/components/FavoriteRooms.jsx";
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
import axiosInstance from "@/shared/api/httpClient.js";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Rating from "@mui/material/Rating";
import Grid from "@mui/material/Grid";
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
  const [summarizingComment, setSummarizingComment] = useState(false);
  const [reviewSummaryResult, setReviewSummaryResult] = useState(null);
  const [summarizeCommentError, setSummarizeCommentError] = useState("");

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
      <BookedRooms rooms={bookedRooms} error={error} success={success} loading={loading}
        fetching={bookingsLoading} loadError={bookingsError} onReload={() => setBookingsReload((value) => value + 1)}
        onConfirmCheckout={handleConfirmCheckout}
        onReview={(room) => { setSelectedBookingForReview(room); setOpenReviewDialog(true); }} />
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
    </Container>
  );
};

UserProfile.propTypes = {
  properties: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default UserProfile;
