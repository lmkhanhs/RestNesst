import React, { useEffect, useRef, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Star as StarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import Chart from 'chart.js/auto';
import axiosInstance from '../../api/axiosConfig';
import Button from '@mui/material/Button';

export default function AdminReports() {
  const revenueRef = useRef(null);
  const usersRef = useRef(null);
  const popularRef = useRef(null);
  const feedbackRef = useRef(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 6)));
  const [endDate, setEndDate] = useState(new Date());
  const [charts, setCharts] = useState({
    revenue: null,
    users: null,
    popular: null,
    feedback: null
  });
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [ratingStats, setRatingStats] = useState([]);
  const [loadingRating, setLoadingRating] = useState(false);
  const [errorRating, setErrorRating] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState(null);
  const [revenueStats, setRevenueStats] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [errorRevenue, setErrorRevenue] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [errorTransactions, setErrorTransactions] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const [reviewStatusStats, setReviewStatusStats] = useState([]);
  const [loadingReviewStatus, setLoadingReviewStatus] = useState(false);
  const [errorReviewStatus, setErrorReviewStatus] = useState(null);

  const statsData = [
    {
      title: 'Tổng doanh thu',
      value: '₫15',
      change: '+12.5%',
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main'
    },
    {
      title: 'Người dùng mới',
      value: '3',
      change: '+8.2%',
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main'
    },
    {
      title: 'Chỗ ở mới',
      value: '3',
      change: '+15.3%',
      icon: <HomeIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.main'
    },
    {
      title: 'Đánh giá trung bình',
      value: '4.5',
      change: '+0.3',
      icon: <StarIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.main'
    }
  ];



  const fetchUserStats = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const start = startDate instanceof Date ? startDate.toISOString().slice(0, 10) : startDate;
      const end = endDate instanceof Date ? endDate.toISOString().slice(0, 10) : endDate;
      const res = await axiosInstance.get(`/api/statistic/users/counts?startDate=${start}&endDate=${end}`);
      setUserStats(res.data.result || []);
    } catch (err) {
      setErrorUsers('Không thể tải dữ liệu người dùng mới');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFilter = () => {
    fetchUserStats();
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  function groupByPeriod(data, period) {
    const result = {};
    data.forEach(item => {
      const date = new Date(item.day);
      let key = '';
      if (period === 'week') {
        const year = date.getFullYear();
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${year}-W${week}`;
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (period === 'quarter') {
        key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
      }
      if (!result[key]) result[key] = 0;
      result[key] += item.totalUsers;
    });
    return Object.entries(result).map(([label, value]) => ({ label, value }));
  }

  let usersLabels = userStats.map(item => item.day);
  let usersData = userStats.map(item => item.totalUsers);
  let groupType = null;
  if (usersLabels.length > 6) {
    const weekData = groupByPeriod(userStats, 'week');
    if (weekData.length <= 6) {
      usersLabels = weekData.map(i => i.label);
      usersData = weekData.map(i => i.value);
      groupType = 'week';
    } else {
      const monthData = groupByPeriod(userStats, 'month');
      if (monthData.length <= 6) {
        usersLabels = monthData.map(i => i.label);
        usersData = monthData.map(i => i.value);
        groupType = 'month';
      } else {
        const quarterData = groupByPeriod(userStats, 'quarter');
        usersLabels = quarterData.map(i => i.label);
        usersData = quarterData.map(i => i.value);
        groupType = 'quarter';
      }
    }
  }

  const createChart = (ctx, type, data, options, oldChart) => {
    if (!ctx) return null;
    if (oldChart) {
      try {
        oldChart.destroy();
      } catch (e) { }
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

  const initializeCharts = () => {
    if (!revenueRef.current || !usersRef.current || !popularRef.current || !feedbackRef.current) {
      console.log('Canvas elements not ready yet');
      return;
    }
    Object.values(charts).forEach(chart => {
      if (chart) {
        try {
          chart.destroy();
        } catch (error) {
          console.error('Error destroying chart:', error);
        }
      }
    });
    try {
      const fetchRatingStats = async () => {
        setLoadingRating(true);
        setErrorRating(null);
        try {
          const res = await axiosInstance.get('/api/statistic/rating');
          setRatingStats(res.data.result || []);
        } catch (err) {
          setErrorRating('Không thể tải dữ liệu đánh giá');
        } finally {
          setLoadingRating(false);
        }
      };
      fetchRatingStats();

      const ratingColor = (rating) => {
        switch (rating) {
          case 5: return '#4caf50';
          case 4: return '#8bc34a';
          case 3: return '#ffeb3b';
          case 2: return '#ff9800';
          case 1: return '#f44336';
          default: return '#bdbdbd';
        }
      };

      const feedbackLabels = ratingStats.map(item => `${item.rating} sao`);
      const feedbackData = ratingStats.map(item => item.persentage);
      const feedbackColors = ratingStats.map(item => ratingColor(item.rating));

      const fetchRevenueStats = async () => {
        setLoadingRevenue(true);
        setErrorRevenue(null);
        try {
          const start = startDate instanceof Date ? startDate.toISOString().slice(0, 10) : startDate;
          const end = endDate instanceof Date ? endDate.toISOString().slice(0, 10) : endDate;
          const res = await axiosInstance.get(`/api/statistic/payments/revenue?startDate=${start}&endDate=${end}`);
          setRevenueStats(res.data.result || []);
        } catch (err) {
          setErrorRevenue('Không thể tải dữ liệu doanh thu');
        } finally {
          setLoadingRevenue(false);
        }
      };
      fetchRevenueStats();

      const fetchReviewStatusStats = async () => {
        setLoadingReviewStatus(true);
        setErrorReviewStatus(null);
        try {
          const res = await axiosInstance.get('/api/statistic/reviews/status');
          setReviewStatusStats(res.data.result || []);
        } catch (err) {
          setErrorReviewStatus('Không thể tải dữ liệu đánh giá tích cực/tiêu cực');
        } finally {
          setLoadingReviewStatus(false);
        }
      };
      fetchReviewStatusStats();

      const reviewStatusLabels = reviewStatusStats.map(item => item.status === 'POSITIVE' ? 'Tích cực' : 'Tiêu cực');
      const reviewStatusData = reviewStatusStats.map(item => item.persentage);
      const reviewStatusColors = reviewStatusStats.map(item => item.status === 'POSITIVE' ? '#4caf50' : '#f44336');

      const newCharts = {
        revenue: createChart(revenueRef.current, 'line', {
          labels: revenueStats.map(item => item.day),
          datasets: [{
            label: 'Doanh thu',
            data: revenueStats.map(item => item.sumRevenue),
            borderColor: '#42a5f5',
            backgroundColor: 'rgba(66, 165, 245, 0.1)',
            tension: 0.4,
            fill: true
          }]
        }, {
          plugins: {
            title: {
              display: true,
              text: 'Doanh thu theo ngày',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => `${value.toLocaleString()}₫`
              }
            }
          }
        }, charts.revenue),
        users: createChart(usersRef.current, 'bar', {
          labels: usersLabels,
          datasets: [{
            label: 'Người dùng mới',
            data: usersData,
            backgroundColor: '#66bb6a'
          }]
        }, {
          plugins: {
            title: {
              display: true,
              text: groupType === 'week' ? 'Người dùng mới theo tuần'
                : groupType === 'month' ? 'Người dùng mới theo tháng'
                : groupType === 'quarter' ? 'Người dùng mới theo quý'
                : 'Người dùng mới theo ngày',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }, charts.users),
        popular: createChart(popularRef.current, 'pie', {
          labels: reviewStatusLabels.length > 0 ? reviewStatusLabels : ['Tích cực', 'Tiêu cực'],
          datasets: [{
            data: reviewStatusData.length > 0 ? reviewStatusData : [0, 0],
            backgroundColor: reviewStatusColors.length > 0 ? reviewStatusColors : ['#4caf50', '#f44336']
          }]
        }, {
          plugins: {
            title: {
              display: true,
              text: 'Phân bố đánh giá Tích cực/Tiêu cực',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 14 },
                color: '#333',
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed.toFixed(2)}%`;
                }
              }
            }
          }
        }, charts.popular),
        feedback: createChart(feedbackRef.current, 'doughnut', {
          labels: feedbackLabels,
          datasets: [{
            data: feedbackData,
            backgroundColor: feedbackColors
          }]
        }, {
          plugins: {
            title: {
              display: true,
              text: 'Phân bố đánh giá',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              position: 'bottom'
            }
          }
        }, charts.feedback)
      };

      setCharts(newCharts);
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  };

  useEffect(() => {
    const checkCanvasReady = () => {
      if (revenueRef.current && usersRef.current && popularRef.current && feedbackRef.current) {
        setIsCanvasReady(true);
      }
    };

    checkCanvasReady();

    const timer = setTimeout(checkCanvasReady, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isCanvasReady) {
      initializeCharts();
    }

    return () => {
      Object.values(charts).forEach(chart => {
        if (chart) {
          try {
            chart.destroy();
          } catch (error) {
            console.error('Error destroying chart:', error);
          }
        }
      });
    };
  }, [isCanvasReady]);

  useEffect(() => {
    if (isCanvasReady) {
      initializeCharts();
    }
  }, [isCanvasReady, userStats]);

  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
  };

  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);
  };

  const handleRefresh = () => {
    if (isCanvasReady) {
      initializeCharts();
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      setErrorTransactions(null);
      try {
        const res = await axiosInstance.get(`/api/payment/data?page=${page-1}`);
        setTransactions(res.data.result || []);
        setTotalPages(res.data.totalPages || 10);
      } catch (err) {
        setErrorTransactions('Không thể tải dữ liệu giao dịch!');
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  useEffect(() => {
    setLoadingReviewStatus(true);
    setErrorReviewStatus(null);
    axiosInstance.get('/api/statistic/reviews/status')
      .then(res => setReviewStatusStats(res.data.result || []))
      .catch(() => setErrorReviewStatus('Không thể tải dữ liệu đánh giá tích cực/tiêu cực'))
      .finally(() => setLoadingReviewStatus(false));
  }, []);

  useEffect(() => {
    if (!isCanvasReady) return;
    if (loadingReviewStatus) return;
    if (charts.popular) {
      try { charts.popular.destroy(); } catch (e) {}
    }
    const reviewStatusLabels = reviewStatusStats.map(item => item.status === 'POSITIVE' ? 'Tích cực' : 'Tiêu cực');
    const reviewStatusData = reviewStatusStats.map(item => item.persentage);
    const reviewStatusColors = reviewStatusStats.map(item => item.status === 'POSITIVE' ? '#4caf50' : '#f44336');
    const newPopularChart = createChart(popularRef.current, 'pie', {
      labels: reviewStatusLabels.length > 0 ? reviewStatusLabels : ['Tích cực', 'Tiêu cực'],
      datasets: [{
        data: reviewStatusData.length > 0 ? reviewStatusData : [0, 0],
        backgroundColor: reviewStatusColors.length > 0 ? reviewStatusColors : ['#4caf50', '#f44336']
      }]
    }, {
      plugins: {
        title: {
          display: true,
          text: 'Phân bố đánh giá Tích cực/Tiêu cực',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 14 },
            color: '#333',
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed.toFixed(2)}%`;
            }
          }
        }
      }
    }, null);
    setCharts(prev => ({ ...prev, popular: newPopularChart }));
  }, [isCanvasReady, reviewStatusStats, loadingReviewStatus]);

  useEffect(() => {
    return () => {
      if (charts.popular) {
        try { charts.popular.destroy(); } catch (e) {}
      }
    };
  }, []);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Thống kê & Báo cáo
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Từ ngày"
              value={startDate}
              onChange={handleStartDateChange}
              maxDate={endDate}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 180 }
                }
              }}
            />
            <DatePicker
              label="Đến ngày"
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 180 }
                }
              }}
            />
          </LocalizationProvider>
          <Button
            variant="contained"
            onClick={handleFilter}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 2
            }}
          >
            Lọc
          </Button>
        </Stack>
      </Stack>

      {/* <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={3}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: stat.color }}
                    >
                      {stat.change}
                    </Typography>
                  </Box>
                  {stat.icon}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid> */}

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <canvas ref={revenueRef}></canvas>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            {loadingUsers ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress />
              </Stack>
            ) : errorUsers ? (
              <Typography color="error">{errorUsers}</Typography>
            ) : (
              <canvas ref={usersRef}></canvas>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loadingReviewStatus ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress />
              </Stack>
            ) : errorReviewStatus ? (
              <Typography color="error">{errorReviewStatus}</Typography>
            ) : (
              <canvas ref={popularRef}></canvas>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <canvas ref={feedbackRef}></canvas>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Giao dịch gần đây
        </Typography>
        {loadingTransactions ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        ) : errorTransactions ? (
          <Typography color="error">{errorTransactions}</Typography>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tài khoản</TableCell>
                    <TableCell>Phương thức</TableCell>
                    <TableCell>Số tiền</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">Không có giao dịch nào</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{transaction.username}</TableCell>
                        <TableCell>{transaction.payment_method}</TableCell>
                        <TableCell>{transaction.amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status === 'SUCCESS' ? 'Thành công' : transaction.status}
                            color={transaction.status === 'SUCCESS' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transaction.content}</TableCell>
                        <TableCell>{transaction.createDate ? new Date(transaction.createDate).toLocaleString('vi-VN') : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                size="medium"
              />
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}
