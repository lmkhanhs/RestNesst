import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Avatar, Box, Button, Card, Chip, Divider, InputAdornment, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Link as RouterLink } from 'react-router-dom';
import { getMediaUrl } from '@/shared/utils/mediaUrl.js';
import { formatHostDate, formatHostPrice, normalizeHostProperty, propertyStatuses } from '../utils/propertyDisplay.js';

export default function HostProperties({ properties, loading, error, onReload, onAdd, onEdit }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const rooms = useMemo(() => properties.map(normalizeHostProperty), [properties]);
  const shown = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('vi-VN');
    return rooms.filter((room) => (status === 'all' || room.status === status)
      && [room.title, room.address, room.city, room.country].filter(Boolean).join(' ').toLocaleLowerCase('vi-VN').includes(search))
      .sort((a, b) => {
        if (sort === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
        if (sort === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
        if (sort === 'rating') return Number(b.avgStart || 0) - Number(a.avgStart || 0);
        return Number(b.id) - Number(a.id);
      });
  }, [rooms, query, status, sort]);
  const resetFilters = () => { setQuery(''); setStatus('all'); setSort('newest'); };

  return (
    <Box component="section" aria-labelledby="host-properties-title" sx={{ pt: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1} sx={{ mb: 2.5 }}>
        <Box>
          <Typography id="host-properties-title" component="h2" variant="h5" sx={{ fontWeight: 750 }}>Chỗ ở của bạn</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Cập nhật thông tin, giá mỗi đêm và lịch nhận khách tại một nơi.</Typography>
        </Box>
        <Typography role="status" aria-live="polite" variant="body2" color="text.secondary">
          {loading ? 'Đang cập nhật danh sách' : error ? 'Danh sách chưa cập nhật' : `${shown.length} / ${rooms.length} chỗ ở`}
        </Typography>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '1fr 1fr', md: 'minmax(0, 1fr) 200px 224px' }, gap: 2,
        p: { xs: 2, sm: 2.5 }, mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
        <TextField id="host-property-search" label="Tìm chỗ ở" placeholder="Tên phòng, địa chỉ, thành phố..." value={query} onChange={(event) => setQuery(event.target.value)} fullWidth
          sx={{ gridColumn: { sm: 'span 2', md: 'auto' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon aria-hidden="true" /></InputAdornment> }} />
        <TextField id="host-property-status" select fullWidth label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}>
          <MenuItem value="all">Tất cả trạng thái</MenuItem>
          {Object.entries(propertyStatuses).map(([value, item]) => <MenuItem key={value} value={value}>{item.label}</MenuItem>)}
        </TextField>
        <TextField id="host-property-sort" select fullWidth label="Sắp xếp" value={sort} onChange={(event) => setSort(event.target.value)}>
          <MenuItem value="newest">Mới nhất</MenuItem>
          <MenuItem value="price-asc">Giá: thấp đến cao</MenuItem>
          <MenuItem value="price-desc">Giá: cao đến thấp</MenuItem>
          <MenuItem value="rating">Điểm đánh giá cao nhất</MenuItem>
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={onReload} sx={{ minHeight: 44 }}>Thử lại</Button>}>{error}</Alert>}
      {loading ? (
        <Box aria-label="Đang tải chỗ ở" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
          {[0, 1, 2].map((key) => <Box key={key} sx={{ minWidth: 0 }}><Skeleton variant="rounded" height={210} /><Skeleton height={42} /><Skeleton width="70%" /><Skeleton height={80} /></Box>)}
        </Box>
      ) : !error && !shown.length ? (
        <Stack alignItems="center" gap={1.5} sx={{ py: 7, px: 2, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <HomeWorkOutlinedIcon sx={{ fontSize: 44, color: 'text.secondary' }} aria-hidden="true" />
          <Typography variant="h6">{rooms.length ? 'Không tìm thấy chỗ ở phù hợp' : 'Bắt đầu với chỗ ở đầu tiên của bạn'}</Typography>
          <Typography color="text.secondary">{rooms.length ? 'Thử tên khác hoặc bỏ bộ lọc để xem toàn bộ chỗ ở.' : 'Thêm hình ảnh, thông tin và lịch nhận khách để giới thiệu chỗ ở của bạn.'}</Typography>
          <Button variant="contained" onClick={rooms.length ? resetFilters : onAdd} startIcon={!rooms.length ? <AddRoundedIcon /> : undefined} sx={{ minHeight: 44 }}>
            {rooms.length ? 'Xóa bộ lọc' : 'Thêm chỗ ở mới'}
          </Button>
        </Stack>
      ) : !error && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
          {shown.map((room) => {
            const state = propertyStatuses[room.status] || { label: room.status || 'Chưa cập nhật', color: 'info' };
            const image = room.images.map((item) => getMediaUrl(typeof item === 'string' ? item : item?.imageUrl)).find(Boolean);
            const reviewCount = Array.isArray(room.reviews) ? room.reviews.length : null;
            const rating = Number(room.avgStart || 0);
            return (
              <Card component="article" aria-label={room.title} key={room.id} elevation={0}
                sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper',
                  transition: 'border-color 160ms ease, box-shadow 160ms ease', '&:hover': { borderColor: 'text.disabled', boxShadow: (theme) => theme.customShadows.z8 },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }}>
                <Box sx={{ position: 'relative' }}>
                  <Box component={RouterLink} to={`/property/${room.id}`} aria-label={`Xem ${room.title}`} sx={{ display: 'block', aspectRatio: '16 / 10', bgcolor: 'background.neutral' }}>
                    <Avatar variant="square" src={image} alt={room.title} sx={{ width: '100%', height: '100%', position: 'absolute', inset: 0, bgcolor: 'background.neutral' }}>
                      <ImageNotSupportedOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary' }} aria-hidden="true" />
                    </Avatar>
                  </Box>
                  <Chip label={state.label} size="small" sx={(theme) => ({ position: 'absolute', top: 12, left: 12, fontWeight: 700, bgcolor: theme.palette.background.paper,
                    color: theme.palette[state.color][theme.palette.mode === 'dark' ? 'light' : 'dark'], border: `1px solid ${alpha(theme.palette[state.color].main, 0.25)}`, boxShadow: theme.customShadows.z1 })} />
                </Box>
                <Stack gap={1.5} sx={{ p: 2.5, flex: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Mã chỗ ở #{room.id}</Typography>
                    <Typography component="h3" variant="h6" sx={{ mt: 0.5, fontWeight: 750, overflowWrap: 'anywhere' }}>{room.title}</Typography>
                  </Box>
                  <Stack direction="row" gap={0.75} alignItems="flex-start" color="text.secondary">
                    <PlaceOutlinedIcon sx={{ fontSize: 18, flexShrink: 0, mt: 0.25 }} aria-hidden="true" />
                    <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{[room.address, room.city, room.country].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ'}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <StarRoundedIcon sx={{ fontSize: 19, color: 'warning.main' }} aria-hidden="true" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{rating > 0 ? rating.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : 'Mới'}</Typography>
                    <Typography variant="body2" color="text.secondary">{reviewCount != null ? `(${reviewCount} đánh giá)` : 'Chưa cập nhật đánh giá'}</Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 750 }}>{formatHostPrice(room.price)} <Typography component="span" variant="body2" color="text.secondary">/ đêm</Typography></Typography>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
                    <Stack direction="row" gap={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                      <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} aria-hidden="true" />
                      <Typography variant="caption" color="text.secondary">Lịch nhận khách</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{room.startDate && room.endDate
                      ? `${formatHostDate(room.startDate)} – ${formatHostDate(room.endDate)}` : 'Chưa cập nhật lịch nhận khách'}</Typography>
                  </Box>
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {room.amenites.slice(0, 2).map((amenity, index) => <Chip key={amenity.id ?? index} label={amenity.name || 'Tiện nghi'} size="small" variant="outlined" sx={{ maxWidth: '100%' }} />)}
                    {room.amenites.length > 2 && <Chip label={`+${room.amenites.length - 2} tiện nghi`} size="small" variant="outlined" />}
                    {!room.amenites.length && <Typography variant="caption" color="text.secondary">Chưa cập nhật tiện nghi</Typography>}
                  </Stack>
                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(room)} aria-label={`Chỉnh sửa ${room.title}`} sx={{ minHeight: 44, flex: 1 }}>Chỉnh sửa</Button>
                      <Button component={RouterLink} to={`/property/${room.id}`} variant="outlined" startIcon={<OpenInNewRoundedIcon />} aria-label={`Xem trang ${room.title}`}
                        sx={(theme) => ({ minHeight: 44, color: theme.palette.text.primary, borderColor: theme.palette.divider })}>Xem phòng</Button>
                    </Stack>
                  </Box>
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

HostProperties.propTypes = {
  properties: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onReload: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};
