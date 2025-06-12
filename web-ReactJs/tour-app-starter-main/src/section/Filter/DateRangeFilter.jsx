import { Box, Typography, Stack, TextField } from "@mui/material";

const DateRangeFilter = ({ startDate, endDate, onChange }) => (
  <Box sx={{ mb: 1 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
      Ngày bắt đầu & Ngày kết thúc
    </Typography>
    <Stack direction="row" spacing={2}>
      <TextField
        placeholder="dd/mm/yyyy"
        type="date"
        size="small"
        value={startDate}
        onChange={(e) =>
          onChange && onChange({ startDate: e.target.value, endDate })
        }
        InputLabelProps={{ shrink: true }}
        fullWidth
        sx={{ borderRadius: 2, bgcolor: "background.paper" }}
        InputProps={{ sx: { borderRadius: 2 } }}
      />
      <TextField
        placeholder="dd/mm/yyyy"
        type="date"
        size="small"
        value={endDate}
        onChange={(e) =>
          onChange && onChange({ startDate, endDate: e.target.value })
        }
        InputLabelProps={{ shrink: true }}
        fullWidth
        sx={{ borderRadius: 2, bgcolor: "background.paper" }}
        InputProps={{ sx: { borderRadius: 2 } }}
      />
    </Stack>
  </Box>
);

export default DateRangeFilter;
