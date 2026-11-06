import { BACKEND_URL } from "@/shared/config/environment.js";
import { useEffect, useState } from "react";
import {
  Stack,
  Checkbox,
  Grid,
  Avatar,
  Typography,
  Box,
} from "@mui/material";
import PropTypes from "prop-types";
import axios from "axios";

const Amenities = ({ value = [], onChange, showIcon }) => {
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selected, setSelected] = useState(value || []);

  useEffect(() => {
    const fetchAmenities = async () => {
      const res = await axios.get(BACKEND_URL + "/api/amenities");
      setAmenitiesList(Array.isArray(res.data?.result) ? res.data.result : []);
    };
    fetchAmenities().catch(() => setAmenitiesList([]));
  }, []);

  useEffect(() => {
    setSelected(value || []);
  }, [value]);

  const handleChange = (id) => {
    let newSelected;
    if (selected.includes(id)) {
      newSelected = selected.filter((item) => item !== id);
    } else {
      newSelected = [...selected, id];
    }
    setSelected(newSelected);
    onChange && onChange(newSelected);
  };

  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
        Tiện nghi phòng
      </Typography>
      {!amenitiesList.length && (
        <Typography variant="body2" color="text.secondary">
          Chưa có tiện nghi để lọc.
        </Typography>
      )}
      <Grid container spacing={1}>
        {amenitiesList.map((amenity) => {
          const isChecked = selected.includes(amenity.id);
          return (
            <Grid item xs={12} key={amenity.id}>
              <Box
                component="label"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minHeight: 44,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: isChecked ? "primary.main" : "divider",
                  bgcolor: isChecked ? "rgba(217, 27, 66, 0.05)" : "background.paper",
                  transition: "border-color 150ms ease, background-color 150ms ease",
                  "&:hover": {
                    borderColor: isChecked ? "primary.main" : "text.secondary",
                  },
                }}
              >
                {showIcon && amenity.thumnailUrl && (
                  <Avatar
                    src={`${BACKEND_URL}${amenity.thumnailUrl}`}
                    alt=""
                    aria-hidden="true"
                    sx={{ width: 22, height: 22, bgcolor: "transparent" }}
                    variant="rounded"
                  />
                )}
                <Typography
                  flex={1}
                  variant="body2"
                  sx={{
                    fontWeight: isChecked ? 600 : 500,
                    color: "text.primary",
                  }}
                >
                  {amenity.name}
                </Typography>
                <Checkbox
                  inputProps={{ "aria-label": amenity.name }}
                  checked={isChecked}
                  onChange={() => handleChange(amenity.id)}
                  color="primary"
                  size="small"
                  sx={{ p: 0.5 }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
};

Amenities.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  showIcon: PropTypes.bool,
};

export default Amenities;
