import { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import Logo from "@/shared/components/Logo.jsx";
import axiosInstance from "@/shared/api/httpClient.js";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";

const DESTINATIONS = [
  { label: "TP. Hồ Chí Minh", keyword: "Hồ Chí" },
  { label: "Đà Nẵng", keyword: "Đà Nẵng" },
  { label: "Hà Nội", keyword: "Hà Nội" },
  { label: "Đà Lạt", keyword: "Đà Lạt" },
  { label: "Hội An", keyword: "Hội An" },
  { label: "Nha Trang", keyword: "Nha Trang" },
];

const POLICY_CONTENT = {
  booking: {
    title: "Chính sách đặt phòng & thanh toán",
    paragraphs: [
      "Mọi chỗ nghỉ trên RestNesst hiển thị rõ giá thuê theo từng đêm bằng Việt Nam Đồng (₫) và khoảng ngày sẵn sàng đón khách trước khi bạn xác nhận đặt phòng.",
      "Thanh toán trực tuyến được xử lý qua cổng VNPay hoặc theo phương thức xác nhận trên trang đặt chỗ. Sau khi hoàn tất kỳ nghỉ, khách lưu trú có thể gửi đánh giá thực tế kèm hình ảnh cho chỗ ở.",
    ],
  },
  terms: {
    title: "Điều khoản sử dụng nền tảng",
    paragraphs: [
      "Khách lưu trú cam kết cung cấp thông tin liên hệ chính xác, tuân thủ nội quy riêng của từng homestay, biệt thự hoặc căn hộ và giữ gìn không gian chung.",
      "Chủ nhà (Host) chịu trách nhiệm đăng tải hình ảnh, địa chỉ, diện tích và mức giá trung thực; quản trị viên có quyền tạm ẩn các tin đăng không đáp ứng tiêu chuẩn chất lượng.",
    ],
  },
  privacy: {
    title: "Bảo mật thông tin cá nhân",
    paragraphs: [
      "RestNesst chỉ sử dụng họ tên, email và số điện thoại của bạn để xác thực tài khoản, gửi thông tin đặt phòng và kết nối trao đổi trực tiếp với Chủ nhà.",
      "Phiên đăng nhập được bảo vệ bằng mã xác thực JWT và cơ chế thu hồi phiên an toàn khi bạn đăng xuất khỏi thiết bị.",
    ],
  },
};

const footerItemButtonSx = {
  appearance: "none",
  border: 0,
  background: "none",
  p: 0,
  m: 0,
  minHeight: 32,
  display: "inline-flex",
  alignItems: "center",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "text.secondary",
  textDecoration: "none",
  cursor: "pointer",
  borderRadius: "6px",
  transition: "color 150ms ease",
  "&:hover": {
    color: (theme) =>
      theme.palette.mode === "dark"
        ? theme.palette.primary.light
        : theme.palette.primary.contrastText === "#fff"
        ? theme.palette.primary.dark
        : theme.palette.primary.darker || theme.palette.primary.dark,
    textDecoration: "underline",
    textUnderlineOffset: "4px",
  },
  "&:focus-visible": {
    outline: "3px solid var(--rn-focus-ring, #38BDF8)",
    outlineOffset: "3px",
  },
};

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Footer() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const searchCtx = useContext(SearchContext);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [user, setUser] = useState(() => readStoredUser());
  const [activePolicyKey, setActivePolicyKey] = useState(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const syncUser = () => setUser(readStoredUser());
    window.addEventListener("storage", syncUser);
    window.addEventListener("userProfileUpdated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("userProfileUpdated", syncUser);
    };
  }, [location.pathname]);

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isHostOrAdmin = roles.includes("HOST") || roles.includes("ADMIN");
  const isLoggedIn = Boolean(user && localStorage.getItem("accessToken"));

  const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  };

  const navigateAndScrollTo = (elementId, resetSearch = false) => {
    if (resetSearch && searchCtx?.updateSearchResults) {
      searchCtx.updateSearchResults([], false);
    }
    const performScroll = () => {
      const target = document.getElementById(elementId);
      if (target) {
        target.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: scrollBehavior });
      }
    };

    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(performScroll, 180);
    } else {
      performScroll();
    }
  };

  const handleDestinationClick = async (keyword) => {
    if (location.pathname !== "/") {
      navigate("/");
    }
    try {
      searchCtx?.beginSearch?.();
      const response = await axiosInstance.get("/api/listings/search", {
        params: { keyword },
      });
      if (response.data?.code === 200) {
        searchCtx?.updateSearchResults?.(response.data.result || [], true);
      } else {
        searchCtx?.updateSearchResults?.([], true);
      }
    } catch {
      searchCtx?.failSearch?.(
        "Không thể tải danh sách chỗ ở theo điểm đến đã chọn."
      );
    }
    window.setTimeout(() => {
      const listEl = document.getElementById("danh-sach-phong");
      listEl?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    }, 140);
  };

  const handleHostCta = () => {
    if (isHostOrAdmin) {
      navigate("/host");
    } else if (isLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  const currentYear = new Date().getFullYear();
  const activePolicy = activePolicyKey ? POLICY_CONTENT[activePolicyKey] : null;
  const accentHoverColor = isDark
    ? "primary.light"
    : theme.palette.primary.contrastText === "#fff"
    ? "primary.dark"
    : "primary.darker";
  const trustChipSx = {
    fontWeight: 600,
    color: "text.primary",
    bgcolor: isDark ? alpha("#1E293B", 0.9) : "background.paper",
    border: "1px solid",
    borderColor: "var(--rn-border)",
    "& .MuiChip-icon": {
      color: isDark ? "primary.light" : "primary.main",
    },
  };

  // Trang quản trị dùng chân trang vận hành gọn để không làm dài bảng điều khiển
  if (isAdminRoute) {
    return (
      <Box
        component="footer"
        sx={{
          colorScheme: isDark ? "dark" : "light",
          bgcolor: isDark ? "#0B1120" : "background.paper",
          borderTop: "1px solid",
          borderColor: "var(--rn-border)",
          color: "text.primary",
          py: 2,
          px: { xs: 2, sm: 3, lg: 4 },
          pr: { xs: 9, md: 10 },
          transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            © {currentYear} RestNesst — Hệ thống quản trị lưu trú & đặt phòng trực tuyến.
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              component={RouterLink}
              to="/"
              sx={{ ...footerItemButtonSx, fontSize: "0.8125rem", minHeight: 28 }}
            >
              Trang khách lưu trú
            </Box>
            <Box
              component="button"
              type="button"
              onClick={scrollToTop}
              sx={{ ...footerItemButtonSx, fontSize: "0.8125rem", minHeight: 28 }}
            >
              Lên đầu trang
            </Box>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      component="footer"
      sx={{
        mt: { xs: 5, md: 7 },
        colorScheme: isDark ? "dark" : "light",
        bgcolor: isDark ? "#0B1120" : "#F8FAFC",
        backgroundImage: isDark
          ? "linear-gradient(180deg, #0F172A 0%, #090D16 100%)"
          : "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
        borderTop: "1px solid",
        borderColor: "var(--rn-border)",
        color: "text.primary",
        transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1440,
          mx: "auto",
          px: { xs: 2, sm: 3, lg: 4 },
          pt: { xs: 4, md: 6 },
          pb: { xs: 10, sm: 4 },
        }}
      >
        {/* Dải mời hợp tác Chủ nhà / quản lý chỗ nghỉ */}
        <Box
          sx={{
            mb: { xs: 4, md: 5 },
            p: { xs: 2.5, sm: 3, md: 3.5 },
            borderRadius: 4,
            bgcolor: isDark ? alpha("#1E293B", 0.92) : "background.paper",
            border: "1px solid",
            borderColor: isDark
              ? alpha(theme.palette.primary.main, 0.28)
              : "var(--rn-border)",
            backgroundImage: `radial-gradient(circle at 100% 0%, ${alpha(
              theme.palette.primary.main,
              isDark ? 0.16 : 0.08
            )} 0%, ${alpha(
              theme.palette.secondary.main,
              isDark ? 0.12 : 0.05
            )} 55%, transparent 100%)`,
            boxShadow: "var(--rn-shadow-sm)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2.5}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "13px",
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, isDark ? 0.32 : 0.18),
                  color: isDark ? "primary.light" : "primary.main",
                  display: { xs: "none", sm: "inline-flex" },
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                <HomeWorkOutlinedIcon aria-hidden="true" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.08rem", sm: "1.2rem" },
                    letterSpacing: "-0.015em",
                    color: "text.primary",
                    mb: 0.5,
                  }}
                >
                  {isHostOrAdmin
                    ? "Theo dõi doanh thu & lịch đặt chỗ nghỉ của bạn"
                    : "Biến ngôi nhà hoặc căn hộ trống thành điểm dừng chân đáng nhớ"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: "66ch", lineHeight: 1.6 }}
                >
                  {isHostOrAdmin
                    ? "Cập nhật phòng trống, định vị tọa độ bản đồ và xem biểu đồ hiệu suất đặt phòng ngay trong không gian quản lý dành cho Chủ nhà."
                    : "Đăng tải chỗ ở với giá minh bạch theo đêm, quản lý lịch nhận khách trực quan và kết nối trực tiếp với du khách khắp Việt Nam."}
                </Typography>
              </Box>
            </Stack>

            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={handleHostCta}
              sx={{
                minHeight: 44,
                px: 2.75,
                borderRadius: "12px",
                fontWeight: 700,
                textTransform: "none",
                whiteSpace: "nowrap",
                color: "primary.contrastText",
                boxShadow: "none",
                flexShrink: 0,
                "&:hover": {
                  bgcolor: "primary.dark",
                  color: "#FFFFFF",
                },
              }}
            >
              {isHostOrAdmin
                ? "Mở trang quản lý Chủ nhà"
                : isLoggedIn
                ? "Đăng ký làm Chủ nhà"
                : "Bắt đầu đón khách"}
            </Button>
          </Stack>
        </Box>

        {/* Nội dung chính 4 cột */}
        <Grid container spacing={{ xs: 3.5, md: 4 }}>
          {/* Cột 1: Nhận diện thương hiệu & thông tin liên hệ */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Logo />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1.25, maxWidth: "38ch", lineHeight: 1.65 }}
                >
                  Nền tảng tìm kiếm và đặt homestay, biệt thự, căn hộ nghỉ dưỡng
                  trực tiếp với bản đồ giá trực quan và đánh giá xác thực từ khách
                  đã lưu trú.
                </Typography>
              </Box>

              <Stack spacing={1} sx={{ color: "text.secondary" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PlaceOutlinedIcon
                    aria-hidden="true"
                    sx={{ fontSize: 18, color: isDark ? "primary.light" : "primary.main" }}
                  />
                  <Typography variant="body2">
                    Khu đô thị Hải Châu, TP. Đà Nẵng, Việt Nam
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneInTalkOutlinedIcon
                    aria-hidden="true"
                    sx={{ fontSize: 18, color: isDark ? "primary.light" : "primary.main" }}
                  />
                  <Typography
                    component="a"
                    href="tel:19006868"
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      "&:hover": { color: accentHoverColor, textDecoration: "underline" },
                    }}
                  >
                    1900 6868 (08:00 – 22:00 hàng ngày)
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MailOutlineRoundedIcon
                    aria-hidden="true"
                    sx={{ fontSize: 18, color: isDark ? "primary.light" : "primary.main" }}
                  />
                  <Typography
                    component="a"
                    href="mailto:hotro@restnesst.vn"
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      "&:hover": { color: accentHoverColor, textDecoration: "underline" },
                    }}
                  >
                    hotro@restnesst.vn
                  </Typography>
                </Stack>
              </Stack>

              {/* Nhãn cam kết dịch vụ */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
                <Chip
                  size="small"
                  icon={<PaymentsOutlinedIcon sx={{ fontSize: 16 }} />}
                  label="Thanh toán VNPay"
                  sx={trustChipSx}
                />
                <Chip
                  size="small"
                  icon={<VerifiedUserOutlinedIcon sx={{ fontSize: 16 }} />}
                  label="Đánh giá thực tế"
                  sx={trustChipSx}
                />
                <Chip
                  size="small"
                  icon={<SupportAgentOutlinedIcon sx={{ fontSize: 16 }} />}
                  label="Trợ lý trực tuyến 24/7"
                  sx={trustChipSx}
                />
              </Stack>
            </Stack>
          </Grid>

          {/* Cột 2: Điểm đến phổ biến */}
          <Grid item xs={12} sm={4} md={2.5}>
            <Box component="nav" aria-label="Điểm đến nổi bật">
              <Typography
                component="h3"
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "text.primary", mb: 1.5, fontSize: "0.95rem" }}
              >
                Điểm đến nổi bật
              </Typography>
              <Box
                component="ul"
                role="list"
                sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 0.75 }}
              >
                {DESTINATIONS.map((dest) => (
                  <Box component="li" key={dest.label}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => handleDestinationClick(dest.keyword)}
                      sx={footerItemButtonSx}
                    >
                      {dest.label}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Cột 3: Khám phá & Tài khoản */}
          <Grid item xs={12} sm={4} md={2.75}>
            <Box component="nav" aria-label="Khám phá lưu trú">
              <Typography
                component="h3"
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "text.primary", mb: 1.5, fontSize: "0.95rem" }}
              >
                Khám phá & lưu trú
              </Typography>
              <Box
                component="ul"
                role="list"
                sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 0.75 }}
              >
                <Box component="li">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => navigateAndScrollTo("danh-sach-phong", true)}
                    sx={footerItemButtonSx}
                  >
                    Tất cả chỗ ở sẵn sàng
                  </Box>
                </Box>
                <Box component="li">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => navigateAndScrollTo("ban-do-cho-o", false)}
                    sx={footerItemButtonSx}
                  >
                    Bản đồ giá khám phá
                  </Box>
                </Box>
                {isLoggedIn ? (
                  <Box component="li">
                    <Box
                      component={RouterLink}
                      to="/profile"
                      sx={footerItemButtonSx}
                    >
                      Hồ sơ & lịch sử chuyến đi
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Box component="li">
                      <Box
                        component={RouterLink}
                        to="/login"
                        sx={footerItemButtonSx}
                      >
                        Đăng nhập tài khoản
                      </Box>
                    </Box>
                    <Box component="li">
                      <Box
                        component={RouterLink}
                        to="/signup"
                        sx={footerItemButtonSx}
                      >
                        Đăng ký thành viên mới
                      </Box>
                    </Box>
                  </>
                )}
                <Box component="li">
                  <Box
                    component="button"
                    type="button"
                    onClick={handleHostCta}
                    sx={footerItemButtonSx}
                  >
                    {isHostOrAdmin ? "Không gian dành cho Chủ nhà" : "Trở thành Chủ nhà"}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Cột 4: Hỗ trợ & Chính sách */}
          <Grid item xs={12} sm={4} md={2.75}>
            <Box component="nav" aria-label="Hỗ trợ và chính sách">
              <Typography
                component="h3"
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "text.primary", mb: 1.5, fontSize: "0.95rem" }}
              >
                Hỗ trợ & chính sách
              </Typography>
              <Box
                component="ul"
                role="list"
                sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 0.75 }}
              >
                <Box component="li">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setActivePolicyKey("booking")}
                    sx={footerItemButtonSx}
                  >
                    Chính sách đặt phòng & thanh toán
                  </Box>
                </Box>
                <Box component="li">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setActivePolicyKey("terms")}
                    sx={footerItemButtonSx}
                  >
                    Điều khoản sử dụng
                  </Box>
                </Box>
                <Box component="li">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setActivePolicyKey("privacy")}
                    sx={footerItemButtonSx}
                  >
                    Bảo mật thông tin
                  </Box>
                </Box>
                <Box component="li">
                  <Box
                    component="a"
                    href="mailto:hotro@restnesst.vn?subject=H%E1%BB%97%20tr%E1%BB%A3%20%C4%91%E1%BA%B7t%20ph%C3%B2ng%20RestNesst"
                    sx={footerItemButtonSx}
                  >
                    Gửi yêu cầu hỗ trợ qua email
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 3, md: 4 }, borderColor: "var(--rn-border)" }} />

        {/* Thanh bản quyền & công cụ cuối trang (chừa khoảng trống bên phải cho nút ChatBot nổi) */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.75}
          sx={{ pr: { sm: 8, md: 9 } }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} RestNesst Việt Nam. Đặt phòng trực tiếp, giá hiển thị minh bạch mỗi đêm.
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack
              direction="row"
              spacing={0.6}
              alignItems="center"
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: "999px",
                bgcolor: isDark ? alpha("#1E293B", 0.9) : "background.paper",
                border: "1px solid",
                borderColor: "var(--rn-border)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              <LanguageRoundedIcon
                sx={{ fontSize: 16, color: isDark ? "primary.light" : "primary.main" }}
                aria-hidden="true"
              />
              <span>Tiếng Việt (VI)</span>
              <Box component="span" aria-hidden="true" sx={{ mx: 0.5 }}>
                ·
              </Box>
              <span>₫ VND</span>
            </Stack>

            <Button
              type="button"
              size="small"
              variant="outlined"
              startIcon={<KeyboardArrowUpRoundedIcon fontSize="small" />}
              onClick={scrollToTop}
              sx={{
                minHeight: 34,
                px: 1.5,
                borderRadius: "999px",
                fontWeight: 700,
                textTransform: "none",
                borderColor: "var(--rn-border)",
                bgcolor: isDark ? alpha("#1E293B", 0.9) : "background.paper",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  color: accentHoverColor,
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.06),
                },
              }}
            >
              Đầu trang
            </Button>
          </Stack>
        </Stack>
      </Container>

      {/* Hộp thoại thông tin chính sách minh bạch */}
      <Dialog
        open={Boolean(activePolicy)}
        onClose={() => setActivePolicyKey(null)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="rn-footer-policy-title"
        PaperProps={{
          sx: {
            bgcolor: "var(--rn-surface)",
            backgroundImage: "none",
            border: "1px solid var(--rn-border)",
            borderRadius: 3,
          },
        }}
      >
        {activePolicy && (
          <>
            <DialogTitle
              id="rn-footer-policy-title"
              sx={{ fontWeight: 800, color: "text.primary" }}
            >
              {activePolicy.title}
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "var(--rn-border)" }}>
              <Stack spacing={1.75}>
                {activePolicy.paragraphs.map((text, idx) => (
                  <Typography
                    key={idx}
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {text}
                  </Typography>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.75 }}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                onClick={() => setActivePolicyKey(null)}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  textTransform: "none",
                  color: "primary.contrastText",
                  "&:hover": {
                    bgcolor: "primary.dark",
                    color: "#FFFFFF",
                  },
                }}
              >
                Đã hiểu
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
