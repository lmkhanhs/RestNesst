import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
// @mui
import { useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

// ----------------------------------------------------------------------

Logo.propTypes = {
  disabledLink: PropTypes.bool,
  sx: PropTypes.object,
};

export default function Logo({ disabledLink = false, sx }) {
  const theme = useTheme();
  const PRIMARY_MAIN = theme.palette.primary.main;

  const logo = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.25,
        minHeight: 44,
        px: 0.5,
        borderRadius: 2,
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "11px",
          bgcolor: "rgba(217, 27, 66, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill={PRIMARY_MAIN}
          viewBox="0 0 256 256"
          aria-hidden="true"
        >
          <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
        </svg>
      </Box>
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: { xs: "1.15rem", sm: "1.25rem" },
          letterSpacing: "-0.02em",
          color: "text.primary",
          lineHeight: 1.1,
        }}
      >
        Rest<Box component="span" sx={{ color: "primary.main" }}>Nesst</Box>
      </Typography>
    </Box>
  );

  if (disabledLink) {
    return <>{logo}</>;
  }

  return (
    <RouterLink
      to="/"
      aria-label="RestNesst - Trang chủ"
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
    >
      {logo}
    </RouterLink>
  );
}
