import { BACKEND_URL } from "@/shared/config/environment.js";
import { Box, Typography, Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const CountryFilter = ({ value, onChange }) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fetchCountries = async () => {
      const res = await axios.get(BACKEND_URL + "/api/countries");
      setOptions(
        Array.isArray(res.data?.result)
          ? res.data.result.map((item) => item.name)
          : []
      );
    };
    fetchCountries().catch(() => setOptions([]));
  }, []);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
        Quốc gia / Khu vực
      </Typography>
      <Autocomplete
        options={options}
        value={value || null}
        onChange={(_, newValue) => onChange && onChange(newValue || "")}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Chọn quốc gia..."
            size="small"
            fullWidth
            inputProps={{
              ...params.inputProps,
              "aria-label": "Chọn quốc gia",
            }}
            sx={{ borderRadius: 2, bgcolor: "background.paper" }}
            InputProps={{
              ...params.InputProps,
              sx: { borderRadius: 2, minHeight: 44 },
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

CountryFilter.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default CountryFilter;
