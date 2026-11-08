import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { MAPTILER_API_KEY } from "@/shared/config/ui.js";
import { formatNightlyPrice } from "@/features/search/components/results/ListingCards.jsx";
import {
  formatCanonicalCity,
  geocodeAddress,
  isValidCoordinate,
  resolveFallbackCoordinate,
} from "@/features/listings/utils/propertyCoordinates.js";
import "@/features/search/components/results/SearchMap.css";

if (MAPTILER_API_KEY) {
  maptilersdk.config.apiKey = MAPTILER_API_KEY;
}

const getMapTilerStyleUrl = (isDarkMode) =>
  `https://api.maptiler.com/maps/${
    isDarkMode ? "streets-v2-dark" : "streets-v2"
  }/style.json?key=${encodeURIComponent(MAPTILER_API_KEY)}`;

const PropertyMap = ({
  id,
  title,
  address,
  city,
  country,
  price,
  latitude,
  longitude,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const appliedStyleModeRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const hasBackendCoords = isValidCoordinate(latitude, longitude);
  const initialCoords = useMemo(() => {
    if (hasBackendCoords) {
      return { latitude: Number(latitude), longitude: Number(longitude) };
    }
    return resolveFallbackCoordinate({ id, address, city, country });
  }, [hasBackendCoords, latitude, longitude, id, address, city, country]);

  const [coordinates, setCoordinates] = useState(initialCoords);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    setCoordinates(initialCoords);
    if (hasBackendCoords) return undefined;

    const controller = new AbortController();
    geocodeAddress({
      id,
      address,
      city,
      country,
      signal: controller.signal,
    })
      .then((resolved) => {
        if (!controller.signal.aborted && resolved && isValidCoordinate(resolved.latitude, resolved.longitude)) {
          setCoordinates(resolved);
        }
      })
      .catch(() => {
        // Giữ tọa độ dự phòng khi hủy request
      });

    return () => controller.abort();
  }, [hasBackendCoords, initialCoords, id, address, city, country]);

  const canonicalCity = useMemo(
    () => formatCanonicalCity(city, address),
    [city, address]
  );

  const fullAddress = useMemo(
    () =>
      [address, canonicalCity || city, country].filter(Boolean).join(", ") ||
      "Việt Nam",
    [address, canonicalCity, city, country]
  );

  const googleMapsUrl = useMemo(() => {
    if (isValidCoordinate(coordinates.latitude, coordinates.longitude)) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${coordinates.latitude},${coordinates.longitude}`
      )}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      fullAddress
    )}`;
  }, [coordinates, fullAddress]);

  const recenterMap = useCallback(() => {
    if (!mapRef.current || !isValidCoordinate(coordinates.latitude, coordinates.longitude)) {
      return;
    }
    mapRef.current.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: 15,
      duration: prefersReducedMotion ? 0 : 550,
    });
  }, [coordinates, prefersReducedMotion]);

  useEffect(() => {
    if (!MAPTILER_API_KEY) {
      setMapError("Chưa cấu hình khóa bản đồ MapTiler.");
      return undefined;
    }
    if (!mapContainerRef.current || mapRef.current) return undefined;

    try {
      setMapError("");
      const initialDark = isDarkRef.current;
      appliedStyleModeRef.current = initialDark ? "dark" : "light";
      const instance = new maptilersdk.Map({
        container: mapContainerRef.current,
        style: getMapTilerStyleUrl(initialDark),
        center: [initialCoords.longitude, initialCoords.latitude],
        zoom: 15,
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

      mapRef.current = instance;
    } catch {
      setMapError("Không thể khởi tạo bản đồ vị trí chỗ nghỉ.");
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      appliedStyleModeRef.current = null;
      setMapReady(false);
    };
  }, [initialCoords]);

  useEffect(() => {
    if (!mapRef.current || !MAPTILER_API_KEY) return;
    const nextMode = isDark ? "dark" : "light";
    if (appliedStyleModeRef.current === nextMode) return;
    appliedStyleModeRef.current = nextMode;
    try {
      mapRef.current.setStyle(getMapTilerStyleUrl(isDark));
    } catch {
      // Bỏ qua nếu style đang chuyển tiếp
    }
  }, [isDark]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!isValidCoordinate(coordinates.latitude, coordinates.longitude)) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const pin = document.createElement("div");
    pin.className = "rn-property-detail-pin";
    pin.textContent =
      Number(price) > 0
        ? `${formatNightlyPrice(price)} ₫ / đêm`
        : title || "Vị trí chỗ nghỉ";

    markerRef.current = new maptilersdk.Marker({
      element: pin,
      anchor: "bottom",
    })
      .setLngLat([coordinates.longitude, coordinates.latitude])
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: 15,
      duration: prefersReducedMotion ? 0 : 450,
    });
  }, [mapReady, coordinates, price, title, prefersReducedMotion]);

  return (
    <Paper
      component="section"
      aria-labelledby="property-map-heading"
      elevation={0}
      className="rn-map-showcase"
      sx={{
        mt: { xs: 3, md: 4 },
        p: { xs: 2.5, sm: 3.5, md: 4 },
        borderRadius: "22px",
        bgcolor: "var(--rn-surface-card, #FFFFFF)",
        border: "1px solid var(--rn-border-subtle, #E2E8F0)",
        boxShadow: "var(--rn-shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.06))",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack spacing={0.6} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography
              id="property-map-heading"
              component="h2"
              variant="h5"
              sx={{
                fontWeight: 800,
                fontFamily: "var(--rn-font-display)",
                color: "var(--rn-text-primary)",
                fontSize: { xs: "1.2rem", sm: "1.4rem" },
              }}
            >
              Vị trí chỗ nghỉ trên bản đồ
            </Typography>
            {(canonicalCity || city) && (
              <Chip
                size="small"
                label={canonicalCity || city}
                sx={{
                  fontWeight: 700,
                  bgcolor: "var(--rn-teal-soft, rgba(15, 118, 110, 0.1))",
                  color: "var(--rn-teal, #0F766E)",
                }}
              />
            )}
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <PlaceOutlinedIcon
              sx={{
                fontSize: 18,
                color: isDark ? "primary.light" : "var(--rn-brand-primary, #D91B42)",
              }}
            />
            <Typography variant="body2" sx={{ color: "var(--rn-text-secondary)", fontWeight: 500 }}>
              {fullAddress}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
          <Button
            type="button"
            size="small"
            variant="outlined"
            startIcon={<MyLocationRoundedIcon fontSize="small" />}
            onClick={recenterMap}
            sx={{
              minHeight: 40,
              px: 1.75,
              borderRadius: "12px",
              fontWeight: 700,
              textTransform: "none",
              borderColor: "var(--rn-border-subtle, #E2E8F0)",
              color: "var(--rn-text-primary)",
            }}
          >
            Đặt lại vị trí
          </Button>
          <Button
            component="a"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="contained"
            color="primary"
            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
            sx={{
              minHeight: 40,
              px: 2,
              borderRadius: "12px",
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "primary.dark",
                color: "#FFFFFF",
              },
            }}
          >
            Mở Google Maps
          </Button>
        </Stack>
      </Stack>

      {mapError ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {mapError}
        </Alert>
      ) : (
        <Box
          className="rn-map-canvas-shell"
          sx={{
            height: { xs: 360, sm: 440, md: 490 },
          }}
        >
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
        </Box>
      )}
    </Paper>
  );
};

PropertyMap.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string,
  address: PropTypes.string,
  city: PropTypes.string,
  country: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  latitude: PropTypes.number,
  longitude: PropTypes.number,
};

export default PropertyMap;
