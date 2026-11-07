import { Box, Button, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

const DateRangeSelector = ({ value = [null, null], setValue, startDate, endDate }) => {
  const theme = useTheme();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const minDate = (startDate ? dayjs(startDate) : dayjs()).startOf('day');
  const maxDate = (endDate ? dayjs(endDate) : dayjs().add(6, 'months')).startOf('day');
  const [checkIn, checkOut] = value;
  const checkoutMin = checkIn?.isValid() && checkIn.isAfter(minDate, 'day') ? checkIn : minDate;
  const firstWeekEnd = minDate.add(7, 'days');
  const lastWeekStart = maxDate.subtract(7, 'days');
  const shortcuts = [
    { label: 'Toàn bộ lịch trống', dates: [minDate, maxDate] },
    { label: 'Tuần đầu tiên', dates: [minDate, firstWeekEnd.isAfter(maxDate) ? maxDate : firstWeekEnd] },
    { label: 'Tuần cuối cùng', dates: [lastWeekStart.isBefore(minDate) ? minDate : lastWeekStart, maxDate] },
    { label: 'Đặt lại', dates: [null, null] },
  ];
  const pickerProps = (label) => ({
    format: 'DD/MM/YYYY',
    localeText: { openDatePickerDialogue: () => label },
    desktopModeMediaQuery: theme.breakpoints.up('sm'),
    reduceAnimations: reducedMotion,
    slotProps: {
      textField: { fullWidth: true, size: 'small', sx: { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } } },
      openPickerButton: { 'aria-label': `Chọn ${label.toLowerCase()}` },
      actionBar: { actions: ['clear', 'cancel', 'accept'] },
      dialog: { transitionDuration: reducedMotion ? 0 : undefined },
      mobilePaper: { sx: { bgcolor: 'background.paper' } },
      desktopPaper: { sx: { bgcolor: 'background.paper' } },
      popper: { placement: 'bottom-end' },
    },
  });

  return (
    <Box>
      <Stack direction="row" gap={0.75} alignItems="center" sx={{ mb: 2 }}>
        <CalendarMonthRoundedIcon color="primary" sx={{ fontSize: 17 }} aria-hidden="true" />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          Lịch trống ({minDate.format('DD/MM/YYYY')} – {maxDate.format('DD/MM/YYYY')})
        </Typography>
      </Stack>
      <Stack gap={2}>
        <DatePicker {...pickerProps('Ngày nhận phòng')} label="Ngày nhận phòng"
          minDate={minDate} maxDate={maxDate} value={checkIn}
          onChange={(date) => setValue([date,
            date?.isValid() && checkOut?.isValid() && checkOut.isBefore(date, 'day') ? null : checkOut])} />
        <DatePicker {...pickerProps('Ngày trả phòng')} label="Ngày trả phòng"
          minDate={checkoutMin} maxDate={maxDate} value={checkOut}
          onChange={(date) => setValue([checkIn, date])} />
      </Stack>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
        {shortcuts.map(({ label, dates }) => (
          <Button key={label} size="small" onClick={() => setValue(dates)}
            sx={{ minHeight: 44, fontSize: '0.75rem', px: 1 }}>{label}</Button>
        ))}
      </Stack>
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
