import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import Chart from "chart.js/auto";
import dayjs from "dayjs";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  Add as AddIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  BookOnline as BookOnlineIcon,
  CheckCircleOutline as CheckIcon,
  DonutLargeOutlined as DonutIcon,
  EditOutlined as EditIcon,
  HighlightOff as CancelIcon,
  HomeWorkOutlined as HomeWorkIcon,
  Launch as LaunchIcon,
  PaidOutlined as PaidIcon,
  RateReviewOutlined as ReviewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  StarRounded as StarIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import axiosInstance from "@/shared/api/httpClient.js";
import { getMediaUrl } from "@/shared/utils/mediaUrl.js";
import {
  formatHostDate,
  formatHostPrice,
  normalizeHostProperty,
  propertyStatuses,
} from "../utils/propertyDisplay.js";

const BOOKING_STATUS_CONFIG = {
  PENDING: { label: "Chờ xác nhận", color: "warning" },
  CONFIRMED: { label: "Đã xác nhận", color: "info" },
  PAID: { label: "Đã thanh toán", color: "success" },
  SUCCESS: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "default" },
  FAILED: { label: "Thanh toán lỗi", color: "error" },
};

const REVENUE_STATUSES = new Set(["PAID", "SUCCESS"]);
const PENDING_REVENUE_STATUSES = new Set(["PENDING", "CONFIRMED"]);

