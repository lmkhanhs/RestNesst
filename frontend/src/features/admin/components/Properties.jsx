import { useContext, useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
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
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  BarChart as BarChartIcon,
  FilterAltOff as ClearFilterIcon,
  PersonOutlineRounded,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axiosInstance from '@/shared/api/httpClient.js';
import { SearchContext } from '@/features/search/context/SearchContext.jsx';
import CreatePropertyDialog from './CreatePropertyDialog.jsx';
import PropertyDetailsDialog from './PropertyDetailsDialog.jsx';
import PropertyAnalyticsCharts from './PropertyAnalyticsCharts.jsx';
import { getPropertyMediaUrl } from '../utils/propertyDetails.js';

function sortByDisplayOrder(items) {
  return [...items].sort(
    (first, second) => (first.orderNumber ?? 0) - (second.orderNumber ?? 0) || first.id - second.id
  );
}

function resolveDisplayText(...candidates) {
  const matched = candidates.find(
    (value) => typeof value === 'string' && value.trim()
  );
  return matched ? matched.trim() : '';
}

export default function AdminProperties({ onPropertyCreated }) {
  const searchCtx = useContext(SearchContext);
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCharts, setShowCharts] = useState(true);
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
    const controller = new AbortController();

    const fetchProperties = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get('/api/listings/all', {
          signal: controller.signal,
        });
        const listings = Array.isArray(res.data?.result) ? res.data.result : [];
        const hostCache = new Map();

        const propertiesWithOwner = await Promise.all(
          listings.map(async (item) => {
            let ownerName = resolveDisplayText(item.hostName);
            let ownerAvatar = getPropertyMediaUrl(item.hostThumnailUrl);

            if (!ownerName && item.hostId != null) {
              try {
                if (!hostCache.has(item.hostId)) {
                  hostCache.set(
                    item.hostId,
                    axiosInstance
                      .get(`/api/users/host/${item.hostId}`, {
                        signal: controller.signal,
                      })
                      .then((hostRes) => hostRes.data?.result)
                  );
                }
                const hostInfo = await hostCache.get(item.hostId);
                ownerName = resolveDisplayText(
                  hostInfo?.fullname,
                  hostInfo?.username,
                  hostInfo?.email
                );
                if (!ownerAvatar) {
                  ownerAvatar = getPropertyMediaUrl(hostInfo?.thumnailUrl);
                }
              } catch {
                ownerName = '';
              }
            }

            if (!ownerName) {
              ownerName =
                item.hostId != null ? `Chủ nhà #${item.hostId}` : 'Chưa cập nhật';
            }

            return {
              id: item.id,
              name: item.name || `Chỗ ở #${item.id}`,
              location: item.city || 'Chưa cập nhật',
              country: item.country || '',
              rawPrice: Number(item.price || 0),
              price: item.price ? `${item.price.toLocaleString()} VND` : '',
              owner: ownerName,
              ownerId: item.hostId ?? null,
              ownerAvatar,
              status: item.access ? 'Đã kích hoạt' : 'Đang chờ kích hoạt',
              listingStatus: item.status || 'ACTIVE',
              popular: Boolean(item.popular),
              startDate: item.startDate || '',
              endDate: item.endDate || '',
              rating: item.avgStart ?? 0,
              images: (item.images || []).map(getPropertyMediaUrl).filter(Boolean),
              orderNumber: item.position ?? 0,
            };
          })
        );

        if (!controller.signal.aborted) {
          setProperties(sortByDisplayOrder(propertiesWithOwner));
        }
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        setError('Không thể tải danh sách chỗ ở');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProperties();
    return () => controller.abort();
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

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleOwnerChange = (e) => setOwnerFilter(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);

  const ownerOptions = useMemo(() => {
    const names = new Set();
    properties.forEach((item) => {
      if (item.owner && item.owner !== 'Chưa cập nhật') {
        names.add(item.owner);
      }
    });
    return Array.from(names);
  }, [properties]);

  const filteredData = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLocaleLowerCase('vi-VN');
    return properties.filter((item) => {
      const matchesSearch =
        !normalizedQuery ||
        [item.name, item.location, item.owner, `#${item.orderNumber ?? 0}`]
          .filter(Boolean)
          .some((field) =>
            String(field).toLocaleLowerCase('vi-VN').includes(normalizedQuery)
          );

      return (
        matchesSearch &&
        (ownerFilter === 'all' || item.owner === ownerFilter) &&
        (statusFilter === 'all' || item.status === statusFilter)
      );
    });
  }, [ownerFilter, properties, searchTerm, statusFilter]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) || ownerFilter !== 'all' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setOwnerFilter('all');
    setStatusFilter('all');
  };

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
      const updatedProperties = properties.map((property) =>
        property.id === id ? { ...property, status: newStatus } : property
      );
      setProperties(updatedProperties);
      searchCtx?.updateSearchResults?.([], false);
      setAlertSeverity('success');
      setAlertMessage('Cập nhật trạng thái thành công!');
      setShowSuccessAlert(true);
      handleCloseDialog();
    } catch {
      setAlertSeverity('error');
      setAlertMessage('Có lỗi khi cập nhật trạng thái!');
      setShowSuccessAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProperty = async (id) => {
    setLoading(true);
    setError('');
    try {
      await axiosInstance.delete(`/api/listings/${id}`);
      const updatedProperties = properties.filter((property) => property.id !== id);
      setProperties(updatedProperties);
      searchCtx?.updateSearchResults?.([], false);
      setAlertSeverity('success');
      setAlertMessage('Gỡ bỏ thành công!');
      setShowSuccessAlert(true);
      handleCloseDialog();
    } catch {
      setAlertSeverity('error');
      setAlertMessage('Có lỗi khi gỡ bỏ!');
      setShowSuccessAlert(true);
      setError('Không thể gỡ bỏ chỗ ở');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrderNumber = async (id, value) => {
    try {
      await axiosInstance.put(`/api/listings/${id}/${value}`);
      setProperties((previous) =>
        sortByDisplayOrder(
          previous.map((property) =>
            property.id === id ? { ...property, orderNumber: value } : property
          )
        )
      );
      setSelectedProperty((previous) =>
        previous && previous.id === id ? { ...previous, orderNumber: value } : previous
      );
      searchCtx?.updateSearchResults?.([], false);
      setAlertSeverity('success');
      setAlertMessage(`Cập nhật số thứ tự thành #${value} thành công!`);
      setShowSuccessAlert(true);
    } catch (err) {
      setAlertSeverity('error');
      setAlertMessage('Có lỗi khi cập nhật số thứ tự!');
      setShowSuccessAlert(true);
      throw err;
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

  const activatedCount = properties.filter(
    (p) => p.status === 'Đã kích hoạt'
  ).length;

  return (
    <Box sx={{ width: '100%', minWidth: 0, p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Quản lý chỗ ở
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {properties.length} chỗ ở • {activatedCount} đã kích hoạt •{' '}
            {ownerOptions.length} chủ sở hữu
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ flexWrap: 'wrap', rowGap: 1 }}
        >
          <Button
            variant={showCharts ? 'outlined' : 'text'}
            size="small"
            startIcon={<BarChartIcon />}
            onClick={() => setShowCharts((prev) => !prev)}
            aria-expanded={showCharts}
            sx={{ minHeight: 40, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {showCharts ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            sx={{ minHeight: 40, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ minHeight: 42, borderRadius: 2, flexShrink: 0, textTransform: 'none', fontWeight: 600 }}
          >
            Thêm chỗ ở mới
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {showCharts && (
        <PropertyAnalyticsCharts
          properties={properties}
          loading={loading}
          ownerFilter={ownerFilter}
          statusFilter={statusFilter}
          onSelectOwnerFilter={setOwnerFilter}
          onSelectStatusFilter={setStatusFilter}
        />
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Typography
          id="admin-properties-table-heading"
          component="h2"
          variant="h6"
          sx={{ fontWeight: 700 }}
        >
          Danh sách chỗ ở ({filteredData.length}/{properties.length})
        </Typography>
        {hasActiveFilters && (
          <Button
            size="small"
            color="inherit"
            startIcon={<ClearFilterIcon />}
            onClick={handleResetFilters}
            sx={{ textTransform: 'none' }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          label="Tìm kiếm chỗ ở, địa điểm, chủ sở hữu..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel id="admin-properties-owner-filter-label">Chủ sở hữu</InputLabel>
          <Select
            labelId="admin-properties-owner-filter-label"
            value={ownerFilter}
            label="Chủ sở hữu"
            onChange={handleOwnerChange}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            {ownerOptions.map((ownerName) => (
              <MenuItem key={ownerName} value={ownerName}>
                {ownerName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel id="admin-properties-status-filter-label">Trạng thái</InputLabel>
          <Select
            labelId="admin-properties-status-filter-label"
            value={statusFilter}
            label="Trạng thái"
            onChange={handleStatusChange}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="Đang chờ kích hoạt">Đang chờ kích hoạt</MenuItem>
            <MenuItem value="Đã kích hoạt">Đã kích hoạt</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          role="region"
          aria-labelledby="admin-properties-table-heading"
          tabIndex={0}
          sx={{
            maxHeight: 560,
            overflow: 'auto',
            scrollbarGutter: 'stable',
            overscrollBehavior: 'contain',
            containerType: 'inline-size',
            borderRadius: 3,
            border: '1px solid var(--rn-border)',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  'Thứ tự',
                  'Ảnh',
                  'Tên chỗ ở',
                  'Địa điểm',
                  'Giá',
                  'Chủ sở hữu',
                  'Trạng thái',
                  'Đánh giá',
                  'Hành động',
                ].map((header, index) => (
                  <TableCell
                    key={header}
                    scope="col"
                    sx={{
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      ...(index === 0
                        ? {
                            position: 'sticky',
                            insetInlineStart: 0,
                            zIndex: 3,
                            bgcolor: 'var(--rn-surface)',
                          }
                        : {}),
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    {properties.length === 0
                      ? 'Chưa có chỗ ở. Chọn “Thêm chỗ ở mới” để tạo chỗ ở đầu tiên.'
                      : 'Không có chỗ ở phù hợp với bộ lọc.'}
                  </TableCell>
                </TableRow>
              )}
              {filteredData.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      position: 'sticky',
                      insetInlineStart: 0,
                      zIndex: 1,
                      bgcolor: 'var(--rn-surface)',
                    }}
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`#${item.orderNumber ?? 0}`}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      component="img"
                      src={item.images[0]}
                      alt={item.name}
                      sx={{
                        display: 'block',
                        width: '100px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.price}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 140 }}>
                      <Avatar
                        src={item.ownerAvatar || undefined}
                        alt=""
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'action.hover',
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                        }}
                      >
                        <PersonOutlineRounded fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}
                        >
                          {item.owner}
                        </Typography>
                        {item.ownerId != null && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', lineHeight: 1.2 }}
                          >
                            Mã: #{item.ownerId}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.status} color={getStatusColor(item.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Rating value={Number(item.rating || 0)} precision={0.5} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        ({item.rating})
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      aria-label={`Xử lý chỗ ở ${item.name}`}
                      startIcon={<SettingsIcon />}
                      onClick={() => handleViewDetails(item)}
                      sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
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
        <CreatePropertyDialog
          onClose={() => setOpenCreateDialog(false)}
          onCreated={handlePropertyCreated}
        />
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
        <Snackbar
          open={showSuccessAlert}
          autoHideDuration={5000}
          transitionDuration={0}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={(_, reason) => {
            if (reason !== 'clickaway') setShowSuccessAlert(false);
          }}
        >
          <Alert
            severity={alertSeverity}
            onClose={() => setShowSuccessAlert(false)}
            sx={{ width: '100%' }}
          >
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
