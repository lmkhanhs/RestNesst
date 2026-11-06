import { Box, Stack, Typography, TextField } from "@mui/material";
import {
  DateRangePicker,
  SingleInputDateRangeField,
} from "@mui/x-date-pickers-pro";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import dayjs from "dayjs";
import PropTypes from "prop-types";

const DateRangeSelector = ({
  value = [null, null],
  setValue,
  startDate,
  endDate,
}) => {
  const minDate = startDate ? dayjs(startDate) : dayjs();
  const maxDate = endDate ? dayjs(endDate) : dayjs().add(6, "months");

  const shortcutItems = [
    {
      label: "Toàn bộ thời gian có sẵn",
      getValue: () => [minDate, maxDate],
    },
    {
      label: "Tuần đầu tiên",
      getValue: () => [
        minDate,
        minDate.add(7, "days").isAfter(maxDate)
          ? maxDate
          : minDate.add(7, "days"),
      ],
    },
    {
      label: "Tuần cuối cùng",
      getValue: () => [
        maxDate.subtract(7, "days").isBefore(minDate)
          ? minDate
          : maxDate.subtract(7, "days"),
        maxDate,
      ],
    },
    { label: "Đặt lại", getValue: () => [null, null] },
  ];

  return (
    <Box>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <CalendarMonthRoundedIcon
          sx={{ fontSize: 17, color: "var(--rn-brand-primary)" }}
        />
        <Typography
          variant="caption"
          sx={{
            color: "var(--rn-text-secondary)",
            fontWeight: 700,
          }}
        >
          Lịch trống ({minDate.format("DD/MM/YYYY")} –{" "}
          {maxDate.format("DD/MM/YYYY")})
        </Typography>
      </Stack>

      <DateRangePicker
        slots={{
          field: SingleInputDateRangeField,
          textField: TextField,
        }}
        slotProps={{
          shortcuts: { items: shortcutItems },
          textField: {
            fullWidth: true,
            variant: "outlined",
            placeholder: "Chọn ngày nhận phòng – trả phòng",
            InputProps: { disableUnderline: true },
          },
        }}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            bgcolor: "var(--rn-surface-2)",
            fontSize: "0.9rem",
            fontWeight: 600,
          },
        }}
        minDate={minDate}
        maxDate={maxDate}
        value={value}
        onChange={(newValue) => setValue(newValue)}
      />
    </Box>
  );
};

DateRangeSelector.propTypes = {
  value: PropTypes.array,
  setValue: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
};

export default DateRangeSelector;
