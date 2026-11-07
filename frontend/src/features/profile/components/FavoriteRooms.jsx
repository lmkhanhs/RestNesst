import { Alert, Avatar, Box, Button, Card, CircularProgress, Stack, Typography } from '@mui/material';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { getMediaUrl } from '@/shared/utils/mediaUrl.js';
import useFavorites from '@/features/favorites/hooks/useFavorites.js';
import { formatProfileDate, formatProfilePrice } from '../utils/formatters.js';

export default function FavoriteRooms() {
  const { favorites, loading, error, reload, setSaved, isPending } = useFavorites();

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 3 }}>
        <FavoriteBorderRoundedIcon sx={{ color: 'primary.main' }} aria-hidden="true" />
        <Box>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 750 }}>Chỗ ở yêu thích</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {loading ? 'Đang cập nhật danh sách của bạn' : `${favorites.length} chỗ ở đã lưu · Mới thêm gần đây nhất`}
          </Typography>
        </Box>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={reload} sx={{ minHeight: 44 }}>Thử lại</Button>}>{error}</Alert>}
      {loading && <Stack role="status" alignItems="center" gap={1} sx={{ py: 4 }}><CircularProgress size={28} /><Typography>Đang tải danh sách yêu thích...</Typography></Stack>}
      {!loading && !error && !favorites.length && (
        <Stack alignItems="center" gap={1.5} sx={{ py: 5, textAlign: 'center' }}>
          <FavoriteBorderRoundedIcon sx={{ fontSize: 40, color: 'text.secondary' }} aria-hidden="true" />
          <Typography variant="h6">Bạn chưa lưu chỗ ở nào</Typography>
          <Typography color="text.secondary">Nhấn trái tim ở chỗ ở bạn thích để tìm lại tại đây.</Typography>
          <Button component={RouterLink} to="/" variant="contained">Khám phá chỗ ở</Button>
        </Stack>
      )}
      <Stack gap={2}>
        {favorites.map((room) => {
          const hasReviews = room.reviewCount > 0;
          const hasRating = hasReviews && room.avgStart != null && Number.isFinite(Number(room.avgStart));
          const hasSentiment = room.positiveReviewCount != null && room.negativeReviewCount != null;
          return (
            <Box key={room.id} component="article" aria-label={room.title}
              sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '180px minmax(0, 1fr)', lg: '224px minmax(0, 1fr) 184px' },
                gap: { xs: 2, sm: 2.5 }, p: 2, border: 1, borderColor: 'divider', borderRadius: 2.5, minWidth: 0, bgcolor: 'background.paper' }}>
              <Box component={RouterLink} to={`/property/${room.id}`} aria-label={`Xem ${room.title}`}
                sx={{ width: '100%', minHeight: { xs: 180, sm: 176 }, aspectRatio: { xs: '16 / 10', sm: 'auto' }, gridRow: { sm: 'span 2', lg: 'auto' },
                  overflow: 'hidden', borderRadius: 2, bgcolor: 'action.hover', display: 'grid', placeItems: 'center' }}>
                <Avatar variant="rounded" src={getMediaUrl(room.primaryThumnail)} alt={room.title}
                  sx={{ width: '100%', height: '100%', borderRadius: 0, bgcolor: 'action.hover' }}>
                  <ImageNotSupportedOutlinedIcon sx={{ color: 'text.secondary', fontSize: 32 }} aria-hidden="true" />
                </Avatar>
              </Box>
              <Stack gap={1.25} sx={{ minWidth: 0, alignSelf: 'center' }}>
                <Typography component={RouterLink} to={`/property/${room.id}`} variant="h6"
                  sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 750, lineHeight: 1.4, overflowWrap: 'anywhere', '&:hover': { color: 'primary.main' } }}>{room.title}</Typography>
                <Stack direction="row" gap={0.75} alignItems="flex-start" color="text.secondary">
                  <PlaceOutlinedIcon sx={{ fontSize: 18, mt: 0.25 }} aria-hidden="true" />
                  <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{[room.address, room.city].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ'}</Typography>
                </Stack>
                <Stack direction="row" gap={0.75} alignItems="center">
                  <StarRoundedIcon sx={{ fontSize: 20, color: 'warning.main' }} aria-hidden="true" />
                  <Typography variant="body2">
                    {hasRating && <Box component="span" sx={{ fontWeight: 750 }}>{Number(room.avgStart).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}/5 </Box>}
                    <Box component="span" sx={{ color: 'text.secondary' }}>{hasReviews ? `(${room.reviewCount} đánh giá)` : room.reviewCount === 0 ? 'Chưa có đánh giá' : 'Chưa cập nhật đánh giá'}</Box>
                  </Typography>
                </Stack>
                {hasReviews && hasSentiment ? (
                  <Box sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 650 }}>
                      {room.positiveReviewCount} tích cực · {room.negativeReviewCount} tiêu cực
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {room.unclassifiedReviewCount > 0 ? `${room.unclassifiedReviewCount} bình luận chưa phân loại` : 'Tất cả bình luận đã được phân loại'}
                    </Typography>
                  </Box>
                ) : <Typography variant="body2" color="text.secondary">{hasReviews ? 'Chưa có dữ liệu phân loại bình luận' : 'Chưa có bình luận để phân loại'}</Typography>}
                <Stack direction="row" gap={0.75} alignItems="center" color="text.secondary">
                  <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} aria-hidden="true" />
                  <Typography variant="caption">Ngày lưu: {formatProfileDate(room.savedAt)}</Typography>
                </Stack>
              </Stack>
              <Stack gap={1.5} sx={{ justifyContent: 'center', alignItems: 'stretch', gridColumn: { sm: 2, lg: 'auto' },
                borderLeft: { lg: 1 }, borderColor: { lg: 'divider' }, pl: { lg: 2.5 }, pt: { xs: 0.5, lg: 0 } }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 750 }}>{formatProfilePrice(room.price)}</Typography>
                  <Typography variant="body2" color="text.secondary">mỗi đêm</Typography>
                </Box>
                <Stack direction={{ xs: 'row', lg: 'column' }} flexWrap="wrap" gap={1}>
                  <Button component={RouterLink} to={`/property/${room.id}`} variant="contained" sx={{ minHeight: 44 }}>Xem chỗ ở</Button>
                  <Button color="primary" variant="outlined" disabled={isPending(room.id) || loading}
                    sx={(theme) => ({ minHeight: 44, color: theme.palette.primary[theme.palette.mode === 'dark' ? 'light' : 'main'], borderColor: theme.palette.primary[theme.palette.mode === 'dark' ? 'light' : 'main'], '&.Mui-disabled': { color: 'action.disabled', borderColor: 'action.disabledBackground' } })}
                    onClick={() => { setSaved(room.id, false).catch(() => {}); }}>Bỏ yêu thích</Button>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}
