import React, { useEffect, useRef, useState } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Skeleton,
  Button
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
  BarChartOutlined as BarChartOutlinedIcon,
  HistoryToggleOff as HistoryToggleOffIcon
} from '@mui/icons-material';
import Chart from 'chart.js/auto';
import axiosInstance from "@/shared/api/httpClient.js";

export default function AdminDashboard() {
  const summaryChartRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
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
  }, [refreshKey]);

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
            backgroundColor: '#FF385C',
            borderRadius: 6
          },
          {
            label: 'Người dùng mới',
            data: usersData,
            backgroundColor: '#0EA5E9',
            borderRadius: 6
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
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#F1F5F9',
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
  }, [refreshKey]);

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
  }, [refreshKey]);

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
  }, [refreshKey]);

  const hasChartData = monthlyUsers.length > 0 || monthlyRevenue.length > 0;

  return (
    <Box sx={{ width: '100%', p: { xs: 2.5, md: 3.5 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Tổng quan hệ thống
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            Biểu đồ doanh thu, tăng trưởng người dùng mới và nhật ký vận hành theo tháng
          </Typography>
        </Box>
        <Tooltip title="Làm mới dữ liệu thống kê">
          <span>
            <Button
              variant="outlined"
              size="small"
              aria-label="Làm mới dữ liệu"
              disabled={loadingSummary}
              onClick={() => setRefreshKey((key) => key + 1)}
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'divider',
                color: 'text.primary'
              }}
            >
              Làm mới
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Grid container spacing={3}>
        {/* Biểu đồ Doanh thu & Người dùng theo tháng */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              height: '100%',
              minHeight: 420,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Biểu đồ Doanh thu & Người dùng mới theo tháng
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Đơn vị doanh thu: triệu VND • Dữ liệu tổng hợp 12 tháng
                </Typography>
              </Box>
              <Chip
                size="small"
                icon={<BarChartOutlinedIcon fontSize="small" />}
                label={hasChartData ? "Đang cập nhật" : "Chưa phát sinh dữ liệu"}
                sx={{
                  bgcolor: hasChartData ? 'rgba(16, 185, 129, 0.12)' : 'var(--rn-surface-subtle)',
                  color: hasChartData ? 'success.main' : 'text.secondary',
                  fontWeight: 600
                }}
              />
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ position: 'relative', flex: 1, minHeight: 320 }}>
              {loadingSummary && (
                <Stack
                  spacing={1.5}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'var(--rn-surface)',
                    zIndex: 2,
                    p: 1
                  }}
                >
                  <Skeleton variant="rectangular" height={28} width="45%" sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
                </Stack>
              )}

              {!loadingSummary && !hasChartData && (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={1}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    bgcolor: 'var(--rn-surface)',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center'
                  }}
                >
                  <BarChartOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Chưa có dữ liệu biểu đồ trong kỳ thống kê
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 360 }}>
                    Khi hệ thống ghi nhận giao dịch thanh toán và người dùng mới, biểu đồ tăng trưởng theo tháng sẽ hiển thị tại đây.
                  </Typography>
                </Stack>
              )}

              <canvas ref={summaryChartRef} />
            </Box>
          </Paper>
        </Grid>

        {/* Khu vực Hoạt động gần đây (Placeholder UI sạch đẹp theo yêu cầu) */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              height: '100%',
              minHeight: 420,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Hoạt động gần đây
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Nhật ký xét duyệt & sự kiện hệ thống
                </Typography>
              </Box>
              <Chip
                size="small"
                label="Trực tiếp"
                sx={{
                  bgcolor: 'var(--rn-surface-subtle)',
                  color: 'text.secondary',
                  fontWeight: 600
                }}
              />
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1.25}
              sx={{
                flex: 1,
                p: 3,
                textAlign: 'center',
                bgcolor: 'var(--rn-bg)',
                borderRadius: 2.5,
                border: '1px dashed var(--rn-border-strong)'
              }}
            >
              <HistoryToggleOffIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Chưa có hoạt động mới nào
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                Các hoạt động xét duyệt Host, kích hoạt chỗ ở và phản hồi hỗ trợ sẽ được tổng hợp tại đây.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
