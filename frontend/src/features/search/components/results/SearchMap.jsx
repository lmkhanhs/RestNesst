import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import UnfoldLessRoundedIcon from "@mui/icons-material/UnfoldLessRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import { MAPTILER_API_KEY } from "@/shared/config/ui.js";
import {
  formatNightlyPrice,
  getImageUrl,
} from "@/features/search/components/results/ListingCards.jsx";
import {
  buildImmediateMapProperties,
  geocodeAddress,
  isValidCoordinate,
  spreadOverlappingMarkers,
} from "@/features/listings/utils/propertyCoordinates.js";
import "./SearchMap.css";

if (MAPTILER_API_KEY) {
  maptilersdk.config.apiKey = MAPTILER_API_KEY;
}

const DEFAULT_VN_VIEW = { lng: 106.7009, lat: 10.7769, zoom: 12 };

const getMapTilerStyleUrl = (isDarkMode) =>
  `https://api.maptiler.com/maps/${
    isDarkMode ? "streets-v2-dark" : "streets-v2"
  }/style.json?key=${encodeURIComponent(MAPTILER_API_KEY)}`;

const SearchMap = ({
  data = [],
  id = "ban-do-cho-o",
  collapsed = false,
  onToggleCollapse,
  onScrollToList,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const appliedStyleModeRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersMapRef = useRef(new globalThis.Map());
  const stripItemRefs = useRef(new globalThis.Map());
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [resolvedProperties, setResolvedProperties] = useState([]);
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);

  // Chuẩn bị dữ liệu tọa độ tức thì + tinh chỉnh qua geocoding nếu bản ghi cũ chưa có tọa độ từ Backend
  useEffect(() => {
    const immediate = buildImmediateMapProperties(data);
    setResolvedProperties(immediate);

    const needsClientGeocode = immediate.some((item) => !item.hasBackendCoords);
    if (!needsClientGeocode || immediate.length === 0) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        const refined = await Promise.all(
          immediate.map(async (item) => {
            if (item.hasBackendCoords) return item;
            const coords = await geocodeAddress({
              id: item.id,
              address: data.find((raw) => String(raw.id) === String(item.id))?.address,
              city: item.city,
              country: item.country,
              signal: controller.signal,
            });
            if (!coords || !isValidCoordinate(coords.latitude, coords.longitude)) {
              return item;
            }
            return {
              ...item,
              latitude: coords.latitude,
              longitude: coords.longitude,
            };
          })
        );
        if (active && !controller.signal.aborted) {
          setResolvedProperties(spreadOverlappingMarkers(refined));
        }
      } catch {
        // Giữ nguyên tọa độ dự phòng khi hủy request
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [data]);

  const cityGroups = useMemo(() => {
    const counts = new globalThis.Map();
    resolvedProperties.forEach((item) => {
      const city = item.displayCity || "Việt Nam";
      counts.set(city, (counts.get(city) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([city, count]) => ({ city, count }));
  }, [resolvedProperties]);

  useEffect(() => {
    if (
      selectedCity !== "ALL" &&
      !cityGroups.some((group) => group.city === selectedCity)
    ) {
      setSelectedCity("ALL");
    }
  }, [cityGroups, selectedCity]);

  const visibleProperties = useMemo(() => {
    if (selectedCity === "ALL") return resolvedProperties;
    return resolvedProperties.filter((item) => item.displayCity === selectedCity);
  }, [resolvedProperties, selectedCity]);

  const selectedProperty = useMemo(
    () =>
      visibleProperties.find((item) => String(item.id) === String(selectedId)) ||
      null,
    [visibleProperties, selectedId]
  );

  // Đóng thẻ xem nhanh khi nhấn phím Escape
  useEffect(() => {
    if (!selectedProperty) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProperty]);

  const fitMapToProperties = useCallback(
    (items) => {
      const mapInstance = mapRef.current;
      if (!mapInstance || !Array.isArray(items) || items.length === 0) return;

      const validItems = items.filter((item) =>
        isValidCoordinate(item.latitude, item.longitude)
      );
      if (validItems.length === 0) return;

      if (validItems.length === 1) {
        mapInstance.flyTo({
          center: [validItems[0].longitude, validItems[0].latitude],
          zoom: 14,
          duration: prefersReducedMotion ? 0 : 550,
        });
        return;
      }

      const bounds = new maptilersdk.LngLatBounds();
      validItems.forEach((item) => {
        bounds.extend([item.longitude, item.latitude]);
      });

      mapInstance.fitBounds(bounds, {
        padding: { top: 72, bottom: 92, left: 72, right: 72 },
        maxZoom: 14.5,
        duration: prefersReducedMotion ? 0 : 650,
      });
    },
    [prefersReducedMotion]
  );

  const handleSelectProperty = useCallback(
    (property, shouldScrollStrip = true) => {
      if (!property) return;
      setSelectedId(property.id);
      if (mapRef.current && isValidCoordinate(property.latitude, property.longitude)) {
        const currentZoom = mapRef.current.getZoom();
        mapRef.current.flyTo({
          center: [property.longitude, property.latitude],
          zoom: Math.max(currentZoom, 13.8),
          duration: prefersReducedMotion ? 0 : 500,
        });
      }
      if (shouldScrollStrip) {
        const node = stripItemRefs.current.get(String(property.id));
        node?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          inline: "nearest",
          block: "nearest",
        });
      }
    },
    [prefersReducedMotion]
  );

  // Khởi tạo đối tượng MapTiler một lần khi khu vực bản đồ mở
  useEffect(() => {
    if (collapsed) return undefined;
    if (!MAPTILER_API_KEY) {
      setMapError("Chưa cấu hình khóa bản đồ MapTiler.");
      return undefined;
    }
    if (mapRef.current || !mapContainerRef.current) {
      mapRef.current?.resize();
      return undefined;
    }

    const currentMarkers = markersMapRef.current;

    try {
      setMapError("");
      const initialDark = isDarkRef.current;
      appliedStyleModeRef.current = initialDark ? "dark" : "light";
      const instance = new maptilersdk.Map({
        container: mapContainerRef.current,
        style: getMapTilerStyleUrl(initialDark),
        center: [DEFAULT_VN_VIEW.lng, DEFAULT_VN_VIEW.lat],
        zoom: DEFAULT_VN_VIEW.zoom,
        navigationControl: false,
        geolocateControl: false,
      });

      instance.addControl(new maptilersdk.NavigationControl(), "top-right");
      instance.addControl(
        new maptilersdk.ScaleControl({ maxWidth: 110, unit: "metric" }),
        "bottom-right"
      );

      instance.on("load", () => {
        setMapReady(true);
        instance.resize();
      });

      instance.on("error", () => {
        // Không ghi đè nếu các tile phụ tải chậm tạm thời
      });

      mapRef.current = instance;
    } catch {
      setMapError("Không thể khởi tạo khung bản đồ tương tác.");
    }

    return () => {
      currentMarkers.forEach(({ marker }) => marker.remove());
      currentMarkers.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      appliedStyleModeRef.current = null;
      setMapReady(false);
    };
  }, [collapsed]);

  // Chuyển nền bản đồ sáng/tối mượt mà khi người dùng đổi giao diện
  useEffect(() => {
    if (collapsed || !mapRef.current || !MAPTILER_API_KEY) return;
    const nextMode = isDark ? "dark" : "light";
    if (appliedStyleModeRef.current === nextMode) return;
    appliedStyleModeRef.current = nextMode;
    try {
      mapRef.current.setStyle(getMapTilerStyleUrl(isDark));
    } catch {
      // Bỏ qua nếu style đang chuyển tiếp
    }
  }, [collapsed, isDark]);

  // Đồng bộ các ghim giá VNĐ khi danh sách hiển thị thay đổi
  useEffect(() => {
    if (collapsed || !mapReady || !mapRef.current) return;

    markersMapRef.current.forEach(({ marker }) => marker.remove());
    markersMapRef.current.clear();

    visibleProperties.forEach((property) => {
      if (!isValidCoordinate(property.latitude, property.longitude)) return;

      const priceLabel = `${formatNightlyPrice(property.price)} ₫`;
      const wrapper = document.createElement("div");
      wrapper.className = "rn-map-marker-wrapper";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "rn-map-price-pin";
      button.textContent = priceLabel;
      button.setAttribute(
        "aria-label",
        `${priceLabel} — ${property.name}, ${property.displayCity}`
      );

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        handleSelectProperty(property, true);
      });

      wrapper.appendChild(button);

      const marker = new maptilersdk.Marker({
        element: wrapper,
        anchor: "bottom",
      })
        .setLngLat([property.longitude, property.latitude])
        .addTo(mapRef.current);

      markersMapRef.current.set(String(property.id), {
        marker,
        wrapper,
        button,
      });
    });

    fitMapToProperties(visibleProperties);
  }, [collapsed, mapReady, visibleProperties, fitMapToProperties, handleSelectProperty]);

  // Cập nhật trạng thái ghim đang chọn mà không tạo lại bản đồ
  useEffect(() => {
    markersMapRef.current.forEach(({ wrapper, button }, key) => {
      const isActive = String(selectedId) === key;
      wrapper.classList.toggle("rn-map-marker-wrapper--active", isActive);
      button.classList.toggle("rn-map-price-pin--active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }, [selectedId, visibleProperties]);

  return (
    <Paper
      id={id}
      component="section"
      aria-labelledby="rn-map-showcase-heading"
      elevation={0}
      className="rn-map-showcase"
      sx={{
        p: { xs: 2, sm: 2.75, md: 3.25 },
        borderRadius: 4,
        bgcolor: "var(--rn-surface)",
        border: "1px solid",
        borderColor: "var(--rn-border)",
        boxShadow: "var(--rn-shadow-sm)",
      }}
    >
      {/* Thanh tiêu đề & điều khiển vùng bản đồ */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: collapsed ? 0 : 2.25 }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "11px",
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, isDark ? 0.3 : 0.18),
                color: isDark ? "primary.light" : "primary.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MapOutlinedIcon aria-hidden="true" sx={{ fontSize: 21 }} />
            </Box>
            <Typography
              id="rn-map-showcase-heading"
              component="h2"
              variant="h5"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.15rem", sm: "1.35rem" },
                letterSpacing: "-0.015em",
                color: "text.primary",
              }}
            >
              Bản đồ khám phá chỗ ở
            </Typography>
            <Chip
              size="small"
              label={`${visibleProperties.length} điểm lưu trú`}
              sx={{
                fontWeight: 700,
                bgcolor: "var(--rn-teal-soft, rgba(15, 118, 110, 0.1))",
                color: "var(--rn-teal, #0F766E)",
              }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Nhấn vào từng mức giá trên bản đồ hoặc chọn nhanh thẻ bên dưới để xem vị trí và giá mỗi đêm.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {!collapsed && visibleProperties.length > 0 && (
            <Button
              type="button"
              size="small"
              variant="outlined"
              startIcon={<MyLocationRoundedIcon fontSize="small" />}
              onClick={() => {
                setSelectedId(null);
                fitMapToProperties(visibleProperties);
              }}
              sx={{
                minHeight: 38,
                px: 1.75,
                borderRadius: "10px",
                fontWeight: 700,
                textTransform: "none",
                borderColor: "divider",
                color: "text.primary",
              }}
            >
              Xem toàn bộ vị trí
            </Button>
          )}
          {onScrollToList && (
            <Button
              type="button"
              size="small"
              variant="outlined"
              startIcon={<KeyboardArrowUpRoundedIcon fontSize="small" />}
              onClick={onScrollToList}
              sx={{
                minHeight: 38,
                px: 1.75,
                borderRadius: "10px",
                fontWeight: 700,
                textTransform: "none",
                borderColor: "divider",
                color: "text.secondary",
              }}
            >
              Lên danh sách phòng
            </Button>
          )}
          {onToggleCollapse && (
            <Button
              type="button"
              size="small"
              variant={collapsed ? "contained" : "text"}
              color={collapsed ? "primary" : "inherit"}
              startIcon={
                collapsed ? (
                  <UnfoldMoreRoundedIcon fontSize="small" />
                ) : (
                  <UnfoldLessRoundedIcon fontSize="small" />
                )
              }
              onClick={onToggleCollapse}
              sx={{
                minHeight: 38,
                px: 1.5,
                borderRadius: "10px",
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              {collapsed ? "Mở rộng bản đồ" : "Thu gọn"}
            </Button>
          )}
        </Stack>
      </Stack>

      {!collapsed && (
        <>
          {/* Bộ chọn nhanh theo khu vực / thành phố khi có dữ liệu */}
          {cityGroups.length > 1 && (
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              role="group"
              aria-label="Lọc nhanh điểm ghim theo thành phố"
              sx={{ mb: 2 }}
            >
              <Chip
                clickable
                onClick={() => {
                  setSelectedCity("ALL");
                  setSelectedId(null);
                }}
                label={`Tất cả khu vực (${resolvedProperties.length})`}
                color={selectedCity === "ALL" ? "primary" : "default"}
                variant={selectedCity === "ALL" ? "filled" : "outlined"}
                sx={{ fontWeight: 700, minHeight: 34 }}
              />
              {cityGroups.map((group) => (
                <Chip
                  key={group.city}
                  clickable
                  onClick={() => {
                    setSelectedCity(group.city);
                    setSelectedId(null);
                  }}
                  label={`${group.city} (${group.count})`}
                  color={selectedCity === group.city ? "primary" : "default"}
                  variant={selectedCity === group.city ? "filled" : "outlined"}
                  sx={{ fontWeight: 600, minHeight: 34 }}
                />
              ))}
            </Stack>
          )}

          {mapError ? (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {mapError}
            </Alert>
          ) : (
            <Box
              className="rn-map-canvas-shell"
              sx={{
                height: { xs: 420, sm: 500, md: 560 },
              }}
            >
              <div
                ref={mapContainerRef}
                style={{ width: "100%", height: "100%" }}
              />

              {visibleProperties.length === 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    position: "absolute",
                    inset: "auto 16px 16px 16px",
                    maxWidth: 420,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.background.paper, 0.94),
                    backdropFilter: "blur(8px)",
                    border: "1px solid",
                    borderColor: "var(--rn-border)",
                    zIndex: 5,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    Chưa có điểm lưu trú để ghim trên bản đồ
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Hãy mở rộng bộ lọc hoặc đổi từ khóa tìm kiếm để xem các chỗ ở sẵn sàng.
                  </Typography>
                </Paper>
              )}

              {/* Thẻ nổi chi tiết phòng khi người dùng chọn ghim */}
              {selectedProperty && (
                <Paper
                  elevation={0}
                  role="dialog"
                  aria-modal="false"
                  aria-label={`Thông tin nhanh ${selectedProperty.name}`}
                  sx={{
                    position: "absolute",
                    left: { xs: 12, sm: 18 },
                    right: { xs: 12, sm: "auto" },
                    bottom: { xs: 12, sm: 18 },
                    width: { sm: 360, md: 384 },
                    borderRadius: "18px",
                    overflow: "hidden",
                    bgcolor: "var(--rn-surface)",
                    border: "1px solid",
                    borderColor: "var(--rn-border)",
                    boxShadow: "var(--rn-shadow-lg)",
                    zIndex: 10,
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      aspectRatio: "16 / 9",
                      bgcolor: "var(--rn-surface-subtle)",
                    }}
                  >
                    <Box
                      component="img"
                      src={getImageUrl(
                        Array.isArray(selectedProperty.images)
                          ? selectedProperty.images[0]
                          : null
                      )}
                      alt={selectedProperty.name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {selectedProperty.popular && (
                      <Chip
                        size="small"
                        label="Được khách yêu thích"
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          fontWeight: 700,
                          bgcolor: "rgba(15, 23, 42, 0.86)",
                          color: "#FFFFFF",
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      aria-label="Đóng thẻ xem nhanh"
                      onClick={() => setSelectedId(null)}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        minWidth: 34,
                        minHeight: 34,
                        bgcolor: isDark
                          ? "rgba(15, 23, 42, 0.84)"
                          : "rgba(255, 255, 255, 0.92)",
                        color: isDark ? "#F8FAFC" : "#0F172A",
                        "&:hover": {
                          bgcolor: isDark ? "#0F172A" : "#FFFFFF",
                        },
                      }}
                    >
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Stack spacing={1.25} sx={{ p: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          lineHeight: 1.3,
                          color: "text.primary",
                        }}
                      >
                        {selectedProperty.name}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.4}
                        alignItems="center"
                        sx={{
                          px: 0.9,
                          py: 0.25,
                          borderRadius: "999px",
                          bgcolor: isDark
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(245, 158, 11, 0.14)",
                          flexShrink: 0,
                        }}
                      >
                        <StarRoundedIcon
                          sx={{ fontSize: 16, color: isDark ? "#FBBF24" : "#D97706" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: isDark ? "#FDE68A" : "#92400E",
                          }}
                        >
                          {Number(selectedProperty.avgStart) > 0
                            ? Number(selectedProperty.avgStart).toFixed(1)
                            : "Mới"}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={0.6} alignItems="flex-start">
                      <PlaceOutlinedIcon
                        sx={{
                          fontSize: 17,
                          color: isDark ? "primary.light" : "primary.main",
                          mt: "2px",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.45 }}
                      >
                        {selectedProperty.address}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        pt: 1.25,
                        borderTop: "1px solid",
                        borderColor: "var(--rn-border)",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", fontWeight: 600 }}
                        >
                          Giá mỗi đêm
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            color: isDark ? "primary.light" : "primary.dark",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatNightlyPrice(selectedProperty.price)} ₫
                        </Typography>
                      </Box>

                      <Button
                        component={RouterLink}
                        to={`/property/${selectedProperty.id}`}
                        variant="contained"
                        color="primary"
                        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />}
                        sx={{
                          minHeight: 40,
                          px: 2,
                          borderRadius: "10px",
                          fontWeight: 700,
                          textTransform: "none",
                          color: "primary.contrastText",
                          boxShadow: "none",
                          "&:hover": {
                            bgcolor: "primary.dark",
                            color: "#FFFFFF",
                          },
                        }}
                      >
                        Xem phòng
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </Box>
          )}

          {/* Dải thẻ thu nhỏ đồng bộ 2 chiều ngay dưới bản đồ rộng */}
          {visibleProperties.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box
                className="rn-map-strip"
                role="list"
                aria-label="Chọn nhanh chỗ ở để định vị trên bản đồ"
              >
                {visibleProperties.map((property) => {
                  const isSelected = String(selectedId) === String(property.id);
                  return (
                    <Box
                      key={property.id}
                      role="listitem"
                      ref={(node) => {
                        if (node) {
                          stripItemRefs.current.set(String(property.id), node);
                        } else {
                          stripItemRefs.current.delete(String(property.id));
                        }
                      }}
                      sx={{ flex: "0 0 auto" }}
                    >
                      <Button
                        type="button"
                        onClick={() => handleSelectProperty(property, false)}
                        aria-pressed={isSelected}
                        sx={{
                          p: 1,
                          pr: 1.75,
                          minHeight: 68,
                          width: { xs: 264, sm: 292 },
                          justifyContent: "flex-start",
                          textAlign: "left",
                          textTransform: "none",
                          borderRadius: "14px",
                          border: "1.5px solid",
                          borderColor: isSelected ? "primary.main" : "var(--rn-border)",
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.08)
                            : isDark
                            ? alpha("#334155", 0.55)
                            : "var(--rn-surface-subtle, #F8FAFC)",
                          color: "text.primary",
                          gap: 1.25,
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, isDark ? 0.24 : 0.12)
                              : isDark
                              ? alpha("#334155", 0.85)
                              : "background.paper",
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={getImageUrl(
                            Array.isArray(property.images) ? property.images[0] : null
                          )}
                          alt=""
                          aria-hidden="true"
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: "10px",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontWeight: 700, color: "text.primary" }}
                          >
                            {property.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            noWrap
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {property.displayCity}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: isDark ? "primary.light" : "primary.dark",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {formatNightlyPrice(property.price)} ₫ / đêm
                          </Typography>
                        </Box>
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

SearchMap.propTypes = {
  data: PropTypes.array,
  id: PropTypes.string,
  collapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
  onScrollToList: PropTypes.func,
};

export default SearchMap;
