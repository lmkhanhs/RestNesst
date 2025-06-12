import React, { useEffect, useRef, useState } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Reply as ReplyIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import Chart from 'chart.js/auto';
import axiosInstance from "../../api/axiosConfig";
import CircularProgress from '@mui/material/CircularProgress';

export default function AdminDashboard() {
  const summaryChartRef = useRef(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [monthlyUsers, setMonthlyUsers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  const dataSummary = [
    { 
      label: 'Tổng người dùng', 
      value: userCount,
      change: '',
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main'
    },
    { 
      label: 'Tổng giao dịch', 
      value: transactionCount,
      change: '',
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main'
    },
    { 
      label: 'Chỗ ở', 
      value: approvedCount,
      change: '',
      icon: <HomeIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.main'
    },
  ];

  

  const getActionIcon = (type) => {
    switch (type) {
      case 'approve':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'reply':
        return <ReplyIcon sx={{ color: 'info.main' }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const groupByMonth = (data, valueKey) => {
    const result = Array(12).fill(0);
    data.forEach(item => {
      const date = new Date(item.day);
      const month = date.getMonth(); 
      result[month] += item[valueKey] || 0;
    });
    return result
      .map((value, idx) => ({ month: idx, value }))
      .filter(item => item.value > 0);
  };

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoadingSummary(true);
      try {
        const [usersRes, revenueRes] = await Promise.all([
          axiosInstance.get('/api/statistic/users/counts?startDate=2025-01-01&endDate=2025-12-31'),
          axiosInstance.get('/api/statistic/payments/revenue?startDate=2025-01-10&endDate=2025-12-31')
        ]);
        setMonthlyUsers(groupByMonth(usersRes.data.result || [], 'totalUsers'));
        setMonthlyRevenue(groupByMonth(revenueRes.data.result || [], 'sumRevenue'));
      } catch (e) {
        setMonthlyUsers([]);
        setMonthlyRevenue([]);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummaryData();
  }, []);

  const createChart = (ctx, type, data, options, oldChart) => {
    if (!ctx) return null;
    if (oldChart) {
      try { oldChart.destroy(); } catch (e) {}
    }
    try {
      return new Chart(ctx, {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }
      });
    } catch (error) {
      console.error('Error creating chart:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!isCanvasReady) return;
    let summaryChart = null;
    if (summaryChartRef.current) {
      const labels = Array.from({ length: 12 }, (_, i) => `Th${i + 1}`);
      const revenueData = Array.from({ length: 12 }, (_, m) => {
        const found = monthlyRevenue.find(item => item.month === m);
        return found ? Math.round((found.value / 1_000_000) * 10) / 10 : 0;
      });
      const usersData = Array.from({ length: 12 }, (_, m) => {
        const found = monthlyUsers.find(item => item.month === m);
        return found ? found.value : 0;
      });
      summaryChart = createChart(summaryChartRef.current, 'bar', {
        labels,
        datasets: [
          {
            label: 'Doanh thu (triệu VND)',
            data: revenueData,
            backgroundColor: '#42a5f5',
            borderRadius: 5
          },
          {
            label: 'Người dùng mới',
            data: usersData,
            backgroundColor: '#66bb6a',
            borderRadius: 5
          }
        ]
      }, {
        plugins: {
          legend: { 
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: { 
            display: true, 
            text: 'Tổng hợp Giao dịch & Người dùng mới',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      });
    }
    return () => {
      if (summaryChart) summaryChart.destroy();
    };
  }, [isCanvasReady, monthlyUsers, monthlyRevenue]);

  useEffect(() => {
    const checkCanvasReady = () => {
      if (summaryChartRef.current) {
        setIsCanvasReady(true);
      }
    };

    checkCanvasReady();
    const timer = setTimeout(checkCanvasReady, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchApprovedCount = async () => {
      try {
        const res = await axiosInstance.get("/api/listings/counts");
        setApprovedCount(res.data.result);
      } catch (error) {
        setApprovedCount(0);
      }
    };
    fetchApprovedCount();
  }, []);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await axiosInstance.get("/api/users/counts");
        setUserCount(res.data.result);
      } catch (error) {
        setUserCount(0);
      }
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    const fetchTransactionCount = async () => {
      try {
        const res = await axiosInstance.get("/api/payment/counts");
        setTransactionCount(res.data.result);
      } catch (error) {
        setTransactionCount(0);
      }
    };
    fetchTransactionCount();
  }, []);

  return (
    <Box sx={{ height: '100%', width: '100%', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          BẢNG ĐIỀU KHIỂN ADMIN
        </Typography>
        <Tooltip title="Làm mới">
          <IconButton onClick={() => isCanvasReady && initializeCharts()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
        {dataSummary.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography color="text.secondary" gutterBottom>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                      {item.value}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      {item.change.startsWith('+') ? (
                        <ArrowUpwardIcon sx={{ color: 'success.main', fontSize: 16 }} />
                      ) : (
                        <ArrowDownwardIcon sx={{ color: 'error.main', fontSize: 16 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: item.change.startsWith('+') ? 'success.main' : 'error.main'
                        }}
                      >
                        {item.change}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {item.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            {loadingSummary ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: 1 }}>
                <CircularProgress />
              </Stack>
            ) : (
              <canvas ref={summaryChartRef}></canvas>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Hoạt động gần đây
          </Typography>
          <Chip 
            label="Xem tất cả" 
            color="primary" 
            variant="outlined"
            clickable
          />
        </Stack>
        <List>
          {recentActions.map((action, index) => (
            <React.Fragment key={action.id}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {action.time}
                    </Typography>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {action.user.charAt(0)}
                    </Avatar>
                  </Stack>
                }
              >
                <ListItemIcon>
                  {getActionIcon(action.type)}
                </ListItemIcon>
                <ListItemText 
                  primary={action.message}
                  secondary={action.user}
                />
              </ListItem>
              {index < recentActions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper> */}
    </Box>
  );
}
