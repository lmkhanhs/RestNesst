import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';



export default function AdminAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newIcon, setNewIcon] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true, position: 1, deleted: false, thumbnail: null });

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filteredAmenities = amenities.filter(
    (amenity) =>
      amenity.name.toLowerCase().includes(searchTerm) ||
      amenity.description.toLowerCase().includes(searchTerm)
  );

  const handleOpenDialog = (amenity = null) => {
    setSelectedAmenity(amenity);
    if (amenity) {
      setFormData({
        name: amenity.name || '',
        description: amenity.description || '',
        isActive: amenity.isActive ?? true,
        position: amenity.position || 1,
        deleted: amenity.deleted ?? false,
        thumbnail: null
      });
    } else {
      setFormData({ name: '', description: '', isActive: true, position: 1, deleted: false, thumbnail: null });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAmenity(null);
  };

  const handleOpenImageDialog = (amenity) => {
    setSelectedAmenity(amenity);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedAmenity(null);
    setNewIcon(null);
  };

  const handleStatusToggle = (id) => {
    setAmenities(prev =>
      prev.map(amenity =>
        amenity.id === id
          ? { ...amenity, status: amenity.status === 'active' ? 'inactive' : 'active' }
          : amenity
      )
    );
    setSnackbar({
      open: true,
      message: 'Cập nhật trạng thái thành công',
      severity: 'success'
    });
  };

  const handleIconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewIcon(URL.createObjectURL(file));
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, thumbnail: file }));
    }
  };

  const handleSaveAmenity = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('isActive', formData.isActive);
      payload.append('position', formData.position);
      payload.append('deleted', formData.deleted);
      if (formData.thumbnail) {
        payload.append('thumbnail', formData.thumbnail);
      }
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (selectedAmenity) {
        await axiosInstance.put(`/api/amenities/${selectedAmenity.id}`, payload, { headers });
      } else {
        await axiosInstance.post('/api/amenities', payload, { headers });
      }
    
      const res = await axiosInstance.get('/api/amenities/index');
      setAmenities(res.data.result || []);
      setSnackbar({ open: true, message: selectedAmenity ? 'Cập nhật tiện nghi thành công!' : 'Thêm tiện nghi thành công!', severity: 'success' });
      setOpenDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Thao tác thất bại!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Đang hoạt động' : 'Không hoạt động';
  };

  const handleDeleteAmenity = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tiện nghi này?')) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`/api/amenities/${id}`);
      const res = await axiosInstance.get('/api/amenities/index');
      setAmenities(res.data.result || []);
      setSnackbar({ open: true, message: 'Xóa tiện nghi thành công!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Xóa tiện nghi thất bại!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAmenities = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/amenities/index');
        setAmenities(res.data.result || []);
      } catch (error) {
        setSnackbar({ open: true, message: 'Không thể tải danh sách tiện nghi!', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchAmenities();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Quản lý tiện nghi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm tiện nghi mới
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Tìm kiếm tiện nghi..."
        variant="outlined"
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {filteredAmenities.map((amenity) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={amenity.id}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box
                    component="img"
                    src={amenity.thumnailUrl ? (amenity.thumnailUrl.startsWith('http') ? amenity.thumnailUrl : `http://175.41.233.105:8080${amenity.thumnailUrl}`) : ''}
                    alt={amenity.name}
                    sx={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'contain',
                      mb: 2
                    }}
                  />
                  <Typography variant="h6" align="center">
                    {amenity.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {amenity.description || ''}
                  </Typography>
                  <Chip
                    label={getStatusText(amenity.isActive)}
                    color={getStatusColor(amenity.isActive)}
                    size="small"
                    sx={{ alignSelf: 'center' }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="center">
                 
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(amenity)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa tiện nghi">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteAmenity(amenity.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openImageDialog}
        onClose={handleCloseImageDialog}
        maxWidth="sm"
        fullWidth
      >
      
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box
              component="img"
              src={newIcon || (selectedAmenity?.thumnailUrl ? (selectedAmenity.thumnailUrl.startsWith('http') ? selectedAmenity.thumnailUrl : `http://175.41.233.105:8080${selectedAmenity.thumnailUrl}`) : '')}
              alt="Current icon"
              sx={{
                width: '100%',
                height: '200px',
                objectFit: 'contain',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1
              }}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Chọn ảnh mới
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleIconUpload}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>Hủy</Button>
          <Button
            variant="contained"
            disabled={!newIcon || loading}
            onClick={async () => {
              if (!selectedAmenity || !newIcon) return;
              setLoading(true);
              try {
                if (!formData.thumbnail) return;
                const payload = new FormData();
                payload.append('thumbnail', formData.thumbnail);
                await axiosInstance.put(`/api/amenities/${selectedAmenity.id}/icon`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
                const res = await axiosInstance.get('/api/amenities/index');
                setAmenities(res.data.result || []);
                setSnackbar({ open: true, message: 'Cập nhật icon thành công!', severity: 'success' });
                setOpenImageDialog(false);
              } catch (error) {
                setSnackbar({ open: true, message: 'Cập nhật icon thất bại!', severity: 'error' });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Đang lưu...' : 'Lưu icon mới'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedAmenity ? 'Chỉnh sửa tiện nghi' : 'Thêm tiện nghi mới'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên tiện nghi"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <TextField
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Vị trí"
              name="position"
              type="number"
              value={formData.position}
              onChange={handleFormChange}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  name="isActive"
                  color="primary"
                />
              }
              label={<Typography fontWeight={500}>Hoạt động</Typography>}
              sx={{ ml: 0 }}
            />
            <Button
              variant="outlined"
              component="label"
              sx={{ minWidth: 120 }}
            >
              {formData.thumbnail ? 'Đã chọn ảnh' : 'Chọn ảnh'}
              <input
                accept="image/*"
                type="file"
                hidden
                onChange={handleThumbnailChange}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveAmenity} disabled={loading}>
            {loading ? 'Đang lưu...' : (selectedAmenity ? 'Lưu thay đổi' : 'Thêm mới')}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}
