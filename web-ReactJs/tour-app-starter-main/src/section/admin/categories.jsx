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
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel
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



export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newIcon, setNewIcon] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true, position: 1, thumbnail: null, preview: '' });

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/categories/index');
        setCategories(res.data.result || []);
      } catch (error) {
        setSnackbar({ open: true, message: 'Không thể tải danh mục!', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm) ||
      category.description.toLowerCase().includes(searchTerm)
  );

  const handleOpenDialog = (category = null) => {
    setSelectedCategory(category);
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        isActive: category.isActive ?? true,
        position: category.position || 1,
        thumbnail: null,
        preview: category.thumnailUrl ? (category.thumnailUrl.startsWith('http') ? category.thumnailUrl : `http://175.41.233.105:8080${category.thumnailUrl}`) : ''
      });
    } else {
      setFormData({ name: '', description: '', isActive: true, position: 1, thumbnail: null, preview: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
  };

  const handleOpenImageDialog = (category) => {
    setSelectedCategory(category);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedCategory(null);
    setNewIcon(null);
  };

  const handleStatusToggle = (id) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === id
          ? { ...category, status: category.status === 'active' ? 'inactive' : 'active' }
          : category
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

  const handleSwitchChange = (e) => {
    setFormData((prev) => ({ ...prev, isActive: e.target.checked }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, thumbnail: file, preview: URL.createObjectURL(file) }));
    }
  };

  const handleSaveCategory = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('isActive', formData.isActive);
      payload.append('position', formData.position);
      if (formData.thumbnail) {
        payload.append('thumbnail', formData.thumbnail);
      }
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (selectedCategory) {
        await axiosInstance.put(`/api/categories/${selectedCategory.id}`, payload, { headers });
      } else {
        await axiosInstance.post('/api/categories', payload, { headers });
      }
      const res = await axiosInstance.get('/api/categories/index');
      setCategories(res.data.result || []);
      setSnackbar({ open: true, message: selectedCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!', severity: 'success' });
      setOpenDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Cập nhật thất bại!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`/api/categories/${id}`);
      const res = await axiosInstance.get('/api/categories/index');
      setCategories(res.data.result || []);
      setSnackbar({ open: true, message: 'Xóa danh mục thành công!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Xóa danh mục thất bại!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Đang hoạt động' : 'Không hoạt động';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Quản lý danh mục
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm danh mục mới
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Tìm kiếm danh mục..."
        variant="outlined"
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {filteredCategories.map((category) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box
                    component="img"
                    src={category.thumnailUrl ? (category.thumnailUrl.startsWith('http') ? category.thumnailUrl : `http://175.41.233.105:8080${category.thumnailUrl}`) : ''}
                    alt={category.name}
                    sx={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'contain',
                      mb: 2
                    }}
                  />
                  <Typography variant="h6" align="center">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {category.description || ''}
                  </Typography>
                  <Chip
                    label={category.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    color={category.isActive ? 'success' : 'error'}
                    size="small"
                    sx={{ alignSelf: 'center' }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(category)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa danh mục">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteCategory(category.id)}
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
              src={newIcon || (selectedCategory?.thumnailUrl ? (selectedCategory.thumnailUrl.startsWith('http') ? selectedCategory.thumnailUrl : `http://175.41.233.105:8080${selectedCategory.thumnailUrl}`) : '')}
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
              if (!selectedCategory || !newIcon) return;
              setLoading(true);
              try {
                if (!formData.thumbnail) return;
                const payload = new FormData();
                payload.append('thumbnail', formData.thumbnail);
                await axiosInstance.put(`/api/categories/${selectedCategory.id}/icon`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
                const res = await axiosInstance.get('/api/categories/index');
                setCategories(res.data.result || []);
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, textAlign: 'center' }}>
          {selectedCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Tên danh mục"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
              variant="outlined"
            />
            <TextField
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              minRows={2}
              variant="outlined"
            />
            <TextField
              label="Vị trí"
              name="position"
              type="number"
              value={formData.position}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              inputProps={{ min: 1 }}
            />
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                variant="outlined"
                component="label"
                sx={{ minWidth: 120 }}
              >
                {formData.thumbnail ? 'Đã chọn ảnh mới' : 'Chọn ảnh'}
                <input
                  accept="image/*"
                  type="file"
                  hidden
                  onChange={handleThumbnailChange}
                />
              </Button>
              {(formData.preview) && (
                <Box
                  component="img"
                  src={formData.preview}
                  alt="Preview"
                  sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #eee', ml: 2 }}
                />
              )}
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label={<Typography fontWeight={500}>Hoạt động</Typography>}
              sx={{ ml: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Hủy</Button>
          <Button variant="contained" onClick={handleSaveCategory} disabled={loading} sx={{ minWidth: 120 }}>
            {loading ? 'Đang lưu...' : (selectedCategory ? 'Lưu thay đổi' : 'Thêm mới')}
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
