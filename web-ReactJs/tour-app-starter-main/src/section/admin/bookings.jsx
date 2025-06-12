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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Pagination from '@mui/material/Pagination';
import axiosInstance from '../../api/axiosConfig';


export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/bookings/dasboards?page=${page-1}`);
        setBookings(res.data.result || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        setSnackbar({ open: true, message: 'Không thể tải danh sách đặt phòng!', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filteredBookings = bookings.filter(
    (booking) =>
      (booking.title?.toLowerCase().includes(searchTerm) ||
        booking.address?.toLowerCase().includes(searchTerm) ||
        booking.city?.toLowerCase().includes(searchTerm)) &&
      (statusFilter === 'all' || booking.bookingStatus?.toLowerCase() === statusFilter) &&
      (paymentFilter === 'all' || (booking.paymentStatus ? booking.paymentStatus.toLowerCase() : 'null') === paymentFilter)
  );

  const handleOpenDialog = (booking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);

      setBookings(prev =>
        prev.map(booking =>
          booking.bookingId === id
            ? { ...booking, bookingStatus: newStatus }
            : booking
        )
      );

      setSnackbar({
        open: true,
        message: 'Cập nhật trạng thái thành công',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật trạng thái',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Đã xác nhận';
      case 'rejected':
        return 'Đã từ chối';
      case 'pending':
        return 'Đang chờ';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Xem danh sách đặt phòng
        </Typography>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tìm kiếm..."
            variant="outlined"
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái đặt phòng</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái đặt phòng"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="pending">Đang chờ</MenuItem>
              <MenuItem value="approved">Đã xác nhận</MenuItem>
              <MenuItem value="rejected">Đã từ chối</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái thanh toán</InputLabel>
            <Select
              value={paymentFilter}
              label="Trạng thái thanh toán"
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="pending">Chờ thanh toán</MenuItem>
              <MenuItem value="paid">Đã thanh toán</MenuItem>
              <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Ảnh</strong></TableCell>
              <TableCell><strong>Tiêu đề</strong></TableCell>
              <TableCell><strong>Địa chỉ</strong></TableCell>
              <TableCell><strong>Thành phố</strong></TableCell>
              <TableCell><strong>Ngày nhận</strong></TableCell>
              <TableCell><strong>Ngày trả</strong></TableCell>
              <TableCell><strong>Giá</strong></TableCell>
              <TableCell><strong>Trạng thái</strong></TableCell>
              {/* <TableCell><strong>Thanh toán</strong></TableCell> */}
              <TableCell><strong>Chi tiết</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">Không có đặt phòng nào</TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.bookingId} hover sx={{ transition: 'background 0.2s' }}>
                  <TableCell>
                    <img src={booking.primaryUrl} alt={booking.title} style={{ width: 60, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{booking.title}</Typography>
                    <Typography variant="caption" color="text.secondary">#{booking.bookingId}</Typography>
                  </TableCell>
                  <TableCell>{booking.address}</TableCell>
                  <TableCell>{booking.city}</TableCell>
                  <TableCell>{booking.checkInDate}</TableCell>
                  <TableCell>{booking.checkOutDate}</TableCell>
                  <TableCell>{booking.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(booking.bookingStatus?.toLowerCase())}
                      color={getStatusColor(booking.bookingStatus?.toLowerCase())}
                      size="small"
                    />
                  </TableCell>
                  {/* <TableCell>
                    <Chip
                      label={getPaymentStatusText(booking.paymentStatus)}
                      color={getPaymentStatusColor(booking.paymentStatus)}
                      size="small"
                    />
                  </TableCell> */}
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton color="primary" onClick={() => handleOpenDialog(booking)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {booking.bookingStatus === 'PENDING' && (
                        <>
                          {/* <Tooltip title="Xác nhận">
                            <IconButton color="success" onClick={() => handleStatusChange(booking.bookingId, 'APPROVED')}>
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Từ chối">
                            <IconButton color="error" onClick={() => handleStatusChange(booking.bookingId, 'REJECTED')}>
                              <RejectIcon />
                            </IconButton>
                          </Tooltip> */}
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          shape="rounded"
          size="medium"
        />
      </Stack>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Chi tiết đặt phòng
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Thông tin đặt phòng</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Typography><strong>Tiêu đề:</strong> {selectedBooking.title}</Typography>
                  <Typography><strong>Địa chỉ:</strong> {selectedBooking.address}</Typography>
                  <Typography><strong>Thành phố:</strong> {selectedBooking.city}</Typography>
                  <Typography><strong>Ngày nhận phòng:</strong> {selectedBooking.checkInDate}</Typography>
                  <Typography><strong>Ngày trả phòng:</strong> {selectedBooking.checkOutDate}</Typography>
                  <Typography><strong>Giá:</strong> {selectedBooking.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</Typography>
                  <Typography><strong>Tổng tiền:</strong> {selectedBooking.totalPrice?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</Typography>
                  <Typography><strong>Nội dung:</strong> {selectedBooking.content}</Typography>
                  <Typography><strong>Trạng thái:</strong> {getStatusText(selectedBooking.bookingStatus?.toLowerCase())}</Typography>
                  <Typography><strong>Thanh toán:</strong> {getPaymentStatusText(selectedBooking.paymentStatus)}</Typography>
                  <Typography><strong>Đánh giá trung bình:</strong> {selectedBooking.avgStart}</Typography>
                  <Typography><strong>Phổ biến:</strong> {selectedBooking.popular ? 'Có' : 'Không'}</Typography>
                  <Typography><strong>Diện tích:</strong> {selectedBooking.area}</Typography>
                  <Typography><strong>Đã bình luận:</strong> {selectedBooking.commented ? 'Có' : 'Không'}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <img src={selectedBooking.primaryUrl} alt={selectedBooking.title} style={{ width: 220, height: 150, borderRadius: 12, objectFit: 'cover', marginBottom: 8 }} />
                  <Typography variant="caption" color="text.secondary">Mã đặt phòng: #{selectedBooking.bookingId}</Typography>
                  <Typography variant="caption" color="text.secondary">Listing ID: {selectedBooking.listingId}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Đóng</Button>
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
