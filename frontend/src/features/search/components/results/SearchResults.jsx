import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useState, useMemo, useContext } from "react";
import PropTypes from "prop-types";
import CardView from "./ListingTabs.jsx";
import { FaColumns, FaMap } from "react-icons/fa";
import SearchMap from "./SearchMap.jsx";
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
  hideInlineMap = false,
  onJumpToMap,
}) => {
  const [view, setView] = useState("card");
  const [tabValue, setTabValue] = useState(0);
  const [inlineMapCollapsed, setInlineMapCollapsed] = useState(false);
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

  const handleSelectCardView = () => {
    setView("card");
    const listSection = document.getElementById("danh-sach-phong");
    listSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectMapView = () => {
    setView("map");
    if (onJumpToMap) {
      onJumpToMap();
      return;
    }
    setInlineMapCollapsed(false);
    requestAnimationFrame(() => {
      const mapEl = document.getElementById("ban-do-cho-o");
      mapEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const resultCount = isSearching
    ? searchResults?.length || 0
    : defaultProperties?.length || 0;

  return (
    <Stack sx={{ minWidth: 0 }} spacing={2.5}>
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
          aria-label="Điều hướng chế độ danh sách và bản đồ"
          sx={{
            bgcolor: "var(--rn-surface-subtle)",
            p: 0.5,
            borderRadius: "12px",
            alignSelf: { xs: "flex-start", sm: "center" },
          }}
        >
          <Button
            type="button"
            onClick={handleSelectCardView}
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
            onClick={handleSelectMapView}
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

      <CardView
        searchResults={properties}
        isSearching={isSearching}
        view="card"
        loading={loading}
        value={tabValue}
        handleChangeTab={handleChangeTab}
      />

      {!hideInlineMap && (
        <SearchMap
          data={properties}
          collapsed={inlineMapCollapsed}
          onToggleCollapse={() => setInlineMapCollapsed((prev) => !prev)}
          onScrollToList={handleSelectCardView}
        />
      )}
    </Stack>
  );
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
  hideInlineMap: PropTypes.bool,
  onJumpToMap: PropTypes.func,
};

export default Result;
