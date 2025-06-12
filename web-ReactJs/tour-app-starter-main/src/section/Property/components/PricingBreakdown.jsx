import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";

const PricingBreakdown = ({ price, nights, total }) => {
  return (
    <Box sx={{ marginTop: 2 }}>
      {nights > 0 ? (
        <Typography
          variant="body2"
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          ₹{price} x {nights} đêm <span>₹{total}</span>
        </Typography>
      ) : (
        <Typography
          variant="body2"
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          Giá phòng / đêm <span>₹{price}</span>
        </Typography>
      )}
      <Typography
        variant="h6"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 1,
        }}
      >
        Tổng cộng <span>₹{total}</span>
      </Typography>
    </Box>
  );
};

PricingBreakdown.propTypes = {
  price: PropTypes.number.isRequired,
  nights: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

export default PricingBreakdown;
