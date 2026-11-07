import { Alert, Box, Button, Card, Skeleton, Stack, Tab, Tabs, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useState, useEffect, useContext } from "react";
import CategoryIcon from "@mui/icons-material/Category";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import Properties from "./ListingCards.jsx";
import { useFilter } from "@/features/search/hooks/useFilter.js";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";
import axiosInstance from "@/shared/api/httpClient.js";
import { BACKEND_URL } from "@/shared/config/environment.js";

const ALL_CATEGORIES = { id: "all", name: "Tất cả danh mục" };
const SKELETON_ITEMS = [1, 2, 3, 4, 5, 6];

export default function ListingTabs({
  value = 0,
  handleChangeTab,
  searchResults = [],
  loading = false,
  view = "card",
}) {
  const [categories, setCategories] = useState([ALL_CATEGORIES]);
  const [categoryError, setCategoryError] = useState("");
  const { filterListings, debouncedFilterListings, cancelPendingFilter } = useFilter();
  const searchCtx = useContext(SearchContext);

  useEffect(() => {
    const controller = new AbortController();
    axiosInstance
      .get("/api/categories", { signal: controller.signal })
      .then(({ data }) =>
        setCategories([
          ALL_CATEGORIES,
          ...(Array.isArray(data.result) ? data.result : []),
        ])
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategoryError("Không tải được danh mục.");
        }
      });
    return () => controller.abort();
  }, []);

  const selectCategory = (event, index) => {
    const category = categories[index] || ALL_CATEGORIES;
    handleChangeTab?.(event, index);
    debouncedFilterListings(
      { category_id: category.id === "all" ? "" : category.id },
      300
    );
  };

  const handleResetAll = (event) => {
    cancelPendingFilter();
    handleChangeTab?.(event, 0);
    if (searchCtx?.updateSearchResults) {
      searchCtx.updateSearchResults([], false);
    } else {
      filterListings({ category_id: "" });
    }
  };

  const isCompactGrid = view === "map";

  return (
    <Box sx={{ width: "100%", minWidth: 0 }} aria-busy={loading}>
      {categoryError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {categoryError}
        </Alert>
      )}

      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          px: { xs: 1, sm: 1.5 },
          py: 0.75,
          mb: 2.5,
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={Math.min(value, categories.length - 1)}
          onChange={selectCategory}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Danh mục chỗ ở"
          sx={{
            minHeight: 52,
            maxWidth: "100%",
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              bgcolor: "primary.main",
            },
          }}
        >
          {categories.map((category) => (
            <Tab
              key={category.id}
              label={category.name}
              iconPosition="start"
              icon={
                category.id === "all" ? (
                  <CategoryIcon aria-hidden="true" sx={{ fontSize: 20 }} />
                ) : (
                  <Box
                    component="img"
                    src={`${BACKEND_URL}${category.thumnailUrl}`}
                    alt=""
                    aria-hidden="true"
                    sx={{ width: 20, height: 20, objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )
              }
              sx={{
                minHeight: 48,
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                  fontWeight: 700,
                  bgcolor: "rgba(217, 27, 66, 0.06)",
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ pt: 0.5 }}>
        {loading ? (
          <Box
            role="status"
            aria-label="Đang tải chỗ ở"
            className={
              isCompactGrid ? "rn-room-grid rn-room-grid--compact" : "rn-room-grid"
            }
          >
            {SKELETON_ITEMS.map((item) => (
              <Card
                key={item}
                elevation={0}
                className="rn-room-card"
                sx={{ overflow: "hidden" }}
              >
                <Skeleton
                  variant="rectangular"
                  sx={{ width: "100%", height: "auto", aspectRatio: "16 / 10" }}
                />
                <Stack spacing={1.25} sx={{ p: 2.25 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Skeleton variant="text" width="48%" height={20} />
                    <Skeleton variant="rounded" width={48} height={22} />
                  </Stack>
                  <Skeleton variant="text" width="85%" height={28} />
                  <Skeleton variant="text" width="65%" height={20} />
                  <Skeleton variant="rounded" width="55%" height={26} />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ pt: 1.5, mt: 0.5, borderTop: "1px solid", borderColor: "divider" }}
                  >
                    <Box sx={{ width: "45%" }}>
                      <Skeleton variant="text" width="60%" height={16} />
                      <Skeleton variant="text" width="90%" height={26} />
                    </Box>
                    <Skeleton variant="rounded" width={108} height={42} sx={{ borderRadius: "10px" }} />
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Box>
        ) : searchResults.length ? (
          <Properties properties={searchResults} compact={isCompactGrid} />
        ) : (
          <Stack
            role="status"
            alignItems="center"
            spacing={1.75}
            sx={{
              py: { xs: 5, sm: 7 },
              px: 3,
              textAlign: "center",
              bgcolor: "background.paper",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "rgba(217, 27, 66, 0.08)",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SearchOffIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h6" component="h3">
              Chưa tìm thấy chỗ ở phù hợp
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ maxWidth: 460, fontSize: "0.9375rem" }}
            >
              Thử đổi từ khóa tìm kiếm, mở rộng khoảng giá hoặc bỏ bớt bộ lọc để
              xem thêm các phòng đang sẵn sàng đón khách.
            </Typography>
            <Button
              type="button"
              variant="outlined"
              color="primary"
              startIcon={<RestartAltRoundedIcon />}
              onClick={handleResetAll}
              className="rn-interactive-btn"
              sx={{
                mt: 0.5,
                minHeight: 44,
                px: 2.5,
                borderRadius: "999px",
                fontWeight: 700,
              }}
            >
              Xem tất cả chỗ ở
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

ListingTabs.propTypes = {
  value: PropTypes.number,
  handleChangeTab: PropTypes.func,
  searchResults: PropTypes.array,
  loading: PropTypes.bool,
  view: PropTypes.string,
};
