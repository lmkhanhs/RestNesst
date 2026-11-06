import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  InputLabel,
  FormControl,
  Paper,
  Stack,
  Chip,
  Alert,
  Portal,
  Rating,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import axiosInstance from '@/shared/api/httpClient.js';
import CreatePropertyDialog from './CreatePropertyDialog.jsx';
import PropertyDetailsDialog from './PropertyDetailsDialog.jsx';
import { getPropertyMediaUrl } from '../utils/propertyDetails.js';

export default function AdminProperties({ onPropertyCreated }) {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
              rating: item.avgStart ?? 0,
              images: (item.images || []).map(getPropertyMediaUrl).filter(Boolean),
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
  }, [refreshKey]);

  const handlePropertyCreated = () => {
    setOpenCreateDialog(false);
    setSearchTerm('');
    setOwnerFilter('all');
    setStatusFilter('all');
    setRefreshKey((value) => value + 1);
    setAlertSeverity('success');
    setAlertMessage('Tạo chỗ ở thành công!');
    setShowSuccessAlert(true);
    onPropertyCreated?.();
  };

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
      setAlertSeverity('success');
      setAlertMessage('Cập nhật trạng thái thành công!');
      setShowSuccessAlert(true);
      handleCloseDialog();
    } catch (err) {
      setAlertSeverity('error');
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
      setAlertSeverity('success');
      setAlertMessage('Gỡ bỏ thành công!');
      setShowSuccessAlert(true);
      handleCloseDialog();
    } catch (err) {
      setAlertSeverity('error');
      setAlertMessage('Có lỗi khi gỡ bỏ!');
      setShowSuccessAlert(true);
      setError("Không thể gỡ bỏ chỗ ở");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrderNumber = async (id, value) => {
    try {
      await axiosInstance.put(`/api/listings/${id}/${value}`);
      setProperties((previous) => previous.map((property) =>
        property.id === id ? { ...property, orderNumber: value } : property
      ));
      setAlertSeverity('success');
      setAlertMessage('Cập nhật số thứ tự thành công!');
      setShowSuccessAlert(true);
    } catch (err) {
      setAlertSeverity('error');
      setAlertMessage('Có lỗi khi cập nhật số thứ tự!');
      setShowSuccessAlert(true);
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
    <Box sx={{ width: '100%', minWidth: 0, p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
          Quản lý chỗ ở
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}
          sx={{ minHeight: 44, flexShrink: 0 }}>
          Thêm chỗ ở mới
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField 
          label="Tìm kiếm chỗ ở..." 
          variant="outlined" 
          value={searchTerm}
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
        <TableContainer component={Paper} elevation={3}>
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
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    {properties.length === 0
                      ? 'Chưa có chỗ ở. Chọn “Thêm chỗ ở mới” để tạo chỗ ở đầu tiên.'
                      : 'Không có chỗ ở phù hợp với bộ lọc.'}
                  </TableCell>
                </TableRow>
              )}
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
        </TableContainer>
      )}

      {openCreateDialog && (
        <CreatePropertyDialog onClose={() => setOpenCreateDialog(false)} onCreated={handlePropertyCreated} />
      )}

      {openDialog && selectedProperty && (
        <PropertyDetailsDialog
          property={selectedProperty}
          busy={loading}
          onClose={handleCloseDialog}
          onStatusUpdate={handleStatusUpdate}
          onRemove={handleRemoveProperty}
          onSaveOrder={handleSaveOrderNumber}
        />
      )}

      <Portal>
        <Snackbar open={showSuccessAlert} autoHideDuration={5000} transitionDuration={0}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={(_, reason) => { if (reason !== 'clickaway') setShowSuccessAlert(false); }}>
          <Alert severity={alertSeverity} onClose={() => setShowSuccessAlert(false)} sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>
      </Portal>
    </Box>
  );
}

AdminProperties.propTypes = {
  onPropertyCreated: PropTypes.func,
};
