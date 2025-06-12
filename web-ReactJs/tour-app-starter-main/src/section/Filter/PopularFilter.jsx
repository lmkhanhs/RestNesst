import { Box, Typography, Checkbox } from "@mui/material";

const PopularFilter = ({ value, onChange }) => (
  <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
    <Checkbox
      checked={value}
      onChange={(e) => onChange && onChange(e.target.checked)}
      color="primary"
      sx={{ mr: 1 }}
    />
    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
      Được khách yêu thích
    </Typography>
  </Box>
);

export default PopularFilter;
