import PropTypes from 'prop-types';
import { Alert, Avatar, Box, Button, Card, Chip, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { getMediaUrl } from '@/shared/utils/mediaUrl.js';
import { formatProfileDate, formatProfilePrice } from '../utils/formatters.js';

const statuses = {
  PENDING: { label: 'Chờ xác nhận', color: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'info' },
  PAID: { label: 'Đã thanh toán', color: 'success' },
  SUCCESS: { label: 'Hoàn tất', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
};

export default function BookedRooms({ rooms, error, success, loading, fetching, loadError, onReload, onConfirmCheckout, onReview }) {
  const renderStatus = (room) => {
    const status = statuses[room.bookingStatus?.trim().toUpperCase()] || { label: room.bookingStatus || 'Chưa cập nhật', color: 'info' };
    return <Chip label={status.label} variant="outlined" size="small" sx={(theme) => ({
      fontWeight: 650, color: theme.palette[status.color][theme.palette.mode === 'dark' ? 'light' : 'dark'],
      bgcolor: alpha(theme.palette[status.color].main, 0.12), borderColor: alpha(theme.palette[status.color].main, 0.35),
    })} />;
  };
  const renderRoom = (room) => (
    <Stack direction="row" gap={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar variant="rounded" src={getMediaUrl(room.primaryUrl)} alt={room.title}
        sx={{ width: 64, height: 64, bgcolor: 'action.hover', flexShrink: 0 }}><HotelOutlinedIcon /></Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography component={RouterLink} to={`/property/${room.listingId}`} sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 700,
          overflowWrap: 'anywhere', '&:hover': { color: 'primary.main' } }}>{room.title || 'Xem chỗ ở'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>{[room.address, room.city].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ'}</Typography>
      </Box>
    </Stack>
  );
  const renderDates = (room) => (
    <Stack gap={0.5}>
      <Typography variant="body2">Nhận: {formatProfileDate(room.checkInDate)}</Typography>
      <Typography variant="body2" color="text.secondary">Trả: {formatProfileDate(room.checkOutDate)}</Typography>
    </Stack>
  );
  const renderPrice = (room) => (
    <Box>
      <Typography sx={{ fontWeight: 700 }}>{formatProfilePrice(room.totalPrice)}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{formatProfilePrice(room.price)} / đêm</Typography>
    </Box>
  );
  const renderActions = (room) => {
    const status = room.bookingStatus?.trim().toUpperCase();
    return <Stack gap={1} alignItems="flex-start">
      {renderStatus(room)}
      {status === 'PAID' && <Button variant="outlined" size="small" disabled={loading} startIcon={<CheckRoundedIcon />}
        sx={(theme) => ({ minHeight: 44, color: theme.palette.primary[theme.palette.mode === 'dark' ? 'light' : 'main'], borderColor: theme.palette.primary[theme.palette.mode === 'dark' ? 'light' : 'main'] })}
        onClick={() => onConfirmCheckout(room.bookingId)}>Xác nhận trả phòng</Button>}
      {status === 'SUCCESS' && room.commented === false && <Button variant="outlined" size="small" startIcon={<RateReviewOutlinedIcon />}
        sx={(theme) => ({ minHeight: 44, color: theme.palette.primary[theme.palette.mode === 'dark' ? 'light' : 'main'], borderColor: theme.palette.primary[theme.palette.mode === 'dark' ? 'light' : 'main'] })}
        onClick={() => onReview(room)}>Đánh giá</Button>}
    </Stack>;
  };

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 3 }}>
        <HotelOutlinedIcon sx={{ color: 'primary.main' }} aria-hidden="true" />
        <Box>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 750 }}>Phòng đã đặt</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{fetching ? 'Đang cập nhật lịch lưu trú của bạn' : `${rooms.length} lượt đặt phòng · Theo dõi lịch lưu trú và trạng thái`}</Typography>
        </Box>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Xác nhận trả phòng thành công!</Alert>}
      {loadError && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={onReload} sx={{ minHeight: 44 }}>Thử lại</Button>}>{loadError}</Alert>}
      {fetching && <Stack role="status" gap={1} alignItems="center" sx={{ py: 4 }}><CircularProgress size={28} /><Typography>Đang tải phòng đã đặt...</Typography></Stack>}
      {!fetching && !loadError && (!rooms.length ? (
        <Stack alignItems="center" gap={1.5} sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h6">Bạn chưa đặt phòng nào</Typography>
          <Typography color="text.secondary">Khám phá chỗ ở và lên kế hoạch cho chuyến đi tiếp theo.</Typography>
          <Button component={RouterLink} to="/" variant="contained">Tìm chỗ ở</Button>
        </Stack>
      ) : <>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Table aria-label="Danh sách phòng đã đặt" sx={{ tableLayout: 'fixed', '& td': { color: 'text.primary', borderBottom: 1, borderColor: 'divider', py: 2.5, verticalAlign: 'top' } }}>
            <TableHead sx={{ bgcolor: 'background.neutral', '& th': { color: 'text.secondary', fontWeight: 700, borderColor: 'divider' } }}>
              <TableRow>
                <TableCell sx={{ width: '34%' }}>Chỗ ở</TableCell>
                <TableCell sx={{ width: '22%' }}>Lịch lưu trú</TableCell>
                <TableCell sx={{ width: '22%' }}>Tổng tiền</TableCell>
                <TableCell sx={{ width: '22%' }}>Trạng thái & thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => <TableRow key={room.bookingId} hover sx={{ bgcolor: 'background.paper', '&:last-child td': { borderBottom: 0 } }}>
                <TableCell>{renderRoom(room)}</TableCell>
                <TableCell>{renderDates(room)}</TableCell>
                <TableCell>{renderPrice(room)}</TableCell>
                <TableCell>{renderActions(room)}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack gap={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
          {rooms.map((room) => <Stack component="article" aria-label={`Đặt phòng ${room.bookingId}`} key={room.bookingId} gap={2}
            sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', minWidth: 0 }}>
            {renderRoom(room)}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              {renderDates(room)}
              {renderPrice(room)}
            </Box>
            {renderActions(room)}
          </Stack>)}
        </Stack>
      </>)}
    </Card>
  );
}

BookedRooms.propTypes = {
  rooms: PropTypes.array.isRequired,
  error: PropTypes.string,
  success: PropTypes.bool,
  loading: PropTypes.bool,
  fetching: PropTypes.bool,
  loadError: PropTypes.string,
  onReload: PropTypes.func.isRequired,
  onConfirmCheckout: PropTypes.func.isRequired,
  onReview: PropTypes.func.isRequired,
};
