import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, Stack, TextField,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  CheckCircleOutline, CloseRounded, DeleteOutlineRounded,
  HighlightOffRounded, LocationOnOutlined, SaveOutlined, StarRounded,
} from '@mui/icons-material';
import axiosInstance from '@/shared/api/httpClient.js';
import { formatPropertyDate, getPropertyMediaUrl } from '../utils/propertyDetails.js';
import PropertyPhotoGallery from './PropertyPhotoGallery.jsx';

function validateOrderValue(rawValue) {
  const trimmed = String(rawValue ?? '').trim();
  if (!trimmed) {
    return 'Vui lòng nhập số thứ tự hiển thị (từ 0 trở lên).';
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'Số thứ tự phải là số nguyên không âm (0, 1, 2...).';
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return 'Số thứ tự không hợp lệ.';
  }
  return '';
}

export default function PropertyDetailsDialog({ property, busy, onClose, onStatusUpdate, onRemove, onSaveOrder }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const orderInputId = useId();
  const orderErrorId = `${orderInputId}-error`;
  const orderInputRef = useRef(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [order, setOrder] = useState('');
  const [orderError, setOrderError] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);
  const disabled = busy || savingOrder;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setDetail(null);
    setOrderError('');
    axiosInstance.get(`/api/listings/admin/${property.id}`, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        if (response.data.code !== 200 || !response.data.result) throw new Error('Không thể tải chi tiết chỗ ở.');
        const initialPosition = response.data.result.position ?? 0;
        setDetail({ ...response.data.result, position: initialPosition });
        setOrder(String(initialPosition));
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.response?.data?.message || requestError.message || 'Không thể tải chi tiết chỗ ở.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [property.id, retry]);

  const saveOrder = async (event) => {
    event.preventDefault();
    if (disabled) return;
    const validationMessage = validateOrderValue(order);
    if (validationMessage) {
      setOrderError(validationMessage);
      orderInputRef.current?.focus();
      return;
    }
    const value = Number(order.trim());
    setOrderError('');
    setSavingOrder(true);
    try {
      await onSaveOrder(property.id, value);
      setDetail((prev) => (prev ? { ...prev, position: value } : prev));
      setOrder(String(value));
    } catch (saveError) {
      setOrderError(
        saveError?.response?.data?.message ||
        saveError?.message ||
        'Không thể cập nhật số thứ tự. Vui lòng thử lại.'
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const title = detail?.title || property.name || `Chỗ ở #${property.id}`;
  const address = [detail?.address, detail?.city, detail?.country].filter((value) => typeof value === 'string' && value.trim()).join(', ');

  return (
    <Dialog open fullWidth maxWidth="lg" fullScreen={fullScreen} aria-labelledby="property-detail-title"
      onClose={() => { if (!disabled) onClose(); }} transitionDuration={reducedMotion ? 0 : undefined}
      sx={{ '& .MuiDialog-paperFullScreen': { m: 0, width: '100%', maxHeight: '100%' } }}>
      <DialogTitle id="property-detail-title" sx={{ pr: 8, pb: 2 }}>
        Chi tiết chỗ ở
        <IconButton aria-label="Đóng chi tiết chỗ ở" onClick={onClose} disabled={disabled}
          sx={{ position: 'absolute', top: 12, right: 12, width: 44, height: 44 }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {loading && (
          <Stack role="status" alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress size={32} /><Typography>Đang tải chi tiết chỗ ở...</Typography>
          </Stack>
        )}
        {error && <Alert severity="error" action={<Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button>}>{error}</Alert>}
        {detail && (
          <Stack spacing={3}>
            <PropertyPhotoGallery images={detail.images || []} title={title} />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" useFlexGap flexWrap="wrap" alignItems="center" gap={1} sx={{ mb: 1 }}>
                  <Chip size="small" color={detail.access ? 'success' : 'warning'} label={detail.access ? 'Đã kích hoạt' : 'Đang chờ kích hoạt'} />
                  <Chip size="small" variant="outlined" label={detail.status === 'ACTIVE' ? 'Đang hoạt động' : 'Không hoạt động'} />
                  {detail.popular && <Chip size="small" variant="outlined" color="primary" label="Đang xu hướng" />}
                  <Chip size="small" variant="outlined" label={`Thứ tự: #${detail.position ?? 0}`} />
                </Stack>
                <Typography variant="h4" component="h2" sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, fontWeight: 700, overflowWrap: 'anywhere' }}>{title}</Typography>
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1 }}>
                  <LocationOnOutlined aria-hidden="true" sx={{ color: 'text.secondary', fontSize: 20, flexShrink: 0 }} />
                  <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{address || 'Chưa cập nhật địa chỉ'}</Typography>
                </Stack>
              </Box>
              <Box
                component="form"
                onSubmit={saveOrder}
                noValidate
                sx={{ flexShrink: 0 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    inputRef={orderInputRef}
                    id={orderInputId}
                    name="position"
                    label="Số thứ tự"
                    type="number"
                    size="small"
                    required
                    disabled={disabled}
                    error={Boolean(orderError)}
                    value={order}
                    onChange={(event) => {
                      const next = event.target.value;
                      setOrder(next);
                      if (orderError && !validateOrderValue(next)) {
                        setOrderError('');
                      }
                    }}
                    onBlur={() => setOrderError(validateOrderValue(order))}
                    sx={{
                      width: 120,
                      '& .MuiInputBase-input': { fontSize: '1rem' },
                    }}
                    inputProps={{
                      min: 0,
                      step: 1,
                      inputMode: 'numeric',
                      enterKeyHint: 'done',
                      'aria-describedby': orderError ? orderErrorId : undefined,
                      'aria-invalid': orderError ? 'true' : 'false',
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={savingOrder ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined />}
                    disabled={disabled}
                    sx={{ minHeight: 40, px: 1.75, whiteSpace: 'nowrap' }}
                  >
                    {savingOrder ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </Stack>
                {orderError && (
                  <Typography
                    id={orderErrorId}
                    role="alert"
                    variant="caption"
                    color="error"
                    sx={{ display: 'block', mt: 0.5, maxWidth: 220 }}
                  >
                    {orderError}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(0, 1fr)' }, alignItems: 'start' }}>
              <Box sx={{ minWidth: 0 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={2} alignItems="center" component="section" aria-label="Chủ sở hữu">
                    <Avatar src={getPropertyMediaUrl(detail.hostThumnailUrl)} alt={detail.hostName || 'Chủ sở hữu'} sx={{ width: 60, height: 60 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" color="text.secondary">Chủ sở hữu</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{detail.hostName || 'Chưa cập nhật tên'}</Typography>
                      {detail.hostId != null && <Typography variant="caption" color="text.secondary">Mã chủ sở hữu: #{detail.hostId}</Typography>}
                    </Box>
                  </Stack>
                  <Divider />
                  <Box component="section" aria-labelledby="property-description-heading">
                    <Typography id="property-description-heading" variant="h6" component="h3" gutterBottom>Mô tả chỗ ở</Typography>
                    <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere', lineHeight: 1.8 }}>
                      {detail.description?.trim() || 'Chưa có mô tả cho chỗ ở này.'}
                    </Typography>
                  </Box>
                  <Divider />
                  {[
                    ['Tiện nghi', detail.amenites || [], 'property-amenities-heading'],
                    ['Danh mục', detail.categories || [], 'property-categories-heading'],
                  ].map(([label, items, id]) => (
                    <Box component="section" aria-labelledby={id} key={id}>
                      <Typography id={id} variant="h6" component="h3" gutterBottom>{label} ({items.length})</Typography>
                      {items.length ? (
                        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
                          {items.map((item) => (
                            <Stack component="li" direction="row" alignItems="center" spacing={1.5} key={item.id ?? item.name}
                              sx={{ minWidth: 0, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                              <Avatar src={getPropertyMediaUrl(item.thumnailUrl)} alt="" variant="rounded"
                                sx={{ width: 32, height: 32, bgcolor: 'action.hover', color: 'text.secondary' }}><CheckCircleOutline fontSize="small" /></Avatar>
                              <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                                <Typography variant="body2">{item.name}</Typography>
                                {item.description && <Typography variant="caption" color="text.secondary">{item.description}</Typography>}
                              </Box>
                            </Stack>
                          ))}
                        </Box>
                      ) : <Typography color="text.secondary">{label === 'Tiện nghi' ? 'Chưa cập nhật tiện nghi.' : 'Chưa cập nhật danh mục.'}</Typography>}
                    </Box>
                  ))}
                </Stack>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Stack spacing={2.5} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.default' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Giá mỗi đêm</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {detail.price == null ? 'Chưa cập nhật' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detail.price)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <StarRounded aria-hidden="true" sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Typography variant="body2">Đánh giá: {detail.avgStart ?? 0}/5</Typography>
                  </Stack>
                  <Divider />
                  <Box component="dl" sx={{ m: 0 }}>
                    {[
                      ['Diện tích', detail.area ? `${detail.area} m²` : 'Chưa cập nhật'],
                      ['Ngày bắt đầu', formatPropertyDate(detail.startDate)],
                      ['Ngày kết thúc', formatPropertyDate(detail.endDate)],
                      ['Ngày tạo', formatPropertyDate(detail.createdAt)],
                      ['Cập nhật lần cuối', formatPropertyDate(detail.updatedAt)],
                    ].map(([label, value]) => (
                      <Box key={label} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                        <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
                        <Typography component="dd" variant="body2" sx={{ m: 0, mt: 0.25, fontWeight: 600 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, gap: { xs: 0.75, sm: 1.25 }, flexWrap: 'wrap',
        '& > :not(:first-of-type)': { ml: 0 },
        '& .MuiButton-root': { minHeight: 44, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}>
        <Button onClick={onClose} disabled={disabled}>Đóng</Button>
        {detail && !loading && (
          <>
            <Button color={detail.access ? 'warning' : 'success'} variant="outlined" disabled={disabled}
              startIcon={detail.access ? <HighlightOffRounded /> : <CheckCircleOutline />}
              onClick={() => onStatusUpdate(property.id, detail.access ? 'Đang chờ kích hoạt' : 'Đã kích hoạt')}>
              {detail.access ? 'Hủy kích hoạt' : 'Kích hoạt'}
            </Button>
            <Button color="error" variant="contained" startIcon={<DeleteOutlineRounded />} disabled={disabled}
              onClick={() => onRemove(property.id)}>Gỡ bỏ</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

PropertyDetailsDialog.propTypes = {
  property: PropTypes.shape({ id: PropTypes.number.isRequired, name: PropTypes.string }).isRequired,
  busy: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onStatusUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onSaveOrder: PropTypes.func.isRequired,
};
