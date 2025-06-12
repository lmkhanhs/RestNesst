import React from "react";
import { Typography } from "@mui/material";
import { LocationOn } from "@mui/icons-material";
import PropTypes from "prop-types";

const PropertyHeader = ({ title, address, country }) => {
  return (
    <>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          background: "linear-gradient(45deg, #2196F3, #21CBF3)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "0.5px",
          marginBottom: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          marginY: 2,
          color: "#757575",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <LocationOn sx={{ fontSize: 20 }} />
        {address}, {country}
      </Typography>
    </>
  );
};

PropertyHeader.propTypes = {
  title: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  country: PropTypes.string.isRequired,
};

export default PropertyHeader;
