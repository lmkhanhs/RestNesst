import { Box, Typography, Stack, TextField } from "@mui/material";
import PropTypes from "prop-types";

const DateRangeFilter = ({ startDate, endDate, onChange }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25, color: "text.primary" }}>
      Ngày nhận & trả phòng
    </Typography>
    <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1.5}>
      <TextField
        label="Nhận phòng"
        type="date"
        size="small"
        value={startDate}
        onChange={(e) =>
          onChange && onChange({ startDate: e.target.value, endDate })
        }
        InputLabelProps={{ shrink: true }}
        fullWidth
        sx={{ borderRadius: 2, bgcolor: "background.paper", minWidth: 0 }}
        InputProps={{ sx: { borderRadius: 2, minHeight: 44 } }}
      />
      <TextField
        label="Trả phòng"
        type="date"
        size="small"
        value={endDate}
        onChange={(e) =>
          onChange && onChange({ startDate, endDate: e.target.value })
        }
        InputLabelProps={{ shrink: true }}
        fullWidth
        sx={{ borderRadius: 2, bgcolor: "background.paper", minWidth: 0 }}
        InputProps={{ sx: { borderRadius: 2, minHeight: 44 } }}
      />
    </Stack>
  </Box>
);

DateRangeFilter.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onChange: PropTypes.func,
};

export default DateRangeFilter;
