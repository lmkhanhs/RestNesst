import React from "react";
import { Box, Typography } from "@mui/material";
import { Crown } from "@phosphor-icons/react";
import PropTypes from "prop-types";

const GuestFavorite = ({ isPopular }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        height: "100%",       
        borderRadius: 2,
        padding: 2.5,
        transition: "transform 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "white",
          display: "flex",
          alignItems: "center",
          ...(isPopular && {
            background: "linear-gradient(45deg, #FFD700, #FFA500)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          }),
        }}
      >
        Guest favourite
        <Crown
          weight="fill"
          style={{
            width: 32,
            height: 32,
            marginLeft: 12,
            color: "#FFD700",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        />
      </Typography>
    </Box>
  );
};

GuestFavorite.propTypes = {
  isPopular: PropTypes.bool,
};

GuestFavorite.defaultProps = {
  isPopular: false,
};

export default GuestFavorite;
