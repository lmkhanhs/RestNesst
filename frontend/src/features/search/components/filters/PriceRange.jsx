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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        spacing={1}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            whiteSpace: "nowrap",
          }}
        >
          Khoảng giá mỗi đêm
        </Typography>
        <Box
          component="span"
          sx={{
            px: 1.25,
            py: 0.35,
            borderRadius: "999px",
            bgcolor: "var(--rn-primary-soft)",
            color: "primary.main",
            fontWeight: 700,
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}
        >
          {Number(value[0] || 0).toLocaleString("vi-VN")} ₫ –{" "}
          {Number(value[1] || 0).toLocaleString("vi-VN")} ₫
        </Box>
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          label="Tối thiểu (₫)"
          type="number"
          fullWidth
          value={value[0]}
          onChange={handleMinChange}
          inputProps={{ min: safeMin, max: safeMax }}
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <TextField
          size="small"
          label="Tối đa (₫)"
          type="number"
          fullWidth
          value={value[1]}
          onChange={handleMaxChange}
          inputProps={{ min: safeMin, max: safeMax }}
          InputProps={{ sx: { borderRadius: 2 } }}
        />
      </Box>
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
