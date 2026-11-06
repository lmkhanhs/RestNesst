import { Box, Slider, Stack, TextField, Typography } from "@mui/material";
import PropTypes from "prop-types";

const PriceRange = ({ value = [0, 1000], onChange, min = 0, max = 1000 }) => {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 1000;

  const handleSliderChange = (event, newValue) => {
    onChange && onChange(newValue);
  };

  const handleMinChange = (e) => {
    const nextMin = Number(e.target.value);
    onChange && onChange([nextMin, value[1]]);
  };

  const handleMaxChange = (e) => {
    const nextMax = Number(e.target.value);
    onChange && onChange([value[0], nextMax]);
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
          Khoảng giá mỗi đêm
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main" }}>
          {Number(value[0] || 0).toLocaleString("vi-VN")} ₫ –{" "}
          {Number(value[1] || 0).toLocaleString("vi-VN")} ₫
        </Typography>
      </Stack>

      <Box sx={{ px: 1 }}>
        <Slider
          value={[
            Math.max(safeMin, Math.min(value[0] ?? safeMin, safeMax)),
            Math.max(safeMin, Math.min(value[1] ?? safeMax, safeMax)),
          ]}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          getAriaLabel={(index) => (index === 0 ? "Giá tối thiểu" : "Giá tối đa")}
          valueLabelFormat={(val) => `${Number(val).toLocaleString("vi-VN")} ₫`}
          min={safeMin}
          max={safeMax}
          step={1}
        />
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.5}>
        <TextField
          size="small"
          label="Tối thiểu (₫)"
          type="number"
          fullWidth
          value={value[0]}
          onChange={handleMinChange}
          inputProps={{ min: safeMin, max: safeMax }}
        />
        <TextField
          size="small"
          label="Tối đa (₫)"
          type="number"
          fullWidth
          value={value[1]}
          onChange={handleMaxChange}
          inputProps={{ min: safeMin, max: safeMax }}
        />
      </Stack>
    </Stack>
  );
};

PriceRange.propTypes = {
  value: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
};

export default PriceRange;
