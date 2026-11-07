import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  IconButton,
  Container,
  Grid,
  Avatar,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  Dashboard as DashboardIcon,
  Report as ReportIcon,
  SupportAgent as SupportAgentIcon,
  Extension as ExtensionIcon,
  Category as CategoryIcon,
  BookOnline as BookOnlineIcon,
  Public as PublicIcon,
  Translate as TranslateIcon,
  HowToReg as RequestPageIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import axiosInstance from "@/shared/api/httpClient.js";

import AdminDashboard from "@/features/admin/components/Dashboard.jsx";
import AdminUsers from "@/features/admin/components/Users.jsx";
import AdminHostRequest from "@/features/admin/components/HostRequests.jsx";
import AdminProperties from "@/features/admin/components/Properties.jsx";
// import AdminTransactions from "@/features/admin/components/Transactions.jsx";
import AdminReports from "@/features/admin/components/Reports.jsx";
import AdminSupports from "@/features/admin/components/SupportMessages.jsx";
// import AdminSystem from "@/features/admin/components/SystemSettings.jsx";
import AdminAmenities from "@/features/admin/components/Amenities.jsx";
import AdminCategories from "@/features/admin/components/Categories.jsx";
import AdminBookings from "@/features/admin/components/Bookings.jsx";
import AdminCountries from "@/features/admin/components/Countries.jsx";
import AdminLanguages from "@/features/admin/components/Languages.jsx";

