import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';
import dayjs from 'dayjs';
import {
  Avatar,
  Box,
  ButtonBase,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  AssignmentIndOutlined as ProfileIcon,
  DonutLargeOutlined as DonutIcon,
  GroupOutlined as GroupIcon,
  HistoryToggleOff as LoginRecencyIcon,
  HowToRegOutlined as HostPartnerIcon,
  Timeline as TimelineIcon,
  VerifiedUserOutlined as ActiveUserIcon,
} from '@mui/icons-material';

function getAccountTypeLabel(roles) {
  if (Array.isArray(roles)) {
    if (roles.includes('ADMIN')) return 'Admin';
    if (roles.includes('HOST')) return 'Chủ cho thuê';
    if (roles.includes('GUEST')) return 'Khách';
  }
  return 'Khách';
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default function UserAnalyticsCharts({
  users,
  pendingHostIds,
  loading,
  roleFilter,
  statusFilter,
  onSelectRoleFilter,
  onSelectStatusFilter,
}) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [periodMonths, setPeriodMonths] = useState(6);

  const roleChartRef = useRef(null);
  const growthChartRef = useRef(null);
  const recencyChartRef = useRef(null);
  const completenessChartRef = useRef(null);

  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const pendingSet = useMemo(
    () => new Set((Array.isArray(pendingHostIds) ? pendingHostIds : []).map(Number)),
    [pendingHostIds]
  );

  const chartAnimation = useMemo(
    () => (prefersReducedMotion ? false : { duration: 380 }),
    [prefersReducedMotion]
  );

  const metrics = useMemo(() => {
    const now = dayjs();
    let activeCount = 0;
    let lockedCount = 0;
    let guestCount = 0;
    let hostCount = 0;
    let adminCount = 0;
    let pendingHostCount = 0;
    let everLoggedInCount = 0;
    let active7dCount = 0;
    let fullProfileCount = 0;
    let totalCompletenessScore = 0;

    const recencyBuckets = [
      { key: '24h', label: '24 giờ qua', active: 0, locked: 0 },
      { key: '7d', label: '2–7 ngày', active: 0, locked: 0 },
      { key: '30d', label: '8–30 ngày', active: 0, locked: 0 },
      { key: 'older', label: 'Trên 30 ngày', active: 0, locked: 0 },
      { key: 'never', label: 'Chưa đăng nhập', active: 0, locked: 0 },
    ];

    const fieldCounts = {
      fullname: 0,
      email: 0,
      avatar: 0,
      phone: 0,
      address: 0,
    };

    safeUsers.forEach((user) => {
      const isActive = user.isActive === true;
      if (isActive) {
        activeCount += 1;
      } else {
        lockedCount += 1;
      }

      const accountType = getAccountTypeLabel(user.roles);
      if (accountType === 'Admin') {
        adminCount += 1;
      } else if (accountType === 'Chủ cho thuê') {
        hostCount += 1;
      } else {
        guestCount += 1;
      }

      if (pendingSet.has(Number(user.id))) {
        pendingHostCount += 1;
      }

      const hasFullname = hasText(user.fullname);
      const hasEmail = hasText(user.email);
      const hasAvatar = hasText(user.thumnailUrl);
      const hasPhone = hasText(user.phone);
      const hasAddress = hasText(user.address);

      if (hasFullname) fieldCounts.fullname += 1;
      if (hasEmail) fieldCounts.email += 1;
      if (hasAvatar) fieldCounts.avatar += 1;
      if (hasPhone) fieldCounts.phone += 1;
      if (hasAddress) fieldCounts.address += 1;

      const filledContactFields = [hasFullname, hasEmail, hasPhone, hasAddress].filter(Boolean).length;
      totalCompletenessScore += (filledContactFields / 4) * 100;
      if (filledContactFields === 4) {
        fullProfileCount += 1;
      }

      const parsedLogin = user.lastLogin ? dayjs(user.lastLogin) : null;
      const statusField = isActive ? 'active' : 'locked';
      if (!parsedLogin || !parsedLogin.isValid()) {
        recencyBuckets[4][statusField] += 1;
      } else {
        everLoggedInCount += 1;
        const diffHours = Math.max(0, now.diff(parsedLogin, 'hour', true));
        const diffDays = Math.max(0, now.diff(parsedLogin, 'day', true));
        if (diffDays <= 7) {
          active7dCount += 1;
        }
        if (diffHours <= 24) {
          recencyBuckets[0][statusField] += 1;
        } else if (diffDays <= 7) {
          recencyBuckets[1][statusField] += 1;
        } else if (diffDays <= 30) {
          recencyBuckets[2][statusField] += 1;
        } else {
          recencyBuckets[3][statusField] += 1;
        }
      }
    });

    const totalCount = safeUsers.length;
    const activePct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
    const avgCompleteness =
      totalCount > 0 ? Math.round(totalCompletenessScore / totalCount) : 0;

    const sortedCompletenessRows = [
      { label: 'Họ và tên', count: fieldCounts.fullname, color: '#0284C7' },
      { label: 'Email liên hệ', count: fieldCounts.email, color: '#10B981' },
      { label: 'Ảnh đại diện', count: fieldCounts.avatar, color: '#8B5CF6' },
      { label: 'Số điện thoại', count: fieldCounts.phone, color: '#F59E0B' },
      { label: 'Địa chỉ cư trú', count: fieldCounts.address, color: '#FF385C' },
    ].sort((a, b) => b.count - a.count);

    const roleBreakdown = [
      { label: 'Khách', roleValue: 'Khách', count: guestCount, color: '#0284C7' },
      { label: 'Chủ cho thuê', roleValue: 'Chủ cho thuê', count: hostCount, color: '#FF385C' },
      { label: 'Admin', roleValue: 'Admin', count: adminCount, color: '#8B5CF6' },
    ];

    return {
      totalCount,
      activeCount,
      lockedCount,
      activePct,
      guestCount,
      hostCount,
      adminCount,
      pendingHostCount,
      everLoggedInCount,
      active7dCount,
      fullProfileCount,
      avgCompleteness,
      roleBreakdown,
      recencyBuckets,
      sortedCompletenessRows,
    };
  }, [pendingSet, safeUsers]);

  const monthlyGrowth = useMemo(() => {
    const now = dayjs();
    const firstMonthStart = now.subtract(periodMonths - 1, 'month').startOf('month');
    const buckets = Array.from({ length: periodMonths }, (_, index) => {
      const monthDate = now.subtract(periodMonths - 1 - index, 'month');
      return {
        key: monthDate.format('YYYY-MM'),
        label: `Th${monthDate.format('MM/YY')}`,
        newUsers: 0,
        activeLogins: 0,
        cumulativeUsers: 0,
      };
    });

    const bucketMap = new Map(buckets.map((item) => [item.key, item]));
    let baselineBeforeWindow = 0;

    safeUsers.forEach((user) => {
      if (!user.createdAt) {
        baselineBeforeWindow += 1;
      } else {
        const created = dayjs(user.createdAt);
        if (!created.isValid() || created.isBefore(firstMonthStart)) {
          baselineBeforeWindow += 1;
        } else {
          const target = bucketMap.get(created.format('YYYY-MM'));
          if (target) {
            target.newUsers += 1;
          }
        }
      }

      if (user.lastLogin) {
        const logged = dayjs(user.lastLogin);
        if (logged.isValid()) {
          const loginBucket = bucketMap.get(logged.format('YYYY-MM'));
          if (loginBucket) {
            loginBucket.activeLogins += 1;
          }
        }
      }
    });

    let runningTotal = baselineBeforeWindow;
    buckets.forEach((bucket) => {
      runningTotal += bucket.newUsers;
      bucket.cumulativeUsers = runningTotal;
    });

    return buckets;
  }, [periodMonths, safeUsers]);

  // Biểu đồ 1: Cơ cấu vai trò tài khoản (Doughnut)
  useEffect(() => {
    const canvas = roleChartRef.current;
    if (!canvas || metrics.totalCount === 0) return undefined;

    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: metrics.roleBreakdown.map((item) => item.label),
        datasets: [
          {
            data: metrics.roleBreakdown.map((item) => item.count),
            backgroundColor: metrics.roleBreakdown.map((item) => item.color),
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        animation: chartAnimation,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const count = Number(ctx.parsed || 0);
                const pct =
                  metrics.totalCount > 0
                    ? Math.round((count / metrics.totalCount) * 100)
                    : 0;
                return `${ctx.label}: ${count} tài khoản (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, metrics.roleBreakdown, metrics.totalCount]);

  // Biểu đồ 2: Tăng trưởng đăng ký & Tương tác đăng nhập theo tháng
  useEffect(() => {
    const canvas = growthChartRef.current;
    if (!canvas || metrics.totalCount === 0) return undefined;

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: monthlyGrowth.map((item) => item.label),
        datasets: [
          {
            type: 'bar',
            label: 'Đăng ký mới',
            data: monthlyGrowth.map((item) => item.newUsers),
            backgroundColor: 'rgba(2, 132, 199, 0.8)',
            borderColor: '#0284C7',
            borderWidth: 1,
            borderRadius: 7,
            maxBarThickness: 30,
          },
          {
            type: 'line',
            label: 'Tổng tài khoản tích lũy',
            data: monthlyGrowth.map((item) => item.cumulativeUsers),
            borderColor: '#FF385C',
            backgroundColor: 'rgba(255, 56, 92, 0.12)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 4,
          },
          {
            type: 'line',
            label: 'Có đăng nhập trong tháng',
            data: monthlyGrowth.map((item) => item.activeLogins),
            borderColor: '#10B981',
            backgroundColor: '#10B981',
            borderDash: [5, 4],
            pointStyle: 'triangle',
            pointRadius: 5,
            borderWidth: 2,
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, boxWidth: 10, padding: 14 },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            title: { display: true, text: 'Số tài khoản' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, metrics.totalCount, monthlyGrowth]);

  // Biểu đồ 3: Phân tầng thời điểm đăng nhập gần nhất (Stacked Bar)
  useEffect(() => {
    const canvas = recencyChartRef.current;
    if (!canvas || metrics.totalCount === 0) return undefined;

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: metrics.recencyBuckets.map((item) => item.label),
        datasets: [
          {
            label: 'Đang hoạt động',
            data: metrics.recencyBuckets.map((item) => item.active),
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10B981',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 34,
          },
          {
            label: 'Đã khóa',
            data: metrics.recencyBuckets.map((item) => item.locked),
            backgroundColor: 'rgba(239, 68, 68, 0.82)',
            borderColor: '#EF4444',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, boxWidth: 10, padding: 14 },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0 },
            title: { display: true, text: 'Số người dùng' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, metrics.recencyBuckets, metrics.totalCount]);

  // Biểu đồ 4: Mức độ hoàn thiện thông tin hồ sơ (Horizontal Bar giảm dần)
  useEffect(() => {
    const canvas = completenessChartRef.current;
    if (!canvas || metrics.totalCount === 0) return undefined;

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: metrics.sortedCompletenessRows.map((item) => item.label),
        datasets: [
          {
            label: 'Số tài khoản đã cập nhật',
            data: metrics.sortedCompletenessRows.map((item) => item.count),
            backgroundColor: metrics.sortedCompletenessRows.map((item) => item.color),
            borderRadius: 6,
            barThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const count = Number(ctx.parsed.x || 0);
                const pct =
                  metrics.totalCount > 0
                    ? Math.round((count / metrics.totalCount) * 100)
                    : 0;
                return `Đã điền: ${count}/${metrics.totalCount} tài khoản (${pct}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: Math.max(1, metrics.totalCount),
            ticks: { precision: 0 },
            title: { display: true, text: 'Số tài khoản' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
          },
          y: {
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, metrics.sortedCompletenessRows, metrics.totalCount]);

  const kpiCards = [
    {
      label: 'Tài khoản hoạt động',
      value: `${metrics.activeCount}/${metrics.totalCount}`,
      sub: `${metrics.activePct}% đang mở • ${metrics.lockedCount} đã khóa`,
      icon: <ActiveUserIcon />,
      accentBg: 'rgba(16, 185, 129, 0.12)',
      accentColor: '#059669',
    },
    {
      label: 'Chủ cho thuê & Khách',
      value: `${metrics.hostCount} Host • ${metrics.guestCount} Khách`,
      sub:
        metrics.pendingHostCount > 0
          ? `${metrics.pendingHostCount} tài khoản đang chờ duyệt lên Host`
          : `${metrics.adminCount} tài khoản Quản trị viên`,
      icon: <HostPartnerIcon />,
      accentBg: 'rgba(255, 56, 92, 0.12)',
      accentColor: '#E11D48',
    },
    {
      label: 'Đăng nhập 7 ngày qua',
      value: metrics.active7dCount,
      sub: `${metrics.everLoggedInCount}/${metrics.totalCount} tài khoản đã từng đăng nhập`,
      icon: <GroupIcon />,
      accentBg: 'rgba(2, 132, 199, 0.12)',
      accentColor: '#0284C7',
    },
    {
      label: 'Độ hoàn thiện hồ sơ',
      value: `${metrics.avgCompleteness}%`,
      sub: `${metrics.fullProfileCount}/${metrics.totalCount} hồ sơ đủ Họ tên, Email, SĐT & Địa chỉ`,
      icon: <ProfileIcon />,
      accentBg: 'rgba(245, 158, 11, 0.14)',
      accentColor: '#D97706',
    },
  ];

  return (
    <Box sx={{ mb: 3.5, minWidth: 0 }}>
      {/* Dải chỉ số tóm tắt chuyên biệt về người dùng */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 2,
          mb: 2.5,
        }}
      >
        {kpiCards.map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'var(--rn-surface)',
              border: '1px solid var(--rn-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1.5}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--rn-text-secondary)', fontWeight: 600, mb: 0.5 }}
                >
                  {card.label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 750,
                    color: 'var(--rn-text-primary)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {loading ? '—' : card.value}
                </Typography>
              </Box>
              <Avatar
                variant="rounded"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: card.accentBg,
                  color: card.accentColor,
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </Avatar>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                mt: 1.25,
                pt: 1,
                borderTop: '1px dashed var(--rn-border)',
                color: 'var(--rn-text-secondary)',
                display: 'block',
              }}
            >
              {card.sub}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Hàng biểu đồ 1: Cơ cấu vai trò & Trạng thái + Tăng trưởng người dùng theo tháng */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: '1px solid var(--rn-border)',
              bgcolor: 'var(--rn-surface)',
              height: '100%',
              minHeight: 375,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DonutIcon color="primary" fontSize="small" />
                  <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Cơ cấu loại tài khoản & Trạng thái
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Nhấn vào từng nhóm bên dưới để lọc nhanh danh sách người dùng
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 240 }}>
                <CircularProgress size={30} />
              </Stack>
            ) : metrics.totalCount === 0 ? (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 240 }}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu tài khoản để hiển thị biểu đồ.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1.75} sx={{ flex: 1, justifyContent: 'space-between' }}>
                <Box sx={{ position: 'relative', height: 175 }}>
                  <canvas
                    ref={roleChartRef}
                    style={{ display: 'block' }}
                    aria-label="Biểu đồ tròn phân bổ người dùng theo vai trò Khách, Chủ cho thuê và Admin"
                    role="img"
                  />
                </Box>

                <Stack spacing={0.75}>
                  {metrics.roleBreakdown.map((item) => {
                    const pct =
                      metrics.totalCount > 0
                        ? Math.round((item.count / metrics.totalCount) * 100)
                        : 0;
                    const isSelected = roleFilter === item.roleValue;
                    return (
                      <ButtonBase
                        key={item.roleValue}
                        onClick={() =>
                          onSelectRoleFilter(isSelected ? 'all' : item.roleValue)
                        }
                        aria-pressed={isSelected}
                        sx={{
                          width: '100%',
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: isSelected
                            ? 'rgba(255, 56, 92, 0.1)'
                            : 'var(--rn-surface-subtle)',
                          border: '1px solid',
                          borderColor: isSelected ? 'primary.main' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: item.color,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.count} ({pct}%)
                        </Typography>
                      </ButtonBase>
                    );
                  })}

                  <Stack direction="row" spacing={1} sx={{ pt: 0.5, flexWrap: 'wrap', rowGap: 1 }}>
                    <Chip
                      size="small"
                      clickable
                      label={`Đang hoạt động: ${metrics.activeCount}`}
                      color={statusFilter === 'Đang hoạt động' ? 'success' : 'default'}
                      variant={statusFilter === 'Đang hoạt động' ? 'filled' : 'outlined'}
                      onClick={() =>
                        onSelectStatusFilter(
                          statusFilter === 'Đang hoạt động' ? 'all' : 'Đang hoạt động'
                        )
                      }
                    />
                    <Chip
                      size="small"
                      clickable
                      label={`Đã khóa: ${metrics.lockedCount}`}
                      color={statusFilter === 'Đã khóa' ? 'error' : 'default'}
                      variant={statusFilter === 'Đã khóa' ? 'filled' : 'outlined'}
                      onClick={() =>
                        onSelectStatusFilter(statusFilter === 'Đã khóa' ? 'all' : 'Đã khóa')
                      }
                    />
                    {metrics.pendingHostCount > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={`Chờ duyệt Host: ${metrics.pendingHostCount}`}
                      />
                    )}
                  </Stack>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: '1px solid var(--rn-border)',
              bgcolor: 'var(--rn-surface)',
              height: '100%',
              minHeight: 375,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 1.25 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TimelineIcon color="primary" fontSize="small" />
                  <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Xu hướng đăng ký mới & Hoạt động theo tháng
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Đối chiếu lượng người dùng tạo tài khoản mới, tổng tích lũy và số lượt đăng nhập
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 155 }}>
                <InputLabel id="admin-users-growth-period-label">Kỳ thống kê</InputLabel>
                <Select
                  labelId="admin-users-growth-period-label"
                  label="Kỳ thống kê"
                  value={periodMonths}
                  onChange={(e) => setPeriodMonths(Number(e.target.value))}
                >
                  <MenuItem value={6}>6 tháng gần đây</MenuItem>
                  <MenuItem value={12}>12 tháng gần đây</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ position: 'relative', flex: 1, minHeight: 265 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 240 }}>
                  <CircularProgress size={30} />
                </Stack>
              ) : metrics.totalCount === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 240 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu tăng trưởng người dùng.
                  </Typography>
                </Stack>
              ) : (
                <canvas
                  ref={growthChartRef}
                  style={{ display: 'block' }}
                  aria-label="Biểu đồ xu hướng người dùng đăng ký mới, tổng tích lũy và hoạt động đăng nhập theo tháng"
                  role="img"
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Hàng biểu đồ 2: Mức độ hoạt động đăng nhập + Độ hoàn thiện hồ sơ */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: '1px solid var(--rn-border)',
              bgcolor: 'var(--rn-surface)',
              height: '100%',
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ mb: 1.25 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LoginRecencyIcon color="primary" fontSize="small" />
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Phân tầng hoạt động đăng nhập gần nhất
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Đánh giá mức độ gắn kết và phát hiện tài khoản lâu chưa truy cập hoặc đã bị khóa
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ position: 'relative', flex: 1, minHeight: 235 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 220 }}>
                  <CircularProgress size={30} />
                </Stack>
              ) : metrics.totalCount === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 220 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu lịch sử đăng nhập.
                  </Typography>
                </Stack>
              ) : (
                <canvas
                  ref={recencyChartRef}
                  style={{ display: 'block' }}
                  aria-label="Biểu đồ cột chồng phân loại người dùng theo thời điểm đăng nhập gần nhất và trạng thái khóa"
                  role="img"
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: '1px solid var(--rn-border)',
              bgcolor: 'var(--rn-surface)',
              height: '100%',
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ mb: 1.25 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ProfileIcon color="primary" fontSize="small" />
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Mức độ hoàn thiện thông tin hồ sơ
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Thống kê số lượng người dùng đã bổ sung đầy đủ từng trường thông tin cá nhân
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ position: 'relative', flex: 1, minHeight: 235 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 220 }}>
                  <CircularProgress size={30} />
                </Stack>
              ) : metrics.totalCount === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 220 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu hồ sơ người dùng.
                  </Typography>
                </Stack>
              ) : (
                <canvas
                  ref={completenessChartRef}
                  style={{ display: 'block' }}
                  aria-label="Biểu đồ thanh ngang xếp hạng tỷ lệ điền các trường Họ tên, Email, Ảnh đại diện, Số điện thoại và Địa chỉ"
                  role="img"
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

UserAnalyticsCharts.propTypes = {
  loading: PropTypes.bool,
  onSelectRoleFilter: PropTypes.func.isRequired,
  onSelectStatusFilter: PropTypes.func.isRequired,
  pendingHostIds: PropTypes.arrayOf(PropTypes.number),
  roleFilter: PropTypes.string.isRequired,
  statusFilter: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(PropTypes.object),
};

UserAnalyticsCharts.defaultProps = {
  loading: false,
  pendingHostIds: [],
  users: [],
};
