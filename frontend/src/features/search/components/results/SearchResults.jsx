import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useState, useEffect, useMemo, useContext } from "react";
import PropTypes from "prop-types";
import CardView from "./ListingTabs.jsx";
import { FaColumns, FaMap } from "react-icons/fa";
import Map from "./SearchMap.jsx";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";

const Result = ({
  properties: defaultProperties,
  searchResults,
  isSearching,
  setIsSearching,
  setSearchResults,
  loading = false,
  error = "",
  retryAction,
}) => {
  const [view, setView] = useState("card");
  const [tabValue, setTabValue] = useState(0);
  const [mapProperties, setMapProperties] = useState([]);
  const searchCtx = useContext(SearchContext);

  // Ưu tiên hiển thị searchResults nếu đang tìm kiếm
  const properties = useMemo(
    () => (isSearching ? searchResults : defaultProperties) || [],
    [isSearching, searchResults, defaultProperties]
  );

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    if (setIsSearching) setIsSearching(false);
    if (setSearchResults) setSearchResults([]);
  };

  const handleClearSearch = () => {
    setTabValue(0);
    if (searchCtx?.updateSearchResults) {
      searchCtx.updateSearchResults([], false);
    }
    if (setIsSearching) setIsSearching(false);
    if (setSearchResults) setSearchResults([]);
  };

  // Process properties data for the map
  useEffect(() => {
    if (properties && properties.length > 0) {
      const processedProperties = properties.map((property) => ({
        ...property,
        id: property.id || "",
        latitude: property.latitude || DEFAULT_CENTER.lat,
        longitude: property.longitude || DEFAULT_CENTER.lng,
        name: property.name || property.title || "Property",
        price: property.price || 0,
        address: property.address || "Address not available",
      }));
      setMapProperties(processedProperties);
    } else {
      setMapProperties([]);
    }
  }, [properties]);

  const resultCount = isSearching
    ? searchResults?.length || 0
    : defaultProperties?.length || 0;

  return (
    <Stack sx={{ minWidth: 0 }} spacing={2}>
      {error && (
        <Alert
          severity="error"
          action={retryAction}
          sx={{
            borderRadius: 2.5,
            alignItems: "center",
            border: "1px solid",
            borderColor: "error.light",
          }}
        >
          {error}
        </Alert>
      )}

      {/* Listing Header Bar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          p: { xs: 1.75, sm: 2 },
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ fontSize: { xs: "1.05rem", sm: "1.15rem" }, fontWeight: 700 }}
          >
            {isSearching ? "Kết quả tìm kiếm & lọc phòng" : "Danh sách phòng nghỉ"}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            flexWrap="wrap"
            sx={{ mt: 0.25 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
              aria-live="polite"
            >
              {loading
                ? "Đang cập nhật danh sách chỗ ở..."
                : isSearching
                ? `Tìm thấy ${resultCount} chỗ ở phù hợp với tiêu chí của bạn`
                : `Hiển thị ${resultCount} phòng sẵn sàng đặt ngay`}
            </Typography>
            {isSearching && !loading && (
              <Button
                type="button"
                size="small"
                color="primary"
                onClick={handleClearSearch}
                sx={{
                  fontWeight: 700,
                  minHeight: 32,
                  px: 1,
                  textDecoration: "underline",
                }}
              >
                Bỏ lọc / Xem tất cả
              </Button>
            )}
          </Stack>
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          role="group"
          aria-label="Chế độ hiển thị danh sách"
          sx={{
            bgcolor: "#F1F5F9",
            p: 0.5,
            borderRadius: "12px",
            alignSelf: { xs: "flex-start", sm: "center" },
          }}
        >
          <Button
            type="button"
            onClick={() => setView("card")}
            aria-pressed={view === "card"}
            startIcon={<FaColumns size={15} aria-hidden="true" />}
            className="rn-interactive-btn"
            sx={{
              minHeight: 40,
              px: 1.75,
              borderRadius: "9px",
              fontWeight: 700,
              fontSize: "0.85rem",
              bgcolor: view === "card" ? "background.paper" : "transparent",
              color: view === "card" ? "primary.main" : "text.secondary",
              boxShadow:
                view === "card"
                  ? "0 1px 3px rgba(15, 23, 42, 0.1)"
                  : "none",
              "&:hover": {
                bgcolor:
                  view === "card"
                    ? "background.paper"
                    : "rgba(15, 23, 42, 0.05)",
              },
            }}
          >
            Xem thẻ
          </Button>
          <Button
            type="button"
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
            startIcon={<FaMap size={15} aria-hidden="true" />}
            className="rn-interactive-btn"
            sx={{
              minHeight: 40,
              px: 1.75,
              borderRadius: "9px",
              fontWeight: 700,
              fontSize: "0.85rem",
              bgcolor: view === "map" ? "background.paper" : "transparent",
              color: view === "map" ? "primary.main" : "text.secondary",
              boxShadow:
                view === "map"
                  ? "0 1px 3px rgba(15, 23, 42, 0.1)"
                  : "none",
              "&:hover": {
                bgcolor:
                  view === "map"
                    ? "background.paper"
                    : "rgba(15, 23, 42, 0.05)",
              },
            }}
          >
            Xem bản đồ
          </Button>
        </Stack>
      </Box>

      {view === "map" ? (
        <Box sx={{ width: "100%", minWidth: 0 }}>
          <Grid container spacing={2.5}>
            <Grid item lg={7} xs={12} sx={{ minWidth: 0 }}>
              <CardView
                searchResults={properties}
                isSearching={isSearching}
                view={view}
                loading={loading}
                value={tabValue}
                handleChangeTab={handleChangeTab}
              />
            </Grid>
            <Grid item lg={5} xs={12} sx={{ minWidth: 0 }}>
              <Map data={mapProperties} />
            </Grid>
          </Grid>
        </Box>
      ) : (
        <CardView
          searchResults={properties}
          isSearching={isSearching}
          view={view}
          loading={loading}
          value={tabValue}
          handleChangeTab={handleChangeTab}
        />
      )}
    </Stack>
  );
};

// Default center coordinates (Hanoi)
const DEFAULT_CENTER = {
  lat: 21.0285,
  lng: 105.8542,
};

Result.propTypes = {
  properties: PropTypes.array,
  searchResults: PropTypes.array,
  isSearching: PropTypes.bool,
  setIsSearching: PropTypes.func,
  setSearchResults: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  retryAction: PropTypes.node,
};

export default Result;
