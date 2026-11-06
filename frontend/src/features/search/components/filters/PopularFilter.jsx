import { Box, Typography, Checkbox } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PropTypes from "prop-types";

const PopularFilter = ({ value = false, onChange }) => (
  <Box
    component="label"
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1.5,
      minHeight: 48,
      px: 1.5,
      py: 1,
      borderRadius: 2.5,
      cursor: "pointer",
      border: "1px solid",
      borderColor: value ? "primary.main" : "divider",
      bgcolor: value ? "rgba(217, 27, 66, 0.10)" : "var(--rn-surface-subtle)",
      transition: "border-color 150ms ease, background-color 150ms ease",
      "&:hover": {
        borderColor: value ? "primary.main" : "text.secondary",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <StarRoundedIcon
        aria-hidden="true"
        sx={{ color: "#D97706", fontSize: 20, flexShrink: 0 }}
      />
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
          Được khách yêu thích
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Đánh giá cao & đặt nhiều nhất
        </Typography>
      </Box>
    </Box>
    <Checkbox
      inputProps={{ "aria-label": "Chỉ hiển thị phòng được khách yêu thích" }}
      checked={Boolean(value)}
      onChange={(e) => onChange && onChange(e.target.checked)}
      color="primary"
      sx={{ p: 0.5 }}
    />
  </Box>
);

PopularFilter.propTypes = {
  value: PropTypes.bool,
  onChange: PropTypes.func,
};

export default PopularFilter;
