import { BACKEND_URL } from "@/shared/config/environment.js";
import { Box, Card, Stack, Typography, Button, Divider } from "@mui/material";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PriceRange from "./PriceRange.jsx";
import Amenities from "./AmenitiesFilter.jsx";
import CountryFilter from "./CountryFilter.jsx";
import DateRangeFilter from "./DateRangeFilter.jsx";
import PopularFilter from "./PopularFilter.jsx";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useFilter } from "@/features/search/hooks/useFilter.js";
import axios from "axios";

const Filter = ({ onCloseMobile }) => {
  const { filterListings } = useFilter();
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [filterState, setFilterState] = useState({
    amenities: [],
    lowestPrice: 0,
    highestPrice: 1000,
    country: "",
    startDate: "",
    endDate: "",
    popular: false,
    category_id: "",
  });

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
      setFilterState((state) => ({
        ...state,
        lowestPrice: min,
        highestPrice: max,
      }));
    };
    fetchPriceRange().catch(() => {
      /* The main results panel reports connection failures. */
    });
  }, []);

  // Gọi API filter mỗi khi filterState thay đổi
  const updateFilter = (newFields) => {
    let newState = { ...filterState, ...newFields };
    if (newState.lowestPrice < priceRange.min)
      newState.lowestPrice = priceRange.min;
    if (newState.highestPrice > priceRange.max)
      newState.highestPrice = priceRange.max;
    setFilterState(newState);

    const filterObj = {
      lowestPrice: newState.lowestPrice,
      highestPrice: newState.highestPrice,
    };
    if (newState.amenities && newState.amenities.length > 0) {
      filterObj.amenities = newState.amenities;
    }
    if (newState.country && newState.country.trim() !== "")
      filterObj.country = newState.country;
    if (newState.startDate && newState.startDate.trim() !== "")
      filterObj.startDate = newState.startDate;
    if (newState.endDate && newState.endDate.trim() !== "")
      filterObj.endDate = newState.endDate;
    if (newState.popular) filterObj.popular = true;
    if (newState.category_id) filterObj.category_id = newState.category_id;

    filterListings(filterObj);
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
    setFilterState({
      amenities: [],
      lowestPrice: priceRange.min,
      highestPrice: priceRange.max,
      country: "",
      startDate: "",
      endDate: "",
      popular: false,
      category_id: "",
    });
    filterListings({
      lowestPrice: priceRange.min,
      highestPrice: priceRange.max,
    });
  };

  const activeFilterCount =
    (filterState.amenities?.length || 0) +
    (filterState.country ? 1 : 0) +
    (filterState.startDate || filterState.endDate ? 1 : 0) +
    (filterState.popular ? 1 : 0) +
    (filterState.lowestPrice > priceRange.min ||
    filterState.highestPrice < priceRange.max
      ? 1
      : 0);

  return (
    <Box component="aside" aria-label="Bộ lọc tìm kiếm phòng" sx={{ py: 0 }}>
      <Card
        elevation={0}
        sx={{
          width: 1,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            py: 1.75,
            px: 2.5,
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

        <Stack spacing={2.25} sx={{ p: 2.5 }}>
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
              onClick={onCloseMobile}
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
