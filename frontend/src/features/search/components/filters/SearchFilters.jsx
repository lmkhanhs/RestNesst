import { BACKEND_URL } from "@/shared/config/environment.js";
import { Box, Card, Stack, Typography, Button, Divider } from "@mui/material";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PriceRange from "./PriceRange.jsx";
import Amenities from "./AmenitiesFilter.jsx";
import CountryFilter from "./CountryFilter.jsx";
import DateRangeFilter from "./DateRangeFilter.jsx";
import PopularFilter from "./PopularFilter.jsx";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useFilter } from "@/features/search/hooks/useFilter.js";
import axios from "axios";

const FILTER_DEBOUNCE_MS = 450;

const Filter = ({ onCloseMobile }) => {
  const { filterListings, debouncedFilterListings, flushPendingFilter } = useFilter();
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const initialFilterState = {
    amenities: [],
    lowestPrice: 0,
    highestPrice: 1000,
    country: "",
    startDate: "",
    endDate: "",
    popular: false,
    category_id: "",
  };
  const [filterState, setFilterState] = useState(initialFilterState);
  const filterStateRef = useRef(initialFilterState);

  // Khi mount, lấy min/max giá từ API
  useEffect(() => {
    const fetchPriceRange = async () => {
      const res = await axios.get(BACKEND_URL + "/api/listings");
      const prices = (res.data.result || [])
        .map((item) => Number(item.price))
        .filter(Number.isFinite);
      if (!prices.length) return;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setPriceRange({ min, max });
      setFilterState((state) => {
        const nextState = {
          ...state,
          lowestPrice: min,
          highestPrice: max,
        };
        filterStateRef.current = nextState;
        return nextState;
      });
    };
    fetchPriceRange().catch(() => {
      /* The main results panel reports connection failures. */
    });
  }, []);

  // Cập nhật giao diện tức thì, trì hoãn gọi API lọc để thao tác mượt hơn
  const updateFilter = (newFields) => {
    const prevState = filterStateRef.current;
    const rawLowest =
      "lowestPrice" in newFields ? Number(newFields.lowestPrice) : prevState.lowestPrice;
    const rawHighest =
      "highestPrice" in newFields ? Number(newFields.highestPrice) : prevState.highestPrice;

    const nextState = {
      ...prevState,
      ...newFields,
      lowestPrice: Number.isFinite(rawLowest) ? Math.max(0, rawLowest) : priceRange.min,
      highestPrice: Number.isFinite(rawHighest) ? Math.max(0, rawHighest) : priceRange.max,
    };
    filterStateRef.current = nextState;
    setFilterState(nextState);

    const clampedLowest = Math.max(
      priceRange.min,
      Math.min(nextState.lowestPrice, priceRange.max)
    );
    const clampedHighest = Math.max(
      clampedLowest,
      Math.min(nextState.highestPrice, priceRange.max)
    );

    const filterObj = {
      lowestPrice: clampedLowest,
      highestPrice: clampedHighest,
    };
    if (nextState.amenities && nextState.amenities.length > 0) {
      filterObj.amenities = nextState.amenities;
    }
    if (nextState.country && nextState.country.trim() !== "")
      filterObj.country = nextState.country;
    if (nextState.startDate && nextState.startDate.trim() !== "")
      filterObj.startDate = nextState.startDate;
    if (nextState.endDate && nextState.endDate.trim() !== "")
      filterObj.endDate = nextState.endDate;
    if (nextState.popular) filterObj.popular = true;
    if (nextState.category_id) filterObj.category_id = nextState.category_id;

    debouncedFilterListings(filterObj, FILTER_DEBOUNCE_MS);
  };

  const handlePriceChange = (range) => {
    updateFilter({ lowestPrice: range[0], highestPrice: range[1] });
  };

  const handleAmenitiesChange = (amenitiesObj) => {
    updateFilter({ amenities: amenitiesObj });
  };

  const handleCountryChange = (country) => {
    updateFilter({ country });
  };
  const handleDateRangeChange = ({ startDate, endDate }) => {
    updateFilter({ startDate, endDate });
  };
  const handlePopularChange = (popular) => {
    updateFilter({ popular });
  };

  const handleResetFilters = () => {
    const resetState = {
      amenities: [],
      lowestPrice: priceRange.min,
      highestPrice: priceRange.max,
      country: "",
      startDate: "",
      endDate: "",
      popular: false,
      category_id: "",
    };
    filterStateRef.current = resetState;
    setFilterState(resetState);
    filterListings({
      lowestPrice: priceRange.min,
      highestPrice: priceRange.max,
    });
  };

  const handleCloseMobileAndFlush = () => {
    flushPendingFilter();
    onCloseMobile?.();
  };

  const effectiveLowest = Math.max(
    priceRange.min,
    Math.min(filterState.lowestPrice, priceRange.max)
  );
  const effectiveHighest = Math.max(
    effectiveLowest,
    Math.min(filterState.highestPrice, priceRange.max)
  );

  const activeFilterCount =
    (filterState.amenities?.length || 0) +
    (filterState.country ? 1 : 0) +
    (filterState.startDate || filterState.endDate ? 1 : 0) +
    (filterState.popular ? 1 : 0) +
    (effectiveLowest > priceRange.min || effectiveHighest < priceRange.max
      ? 1
      : 0);

  return (
    <Box component="aside" aria-label="Bộ lọc tìm kiếm phòng" sx={{ py: 0 }}>
      <Card
        elevation={0}
        sx={{
          width: 1,
          borderRadius: 3.5,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: "var(--rn-shadow-sm)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            py: 1.75,
            px: { xs: 2.25, lg: 2.75 },
            bgcolor: "var(--rn-surface-subtle)",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Bộ lọc
              </Typography>
              {activeFilterCount > 0 && (
                <Box
                  component="span"
                  sx={{
                    px: 1,
                    py: 0.125,
                    borderRadius: "999px",
                    bgcolor: "primary.main",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </Box>
              )}
            </Stack>
            <Button
              type="button"
              size="small"
              color="primary"
              startIcon={<RestartAltRoundedIcon fontSize="small" />}
              onClick={handleResetFilters}
              sx={{
                minHeight: 36,
                px: 1.25,
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Xóa tất cả
            </Button>
          </Stack>
        </Box>

        <Stack spacing={2} sx={{ p: { xs: 2.25, lg: 2.75 } }}>
          <PopularFilter
            value={filterState.popular}
            onChange={handlePopularChange}
          />
          <Divider />
          <PriceRange
            value={[filterState.lowestPrice, filterState.highestPrice]}
            onChange={handlePriceChange}
            min={priceRange.min}
            max={priceRange.max}
          />
          <Divider />
          <CountryFilter
            value={filterState.country}
            onChange={handleCountryChange}
          />
          <Divider />
          <DateRangeFilter
            startDate={filterState.startDate}
            endDate={filterState.endDate}
            onChange={handleDateRangeChange}
          />
          <Divider />
          <Amenities
            value={filterState.amenities}
            onChange={handleAmenitiesChange}
            showIcon
          />

          {onCloseMobile && (
            <Button
              type="button"
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<CheckRoundedIcon />}
              onClick={handleCloseMobileAndFlush}
              className="rn-interactive-btn"
              sx={{
                display: { xs: "inline-flex", md: "none" },
                minHeight: 46,
                borderRadius: 2.5,
                fontWeight: 700,
                mt: 1,
              }}
            >
              Xem kết quả lọc
            </Button>
          )}
        </Stack>
      </Card>
    </Box>
  );
};

Filter.propTypes = {
  onCloseMobile: PropTypes.func,
};

export default Filter;