function truncateLabel(label, maxLength = 20) {
  const text = String(label || "Chỗ ở").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getBookingStatusMeta(status) {
  const key = String(status || "PENDING").trim().toUpperCase();
  return BOOKING_STATUS_CONFIG[key] || { label: key || "Chưa rõ", color: "default" };
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = dayjs(checkIn);
  const end = dayjs(checkOut);
  if (!start.isValid() || !end.isValid()) return 0;
  return Math.max(1, end.diff(start, "day"));
}

function normalizeBookingItem(item) {
  const status = String(item.bookingStatus || "PENDING").trim().toUpperCase();
  const total =
    Number.isFinite(Number(item.totalPrice)) && Number(item.totalPrice) > 0
      ? Number(item.totalPrice)
      : Number(item.price || 0) * calculateNights(item.checkInDate, item.checkOutDate);

  return {
    bookingId: item.bookingId ?? item.id,
    listingId: Number(item.listingId),
    title: item.title || `Chỗ ở #${item.listingId || ""}`,
    primaryUrl: item.primaryUrl || "",
    city: item.city || "",
    address: item.address || "",
    price: Number(item.price || 0),
    guestName: item.guestName || item.guestUsername || "Khách đặt phòng",
    guestEmail: item.guestEmail || "",
    guestAvatar: item.guestAvatar || "",
    checkInDate: item.checkInDate || "",
    checkOutDate: item.checkOutDate || "",
    nights: calculateNights(item.checkInDate, item.checkOutDate),
    totalPrice: Number.isFinite(total) ? total : 0,
    bookingStatus: status,
    paymentStatus: String(item.paymentStatus || "").trim().toUpperCase(),
    createdAt: item.createdAt || item.checkInDate || "",
    content: item.content || "",
  };
}

export default function HostAnalyticsManagement({
  properties,
  propertiesLoading,
  propertiesError,
  onReloadProperties,
  onAddProperty,
  onEditProperty,
}) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [periodMonths, setPeriodMonths] = useState(6);
  const [breakdownMode, setBreakdownMode] = useState("properties");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const propertyChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const ratingChartRef = useRef(null);

  const normalizedProperties = useMemo(
    () =>
      (Array.isArray(properties) ? properties : []).map((raw) => ({
        ...normalizeHostProperty(raw),
        raw,
        reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
      })),
    [properties]
  );

  const hostListingIdSet = useMemo(
    () => new Set(normalizedProperties.map((item) => Number(item.id))),
    [normalizedProperties]
  );

  const fetchHostBookings = useCallback(
    async (signal) => {
      setBookingsLoading(true);
      try {
        const res = await axiosInstance.get("/api/bookings/host", { signal });
        const list = Array.isArray(res.data?.result) ? res.data.result : [];
        setBookings(list.map(normalizeBookingItem));
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          return;
        }
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const roles = Array.isArray(storedUser?.roles) ? storedUser.roles : [];
        if (roles.includes("ADMIN") && hostListingIdSet.size > 0) {
          try {
            const adminRes = await axiosInstance.get(
              "/api/bookings/dasboards?page=0&size=100",
              { signal }
            );
            const allAdminBookings = Array.isArray(adminRes.data?.result)
              ? adminRes.data.result
              : [];
            const filteredForHost = allAdminBookings
              .filter((item) => hostListingIdSet.has(Number(item.listingId)))
              .map(normalizeBookingItem);
            setBookings(filteredForHost);
            return;
          } catch (fallbackErr) {
            if (
              fallbackErr?.name === "CanceledError" ||
              fallbackErr?.code === "ERR_CANCELED"
            ) {
              return;
            }
          }
        }
        setBookings([]);
      } finally {
        if (!signal?.aborted) {
          setBookingsLoading(false);
        }
      }
    },
    [hostListingIdSet]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchHostBookings(controller.signal);
    return () => controller.abort();
  }, [fetchHostBookings]);

  const handleRefreshAll = () => {
    if (onReloadProperties) {
      onReloadProperties();
    }
    fetchHostBookings();
  };

  const scopedProperties = useMemo(() => {
    if (selectedPropertyId === "all") return normalizedProperties;
    return normalizedProperties.filter(
      (item) => String(item.id) === String(selectedPropertyId)
    );
  }, [normalizedProperties, selectedPropertyId]);

  const scopedPropertyIds = useMemo(
    () => new Set(scopedProperties.map((item) => Number(item.id))),
    [scopedProperties]
  );

  const scopedBookings = useMemo(
    () =>
      bookings.filter((item) =>
        selectedPropertyId === "all"
          ? hostListingIdSet.size === 0 || hostListingIdSet.has(item.listingId)
          : scopedPropertyIds.has(item.listingId)
      ),
    [bookings, hostListingIdSet, scopedPropertyIds, selectedPropertyId]
  );

  const scopedReviews = useMemo(
    () =>
      scopedProperties.flatMap((property) =>
        (property.reviews || []).map((review) => ({
          ...review,
          listingId: property.id,
          listingTitle: property.title,
        }))
      ),
    [scopedProperties]
  );

  const summaryMetrics = useMemo(() => {
    const confirmedRevenue = scopedBookings
      .filter((b) => REVENUE_STATUSES.has(b.bookingStatus))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const pendingRevenue = scopedBookings
      .filter((b) => PENDING_REVENUE_STATUSES.has(b.bookingStatus))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const completedOrPaidCount = scopedBookings.filter((b) =>
      REVENUE_STATUSES.has(b.bookingStatus)
    ).length;
    const pendingBookingsCount = scopedBookings.filter((b) =>
      PENDING_REVENUE_STATUSES.has(b.bookingStatus)
    ).length;

    const positiveReviews = scopedReviews.filter(
      (r) => String(r.status || "").toUpperCase() === "POSITIVE"
    ).length;
    const negativeReviews = scopedReviews.filter(
      (r) => String(r.status || "").toUpperCase() === "NEGATIVE"
    ).length;
    const positiveRate =
      scopedReviews.length > 0
        ? Math.round((positiveReviews / scopedReviews.length) * 100)
        : 0;

    const readyPropertiesCount = scopedProperties.filter((p) =>
      ["ACTIVE", "AVAILABLE"].includes(p.status)
    ).length;
    const totalAmenities = scopedProperties.reduce(
      (sum, p) => sum + (p.amenites?.length || 0),
      0
    );
    const avgAmenities =
      scopedProperties.length > 0
        ? (totalAmenities / scopedProperties.length).toLocaleString("vi-VN", {
            maximumFractionDigits: 1,
          })
        : "0";

    return {
      confirmedRevenue,
      pendingRevenue,
      totalBookings: scopedBookings.length,
      completedOrPaidCount,
      pendingBookingsCount,
      totalReviews: scopedReviews.length,
      positiveReviews,
      negativeReviews,
      positiveRate,
      readyPropertiesCount,
      avgAmenities,
    };
  }, [scopedBookings, scopedProperties, scopedReviews]);

  const propertyPerformanceRows = useMemo(() => {
    return scopedProperties.map((property) => {
      const propBookings = scopedBookings.filter(
        (b) => Number(b.listingId) === Number(property.id)
      );
      const revenue = propBookings
        .filter((b) => REVENUE_STATUSES.has(b.bookingStatus))
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const reviews = property.reviews || [];
      const positiveCount = reviews.filter(
        (r) => String(r.status || "").toUpperCase() === "POSITIVE"
      ).length;
      const computedAvgRating =
        Number(property.avgStart) > 0
          ? Number(property.avgStart)
          : reviews.length > 0
          ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
            reviews.length
          : 0;

      return {
        ...property,
        bookingCount: propBookings.length,
        revenue,
        reviewCount: reviews.length,
        positiveRate:
          reviews.length > 0
            ? Math.round((positiveCount / reviews.length) * 100)
            : null,
        ratingValue: Number(computedAvgRating.toFixed(1)),
        amenityCount: property.amenites?.length || 0,
      };
    });
  }, [scopedBookings, scopedProperties]);

  const statusBreakdown = useMemo(() => {
    if (breakdownMode === "bookings") {
      const paidOrDone = scopedBookings.filter((b) =>
        REVENUE_STATUSES.has(b.bookingStatus)
      ).length;
      const pendingOrConfirmed = scopedBookings.filter((b) =>
        PENDING_REVENUE_STATUSES.has(b.bookingStatus)
      ).length;
      const cancelledOrFailed = scopedBookings.filter((b) =>
        ["CANCELLED", "FAILED"].includes(b.bookingStatus)
      ).length;

      const items = [
        {
          label: "Đã thanh toán / Hoàn thành",
          count: paidOrDone,
          color: "#10B981",
        },
        {
          label: "Chờ xử lý / Đã xác nhận",
          count: pendingOrConfirmed,
          color: "#F59E0B",
        },
        {
          label: "Đã hủy / Lỗi thanh toán",
          count: cancelledOrFailed,
          color: "#EF4444",
        },
      ];
      const total = items.reduce((sum, item) => sum + item.count, 0);
      return { items, total };
    }

    const activeCount = scopedProperties.filter((p) =>
      ["ACTIVE", "AVAILABLE"].includes(p.status)
    ).length;
    const occupiedCount = scopedProperties.filter(
      (p) => p.status === "OCCUPIED"
    ).length;
    const inactiveCount = Math.max(
      0,
      scopedProperties.length - activeCount - occupiedCount
    );

    const items = [
      {
        label: "Sẵn sàng đón khách",
        count: activeCount,
        color: "#10B981",
      },
      {
        label: "Đang có khách lưu trú",
        count: occupiedCount,
        color: "#0284C7",
      },
      {
        label: "Tạm ngưng / Khác",
        count: inactiveCount,
        color: "#F59E0B",
      },
    ];
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return { items, total };
  }, [breakdownMode, scopedBookings, scopedProperties]);

  const monthlySeries = useMemo(() => {
    const count = periodMonths === 0 ? 12 : periodMonths;
    const now = dayjs();
    const buckets = Array.from({ length: count }, (_, idx) => {
      const monthDate = now.subtract(count - 1 - idx, "month");
      return {
        key: monthDate.format("YYYY-MM"),
        label: `Th${monthDate.format("MM/YY")}`,
        revenueThousand: 0,
        bookings: 0,
        reviews: 0,
      };
    });
    const bucketMap = new Map(buckets.map((b) => [b.key, b]));

    scopedBookings.forEach((booking) => {
      const rawDate = booking.createdAt || booking.checkInDate;
      if (!rawDate) return;
      const parsed = dayjs(rawDate);
      if (!parsed.isValid()) return;
      const bucket = bucketMap.get(parsed.format("YYYY-MM"));
      if (bucket) {
        bucket.bookings += 1;
        if (REVENUE_STATUSES.has(booking.bookingStatus)) {
          bucket.revenueThousand += Math.round((booking.totalPrice || 0) / 1000);
        }
      }
    });

    scopedReviews.forEach((review) => {
      if (!review.reviewDate) return;
      const parsed = dayjs(review.reviewDate);
      if (!parsed.isValid()) return;
      const bucket = bucketMap.get(parsed.format("YYYY-MM"));
      if (bucket) {
        bucket.reviews += 1;
      }
    });

    const hasAnyActivity = buckets.some(
      (b) => b.revenueThousand > 0 || b.bookings > 0 || b.reviews > 0
    );

    return { buckets, hasAnyActivity };
  }, [periodMonths, scopedBookings, scopedReviews]);

  const starDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    scopedReviews.forEach((review) => {
      const rounded = Math.min(5, Math.max(1, Math.round(Number(review.rating || 0))));
      if (counts[rounded] != null) {
        counts[rounded] += 1;
      }
    });

    if (scopedReviews.length === 0 && scopedProperties.length > 0) {
      scopedProperties.forEach((prop) => {
        if (Number(prop.avgStart) > 0) {
          const star = Math.min(5, Math.max(1, Math.round(Number(prop.avgStart))));
          counts[star] += 1;
        }
      });
      return {
        labels: ["5 sao ★", "4 sao ★", "3 sao ★", "2 sao ★", "1 sao ★"],
        values: [counts[5], counts[4], counts[3], counts[2], counts[1]],
        fromPropertyAvg: true,
      };
    }

    return {
      labels: ["5 sao ★", "4 sao ★", "3 sao ★", "2 sao ★", "1 sao ★"],
      values: [counts[5], counts[4], counts[3], counts[2], counts[1]],
      fromPropertyAvg: false,
    };
  }, [scopedProperties, scopedReviews]);

  const chartAnimation = useMemo(
    () => (prefersReducedMotion ? false : { duration: 420 }),
    [prefersReducedMotion]
  );

  // Biểu đồ 1: Hiệu suất từng chỗ ở (Giá/đêm, Doanh thu & Điểm đánh giá)
  useEffect(() => {
    const canvas = propertyChartRef.current;
    if (!canvas || propertyPerformanceRows.length === 0) return undefined;

    const labels = propertyPerformanceRows.map((item) =>
      truncateLabel(item.title, 18)
    );
    const priceThousandData = propertyPerformanceRows.map((item) =>
      Math.round(Number(item.price || 0) / 1000)
    );
    const revenueThousandData = propertyPerformanceRows.map((item) =>
      Math.round(Number(item.revenue || 0) / 1000)
    );
    const ratingData = propertyPerformanceRows.map((item) => item.ratingValue);

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Giá / đêm (nghìn ₫)",
            data: priceThousandData,
            backgroundColor: "rgba(255, 56, 92, 0.82)",
            borderColor: "#FF385C",
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 38,
            yAxisID: "yCurrency",
          },
          {
            type: "bar",
            label: "Doanh thu (nghìn ₫)",
            data: revenueThousandData,
            backgroundColor: "rgba(13, 148, 136, 0.82)",
            borderColor: "#0D9488",
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 38,
            yAxisID: "yCurrency",
          },
          {
            type: "line",
            label: "Điểm đánh giá (★)",
            data: ratingData,
            borderColor: "#D97706",
            backgroundColor: "#F59E0B",
            borderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.25,
            yAxisID: "yRating",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true, boxWidth: 10, padding: 16 },
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                if (ctx.dataset.yAxisID === "yRating") {
                  return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} / 5 ★`;
                }
                const vnd = Number(ctx.parsed.y || 0) * 1000;
                return `${ctx.dataset.label.replace(" (nghìn ₫)", "")}: ${vnd.toLocaleString("vi-VN")} ₫`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          yCurrency: {
            type: "linear",
            position: "left",
            beginAtZero: true,
            title: { display: true, text: "Nghìn ₫" },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
          yRating: {
            type: "linear",
            position: "right",
            min: 0,
            max: 5,
            ticks: { stepSize: 1 },
            title: { display: true, text: "Điểm ★" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, propertyPerformanceRows]);

  // Biểu đồ 2: Cơ cấu trạng thái (Doughnut)
  useEffect(() => {
    const canvas = doughnutChartRef.current;
    if (!canvas || statusBreakdown.total === 0) return undefined;

    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: statusBreakdown.items.map((item) => item.label),
        datasets: [
          {
            data: statusBreakdown.items.map((item) => item.count),
            backgroundColor: statusBreakdown.items.map((item) => item.color),
            borderColor: "#FFFFFF",
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "66%",
        animation: chartAnimation,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const count = Number(ctx.parsed || 0);
                const pct =
                  statusBreakdown.total > 0
                    ? Math.round((count / statusBreakdown.total) * 100)
                    : 0;
                return `${ctx.label}: ${count} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, statusBreakdown]);

  // Biểu đồ 3: Xu hướng theo tháng (Doanh thu, Đơn đặt & Đánh giá)
  useEffect(() => {
    const canvas = trendChartRef.current;
    if (!canvas) return undefined;

    const labels = monthlySeries.buckets.map((b) => b.label);
    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            type: "line",
            label: "Doanh thu (nghìn ₫)",
            data: monthlySeries.buckets.map((b) => b.revenueThousand),
            borderColor: "#FF385C",
            backgroundColor: "rgba(255, 56, 92, 0.14)",
            fill: true,
            tension: 0.32,
            borderWidth: 2.5,
            pointRadius: 4,
            yAxisID: "yRev",
          },
          {
            type: "bar",
            label: "Đơn đặt phòng",
            data: monthlySeries.buckets.map((b) => b.bookings),
            backgroundColor: "rgba(2, 132, 199, 0.78)",
            borderRadius: 6,
            maxBarThickness: 26,
            yAxisID: "yCount",
          },
          {
            type: "line",
            label: "Đánh giá mới",
            data: monthlySeries.buckets.map((b) => b.reviews),
            borderColor: "#10B981",
            backgroundColor: "#10B981",
            borderDash: [5, 4],
            pointStyle: "triangle",
            pointRadius: 5,
            borderWidth: 2,
            tension: 0.25,
            yAxisID: "yCount",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true, boxWidth: 10, padding: 16 },
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                if (ctx.dataset.yAxisID === "yRev") {
                  const vnd = Number(ctx.parsed.y || 0) * 1000;
                  return `Doanh thu: ${vnd.toLocaleString("vi-VN")} ₫`;
                }
                return `${ctx.dataset.label}: ${ctx.parsed.y}`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          yRev: {
            type: "linear",
            position: "left",
            beginAtZero: true,
            title: { display: true, text: "Nghìn ₫" },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
          yCount: {
            type: "linear",
            position: "right",
            beginAtZero: true,
            ticks: { precision: 0 },
            title: { display: true, text: "Số lượt" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, monthlySeries]);

  // Biểu đồ 4: Phân bố điểm sao (1★ - 5★)
  useEffect(() => {
    const canvas = ratingChartRef.current;
    if (!canvas) return undefined;

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: starDistribution.labels,
        datasets: [
          {
            label: starDistribution.fromPropertyAvg
              ? "Số chỗ ở theo mức sao trung bình"
              : "Số lượt đánh giá",
            data: starDistribution.values,
            backgroundColor: [
              "#10B981",
              "#34D399",
              "#FBBF24",
              "#FB923C",
              "#EF4444",
            ],
            borderRadius: 6,
            barThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimation,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
          y: {
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [chartAnimation, starDistribution]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLocaleLowerCase("vi-VN");
    return scopedBookings.filter((booking) => {
      const matchesStatus =
        bookingStatusFilter === "all" ||
        booking.bookingStatus === bookingStatusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = [
        `#${booking.bookingId}`,
        booking.title,
        booking.guestName,
        booking.guestEmail,
        booking.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi-VN");
      return haystack.includes(q);
    });
  }, [bookingSearch, bookingStatusFilter, scopedBookings]);

  const handleBookingStatusAction = async (bookingId, targetStatus) => {
    try {
      setUpdatingBookingId(bookingId);
      const res = await axiosInstance.put(
        `/api/bookings/host/${bookingId}/status`,
        null,
        { params: { status: targetStatus } }
      );
      const updated = res.data?.result;
      setBookings((prev) =>
        prev.map((item) =>
          item.bookingId === bookingId
            ? updated
              ? normalizeBookingItem(updated)
              : { ...item, bookingStatus: targetStatus }
            : item
        )
      );
      setFeedback({
        open: true,
        severity: "success",
        message:
          targetStatus === "CONFIRMED"
            ? `Đã xác nhận đơn đặt phòng #${bookingId}.`
            : `Đã từ chối / hủy đơn đặt phòng #${bookingId}.`,
      });
    } catch (err) {
      setFeedback({
        open: true,
        severity: "error",
        message:
          err.response?.data?.message ||
          "Không thể cập nhật trạng thái đơn đặt phòng (hãy kiểm tra lại backend nếu vừa cập nhật).",
      });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const kpiCards = [
    {
      label: "Doanh thu ghi nhận",
      value: formatHostPrice(summaryMetrics.confirmedRevenue),
      sub:
        summaryMetrics.pendingRevenue > 0
          ? `Chờ thanh toán: ${formatHostPrice(summaryMetrics.pendingRevenue)}`
          : "Tổng hợp từ đơn đã thanh toán & hoàn thành",
      icon: <PaidIcon />,
      accentBg: "rgba(16, 185, 129, 0.12)",
      accentColor: "#059669",
    },
    {
      label: "Đơn đặt phòng",
      value: summaryMetrics.totalBookings,
      sub: `${summaryMetrics.completedOrPaidCount} hoàn tất • ${summaryMetrics.pendingBookingsCount} chờ xử lý`,
      icon: <BookOnlineIcon />,
      accentBg: "rgba(2, 132, 199, 0.12)",
      accentColor: "#0284C7",
    },
    {
      label: "Đánh giá của khách",
      value: summaryMetrics.totalReviews,
      sub:
        summaryMetrics.totalReviews > 0
          ? `${summaryMetrics.positiveRate}% phản hồi tích cực (${summaryMetrics.positiveReviews}/${summaryMetrics.totalReviews})`
          : "Chưa có lượt nhận xét chi tiết",
      icon: <ReviewIcon />,
      accentBg: "rgba(245, 158, 11, 0.14)",
      accentColor: "#D97706",
    },
    {
      label: "Mức độ sẵn sàng & Tiện nghi",
      value: `${summaryMetrics.readyPropertiesCount}/${scopedProperties.length} phòng`,
      sub: `Trung bình ${summaryMetrics.avgAmenities} tiện nghi / chỗ ở`,
      icon: <HomeWorkIcon />,
      accentBg: "rgba(255, 56, 92, 0.12)",
      accentColor: "#E11D48",
    },
  ];

  return (
    <Box component="section" sx={{ pt: 3, minWidth: 0 }}>
      {/* Thanh tiêu đề & bộ lọc phạm vi phân tích */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            id="host-analytics-heading"
            component="h2"
            variant="h5"
            sx={{ fontWeight: 750, color: "var(--rn-text-primary)" }}
          >
            Thống kê & Quản lý vận hành Host
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "var(--rn-text-secondary)", mt: 0.5 }}
          >
            Phân tích trực quan doanh thu, giá niêm yết, điểm đánh giá và quản lý nhanh chỗ ở, đơn đặt phòng của bạn.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
            <InputLabel id="host-analytics-property-filter-label">
              Phạm vi chỗ ở
            </InputLabel>
            <Select
              labelId="host-analytics-property-filter-label"
              label="Phạm vi chỗ ở"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              <MenuItem value="all">
                Tất cả chỗ ở ({normalizedProperties.length})
              </MenuItem>
              {normalizedProperties.map((prop) => (
                <MenuItem key={prop.id} value={String(prop.id)}>
                  {truncateLabel(prop.title, 32)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 165 } }}>
            <InputLabel id="host-analytics-period-filter-label">
              Kỳ biểu đồ
            </InputLabel>
            <Select
              labelId="host-analytics-period-filter-label"
              label="Kỳ biểu đồ"
              value={periodMonths}
              onChange={(e) => setPeriodMonths(Number(e.target.value))}
            >
              <MenuItem value={6}>6 tháng gần đây</MenuItem>
              <MenuItem value={12}>12 tháng gần đây</MenuItem>
              <MenuItem value={0}>Toàn năm (12 tháng)</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
            disabled={propertiesLoading || bookingsLoading}
            sx={{
              minHeight: 40,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Làm mới
          </Button>
        </Stack>
      </Stack>

      {propertiesError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {propertiesError}
        </Alert>
      )}

      {/* 4 chỉ số vận hành chuyên sâu dành riêng cho mục Thống kê & Quản lý */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                height: "100%",
                borderRadius: 3,
                bgcolor: "var(--rn-surface)",
                border: "1px solid var(--rn-border)",
                boxShadow: "var(--rn-shadow-sm)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
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
                    sx={{
                      color: "var(--rn-text-secondary)",
                      fontWeight: 600,
                      mb: 0.75,
                    }}
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 750,
                      color: "var(--rn-text-primary)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {propertiesLoading && bookingsLoading ? "—" : card.value}
                  </Typography>
                </Box>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 42,
                    height: 42,
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
                  mt: 1.5,
                  pt: 1.25,
                  borderTop: "1px dashed var(--rn-border)",
                  color: "var(--rn-text-secondary)",
                  display: "block",
                }}
              >
                {card.sub}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Hàng biểu đồ 1: Hiệu suất từng chỗ ở + Cơ cấu trạng thái */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              border: "1px solid var(--rn-border)",
              bgcolor: "var(--rn-surface)",
              boxShadow: "var(--rn-shadow-sm)",
              height: "100%",
              minHeight: 390,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BarChartOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Hiệu suất theo từng chỗ ở
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Đối chiếu Giá niêm yết / đêm, Doanh thu ghi nhận và Điểm đánh giá (★)
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${propertyPerformanceRows.length} chỗ ở`}
                sx={{
                  bgcolor: "rgba(255, 56, 92, 0.1)",
                  color: "primary.main",
                  fontWeight: 600,
                }}
              />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ position: "relative", flex: 1, minHeight: 280 }}>
              {propertiesLoading ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ height: "100%", minHeight: 260 }}
                >
                  <CircularProgress size={32} />
                </Stack>
              ) : propertyPerformanceRows.length === 0 ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={1.25}
                  sx={{ height: "100%", minHeight: 260, textAlign: "center", px: 2 }}
                >
                  <HomeWorkIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Chưa có chỗ ở nào để phân tích
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Đăng chỗ ở đầu tiên để xem biểu đồ đối chiếu giá, doanh thu và điểm đánh giá.
                  </Typography>
                  {onAddProperty && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={onAddProperty}
                      sx={{ mt: 1, textTransform: "none", borderRadius: 2 }}
                    >
                      Thêm chỗ ở mới
                    </Button>
                  )}
                </Stack>
              ) : (
                <canvas
                  ref={propertyChartRef}
                  aria-label="Biểu đồ so sánh giá mỗi đêm, doanh thu và điểm sao của từng chỗ ở"
                  role="img"
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              border: "1px solid var(--rn-border)",
              bgcolor: "var(--rn-surface)",
              boxShadow: "var(--rn-shadow-sm)",
              height: "100%",
              minHeight: 390,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DonutIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Cơ cấu trạng thái
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Tỷ trọng chỗ ở hoặc đơn đặt phòng theo tình trạng
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75}>
                <Chip
                  size="small"
                  clickable
                  label="Chỗ ở"
                  color={breakdownMode === "properties" ? "primary" : "default"}
                  variant={breakdownMode === "properties" ? "filled" : "outlined"}
                  onClick={() => setBreakdownMode("properties")}
                />
                <Chip
                  size="small"
                  clickable
                  label="Đơn đặt"
                  color={breakdownMode === "bookings" ? "primary" : "default"}
                  variant={breakdownMode === "bookings" ? "filled" : "outlined"}
                  onClick={() => setBreakdownMode("bookings")}
                />
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {statusBreakdown.total === 0 ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ flex: 1, minHeight: 250, textAlign: "center", px: 2 }}
              >
                <DonutIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {breakdownMode === "bookings"
                    ? "Chưa phát sinh đơn đặt phòng"
                    : "Chưa có dữ liệu chỗ ở"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {breakdownMode === "bookings"
                    ? "Khi khách đặt chỗ ở của bạn, tỷ trọng trạng thái đơn sẽ hiển thị tại đây."
                    : "Hãy thêm chỗ ở để theo dõi tỷ lệ phòng đang hoạt động."}
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ flex: 1, justifyContent: "space-between" }}>
                <Box sx={{ position: "relative", height: 195 }}>
                  <canvas
                    ref={doughnutChartRef}
                    aria-label="Biểu đồ tròn thể hiện cơ cấu trạng thái"
                    role="img"
                  />
                </Box>
                <Stack spacing={1}>
                  {statusBreakdown.items.map((item) => {
                    const pct =
                      statusBreakdown.total > 0
                        ? Math.round((item.count / statusBreakdown.total) * 100)
                        : 0;
                    return (
                      <Stack
                        key={item.label}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 2,
                          bgcolor: "var(--rn-surface-subtle)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: item.color,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.count} ({pct}%)
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Hàng biểu đồ 2: Xu hướng theo tháng + Phân bố điểm sao & Cảm xúc AI */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              border: "1px solid var(--rn-border)",
              bgcolor: "var(--rn-surface)",
              boxShadow: "var(--rn-shadow-sm)",
              height: "100%",
              minHeight: 370,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TimelineIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Xu hướng Doanh thu, Đơn đặt & Đánh giá theo tháng
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Theo dõi biến động dòng tiền và tương tác khách hàng qua từng tháng
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ position: "relative", flex: 1, minHeight: 260 }}>
              {!monthlySeries.hasAnyActivity && !bookingsLoading && (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={0.75}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    bgcolor: "rgba(255, 255, 255, 0.86)",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <TimelineIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Chưa có giao dịch hoặc đánh giá mới trong kỳ đã chọn
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360 }}>
                    Biểu đồ sẽ tự động vẽ đường xu hướng doanh thu, số đơn đặt và lượt nhận xét ngay khi phát sinh hoạt động.
                  </Typography>
                </Stack>
              )}
              <canvas
                ref={trendChartRef}
                aria-label="Biểu đồ xu hướng doanh thu, đơn đặt phòng và đánh giá theo tháng"
                role="img"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              border: "1px solid var(--rn-border)",
              bgcolor: "var(--rn-surface)",
              boxShadow: "var(--rn-shadow-sm)",
              height: "100%",
              minHeight: 370,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ mb: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <StarIcon sx={{ color: "#F59E0B" }} fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Phân bố Điểm sao & Cảm xúc khách hàng
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {starDistribution.fromPropertyAvg
                  ? "Phân bố theo mức điểm sao trung bình hiện tại của các chỗ ở"
                  : "Thống kê mức sao (1★–5★) và phân tích sắc thái đánh giá"}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ position: "relative", flex: 1, minHeight: 185 }}>
              <canvas
                ref={ratingChartRef}
                aria-label="Biểu đồ phân bố điểm đánh giá từ 1 đến 5 sao"
                role="img"
              />
            </Box>

            {/* Thanh Bullet tỷ lệ cảm xúc tích cực / tiêu cực */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: "var(--rn-surface-subtle)",
                border: "1px solid var(--rn-border)",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 0.75 }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Chỉ số hài lòng từ nhận xét (AI Sentiment)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summaryMetrics.totalReviews > 0
                    ? `${summaryMetrics.positiveReviews} tích cực • ${summaryMetrics.negativeReviews} tiêu cực`
                    : "Chưa có nhận xét văn bản"}
                </Typography>
              </Stack>
              <Box
                sx={{
                  height: 10,
                  borderRadius: 999,
                  overflow: "hidden",
                  bgcolor: "rgba(148, 163, 184, 0.25)",
                  display: "flex",
                }}
              >
                {summaryMetrics.totalReviews > 0 && (
                  <>
                    <Box
                      sx={{
                        width: `${summaryMetrics.positiveRate}%`,
                        bgcolor: "#10B981",
                      }}
                    />
                    <Box
                      sx={{
                        width: `${Math.max(0, 100 - summaryMetrics.positiveRate)}%`,
                        bgcolor:
                          summaryMetrics.negativeReviews > 0
                            ? "#EF4444"
                            : "rgba(148, 163, 184, 0.25)",
                      }}
                    />
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Khu vực Quản lý 1: Bảng hiệu suất & Quản lý nhanh từng chỗ ở */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 3,
          border: "1px solid var(--rn-border)",
          bgcolor: "var(--rn-surface)",
          boxShadow: "var(--rn-shadow-sm)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography
              id="host-property-management-table-title"
              component="h3"
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Quản lý hiệu suất từng chỗ ở
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi giá, đánh giá, lượt đặt và chỉnh sửa nhanh thông tin từng tài sản.
            </Typography>
          </Box>
          {onAddProperty && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={onAddProperty}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Thêm chỗ ở mới
            </Button>
          )}
        </Stack>

        <TableContainer
          role="region"
          aria-labelledby="host-property-management-table-title"
          tabIndex={0}
          sx={{
            maxHeight: 420,
            overflow: "auto",
            containerType: "inline-size",
            borderRadius: 2,
            border: "1px solid var(--rn-border)",
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  scope="col"
                  sx={{
                    fontWeight: 700,
                    position: "sticky",
                    insetInlineStart: 0,
                    zIndex: 3,
                    bgcolor: "var(--rn-surface)",
                  }}
                >
                  Chỗ ở
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Giá / đêm</TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Đánh giá</TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Đơn đặt & Doanh thu</TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Tiện nghi</TableCell>
                <TableCell scope="col" align="right" sx={{ fontWeight: 700 }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {propertyPerformanceRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có chỗ ở nào trong phạm vi đang chọn.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                propertyPerformanceRows.map((row) => {
                  const statusMeta = propertyStatuses[row.status] || {
                    label: row.status || "Chưa cập nhật",
                    color: "default",
                  };
                  const coverUrl = row.images?.[0] ? getMediaUrl(row.images[0]) : "";
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          position: "sticky",
                          insetInlineStart: 0,
                          zIndex: 1,
                          bgcolor: "var(--rn-surface)",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            variant="rounded"
                            src={coverUrl}
                            alt={row.title}
                            sx={{ width: 48, height: 38, borderRadius: 1.5 }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700, maxWidth: 230 }}
                              noWrap
                            >
                              {row.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {[row.city, row.country].filter(Boolean).join(", ") ||
                                row.address ||
                                "Chưa cập nhật vị trí"}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusMeta.label}
                          color={statusMeta.color}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        {formatHostPrice(row.price)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <StarIcon sx={{ fontSize: 17, color: "#F59E0B" }} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {row.ratingValue > 0 ? row.ratingValue.toFixed(1) : "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({row.reviewCount})
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.bookingCount} đơn
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatHostPrice(row.revenue)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${row.amenityCount} tiện nghi`}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          {onEditProperty && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              aria-label={`Sửa ${row.title}`}
                              onClick={() => onEditProperty(row.raw)}
                              sx={{ textTransform: "none", borderRadius: 1.5 }}
                            >
                              Sửa
                            </Button>
                          )}
                          <Button
                            size="small"
                            component={RouterLink}
                            to={`/property/${row.id}`}
                            aria-label={`Xem ${row.title}`}
                            endIcon={<LaunchIcon fontSize="inherit" />}
                            sx={{ textTransform: "none", borderRadius: 1.5 }}
                          >
                            Xem
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Khu vực Quản lý 2: Danh sách & Xử lý đơn đặt phòng của khách */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: "1px solid var(--rn-border)",
          bgcolor: "var(--rn-surface)",
          boxShadow: "var(--rn-shadow-sm)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography
              id="host-bookings-management-table-title"
              component="h3"
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Quản lý đơn đặt phòng của khách
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tra cứu lịch nhận – trả phòng và xác nhận hoặc từ chối các yêu cầu đặt phòng đang chờ.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              size="small"
              label="Tìm khách, mã đơn, chỗ ở"
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: "100%", sm: 230 } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 175 } }}>
              <InputLabel id="host-booking-status-filter-label">
                Trạng thái đơn
              </InputLabel>
              <Select
                labelId="host-booking-status-filter-label"
                label="Trạng thái đơn"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tất cả ({scopedBookings.length})</MenuItem>
                <MenuItem value="PENDING">Chờ xác nhận</MenuItem>
                <MenuItem value="CONFIRMED">Đã xác nhận</MenuItem>
                <MenuItem value="PAID">Đã thanh toán</MenuItem>
                <MenuItem value="SUCCESS">Hoàn thành</MenuItem>
                <MenuItem value="CANCELLED">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <TableContainer
          role="region"
          aria-labelledby="host-bookings-management-table-title"
          tabIndex={0}
          sx={{
            maxHeight: 440,
            overflow: "auto",
            containerType: "inline-size",
            borderRadius: 2,
            border: "1px solid var(--rn-border)",
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  scope="col"
                  sx={{
                    fontWeight: 700,
                    position: "sticky",
                    insetInlineStart: 0,
                    zIndex: 3,
                    bgcolor: "var(--rn-surface)",
                  }}
                >
                  Mã / Khách đặt
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Chỗ ở</TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Nhận – Trả phòng</TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Tổng tiền</TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                <TableCell scope="col" align="right" sx={{ fontWeight: 700 }}>
                  Xử lý
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookingsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có đơn đặt phòng nào khớp với bộ lọc hiện tại.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => {
                  const statusMeta = getBookingStatusMeta(booking.bookingStatus);
                  const isUpdating = updatingBookingId === booking.bookingId;
                  const canConfirm = booking.bookingStatus === "PENDING";
                  const canCancel =
                    booking.bookingStatus === "PENDING" ||
                    booking.bookingStatus === "CONFIRMED";

                  return (
                    <TableRow key={booking.bookingId} hover>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          position: "sticky",
                          insetInlineStart: 0,
                          zIndex: 1,
                          bgcolor: "var(--rn-surface)",
                        }}
                      >
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            src={
                              booking.guestAvatar
                                ? getMediaUrl(booking.guestAvatar)
                                : undefined
                            }
                            alt={booking.guestName}
                            sx={{ width: 34, height: 34, fontSize: 14 }}
                          >
                            {booking.guestName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {booking.guestName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              #{booking.bookingId}
                              {booking.guestEmail ? ` • ${booking.guestEmail}` : ""}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, maxWidth: 210 }}
                          noWrap
                        >
                          {booking.title}
                        </Typography>
                        {booking.city && (
                          <Typography variant="caption" color="text.secondary">
                            {booking.city}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2">
                          {formatHostDate(booking.checkInDate)} →{" "}
                          {formatHostDate(booking.checkOutDate)}
                        </Typography>
                        {booking.nights > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {booking.nights} đêm
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        {formatHostPrice(booking.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusMeta.label}
                          color={statusMeta.color}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {canConfirm || canCancel ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            {canConfirm && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={isUpdating}
                                startIcon={<CheckIcon />}
                                aria-label={`Xác nhận đơn #${booking.bookingId}`}
                                onClick={() =>
                                  handleBookingStatusAction(
                                    booking.bookingId,
                                    "CONFIRMED"
                                  )
                                }
                                sx={{ textTransform: "none", borderRadius: 1.5 }}
                              >
                                Xác nhận
                              </Button>
                            )}
                            {canCancel && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                disabled={isUpdating}
                                startIcon={<CancelIcon />}
                                aria-label={`Từ chối đơn #${booking.bookingId}`}
                                onClick={() =>
                                  handleBookingStatusAction(
                                    booking.bookingId,
                                    "CANCELLED"
                                  )
                                }
                                sx={{ textTransform: "none", borderRadius: 1.5 }}
                              >
                                Từ chối
                              </Button>
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Đã chốt trạng thái
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={feedback.open}
        autoHideDuration={3500}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

HostAnalyticsManagement.propTypes = {
  onAddProperty: PropTypes.func,
  onEditProperty: PropTypes.func,
  onReloadProperties: PropTypes.func,
  properties: PropTypes.arrayOf(PropTypes.object),
  propertiesError: PropTypes.string,
  propertiesLoading: PropTypes.bool,
};

HostAnalyticsManagement.defaultProps = {
  onAddProperty: undefined,
  onEditProperty: undefined,
  onReloadProperties: undefined,
  properties: [],
  propertiesError: "",
  propertiesLoading: false,
};
