import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Stack,
  IconButton,
  Badge,
  Container,
  Grid,
  Avatar,
  Button,
  TextField,
  Menu,
  MenuItem,
  Divider,
  Alert,
  
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  Dashboard as DashboardIcon,
  Report as ReportIcon,
  SupportAgent as SupportAgentIcon,
  Settings as SettingsIcon,
  Extension as ExtensionIcon,
  Category as CategoryIcon,
  BookOnline as BookOnlineIcon,
  Public as PublicIcon,
  HowToReg as RequestPageIcon,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import axiosInstance from "../api/axiosConfig";

import AdminDashboard from "../section/admin/dashboard";
import AdminUsers from "../section/admin/users";
import AdminHostRequest from "../section/admin/hostRequest";
import AdminProperties from "../section/admin/properties";
// import AdminTransactions from "../section/admin/transactions";
import AdminReports from "../section/admin/reports";
import AdminSupports from "../section/admin/supports";
// import AdminSystem from "../section/admin/system";
import AdminAmenities from "../section/admin/amenities";
import AdminCategories from "../section/admin/categories";
import AdminBookings from "../section/admin/bookings";
import AdminCountries from "../section/admin/countries";


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
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [listingCount, setListingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

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

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const stats = [
    {
      title: "Người dùng",
      value: userCount,
      icon: <PeopleIcon />,
      color: "success.main",
    },
    {
      title: "Giao dịch",
      value: transactionCount,
      icon: <ReceiptIcon />,
      color: "info.main",
    },
    {
      title: "Chỗ ở",
      value: listingCount,
      icon: <HomeIcon />,
      color: "warning.main",
    },
    {
      title: "Tổng doanh thu",
      value: `₫${totalRevenue.toLocaleString("vi-VN")}`,
      icon: <MoneyIcon />,
      color: "primary.main",
    },
  ];

  const tabIcons = [
    <DashboardIcon />, 
    <PeopleIcon />,
    <RequestPageIcon />,
    <HomeIcon />, 
    // <ReceiptIcon />,
    <ReportIcon />,
    <SupportAgentIcon />,
    // <SettingsIcon />, 
    <ExtensionIcon />, 
    <CategoryIcon />, 
    <BookOnlineIcon />,
    <PublicIcon />,
    
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{ p: 3, mb: 3, bgcolor: "background.default" }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>
                Trang Quản Trị
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Theo dõi & quản lý toàn bộ hệ thống
              </Typography>
            </Grid>
            {/* <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <IconButton>
                  <Badge badgeContent={5} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                <Button
                  variant="contained"
                  startIcon={<FilterIcon />}
                  onClick={handleMenuOpen}
                >
                  Lọc
                </Button>
              </Stack>
            </Grid> */}
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{ p: 2, mb: 3, bgcolor: "background.default" }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* <Grid item xs={12}> */}
              {/* <TextField
                fullWidth
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              /> */}
            {/* </Grid> */}
          </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} md={3} key={index}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: stat.color }}>{stat.icon}</Avatar>
                  <Box>
                    <Typography variant="h6">{stat.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin-tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={tabIcons[0]} label="Tổng quan" />
            <Tab icon={tabIcons[1]} label="Người dùng" />
            <Tab icon={tabIcons[2]} label="Yêu cầu host" />
            <Tab icon={tabIcons[3]} label="Chỗ ở" />
            {/* <Tab icon={tabIcons[4]} label="Giao dịch" /> */}
            <Tab icon={tabIcons[4]} label="Báo cáo" />
            <Tab icon={tabIcons[5]} label="Hỗ trợ" />
            {/* <Tab icon={tabIcons[7]} label="Hệ thống" /> */}
            <Tab icon={tabIcons[6]} label="Tiện nghi" />
            <Tab icon={tabIcons[7]} label="Danh mục" />
            <Tab icon={tabIcons[8]} label="Đơn đặt phòng" />
            <Tab icon={tabIcons[9]} label="Quốc gia" />
            
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
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
            <AdminProperties />
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
          
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Tất cả</MenuItem>
        <MenuItem onClick={handleMenuClose}>Hôm nay</MenuItem>
        <MenuItem onClick={handleMenuClose}>Tuần này</MenuItem>
        <MenuItem onClick={handleMenuClose}>Tháng này</MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>Tùy chỉnh</MenuItem>
      </Menu>

      {showSuccessAlert && (
        <Alert
          severity="success"
          onClose={() => setShowSuccessAlert(false)}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000 }}
        >
          Thao tác thành công!
        </Alert>
      )}
    </Container>
  );
}
