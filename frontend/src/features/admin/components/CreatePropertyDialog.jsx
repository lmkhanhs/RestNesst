import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, Stack, TextField, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import axiosInstance from '@/shared/api/httpClient.js';
import { geocodeAddress, isValidCoordinate } from '@/features/listings/utils/propertyCoordinates.js';

export default function CreatePropertyDialog({ onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const submitting = useRef(false);
  const [property, setProperty] = useState({
    title: '', description: '', address: '', city: '', country: '',
    latitude: '', longitude: '',
    area: '', price: '', startDate: '', endDate: '',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [options, setOptions] = useState({ countries: [], categories: [], amenities: [] });
  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setOptionsLoading(true);
    setOptionsError('');
    Promise.all([
      axiosInstance.get('/api/countries', { signal: controller.signal }),
      axiosInstance.get('/api/categories', { signal: controller.signal }),
      axiosInstance.get('/api/amenities', { signal: controller.signal }),
    ]).then(([countries, categoryResponse, amenityResponse]) => {
      if (!controller.signal.aborted) {
        setOptions({
          countries: countries.data.result || [],
          categories: categoryResponse.data.result || [],
          amenities: amenityResponse.data.result || [],
        });
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setOptionsError('Không thể tải quốc gia, danh mục và tiện nghi. Vui lòng thử lại.');
      }
    }).finally(() => {
      if (!controller.signal.aborted) setOptionsLoading(false);
    });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const handleChange = (event) => {
    setProperty((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleResolveCoordinates = async () => {
    if (!property.address.trim() && !property.city.trim()) {
      setError('Vui lòng nhập địa chỉ hoặc thành phố trước khi lấy tọa độ.');
      return;
    }
    setError('');
    setGeocoding(true);
    try {
      const coords = await geocodeAddress({
        address: property.address,
        city: property.city,
        country: property.country || 'Việt Nam',
      });
      if (coords && isValidCoordinate(coords.latitude, coords.longitude)) {
        setProperty((previous) => ({
          ...previous,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));
      }
    } finally {
      setGeocoding(false);
    }
  };

  const handleImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setError('Vui lòng chỉ chọn tệp hình ảnh.');
      event.target.value = '';
      setImages([]);
      return;
    }
    setError('');
    setImages(files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current || optionsLoading || optionsError || !options.countries.length) return;
    if (['title', 'description', 'address', 'city'].some((key) => !property[key].trim())) {
      setError('Vui lòng nhập đầy đủ thông tin chỗ ở, không chỉ nhập khoảng trắng.');
      return;
    }
    if (!property.country || !images.length || Number(property.price) <= 0 || Number(property.area) <= 0) {
      setError('Vui lòng chọn quốc gia, ít nhất một ảnh và nhập giá, diện tích lớn hơn 0.');
      return;
    }
    if (!property.startDate || !property.endDate || property.endDate < property.startDate) {
      setError('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      Object.entries(property).forEach(([key, value]) => {
        if (key === 'latitude' || key === 'longitude') return;
        formData.append(key, String(value).trim());
      });
      if (isValidCoordinate(property.latitude, property.longitude)) {
        formData.append('latitude', String(Number(property.latitude)));
        formData.append('longitude', String(Number(property.longitude)));
      }
      // Giữ tên field và cách gửi danh sách theo API tạo chỗ ở hiện tại.
      formData.append('categories', categories.map((item) => item.name).join(','));
      formData.append('amenites', amenities.map((item) => item.name).join(','));
      images.forEach((file) => formData.append('imgs', file));
      const response = await axiosInstance.post('/api/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (![200, 201].includes(response.status) || ![200, 201].includes(response.data.code)) {
        throw new Error(response.data.message || 'Không thể tạo chỗ ở. Vui lòng thử lại.');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không thể tạo chỗ ở. Vui lòng thử lại.');
      return;
    } finally {
      submitting.current = false;
      setSaving(false);
    }
    onCreated();
  };

  return (
    <Dialog
      open
      onClose={() => { if (!submitting.current) onClose(); }}
      aria-labelledby="create-property-title"
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      sx={{ '& .MuiDialog-paperFullScreen': { m: 0, width: '100%', maxHeight: '100%' } }}
      transitionDuration={reducedMotion ? 0 : undefined}
    >
      <DialogTitle id="create-property-title">Thêm chỗ ở mới</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chỗ ở sẽ thuộc tài khoản quản trị đang đăng nhập và được kích hoạt ngay sau khi tạo.
          </Typography>
          {error && <Alert ref={errorRef} tabIndex={-1} severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {optionsLoading && <Typography role="status" sx={{ mb: 2 }}>Đang tải lựa chọn...</Typography>}
          {optionsError && (
            <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => setRetry((value) => value + 1)}>Thử lại</Button>}>
              {optionsError}
            </Alert>
          )}
          {!optionsLoading && !optionsError && !options.countries.length && (
            <Alert severity="warning" sx={{ mb: 2 }}>Chưa có quốc gia. Hãy thêm quốc gia trong mục Quốc gia trước khi tạo chỗ ở.</Alert>
          )}
          <Box component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
            <Grid container spacing={2}>
              {[
                ['title', 'Tên chỗ ở', 12], ['description', 'Mô tả', 12],
                ['address', 'Địa chỉ', 6], ['city', 'Thành phố', 6],
              ].map(([name, label, width]) => (
                <Grid item xs={12} sm={width} key={name}>
                  <TextField
                    name={name} label={label} value={property[name]} onChange={handleChange}
                    fullWidth required autoFocus={name === 'title'}
                    multiline={name === 'description'} minRows={name === 'description' ? 3 : undefined}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField
                  select fullWidth required label="Quốc gia" name="country" value={property.country}
                  onChange={handleChange} disabled={optionsLoading || Boolean(optionsError)}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}
                >
                  <option value="">Chọn quốc gia</option>
                  {options.countries.map((country) => <option key={country.id} value={country.name}>{country.name}</option>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="latitude" label="Vĩ độ (tùy chọn)" type="number" fullWidth
                  value={property.latitude} onChange={handleChange}
                  inputProps={{ step: 'any', min: -90, max: 90 }}
                  helperText="Để trống sẽ tự động phân giải"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="longitude" label="Kinh độ (tùy chọn)" type="number" fullWidth
                  value={property.longitude} onChange={handleChange}
                  inputProps={{ step: 'any', min: -180, max: 180 }}
                />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Button
                  type="button" variant="outlined" fullWidth onClick={handleResolveCoordinates}
                  disabled={geocoding || saving}
                  sx={{ minHeight: 56, fontWeight: 700, textTransform: 'none' }}
                >
                  {geocoding ? 'Đang tra tọa độ...' : 'Lấy tọa độ từ địa chỉ'}
                </Button>
              </Grid>
              {[
                ['price', 'Giá mỗi đêm (VND)'], ['area', 'Diện tích (m²)'],
              ].map(([name, label]) => (
                <Grid item xs={12} sm={6} key={name}>
                  <TextField
                    name={name} label={label} type="number" fullWidth required
                    value={property[name]} onChange={handleChange} inputProps={{ min: 0.01, step: 'any' }}
                  />
                </Grid>
              ))}
              {[
                ['startDate', 'Ngày bắt đầu'], ['endDate', 'Ngày kết thúc'],
              ].map(([name, label]) => (
                <Grid item xs={12} sm={6} key={name}>
                  <TextField
                    name={name} label={label} type="date" fullWidth required
                    value={property[name]} onChange={handleChange} InputLabelProps={{ shrink: true }}
                    inputProps={name === 'endDate' ? { min: property.startDate || undefined } : undefined}
                  />
                </Grid>
              ))}
              {[
                ['Danh mục', options.categories, categories, setCategories],
                ['Tiện nghi', options.amenities, amenities, setAmenities],
              ].map(([label, choices, selected, setSelected]) => (
                <Grid item xs={12} key={label}>
                  <Autocomplete
                    multiple options={choices} value={selected} onChange={(_, value) => setSelected(value)}
                    getOptionLabel={(option) => option.name} isOptionEqualToValue={(a, b) => a.id === b.id}
                    disabled={optionsLoading || Boolean(optionsError) || saving} noOptionsText="Chưa có lựa chọn"
                    renderInput={(params) => <TextField {...params} label={label} />}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Typography component="label" htmlFor="create-property-images" sx={{ display: 'block', mb: 1 }}>
                  Hình ảnh (ít nhất 1 ảnh) *
                </Typography>
                <Box
                  component="input" id="create-property-images" type="file" accept="image/*" multiple required
                  onChange={handleImages} sx={{ width: '100%', minHeight: 44 }}
                />
                <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                  {previews.map((url, index) => (
                    <Box component="img" key={url} src={url} alt={`Ảnh xem trước ${index + 1}`}
                      sx={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 1 }} />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, '& .MuiButton-root': { minHeight: 44 } }}>
          <Button onClick={onClose} disabled={saving}>Hủy</Button>
          <Button
            type="submit" variant="contained"
            disabled={saving || optionsLoading || Boolean(optionsError) || !options.countries.length}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {saving ? 'Đang tạo...' : 'Tạo chỗ ở'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

CreatePropertyDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};
