import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  Badge,
  LinearProgress,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Hotel as HotelIcon,
  Public as PublicIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';



export default function AdminCountries() {
  const [countries, setCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    image: '',
    isActive: true
  });
  const [errorAlert, setErrorAlert] = useState('');


  const fetchCountries = async () => {
    try {
      const res = await axiosInstance.get('/api/countries/detail');
      setCountries(res.data.result || []);
    } catch (error) {
      setErrorAlert('Không thể tải danh sách quốc gia!');
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filteredCountries = countries
    .filter((country) =>
      (country.name.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm)) &&
      (filterStatus === 'all' || country.status === filterStatus)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'properties':
          return b.totalProperties - a.totalProperties;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const handleOpenDialog = (country = null) => {
    if (country) {
      setSelectedCountry(country);
      setFormData({
        name: country.name,
        code: country.code,
        description: country.description,
        image: country.thumbnail || '',
        isActive: country.isActive !== undefined ? country.isActive : true
      });
    } else {
      setSelectedCountry(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        image: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCountry(null);
  };

  const handleSubmit = async () => {
    if (selectedCountry) {
      try {
        const form = new FormData();
        form.append('id', selectedCountry.id);
        form.append('name', formData.name);
        form.append('description', formData.description);
        form.append('isActive', formData.isActive);
   
        if (formData.image && formData.image.startsWith('data:')) {
          const arr = formData.image.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const file = new File([u8arr], 'thumbnail.png', { type: mime });
          form.append('thumbnail', file);
        }
        const res = await axiosInstance.put('/api/countries', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        await fetchCountries();
        setShowSuccessAlert(true);
        handleCloseDialog();
      } catch (error) {
        setErrorAlert('Cập nhật quốc gia thất bại!');
      }
    } else {
      try {
        let res;
        if (formData.image) {
          const form = new FormData();
          form.append('name', formData.name);
          form.append('description', formData.description);
          form.append('isActive', formData.isActive);

          if (formData.image.startsWith('data:')) {

            const arr = formData.image.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const file = new File([u8arr], 'thumbnail.png', { type: mime });
            form.append('thumbnail', file);
          }
        
          res = await axiosInstance.post('/api/countries', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
  
          const payload = {
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive
          };
          res = await axiosInstance.post('/api/countries', payload);
        }
    
        await fetchCountries();
        setShowSuccessAlert(true);
        handleCloseDialog();
      } catch (error) {
        setErrorAlert('Thêm quốc gia thất bại!');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quốc gia này?')) {
      try {
        await axiosInstance.delete(`/api/countries/${id}`);
        await fetchCountries();
        setShowSuccessAlert(true);
      } catch (error) {
        setErrorAlert('Xóa quốc gia thất bại!');
      }
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlagIcon color="primary" /> Quản lý Quốc gia
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Thêm Quốc gia
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Tìm kiếm quốc gia..."
          variant="outlined"
          onChange={handleSearchChange}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ borderRadius: 2 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sắp xếp theo</InputLabel>
          <Select
            value={sortBy}
            label="Sắp xếp theo"
            onChange={(e) => setSortBy(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <FilterIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="name">Tên</MenuItem>
            <MenuItem value="properties">Số lượng homestay</MenuItem>
            <MenuItem value="rating">Đánh giá</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={3}>
        {filteredCountries.map((country) => (
          <Grid item xs={12} md={6} key={country.id}>
            <Card 
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={country.thumbnail || country.image || ''}
                  alt={country.name}
                />
                {country.trending && (
                  <Chip
                    icon={<TrendingUpIcon />}
                    label="Đang thịnh hành"
                    color="secondary"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16
                    }}
                  />
                )}
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                    {country.name}
                  </Typography>
                  <Chip
                    icon={<StarIcon />}
                    label={
                      typeof country.rating === 'number' && !isNaN(country.rating)
                        ? country.rating.toFixed(1)
                        : '0.0'
                    }
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={country.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    color={country.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Stack>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {country.description}
                </Typography>

                <Stack direction="row" spacing={2} mb={2}>
                  
                  <Chip
                    icon={<HotelIcon />}
                    label={`${country.totalHomestays} homestay`}
                    variant="outlined"
                  />
                </Stack>

               

               
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Tooltip title="Chỉnh sửa">
                  <IconButton 
                    onClick={() => handleOpenDialog(country)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton 
                    onClick={() => handleDelete(country.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {selectedCountry ? 'Chỉnh sửa Quốc gia' : 'Thêm Quốc gia mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              {selectedCountry ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <TextField
                    label="Tên quốc gia"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FlagIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ flex: 1, mr: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={formData.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    sx={{
                      ml: 2,
                      '.MuiFormControlLabel-label': {
                        fontWeight: 600,
                        color: formData.isActive ? 'success.main' : 'text.secondary',
                        fontSize: 16
                      }
                    }}
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label="Tên quốc gia"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FlagIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: 16,
                    bgcolor: 'primary.main',
                    color: 'white',
                    boxShadow: 2,
                    mb: 1.5,
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  Tải Hình Ảnh Lên
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, image: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                {formData.image && (
                  <Box sx={{ mt: 1, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{
                        maxWidth: 220,
                        maxHeight: 140,
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        objectFit: 'cover',
                        marginBottom: 8
                      }}
                    />
                    <Button size="small" color="error" variant="outlined" onClick={() => setFormData({ ...formData, image: '' })}>
                      Xóa ảnh
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
          >
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            startIcon={selectedCountry ? <EditIcon /> : <AddIcon />}
          >
            {selectedCountry ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </Box>
      </Dialog>


      

      {showSuccessAlert && (
        <Alert
          severity="success"
          onClose={() => setShowSuccessAlert(false)}
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          {'Lưu thông tin quốc gia thành công!'}
        </Alert>
      )}

      {errorAlert && (
        <Alert
          severity="error"
          onClose={() => setErrorAlert('')}
          sx={{ 
            position: 'fixed', 
            bottom: 80, 
            right: 24,
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          {errorAlert}
        </Alert>
      )}
    </Box>
  );
}
