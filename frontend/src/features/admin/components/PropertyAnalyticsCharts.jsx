import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';
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
  BarChartOutlined as BarChartIcon,
  DonutLargeOutlined as DonutIcon,
  HomeWorkOutlined as PropertyIcon,
  LocationCityOutlined as LocationIcon,
  PaidOutlined as PriceIcon,
  StarOutlineRounded as StarIcon,
  TuneOutlined as DistributionIcon,
} from '@mui/icons-material';

function formatVnd(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '0 VND';
  return `${Math.round(num).toLocaleString('vi-VN')} VND`;
}

function truncateLabel(text, maxLen = 18) {
  const clean = String(text || 'Chỗ ở').trim();
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
}

export default function PropertyAnalyticsCharts({
  properties,
  loading,
  ownerFilter,
  statusFilter,
  onSelectOwnerFilter,
  onSelectStatusFilter,
}) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [comparisonSort, setComparisonSort] = useState('order');
  const [groupingMode, setGroupingMode] = useState('location');
  const [distributionMode, setDistributionMode] = useState('price');

  const statusChartRef = useRef(null);
  const priceRatingChartRef = useRef(null);
  const groupingChartRef = useRef(null);
  const distributionChartRef = useRef(null);

  const safeProperties = useMemo(
    () => (Array.isArray(properties) ? properties : []),
    [properties]
  );

  const chartAnimation = useMemo(
    () => (prefersReducedMotion ? false : { duration: 380 }),
    [prefersReducedMotion]
  );

  const metrics = useMemo(() => {
    let activatedCount = 0;
    let activatedActiveHostCount = 0;
    let activatedPausedHostCount = 0;
    let pendingCount = 0;
    let popularCount = 0;
    let totalImages = 0;

    const validPrices = [];
    const validRatings = [];
    const locationMap = new Map();
    const ownerMap = new Map();

    const priceTiers = [
      { label: 'Dưới 500k', active: 0, pending: 0 },
      { label: '500k – 1 triệu', active: 0, pending: 0 },
      { label: '1 – 2 triệu', active: 0, pending: 0 },
      { label: 'Trên 2 triệu', active: 0, pending: 0 },
    ];

    const ratingTiers = [
      { label: '4.5 – 5.0 ★', active: 0, pending: 0 },
      { label: '4.0 – 4.4 ★', active: 0, pending: 0 },
      { label: '3.0 – 3.9 ★', active: 0, pending: 0 },
      { label: 'Dưới 3.0 ★', active: 0, pending: 0 },
      { label: 'Chưa đánh giá', active: 0, pending: 0 },
    ];

    safeProperties.forEach((item) => {
      const isActivated = item.status === 'Đã kích hoạt';
      const hostOperationalStatus = String(item.listingStatus || 'ACTIVE')
        .trim()
        .toUpperCase();

      if (isActivated) {
        activatedCount += 1;
        if (hostOperationalStatus === 'INACTIVE') {
          activatedPausedHostCount += 1;
        } else {
          activatedActiveHostCount += 1;
        }
      } else {
        pendingCount += 1;
      }

      if (item.popular) {
        popularCount += 1;
      }

      totalImages += Array.isArray(item.images) ? item.images.length : 0;

      const numericPrice = Number(item.rawPrice ?? 0);
      if (Number.isFinite(numericPrice) && numericPrice > 0) {
        validPrices.push(numericPrice);
      }

      const numericRating = Number(item.rating ?? 0);
      if (Number.isFinite(numericRating) && numericRating > 0) {
        validRatings.push(numericRating);
      }

      const stateField = isActivated ? 'active' : 'pending';
      if (numericPrice < 500000) {
        priceTiers[0][stateField] += 1;
      } else if (numericPrice <= 1000000) {
        priceTiers[1][stateField] += 1;
      } else if (numericPrice <= 2000000) {
        priceTiers[2][stateField] += 1;
      } else {
        priceTiers[3][stateField] += 1;
      }

      if (!Number.isFinite(numericRating) || numericRating <= 0) {
        ratingTiers[4][stateField] += 1;
      } else if (numericRating >= 4.5) {
        ratingTiers[0][stateField] += 1;
      } else if (numericRating >= 4.0) {
        ratingTiers[1][stateField] += 1;
      } else if (numericRating >= 3.0) {
        ratingTiers[2][stateField] += 1;
      } else {
        ratingTiers[3][stateField] += 1;
      }

      const locKey = (item.location || 'Chưa cập nhật').trim();
      const prevLoc = locationMap.get(locKey) || {
        label: locKey,
        count: 0,
        priceSum: 0,
        pricedCount: 0,
      };
      prevLoc.count += 1;
      if (numericPrice > 0) {
        prevLoc.priceSum += numericPrice;
        prevLoc.pricedCount += 1;
      }
      locationMap.set(locKey, prevLoc);

      const ownerKey = (item.owner || 'Chưa cập nhật').trim();
      const prevOwner = ownerMap.get(ownerKey) || {
        label: ownerKey,
        count: 0,
        priceSum: 0,
        pricedCount: 0,
      };
      prevOwner.count += 1;
      if (numericPrice > 0) {
        prevOwner.priceSum += numericPrice;
        prevOwner.pricedCount += 1;
      }
      ownerMap.set(ownerKey, prevOwner);
    });

    const totalCount = safeProperties.length;
    const activatedPct =
      totalCount > 0 ? Math.round((activatedCount / totalCount) * 100) : 0;

    const avgPrice =
      validPrices.length > 0
        ? validPrices.reduce((sum, val) => sum + val, 0) / validPrices.length
        : 0;
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;

    const avgRating =
      validRatings.length > 0
        ? (
            validRatings.reduce((sum, val) => sum + val, 0) / validRatings.length
          ).toLocaleString('vi-VN', { maximumFractionDigits: 1 })
        : '0';

    const avgImages =
      totalCount > 0
        ? (totalImages / totalCount).toLocaleString('vi-VN', {
            maximumFractionDigits: 1,
          })
        : '0';

    const sortedLocations = Array.from(locationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const sortedOwners = Array.from(ownerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const doughnutSegments = [
      {
        label: 'Đã kích hoạt (Đang đón khách)',
        count: activatedActiveHostCount,
        color: '#10B981',
      },
      ...(activatedPausedHostCount > 0
        ? [
            {
              label: 'Đã kích hoạt (Host tạm ngưng)',
              count: activatedPausedHostCount,
              color: '#0284C7',
            },
          ]
        : []),
      {
        label: 'Đang chờ kích hoạt',
        count: pendingCount,
        color: '#F59E0B',
      },
    ];

    return {
      totalCount,
      activatedCount,
      pendingCount,
      activatedPct,
      popularCount,
      avgPrice,
      minPrice,
      maxPrice,
      avgRating,
      ratedCount: validRatings.length,
      uniqueLocationsCount: locationMap.size,
      uniqueOwnersCount: ownerMap.size,
      avgImages,
      doughnutSegments,
      sortedLocations,
      sortedOwners,
      priceTiers,
      ratingTiers,
    };
  }, [safeProperties]);

  const comparedProperties = useMemo(() => {
    const list = [...safeProperties];
    if (comparisonSort === 'priceDesc') {
      list.sort((a, b) => Number(b.rawPrice || 0) - Number(a.rawPrice || 0));
    } else if (comparisonSort === 'ratingDesc') {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else {
      list.sort(
        (a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0) || a.id - b.id
      );
    }
    return list.slice(0, 12);
  }, [comparisonSort, safeProperties]);

  // Biểu đồ 1: Tình trạng phê duyệt & kích hoạt chỗ ở (Doughnut)
  useEffect(() => {
    const canvas = statusChartRef.current;
    if (!canvas || metrics.totalCount === 0) return undefined;

    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: metrics.doughnutSegments.map((item) => item.label),
        datasets: [
          {
            data: metrics.doughnutSegments.map((item) => item.count),
            backgroundColor: metrics.doughnutSegments.map((item) => item.color),
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
                return `${ctx.label}: ${count} chỗ ở (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, metrics.doughnutSegments, metrics.totalCount]);

  // Biểu đồ 2: Đối chiếu Giá / đêm & Điểm đánh giá theo chỗ ở (Combo Bar + Line)
  useEffect(() => {
    const canvas = priceRatingChartRef.current;
    if (!canvas || comparedProperties.length === 0) return undefined;

    const labels = comparedProperties.map(
      (item) => `#${item.orderNumber ?? 0} ${truncateLabel(item.name, 15)}`
    );

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Giá / đêm (nghìn VND)',
            data: comparedProperties.map((item) =>
              Math.round(Number(item.rawPrice || 0) / 1000)
            ),
            backgroundColor: comparedProperties.map((item) =>
              item.status === 'Đã kích hoạt'
                ? 'rgba(255, 56, 92, 0.82)'
                : 'rgba(245, 158, 11, 0.82)'
            ),
            borderColor: comparedProperties.map((item) =>
              item.status === 'Đã kích hoạt' ? '#FF385C' : '#D97706'
            ),
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 38,
            yAxisID: 'yPrice',
          },
          {
            type: 'line',
            label: 'Điểm đánh giá (★)',
            data: comparedProperties.map((item) => Number(item.rating || 0)),
            borderColor: '#0284C7',
            backgroundColor: '#0284C7',
            borderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.25,
            yAxisID: 'yRating',
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
          tooltip: {
            callbacks: {
              title(items) {
                const idx = items[0]?.dataIndex ?? 0;
                const target = comparedProperties[idx];
                return target
                  ? `${target.name} (${target.location}) — Chủ: ${target.owner}`
                  : '';
              },
              label(ctx) {
                if (ctx.dataset.yAxisID === 'yRating') {
                  return `Đánh giá: ${Number(ctx.parsed.y || 0).toFixed(1)} / 5 ★`;
                }
                const vnd = Number(ctx.parsed.y || 0) * 1000;
                return `Giá niêm yết: ${formatVnd(vnd)} / đêm`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          yPrice: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Nghìn VND' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
          },
          yRating: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 5,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Điểm ★' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, comparedProperties]);

  // Biểu đồ 3: Phân bố chỗ ở theo Địa điểm hoặc Chủ sở hữu (Horizontal Bar giảm dần)
  useEffect(() => {
    const canvas = groupingChartRef.current;
    const rows =
      groupingMode === 'owner' ? metrics.sortedOwners : metrics.sortedLocations;
    if (!canvas || rows.length === 0) return undefined;

    const palette = [
      '#0284C7',
      '#FF385C',
      '#10B981',
      '#8B5CF6',
      '#F59E0B',
      '#0D9488',
      '#EC4899',
      '#6366F1',
    ];

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: rows.map((item) => truncateLabel(item.label, 22)),
        datasets: [
          {
            label: 'Số lượng chỗ ở',
            data: rows.map((item) => item.count),
            backgroundColor: rows.map((_, idx) => palette[idx % palette.length]),
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
              title(items) {
                const idx = items[0]?.dataIndex ?? 0;
                return rows[idx]?.label || '';
              },
              label(ctx) {
                const idx = ctx.dataIndex;
                const row = rows[idx];
                const avg =
                  row && row.pricedCount > 0 ? row.priceSum / row.pricedCount : 0;
                const avgPart = avg > 0 ? ` • Giá TB: ${formatVnd(avg)}` : '';
                return `Số lượng: ${ctx.parsed.x} chỗ ở${avgPart}`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
            title: { display: true, text: 'Số chỗ ở' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
          },
          y: { grid: { display: false } },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, groupingMode, metrics.sortedLocations, metrics.sortedOwners]);

  // Biểu đồ 4: Phân khúc Giá phòng hoặc Mức điểm sao (Stacked Bar)
  useEffect(() => {
    const canvas = distributionChartRef.current;
    if (!canvas || metrics.totalCount === 0) return undefined;

    const tiers =
      distributionMode === 'rating' ? metrics.ratingTiers : metrics.priceTiers;

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: tiers.map((item) => item.label),
        datasets: [
          {
            label: 'Đã kích hoạt',
            data: tiers.map((item) => item.active),
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10B981',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 36,
          },
          {
            label: 'Đang chờ kích hoạt',
            data: tiers.map((item) => item.pending),
            backgroundColor: 'rgba(245, 158, 11, 0.85)',
            borderColor: '#D97706',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 36,
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
            title: { display: true, text: 'Số chỗ ở' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, distributionMode, metrics.priceTiers, metrics.ratingTiers, metrics.totalCount]);

  const kpiCards = [
    {
      label: 'Tình trạng kích hoạt',
      value: `${metrics.activatedCount}/${metrics.totalCount}`,
      sub: `${metrics.activatedPct}% hiển thị trang chủ • ${metrics.pendingCount} chờ duyệt`,
      icon: <PropertyIcon />,
      accentBg: 'rgba(16, 185, 129, 0.12)',
      accentColor: '#059669',
    },
    {
      label: 'Giá trung bình / đêm',
      value: metrics.avgPrice > 0 ? formatVnd(metrics.avgPrice) : 'Chưa cập nhật',
      sub:
        metrics.minPrice > 0
          ? `${formatVnd(metrics.minPrice)} → ${formatVnd(metrics.maxPrice)}`
          : 'Chưa có dữ liệu giá niêm yết',
      icon: <PriceIcon />,
      accentBg: 'rgba(255, 56, 92, 0.12)',
      accentColor: '#E11D48',
    },
    {
      label: 'Điểm đánh giá TB',
      value: metrics.ratedCount > 0 ? `${metrics.avgRating} ★` : 'Chưa có ★',
      sub: `${metrics.ratedCount}/${metrics.totalCount} chỗ ở có đánh giá • ${metrics.popularCount} nổi bật`,
      icon: <StarIcon />,
      accentBg: 'rgba(245, 158, 11, 0.14)',
      accentColor: '#D97706',
    },
    {
      label: 'Địa bàn & Chủ sở hữu',
      value: `${metrics.uniqueLocationsCount} khu vực`,
      sub: `${metrics.uniqueOwnersCount} chủ sở hữu • Trung bình ${metrics.avgImages} ảnh/chỗ ở`,
      icon: <LocationIcon />,
      accentBg: 'rgba(2, 132, 199, 0.12)',
      accentColor: '#0284C7',
    },
  ];

  const statusFilterItems = [
    {
      label: 'Đã kích hoạt',
      statusValue: 'Đã kích hoạt',
      count: metrics.activatedCount,
      color: '#10B981',
    },
    {
      label: 'Đang chờ kích hoạt',
      statusValue: 'Đang chờ kích hoạt',
      count: metrics.pendingCount,
      color: '#F59E0B',
    },
  ];

  return (
    <Box sx={{ mb: 3.5, minWidth: 0 }}>
      {/* Dải chỉ số tóm tắt chuyên biệt cho Chỗ ở */}
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

      {/* Hàng biểu đồ 1: Tình trạng kích hoạt + Đối chiếu Giá & Điểm sao từng chỗ ở */}
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
            <Box sx={{ mb: 1.25 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DonutIcon color="primary" fontSize="small" />
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Tỷ trọng trạng thái kích hoạt
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Nhấn vào trạng thái bên dưới để lọc nhanh danh sách chỗ ở
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 240 }}>
                <CircularProgress size={30} />
              </Stack>
            ) : metrics.totalCount === 0 ? (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 240 }}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có chỗ ở nào để thống kê trạng thái.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1.75} sx={{ flex: 1, justifyContent: 'space-between' }}>
                <Box sx={{ position: 'relative', height: 185 }}>
                  <canvas
                    ref={statusChartRef}
                    style={{ display: 'block' }}
                    aria-label="Biểu đồ tròn phân bổ trạng thái kích hoạt của các chỗ ở"
                    role="img"
                  />
                </Box>

                <Stack spacing={0.85}>
                  {statusFilterItems.map((item) => {
                    const pct =
                      metrics.totalCount > 0
                        ? Math.round((item.count / metrics.totalCount) * 100)
                        : 0;
                    const isSelected = statusFilter === item.statusValue;
                    return (
                      <ButtonBase
                        key={item.statusValue}
                        onClick={() =>
                          onSelectStatusFilter(isSelected ? 'all' : item.statusValue)
                        }
                        aria-pressed={isSelected}
                        sx={{
                          width: '100%',
                          px: 1.5,
                          py: 0.85,
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
                  <BarChartIcon color="primary" fontSize="small" />
                  <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Đối chiếu Giá / đêm & Điểm đánh giá từng chỗ ở
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  So sánh tương quan mức giá niêm yết, điểm sao và thứ tự ưu tiên hiển thị
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 175 }}>
                <InputLabel id="admin-properties-compare-sort-label">Sắp xếp theo</InputLabel>
                <Select
                  labelId="admin-properties-compare-sort-label"
                  label="Sắp xếp theo"
                  value={comparisonSort}
                  onChange={(e) => setComparisonSort(e.target.value)}
                >
                  <MenuItem value="order">Thứ tự trang chủ (#)</MenuItem>
                  <MenuItem value="priceDesc">Giá cao → thấp</MenuItem>
                  <MenuItem value="ratingDesc">Điểm sao cao → thấp</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ position: 'relative', flex: 1, minHeight: 265 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 240 }}>
                  <CircularProgress size={30} />
                </Stack>
              ) : comparedProperties.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 240 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu chỗ ở để đối chiếu.
                  </Typography>
                </Stack>
              ) : (
                <canvas
                  ref={priceRatingChartRef}
                  style={{ display: 'block' }}
                  aria-label="Biểu đồ kết hợp cột giá mỗi đêm và đường điểm đánh giá sao của các chỗ ở"
                  role="img"
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Hàng biểu đồ 2: Phân bố theo Địa điểm / Chủ sở hữu + Phân khúc Giá / Điểm sao */}
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
              minHeight: 355,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationIcon color="primary" fontSize="small" />
                  <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Phân bố theo {groupingMode === 'owner' ? 'Chủ sở hữu' : 'Địa điểm'}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Xếp hạng số lượng và mặt bằng giá trung bình theo từng khu vực hoặc chủ nhà
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75}>
                <Chip
                  size="small"
                  clickable
                  label="Địa điểm"
                  color={groupingMode === 'location' ? 'primary' : 'default'}
                  variant={groupingMode === 'location' ? 'filled' : 'outlined'}
                  onClick={() => setGroupingMode('location')}
                />
                <Chip
                  size="small"
                  clickable
                  label="Chủ sở hữu"
                  color={groupingMode === 'owner' ? 'primary' : 'default'}
                  variant={groupingMode === 'owner' ? 'filled' : 'outlined'}
                  onClick={() => setGroupingMode('owner')}
                />
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ position: 'relative', flex: 1, minHeight: 215 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 200 }}>
                  <CircularProgress size={30} />
                </Stack>
              ) : metrics.totalCount === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 200 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu địa điểm hoặc chủ sở hữu.
                  </Typography>
                </Stack>
              ) : (
                <canvas
                  ref={groupingChartRef}
                  style={{ display: 'block' }}
                  aria-label={`Biểu đồ thanh ngang phân bố chỗ ở theo ${
                    groupingMode === 'owner' ? 'chủ sở hữu' : 'địa điểm'
                  }`}
                  role="img"
                />
              )}
            </Box>

            {groupingMode === 'owner' && metrics.sortedOwners.length > 0 && (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mt: 1.5, pt: 1.25, borderTop: '1px dashed var(--rn-border)', flexWrap: 'wrap', rowGap: 0.75 }}
              >
                {metrics.sortedOwners.slice(0, 5).map((ownerItem) => {
                  const isSelected = ownerFilter === ownerItem.label;
                  return (
                    <Chip
                      key={ownerItem.label}
                      size="small"
                      clickable
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      label={`${ownerItem.label} (${ownerItem.count})`}
                      onClick={() =>
                        onSelectOwnerFilter(isSelected ? 'all' : ownerItem.label)
                      }
                    />
                  );
                })}
              </Stack>
            )}
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
              minHeight: 355,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DistributionIcon color="primary" fontSize="small" />
                  <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Cấu trúc {distributionMode === 'rating' ? 'Mức điểm sao' : 'Phân khúc giá'}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Phân tầng nguồn cung chỗ ở theo khoảng giá thuê hoặc chất lượng đánh giá
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75}>
                <Chip
                  size="small"
                  clickable
                  label="Phân khúc giá"
                  color={distributionMode === 'price' ? 'primary' : 'default'}
                  variant={distributionMode === 'price' ? 'filled' : 'outlined'}
                  onClick={() => setDistributionMode('price')}
                />
                <Chip
                  size="small"
                  clickable
                  label="Điểm sao"
                  color={distributionMode === 'rating' ? 'primary' : 'default'}
                  variant={distributionMode === 'rating' ? 'filled' : 'outlined'}
                  onClick={() => setDistributionMode('rating')}
                />
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ position: 'relative', flex: 1, minHeight: 235 }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 220 }}>
                  <CircularProgress size={30} />
                </Stack>
              ) : metrics.totalCount === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: 220 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu phân khúc chỗ ở.
                  </Typography>
                </Stack>
              ) : (
                <canvas
                  ref={distributionChartRef}
                  style={{ display: 'block' }}
                  aria-label={`Biểu đồ cột chồng phân bổ chỗ ở theo ${
                    distributionMode === 'rating' ? 'mức điểm sao' : 'phân khúc giá mỗi đêm'
                  }`}
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

PropertyAnalyticsCharts.propTypes = {
  loading: PropTypes.bool,
  onSelectOwnerFilter: PropTypes.func.isRequired,
  onSelectStatusFilter: PropTypes.func.isRequired,
  ownerFilter: PropTypes.string.isRequired,
  properties: PropTypes.arrayOf(PropTypes.object),
  statusFilter: PropTypes.string.isRequired,
};

PropertyAnalyticsCharts.defaultProps = {
  loading: false,
  properties: [],
};
