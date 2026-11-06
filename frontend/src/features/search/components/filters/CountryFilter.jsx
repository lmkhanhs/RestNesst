import { Box, Typography, Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

const CountryFilter = ({ value, onChange }) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fetchCountries = async () => {
      const res = await axios.get("http://175.41.233.105:8080/api/countries");
      setOptions(res.data.result.map((item) => item.name));
    };
    fetchCountries();
  }, []);

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Quốc gia
      </Typography>
      <Autocomplete
        options={options}
        value={value || ""}
        onChange={(_, newValue) => onChange && onChange(newValue || "")}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Chọn quốc gia..."
            size="small"
            fullWidth
            sx={{ borderRadius: 2, bgcolor: "background.paper" }}
            InputProps={{
              ...params.InputProps,
              sx: { borderRadius: 2 },
            }}
          />
        )}
        isOptionEqualToValue={(option, val) => option === val}
        autoHighlight
        clearOnEscape
      />
    </Box>
  );
};

export default CountryFilter;
