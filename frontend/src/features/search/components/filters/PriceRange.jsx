import { InputLabel, Slider, Stack, TextField } from "@mui/material";

const PriceRange = ({ value, onChange, min = 0, max = 1000 }) => {
  const handleSliderChange = (event, newValue) => {
    onChange && onChange(newValue);
  };

  const handleMinChange = (e) => {
    const min = Number(e.target.value);
    onChange && onChange([min, value[1]]);
  };

  const handleMaxChange = (e) => {
    const max = Number(e.target.value);
    onChange && onChange([value[0], max]);
  };

  return (
    <Stack spacing={1}>
      <InputLabel
        sx={{
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Khoảng giá
      </InputLabel>
      <Slider
        value={value}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value}$`}
        min={min}
        max={max}
        step={1}
      />
      <Stack direction="row" alignItems="center" spacing={2}>
        <TextField
          size="small"
          label="Tối thiểu"
          type="number"
          value={value[0]}
          onChange={handleMinChange}
          inputProps={{ min, max }}
        />
        <TextField
          size="small"
          label="Tối đa"
          type="number"
          value={value[1]}
          onChange={handleMaxChange}
          inputProps={{ min, max }}
        />
      </Stack>
    </Stack>
  );
};

export default PriceRange;