function TabPanel({ children, value, index }) {
  return value === index ? <Box>{children}</Box> : null;
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export default function AdminPage() {
  const [tabValue, setTabValue] = useState(0);
  const [listingCount, setListingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchListingCount = async () => {
      try {
        const response = await axiosInstance.get("/api/listings/counts");
        setListingCount(response.data.result);
      } catch (error) {
        setListingCount(0);
      }
    };
    fetchListingCount();
  }, []);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await axiosInstance.get("/api/users/counts");
        setUserCount(response.data.result);
      } catch (error) {
        setUserCount(0);
      }
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    const fetchTransactionCount = async () => {
      try {
        const response = await axiosInstance.get("/api/payment/counts");
        setTransactionCount(response.data.result);
      } catch (error) {
        setTransactionCount(0);
      }
    };
    fetchTransactionCount();
  }, []);

  useEffect(() => {
    const fetchTotalRevenue = async () => {
      try {
        const response = await axiosInstance.get("/api/payment/amount");
        setTotalRevenue(response.data.result || 0);
      } catch (error) {
        setTotalRevenue(0);
      }
    };
    fetchTotalRevenue();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const isOverviewTab = tabValue === 0;

  const stats = [
    {
      title: "Người dùng",
      value: userCount,
      rawValue: userCount,
      icon: <PeopleIcon />,
      color: "success.main",
      accentBg: "rgba(16, 185, 129, 0.12)",
      accentColor: "#059669",
      emptyHint: "Chưa có tài khoản đăng ký mới",
      activeHint: "Tài khoản đang hoạt động",
      trend: "",
    },
    {
      title: "Giao dịch",
      value: transactionCount,
      rawValue: transactionCount,
      icon: <ReceiptIcon />,
      color: "info.main",
      accentBg: "rgba(14, 165, 233, 0.12)",
      accentColor: "#0284C7",
      emptyHint: "Chưa phát sinh giao dịch thanh toán",
      activeHint: "Giao dịch đã ghi nhận",
      trend: "",
    },
    {
      title: "Chỗ ở",
      value: listingCount,
      rawValue: listingCount,
      icon: <HomeIcon />,
      color: "warning.main",
      accentBg: "rgba(245, 158, 11, 0.12)",
      accentColor: "#D97706",
      emptyHint: "Chưa có chỗ ở nào được đăng",
      activeHint: "Phòng & homestay trên hệ thống",
      trend: "",
    },
    {
      title: "Tổng doanh thu",
      value: `₫${totalRevenue.toLocaleString("vi-VN")}`,
      rawValue: totalRevenue,
      icon: <MoneyIcon />,
      color: "primary.main",
      accentBg: "rgba(255, 56, 92, 0.12)",
      accentColor: "#E11D48",
      emptyHint: "Chưa phát sinh doanh thu",
      activeHint: "Tổng doanh thu lũy kế",
      trend: "",
    },
  ];

  const tabIcons = [
    <DashboardIcon key="dashboard" />,
    <PeopleIcon key="people" />,
    <RequestPageIcon key="request" />,
    <HomeIcon key="home" />,
    <ReportIcon key="report" />,
    <SupportAgentIcon key="support" />,
    <ExtensionIcon key="amenities" />,
    <CategoryIcon key="categories" />,
    <BookOnlineIcon key="bookings" />,
    <PublicIcon key="countries" />,
    <TranslateIcon key="languages" />,
  ];

  const sidebarGroups = [
    {
      groupLabel: "Tổng quan & Phân tích",
      items: [
        { index: 0, label: "Tổng quan", icon: tabIcons[0] },
        { index: 4, label: "Báo cáo & Thống kê", icon: tabIcons[4] },
      ],
    },
    {
      groupLabel: "Người dùng & Đối tác",
      items: [
        { index: 1, label: "Người dùng", icon: tabIcons[1] },
        { index: 2, label: "Yêu cầu lên Host", icon: tabIcons[2] },
      ],
    },
    {
      groupLabel: "Quản lý nội dung",
      items: [
        { index: 3, label: "Chỗ ở", icon: tabIcons[3] },
        { index: 6, label: "Tiện nghi", icon: tabIcons[6] },
        { index: 7, label: "Danh mục", icon: tabIcons[7] },
        { index: 9, label: "Quốc gia", icon: tabIcons[9] },
        { index: 10, label: "Ngôn ngữ", icon: tabIcons[10] },
      ],
    },
    {
      groupLabel: "Vận hành & Hỗ trợ",
      items: [
        { index: 8, label: "Đơn đặt phòng", icon: tabIcons[8] },
        { index: 5, label: "Hỗ trợ khách hàng", icon: tabIcons[5] },
      ],
    },
  ];

  const activeNavItem =
    sidebarGroups
      .flatMap((group) => group.items)
      .find((item) => item.index === tabValue) || sidebarGroups[0].items[0];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${activeNavItem.label} | RestNesst Admin`;
    return () => {
      document.title = previousTitle;
    };
  }, [activeNavItem.label]);

  const renderSidebarContent = (isMobile = false) => (
    <Box
      component="nav"
      aria-label="Điều hướng trang quản trị"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        py: 2.5,
        px: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1, pb: 2, mb: 1.5, borderBottom: "1px solid var(--admin-border)" }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: "rgba(255, 56, 92, 0.12)",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DashboardIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "var(--admin-text-primary)", lineHeight: 1.2 }}
            >
              Bảng điều khiển
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--admin-text-secondary)" }}>
              RestNesst Admin
            </Typography>
          </Box>
        </Stack>
        {isMobile && (
          <IconButton
            aria-label="Đóng menu quản trị"
            size="small"
            onClick={() => setMobileOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {sidebarGroups.map((group) => (
          <Box key={group.groupLabel} sx={{ mb: 2.25 }}>
            <Typography
              variant="overline"
              sx={{
                px: 1.5,
                 mb: 0.5,
                display: "block",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--admin-text-secondary)",
              }}
            >
              {group.groupLabel}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => {
                const isSelected = tabValue === item.index;
                return (
                  <ListItemButton
                    key={item.index}
                    selected={isSelected}
                    aria-current={isSelected ? "page" : undefined}
                    onClick={(event) => {
                      handleTabChange(event, item.index);
                      if (isMobile) setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      py: 1,
                      px: 1.5,
                      transition: "all 0.16s ease",
                      color: isSelected ? "primary.main" : "var(--admin-text-primary)",
                      bgcolor: isSelected
                        ? "rgba(255, 56, 92, 0.1)"
                        : "transparent",
                      "&.Mui-selected": {
                        bgcolor: "rgba(255, 56, 92, 0.1)",
                        color: "primary.main",
                        "&:hover": {
                          bgcolor: "rgba(255, 56, 92, 0.14)",
                        },
                      },
                      "&:hover": {
                        bgcolor: "var(--rn-surface-subtle)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isSelected ? "primary.main" : "var(--admin-text-secondary)",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    />
                    {isSelected && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                        }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        "--admin-bg": "var(--rn-bg)",
        "--admin-surface": "var(--rn-surface)",
        "--admin-border": "var(--rn-border)",
        "--admin-text-primary": "var(--rn-text-primary)",
        "--admin-text-secondary": "var(--rn-text-secondary)",
        "--admin-radius-lg": "16px",
        "--admin-shadow-sm": "var(--rn-shadow-sm)",
        minHeight: "calc(100dvh - var(--rn-admin-header-height))",
        width: "100%",
        maxWidth: "var(--rn-admin-shell-max-width)",
        mx: "auto",
        px: "var(--rn-admin-shell-gutter)",
        py: { xs: 2.5, md: 3 },
        gap: { lg: 3 },
        alignItems: "flex-start",
        bgcolor: "var(--admin-bg)",
        display: "flex",
      }}
    >
      {/* Sidebar nằm trong cùng khung với header và nội dung */}
      <Box
        component="aside"
        sx={{
          width: 264,
          flexShrink: 0,
          display: { xs: "none", lg: "block" },
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "var(--admin-radius-lg)",
          boxShadow: "var(--admin-shadow-sm)",
          position: "sticky",
          top: "calc(var(--rn-admin-header-height) + 24px)",
          maxHeight: "calc(100dvh - var(--rn-admin-header-height) - 48px)",
          overflowY: "auto",
        }}
      >
        {renderSidebarContent(false)}
      </Box>

      {/* Drawer menu cho mobile & tablet */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            bgcolor: "var(--rn-surface)",
          },
        }}
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* Khu vực nội dung chính */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <Container maxWidth={false} disableGutters>
          {isOverviewTab ? (
            <>
              {/* Tiêu đề & bộ 4 thẻ KPI tổng quan chỉ hiển thị ở mục Tổng quan */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconButton
                    aria-label="Mở menu quản trị"
                    onClick={() => setMobileOpen(true)}
                    sx={{
                      display: { xs: "inline-flex", lg: "none" },
                      border: "1px solid var(--admin-border)",
                      bgcolor: "var(--admin-surface)",
                      borderRadius: 2,
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "1.35rem", sm: "1.65rem" },
                          color: "var(--admin-text-primary)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        Trang Quản Trị
                      </Typography>
                      <Chip
                        size="small"
                        label={activeNavItem.label}
                        sx={{
                          bgcolor: "rgba(255, 56, 92, 0.1)",
                          color: "primary.main",
                          fontWeight: 600,
                          borderRadius: 1.5,
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--admin-text-secondary)", mt: 0.25 }}
                    >
                      Theo dõi chỉ số vận hành & quản lý toàn bộ hệ thống RestNesst
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                {stats.map((stat, index) => {
                  const isZero = Number(stat.rawValue) === 0;
                  return (
                    <Grid item xs={12} sm={6} xl={3} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          height: "100%",
                          borderRadius: "var(--admin-radius-lg)",
                          bgcolor: "var(--admin-surface)",
                          border: "1px solid var(--admin-border)",
                          boxShadow: "var(--admin-shadow-sm)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "transform 0.18s ease, box-shadow 0.18s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="flex-start"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "var(--admin-text-secondary)",
                                fontWeight: 600,
                                mb: 0.75,
                              }}
                            >
                              {stat.title}
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 700,
                                color: isZero
                                  ? "#64748B"
                                  : "var(--admin-text-primary)",
                                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                                lineHeight: 1.2,
                              }}
                            >
                              {stat.value}
                            </Typography>
                          </Box>
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2.5,
                              bgcolor: stat.accentBg,
                              color: stat.accentColor,
                            }}
                          >
                            {stat.icon}
                          </Avatar>
                        </Stack>

                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                          sx={{
                            mt: 2,
                            pt: 1.5,
                            borderTop: "1px dashed var(--admin-border)",
                          }}
                        >
                          {stat.trend ? (
                            <>
                              <TrendingUpIcon
                                sx={{ fontSize: 16, color: "success.main" }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "success.main", fontWeight: 600 }}
                              >
                                {stat.trend}
                              </Typography>
                            </>
                          ) : isZero ? (
                            <>
                              <InfoOutlinedIcon
                                sx={{ fontSize: 15, color: "var(--admin-text-secondary)" }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "var(--admin-text-secondary)", fontWeight: 500 }}
                              >
                                {stat.emptyHint}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <TrendingUpIcon
                                sx={{ fontSize: 15, color: stat.accentColor }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "var(--admin-text-secondary)", fontWeight: 500 }}
                              >
                                {stat.activeHint}
                              </Typography>
                            </>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          ) : (
            /* Thanh mở menu gọn cho thiết bị nhỏ khi ở các mục quản lý riêng */
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                display: { xs: "flex", lg: "none" },
                mb: 2,
              }}
            >
              <IconButton
                aria-label="Mở menu quản trị"
                onClick={() => setMobileOpen(true)}
                sx={{
                  border: "1px solid var(--admin-border)",
                  bgcolor: "var(--admin-surface)",
                  borderRadius: 2,
                }}
              >
                <MenuIcon />
              </IconButton>
              <Chip
                size="small"
                label={activeNavItem.label}
                sx={{
                  bgcolor: "rgba(255, 56, 92, 0.1)",
                  color: "primary.main",
                  fontWeight: 600,
                  borderRadius: 1.5,
                }}
              />
            </Stack>
          )}

          {/* Khung hiển thị nội dung riêng của từng mục */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: "var(--admin-radius-lg)",
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              boxShadow: "var(--admin-shadow-sm)",
              overflow: "hidden",
            }}
          >
            <TabPanel value={tabValue} index={0}>
              <AdminDashboard />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <AdminUsers />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <AdminHostRequest />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <AdminProperties onPropertyCreated={() => setListingCount((count) => count + 1)} />
            </TabPanel>
            {/* <TabPanel value={tabValue} index={4}>
              <AdminTransactions />
            </TabPanel> */}
            <TabPanel value={tabValue} index={4}>
              <AdminReports />
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
              <AdminSupports />
            </TabPanel>
            {/* <TabPanel value={tabValue} index={7}>
              <AdminSystem />
            </TabPanel> */}
            <TabPanel value={tabValue} index={6}>
              <AdminAmenities />
            </TabPanel>
            <TabPanel value={tabValue} index={7}>
              <AdminCategories />
            </TabPanel>
            <TabPanel value={tabValue} index={8}>
              <AdminBookings />
            </TabPanel>
            <TabPanel value={tabValue} index={9}>
              <AdminCountries />
            </TabPanel>
            <TabPanel value={tabValue} index={10}>
              <AdminLanguages />
            </TabPanel>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
