import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  InputLabel,
  FormControl,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Rating,
  ImageList,
  ImageListItem,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Close as CloseIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderEdit, setOrderEdit] = useState({});
  const [orderLoading, setOrderLoading] = useState({});

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get('/api/listings/all');
        const listings = res.data.result;
        
        const propertiesWithOwner = await Promise.all(
          listings.map(async (item) => {
            let ownerName = '';
            try {
              const hostRes = await axiosInstance.get(`/api/users/host/${item.hostId}`);
              ownerName = hostRes.data.result.fullname || '';
            } catch (e) {
              ownerName = 'Không xác định';
            }
            return {
              id: item.id,
              name: item.name,
              location: item.city,
              price: item.price ? `${item.price.toLocaleString()} VND` : '',
              owner: ownerName,
              status: item.access ? 'Đã kích hoạt' : 'Đang chờ kích hoạt',
              rating: item.avgRating || 0,
              images: item.images?.map(img => img.startsWith('uploads/') ? `http://175.41.233.105:8080/${img}` : img) || [],
              description: item.description || '',
              amenities: item.amenities || [],
              createdAt: item.startDate || '',
              lastUpdated: item.endDate || '',
              violations: item.violations || [],
              reports: item.reports || [],
              isTrending: item.popular || false,
              orderNumber: item.position || 0,
            };
          })
        );
        setProperties(propertiesWithOwner);
      } catch (err) {
        setError('Không thể tải danh sách chỗ ở');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());
  const handleOwnerChange = (e) => setOwnerFilter(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);

  const filteredData = properties.filter(
    (item) =>
      (item.name.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)) &&
      (ownerFilter === 'all' || item.owner.toLowerCase().includes(ownerFilter.toLowerCase())) &&
      (statusFilter === 'all' || item.status === statusFilter)
  );

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProperty(null);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setLoading(true);

      const statusValue = newStatus === 'Đã kích hoạt';
      await axiosInstance.put(`/api/listings/access/${id}?status=${statusValue}`);
      const updatedProperties = properties.map(property =>
        property.id === id ? { ...property, status: newStatus } : property
      );
      setProperties(updatedProperties);
      setAlertMessage('Cập nhật trạng thái thành công!');
      setShowSuccessAlert(true);
      handleCloseDialog();
    } catch (err) {
      setAlertMessage('Có lỗi khi cập nhật trạng thái!');
      setShowSuccessAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProperty = async (id) => {
    setLoading(true);
    setError("");
    try {
      await axiosInstance.delete(`/api/listings/${id}`);
      const updatedProperties = properties.filter(property => property.id !== id);
      setProperties(updatedProperties);
      setAlertMessage('Gỡ bỏ thành công!');
      setShowSuccessAlert(true);
      handleCloseDialog();
    } catch (err) {
      setAlertMessage('Có lỗi khi gỡ bỏ!');
      setShowSuccessAlert(true);
      setError("Không thể gỡ bỏ chỗ ở");
    } finally {
      setLoading(false);
    }
  };

  const handleTrendingChange = (id, newValue) => {

    const updatedProperties = properties.map(property =>
      property.id === id ? { ...property, isTrending: newValue } : property
    );
    setProperties(updatedProperties);
    setAlertMessage('Cập nhật trạng thái xu hướng thành công!');
    setShowSuccessAlert(true);
  };

  const handleOrderNumberChange = (id, newValue) => {
    setOrderEdit(prev => ({ ...prev, [id]: newValue }));
  };

  const handleSaveOrderNumber = async (id) => {
    setOrderLoading(prev => ({ ...prev, [id]: true }));
    try {
      const value = orderEdit[id];
      await axiosInstance.put(`/api/listings/${id}/${value}`);
      const updatedProperties = properties.map(property =>
        property.id === id ? { ...property, orderNumber: parseInt(value) || 0 } : property
      );
      setProperties(updatedProperties);
      setAlertMessage('Cập nhật số thứ tự thành công!');
      setShowSuccessAlert(true);
    } catch (err) {
      setAlertMessage('Có lỗi khi cập nhật số thứ tự!');
      setShowSuccessAlert(true);
    } finally {
      setOrderLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã kích hoạt':
        return 'success';
      case 'Đang chờ kích hoạt':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Quản lý chỗ ở
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField 
          label="Tìm kiếm chỗ ở..." 
          variant="outlined" 
          onChange={handleSearchChange}
          fullWidth
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Chủ sở hữu</InputLabel>
          <Select value={ownerFilter} label="Chủ sở hữu" onChange={handleOwnerChange}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="Chủ A">Chủ A</MenuItem>
            <MenuItem value="Chủ B">Chủ B</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={statusFilter} label="Trạng thái" onChange={handleStatusChange}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="Đang chờ kích hoạt">Đang chờ kích hoạt</MenuItem>
            <MenuItem value="Đã kích hoạt">Đã kích hoạt</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Typography>Đang tải dữ liệu...</Typography>
        </Box>
      ) : (
        <Paper elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                {['Ảnh', 'Tên chỗ ở', 'Địa điểm', 'Giá', 'Chủ sở hữu', 'Trạng thái', 'Đánh giá', 'Hành động'].map((header) => (
                  <TableCell
                    key={header}
                    sx={{ fontWeight: 600 }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box
                      component="img"
                      src={item.images[0]}
                      alt={item.name}
                      sx={{
                        width: '100px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{item.owner}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.status}
                      color={getStatusColor(item.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Rating value={item.rating} precision={0.5} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        ({item.rating})
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SettingsIcon />}
                      onClick={() => handleViewDetails(item)}
                    >
                      Xử lý
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Chi tiết chỗ ở
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <ImageList sx={{ height: 200 }} cols={2} rowHeight={200}>
                  {selectedProperty.images.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        loading="lazy"
                        style={{ objectFit: 'cover' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>{selectedProperty.name}</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedProperty.isTrending}
                        onChange={(e) => handleTrendingChange(selectedProperty.id, e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Đang xu hướng"
                  />
                  <TextField
                    label="Số thứ tự"
                    type="number"
                    value={orderEdit[selectedProperty.id] !== undefined ? orderEdit[selectedProperty.id] : selectedProperty.orderNumber}
                    onChange={(e) => handleOrderNumberChange(selectedProperty.id, e.target.value)}
                    sx={{ width: '120px' }}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ ml: 1, minWidth: 40 }}
                    onClick={() => handleSaveOrderNumber(selectedProperty.id)}
                    disabled={orderLoading[selectedProperty.id]}
                    startIcon={<SaveIcon />}
                  >
                    Lưu
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationIcon color="action" />
                    <Typography>{selectedProperty.location}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon color="action" />
                    <Typography>Chủ sở hữu: {selectedProperty.owner}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarIcon color="action" />
                    <Typography>Ngày tạo: {selectedProperty.createdAt}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StarIcon color="action" />
                    <Typography>Đánh giá: {selectedProperty.rating}/5</Typography>
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Mô tả
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProperty.description}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Tiện nghi
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedProperty.amenities.map((amenity, index) => (
                    <Chip
                      key={index}
                      label={amenity}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Grid>

              {(selectedProperty.violations.length > 0 || selectedProperty.reports.length > 0) && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={2}>
                    {selectedProperty.violations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" color="error" gutterBottom>
                          Vi phạm
                        </Typography>
                        {selectedProperty.violations.map((violation, index) => (
                          <Stack key={index} direction="row" spacing={1} alignItems="center">
                            <WarningIcon color="error" />
                            <Typography variant="body2">{violation}</Typography>
                          </Stack>
                        ))}
                      </Box>
                    )}
                    {selectedProperty.reports.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" color="warning.main" gutterBottom>
                          Báo cáo
                        </Typography>
                        {selectedProperty.reports.map((report, index) => (
                          <Stack key={index} direction="row" spacing={1} alignItems="center">
                            <WarningIcon color="warning" />
                            <Typography variant="body2">{report}</Typography>
                          </Stack>
                        ))}
                      </Box>
                    )}
                  </Stack>
                </Grid>
              )}

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  {selectedProperty.status === 'Đang chờ kích hoạt' ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => handleStatusUpdate(selectedProperty.id, 'Đã kích hoạt')}
                    >
                      Kích hoạt
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<RejectIcon />}
                      onClick={() => handleStatusUpdate(selectedProperty.id, 'Đang chờ kích hoạt')}
                    >
                      Hủy kích hoạt
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveProperty(selectedProperty.id)}
                  >
                    Gỡ bỏ
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {showSuccessAlert && (
        <Alert
          severity="success"
          onClose={() => setShowSuccessAlert(false)}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}
        >
          {alertMessage}
        </Alert>
      )}
    </Box>
  );
}
