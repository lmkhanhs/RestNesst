import { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TuneIcon from "@mui/icons-material/Tune";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { Link as RouterLink } from "react-router-dom";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";
import { SearchResults } from "@/features/search/components/results/index.js";
import {
  formatNightlyPrice,
  getImageUrl,
} from "@/features/search/components/results/ListingCards.jsx";
import Filter from "@/features/search/components/filters/SearchFilters.jsx";
import useResponsive from "@/shared/hooks/useResponsive.js";
import axiosInstance from "@/shared/api/httpClient.js";
import "@/features/search/components/results/SearchMap.css";

export default function HomePage() {
  const {
    searchResults,
    isSearching,
    defaultProperties,
    setDefaultProperties,
    isSearchLoading,
    searchError,
  } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isDesktop = useResponsive("up", "md");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    axiosInstance
      .get("/api/listings", { signal: controller.signal })
      .then(({ data }) =>
        setDefaultProperties(Array.isArray(data.result) ? data.result : [])
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            "Không tải được chỗ ở. Vui lòng kiểm tra kết nối và thử lại."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [setDefaultProperties, reloadKey]);

  const featuredProperty = useMemo(() => {
    if (!Array.isArray(defaultProperties) || defaultProperties.length === 0) {
      return null;
    }
    return (
      defaultProperties.find((item) => item.popular) || defaultProperties[0]
    );
  }, [defaultProperties]);

  const statsSummary = useMemo(() => {
    if (!Array.isArray(defaultProperties) || defaultProperties.length === 0) {
      return { total: 0, minPrice: null, popularCount: 0 };
    }
    const prices = defaultProperties
      .map((item) => Number(item.price))
      .filter((val) => Number.isFinite(val) && val > 0);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const popularCount = defaultProperties.filter((item) => item.popular).length;
    return {
      total: defaultProperties.length,
      minPrice,
      popularCount,
    };
  }, [defaultProperties]);

  const scrollToListings = () => {
    const el = document.getElementById("danh-sach-phong");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOpenFilterFromHero = () => {
    if (!isDesktop) {
      setFiltersOpen(true);
    }
    scrollToListings();
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 11, md: 10 },
      }}
    >
      {/* Trang chủ: Hero & Điểm lưu trú tâm điểm */}
      <Box
        component="section"
        aria-label="Giới thiệu trang chủ RestNesst"
        sx={{
          mb: { xs: 3, md: 4 },
          p: { xs: 2.25, sm: 3.5, md: 4 },
          borderRadius: 4,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(217, 27, 66, 0.06) 0%, rgba(15, 118, 110, 0.04) 45%, rgba(255, 255, 255, 0) 75%)",
          boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "minmax(0, 1.25fr) minmax(300px, 0.75fr)",
            },
            gap: { xs: 3, md: 4 },
            alignItems: "center",
          }}
        >
          {/* Left Hero Column */}
          <Stack spacing={2.25} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: "999px",
                bgcolor: "var(--rn-teal-soft)",
                color: "var(--rn-teal)",
                fontWeight: 700,
                fontSize: "0.8125rem",
                width: "fit-content",
              }}
            >
              <VerifiedOutlinedIcon aria-hidden="true" sx={{ fontSize: 16 }} />
              <span>Đặt phòng trực tiếp · Giá minh bạch mỗi đêm</span>
            </Box>

            <Typography
              component="h1"
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: {
                  xs: "1.65rem",
                  sm: "2.15rem",
                  md: "2.5rem",
                },
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "text.primary",
                maxWidth: "24ch",
              }}
            >
              Tìm chốn dừng chân lý tưởng cho kỳ nghỉ tiếp theo
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: "60ch",
                fontSize: { xs: "0.95rem", sm: "1.025rem" },
                lineHeight: 1.6,
              }}
            >
              Khám phá homestay, biệt thự và căn hộ nghỉ dưỡng với ảnh thực tế
              sắc nét, thông tin ngày trống rõ ràng và thao tác đặt phòng nhanh
              gọn trên mọi thiết bị.
            </Typography>

            {/* Quick Summary Pills */}
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={1}
              sx={{ pt: 0.25 }}
              aria-label="Thống kê nhanh chỗ ở"
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: "var(--rn-surface-subtle)",
                  border: "1px solid",
                  borderColor: "divider",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                {statsSummary.total > 0
                  ? `${statsSummary.total} chỗ ở sẵn sàng`
                  : "Cập nhật chỗ ở mỗi ngày"}
              </Box>
              {statsSummary.minPrice !== null && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: "var(--rn-surface-subtle)",
                    border: "1px solid",
                    borderColor: "divider",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  Chỉ từ {formatNightlyPrice(statsSummary.minPrice)} ₫ / đêm
                </Box>
              )}
              {statsSummary.popularCount > 0 && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: "#FEF3C7",
                    color: "#78350F",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                  }}
                >
                  ★ {statsSummary.popularCount} phòng được khách yêu thích
                </Box>
              )}
            </Stack>

            {/* Hero Actions */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ pt: 0.5 }}
            >
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="large"
                onClick={scrollToListings}
                endIcon={<ArrowForwardRoundedIcon />}
                className="rn-interactive-btn"
                sx={{
                  minHeight: 48,
                  px: 3,
                  borderRadius: "12px",
                  fontWeight: 700,
                  boxShadow: "none",
                }}
              >
                Khám phá danh sách phòng
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                size="large"
                startIcon={<TuneIcon />}
                onClick={handleOpenFilterFromHero}
                className="rn-interactive-btn"
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  borderRadius: "12px",
                  fontWeight: 700,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                Lọc theo ngân sách & tiện nghi
              </Button>
            </Stack>
          </Stack>

          {/* Right Hero Column: Featured Room Card (Shared Card Style) */}
          <Box sx={{ minWidth: 0 }}>
            {loading ? (
              <Card elevation={0} className="rn-room-card">
                <Skeleton
                  variant="rectangular"
                  sx={{ width: "100%", height: "auto", aspectRatio: "16 / 10" }}
                />
                <Stack spacing={1} sx={{ p: 2.25 }}>
                  <Skeleton variant="text" width="55%" height={20} />
                  <Skeleton variant="text" width="85%" height={28} />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ pt: 1 }}
                  >
                    <Skeleton variant="text" width="40%" height={28} />
                    <Skeleton
                      variant="rounded"
                      width={116}
                      height={42}
                      sx={{ borderRadius: "10px" }}
                    />
                  </Stack>
                </Stack>
              </Card>
            ) : featuredProperty ? (
              <Card
                component="article"
                elevation={0}
                className="rn-room-card"
                aria-label="Phòng nghỉ nổi bật trên trang chủ"
              >
                <Box className="rn-room-card__media">
                  <img
                    src={getImageUrl(
                      Array.isArray(featuredProperty.images)
                        ? featuredProperty.images[0]
                        : null
                    )}
                    alt={
                      featuredProperty.name ||
                      featuredProperty.title ||
                      "Phòng nghỉ nổi bật"
                    }
                    className="rn-room-card__img"
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      bgcolor: "rgba(15, 23, 42, 0.82)",
                      backdropFilter: "blur(6px)",
                      color: "#FFFFFF",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "999px",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  >
                    Điểm lưu trú tâm điểm
                  </Box>
                </Box>
                <Stack spacing={1} sx={{ p: 2.25 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{ minWidth: 0, flex: 1 }}
                    >
                      <PlaceOutlinedIcon
                        aria-hidden="true"
                        sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: "text.secondary",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {[featuredProperty.city, featuredProperty.country]
                          .filter(Boolean)
                          .join(", ") ||
                          featuredProperty.address ||
                          "Việt Nam"}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.375,
                        px: 1,
                        py: 0.25,
                        borderRadius: "999px",
                        bgcolor: "#FEF3C7",
                        color: "#78350F",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                      }}
                    >
                      <StarRoundedIcon
                        aria-hidden="true"
                        sx={{ color: "#D97706", fontSize: 16 }}
                      />
                      <span>
                        {Number(featuredProperty.avgStart) > 0
                          ? Number(featuredProperty.avgStart).toFixed(1)
                          : "Mới"}
                      </span>
                    </Box>
                  </Stack>

                  <Typography
                    component="h2"
                    variant="h6"
                    sx={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {featuredProperty.name || featuredProperty.title}
                  </Typography>

                  <Box
                    component="footer"
                    className="rn-room-card__footer"
                    sx={{
                      pt: 1.25,
                      mt: 0.5,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontWeight: 500 }}
                      >
                        Giá mỗi đêm
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.125rem",
                          color: "text.primary",
                        }}
                      >
                        {formatNightlyPrice(featuredProperty.price)} ₫
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 500,
                            fontSize: "0.8125rem",
                            color: "text.secondary",
                          }}
                        >
                          {" "}
                          / đêm
                        </Box>
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      to={`/property/${featuredProperty.id}`}
                      variant="contained"
                      color="primary"
                      endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                      className="rn-interactive-btn"
                      sx={{
                        minHeight: 42,
                        px: 2,
                        borderRadius: "10px",
                        fontWeight: 700,
                        boxShadow: "none",
                      }}
                    >
                      Đặt phòng
                    </Button>
                  </Box>
                </Stack>
              </Card>
            ) : (
              <Card
                component="article"
                elevation={0}
                className="rn-room-card"
                aria-label="Gợi ý kỳ nghỉ RestNesst"
              >
                <Box className="rn-room-card__media">
                  <img
                    src={getImageUrl(null)}
                    alt="Không gian nghỉ dưỡng RestNesst"
                    className="rn-room-card__img"
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      bgcolor: "rgba(15, 23, 42, 0.82)",
                      color: "#FFFFFF",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "999px",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  >
                    Trải nghiệm RestNesst
                  </Box>
                </Box>
                <Stack spacing={1} sx={{ p: 2.25 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Không gian lưu trú tuyển chọn khắp Việt Nam
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sử dụng thanh tìm kiếm hoặc bộ lọc bên dưới để tìm phòng phù
                    hợp với lịch trình và ngân sách của bạn.
                  </Typography>
                </Stack>
              </Card>
            )}
          </Box>
        </Box>
      </Box>

      {/* Khu vực Danh sách phòng & Bộ lọc */}
      <Box
        id="danh-sach-phong"
        component="section"
        aria-label="Bộ lọc và danh sách phòng"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: { xs: 2.5, md: 3, lg: 3.5 },
          minWidth: 0,
        }}
      >
        {/* Cột Bộ lọc: Mobile/Tablet dùng nút mở nhanh bằng một tay + chuyển động ngắn; Desktop hiển thị cột cố định */}
        <Box
          sx={{
            width: { xs: "100%", md: 340, lg: 368, xl: 388 },
            flexShrink: 0,
            minWidth: 0,
            position: { md: "sticky" },
            top: { md: 88 },
            alignSelf: { md: "flex-start" },
          }}
        >
          {!isDesktop && (
            <Button
              type="button"
              id="search-filter-heading"
              aria-controls="search-filter-content"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((prev) => !prev)}
              fullWidth
              className="rn-interactive-btn"
              sx={{
                minHeight: 50,
                px: 2.25,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "background.paper",
                color: "text.primary",
                border: "1px solid",
                borderColor: filtersOpen ? "primary.main" : "divider",
                borderRadius: 3,
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                "&:hover": {
                  bgcolor: "var(--rn-surface-subtle)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <TuneIcon sx={{ color: "primary.main" }} />
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    component="span"
                     sx={{ display: "block", fontWeight: 700, fontSize: "0.95rem" }}
                  >
                    Bộ lọc tìm kiếm
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", lineHeight: 1.2 }}
                  >
                    {filtersOpen
                      ? "Chạm để thu gọn bộ lọc"
                      : "Khoảng giá, ngày trống, tiện nghi"}
                  </Typography>
                </Box>
              </Stack>
              <ExpandMoreIcon
                sx={{
                  transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                  },
                }}
              />
            </Button>
          )}

          {isDesktop ? (
            <Box id="search-filter-content">
              <Filter />
            </Box>
          ) : (
            <Box
              id="search-filter-content"
              role="region"
              aria-labelledby="search-filter-heading"
              className={
                filtersOpen
                  ? "rn-filter-drawer rn-filter-drawer--open"
                  : "rn-filter-drawer"
              }
            >
              <Box className="rn-filter-drawer__inner" sx={{ pt: filtersOpen ? 1.5 : 0 }}>
                <Filter onCloseMobile={() => setFiltersOpen(false)} />
              </Box>
            </Box>
          )}
        </Box>

        {/* Cột Danh sách phòng */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SearchResults
            properties={defaultProperties}
            searchResults={searchResults}
            isSearching={isSearching}
            loading={loading || isSearchLoading}
            error={error || searchError}
            retryAction={
              error && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setReloadKey((key) => key + 1)}
                  sx={{ fontWeight: 700, minHeight: 36 }}
                >
                  Thử lại
                </Button>
              )
            }
          />
        </Box>
      </Box>

      {/* Nút mở nhanh bộ lọc bằng ngón cái ở cuối màn hình điện thoại */}
      {!isDesktop && (
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1050,
            display: { xs: "block", sm: "none" },
          }}
        >
          <Button
            type="button"
            variant="contained"
            color="primary"
            startIcon={<TuneIcon />}
            aria-controls="search-filter-content"
            aria-expanded={filtersOpen}
            onClick={() => {
              setFiltersOpen((prev) => {
                const next = !prev;
                if (next) {
                  const el = document.getElementById("search-filter-heading");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return next;
              });
            }}
            className="rn-interactive-btn"
            sx={{
              minHeight: 46,
              px: 2.75,
              borderRadius: "999px",
              fontWeight: 700,
              bgcolor: "#0F172A",
              color: "#FFFFFF",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.32)",
              "&:hover": {
                bgcolor: "#1E293B",
              },
            }}
          >
            {filtersOpen ? "Đóng bộ lọc" : "Mở bộ lọc"}
          </Button>
        </Box>
      )}
    </Container>
  );
}
