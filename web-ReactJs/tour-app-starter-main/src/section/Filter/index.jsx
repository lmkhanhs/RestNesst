import { Box, Card, Stack, Typography, Button, Divider } from "@mui/material";
import PriceRange from "./PriceRange";
import Amenities from "./Amenties";
import CountryFilter from "./CountryFilter";
import DateRangeFilter from "./DateRangeFilter";
import PopularFilter from "./PopularFilter";
import { useState, useEffect } from "react";
import { useFilter } from "../../contexts/useFilter";
import axios from "axios";

const Filter = () => {
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
  const [amenitiesList, setAmenitiesList] = useState([]);

  // Khi mount, lấy min/max giá từ API
  useEffect(() => {
    const fetchPriceRange = async () => {
      const res = await axios.get("http://175.41.233.105:8080/api/listings");
      const prices = res.data.result.map((item) => item.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setPriceRange({ min, max });
      setFilterState((state) => ({
        ...state,
        lowestPrice: min,
        highestPrice: max,
      }));
      // Gọi filter lần đầu với min/max thực tế
      filterListings({
        lowestPrice: min,
        highestPrice: max,
      });
    };
    fetchPriceRange();
    // eslint-disable-next-line
  }, []);

  // Gọi API filter mỗi khi filterState thay đổi
  const updateFilter = (newFields) => {
    let newState = { ...filterState, ...newFields };
    // Đảm bảo lowestPrice và highestPrice nằm trong min/max
    if (newState.lowestPrice < priceRange.min)
      newState.lowestPrice = priceRange.min;
    if (newState.highestPrice > priceRange.max)
      newState.highestPrice = priceRange.max;
    setFilterState(newState);

    // Tạo object filter sạch, chỉ truyền trường có giá trị thực sự
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

    console.log("Gọi filter với:", filterObj);
    filterListings(filterObj);
  };

  const handlePriceChange = (range) => {
    updateFilter({ lowestPrice: range[0], highestPrice: range[1] });
  };

  const handleAmenitiesChange = (amenitiesObj) => {
    updateFilter({ amenities: amenitiesObj });
  };

  // Các handler cho filter con
  const handleCountryChange = (country) => {
    updateFilter({ country });
  };
  const handleDateRangeChange = ({ startDate, endDate }) => {
    updateFilter({ startDate, endDate });
  };
  const handlePopularChange = (popular) => {
    updateFilter({ popular });
  };

  return (
    <Box sx={{ py: 4, pl: 1 }}>
      <Card sx={{ width: 1, pb: 3 }}>
        <Box
          sx={{
            mb: 2,
            py: 2,
            px: 3,
            bgcolor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[200]
                : theme.palette.grey[900],
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={"space-between"}
          >
            <Typography variant="subtitle1">Bộ lọc</Typography>
            <Button
              size="small"
              onClick={() => {
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
              }}
            >
              Xóa tất cả bộ lọc
            </Button>
          </Stack>
        </Box>
        <Stack spacing={2} sx={{ px: 3 }}>
          <PriceRange
            value={[filterState.lowestPrice, filterState.highestPrice]}
            onChange={handlePriceChange}
            min={priceRange.min}
            max={priceRange.max}
          />
          <Divider sx={{ my: 1 }} />
          <Amenities
            value={filterState.amenities}
            onChange={handleAmenitiesChange}
            showIcon
            amenitiesList={amenitiesList}
          />
          <Divider sx={{ my: 1 }} />
          <CountryFilter
            value={filterState.country}
            onChange={handleCountryChange}
          />
          <Divider sx={{ my: 1 }} />
          <DateRangeFilter
            startDate={filterState.startDate}
            endDate={filterState.endDate}
            onChange={handleDateRangeChange}
          />
          <Divider sx={{ my: 1 }} />
          <PopularFilter
            value={filterState.popular}
            onChange={handlePopularChange}
          />
        </Stack>
      </Card>
    </Box>
  );
};

export default Filter;
