import {
  Autocomplete,
  TextField,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useState, useEffect } from "react";
import axios from "axios";

const LocationSearch = () => {
  const [inputText, setInputText] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/countries")
      .then((res) => {
        const countries = res.data.result.map((c) => c.name);
        setOptions(countries);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleClearInput = () => {
    setInputText("");
  };

  return (
    <Autocomplete
      fullWidth
      freeSolo
      options={options}
      loading={loading}
      value={inputText}
      onInputChange={(event, newValue) => {
        setInputText(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          value={inputText}
          placeholder="Enter country"
          variant="standard"
          InputProps={{
            ...params.InputProps,
            disableUnderline: true,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : inputText ? (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearInput} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default LocationSearch;
