import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Divider,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const mockTransactions = [
  {
    id: 'TXN001',
    type: 'Đặt phòng',
    customer: 'Lê Minh Khánh',
    customerEmail: 'khanh@email.com',
    customerPhone: '0123456789',
    date: '2025-03-20',
    amount: 3,
    status: 'pending',
    paymentMethod: 'Chuyển khoản',
    roomId: 'R001',
    roomName: 'Phòng Deluxe',
    checkIn: '2025-03-25',
    checkOut: '2025-03-27',
    nights: 2,
    notes: 'Khách hàng yêu cầu giường king size',
    refundAmount: 0,
    refundReason: '',
    refundMethod: '',
    refundAccount: ''
  },
  {
    id: 'TXN002',
    type: 'Hủy phòng',
    customer: 'Hoàng Minh Nhật',
    customerEmail: 'nhat@email.com',
    customerPhone: '0987654321',
    date: '2025-03-19',
    amount: -2,
    status: 'completed',
    paymentMethod: 'Thẻ tín dụng',
    roomId: 'R002',
    roomName: 'Phòng Suite',
    checkIn: '2025-03-22',
    checkOut: '2025-03-24',
    nights: 2,
    notes: 'Khách hàng hủy do thay đổi lịch trình'
  },
  {
    id: 'TXN003',
    type: 'Hoàn tiền',
    customer: 'Trần Phước Phú',
    customerEmail: 'phu@email.com',
    customerPhone: '0123987456',
    date: '2025-03-18',
    amount: -1,
    status: 'processing',
    paymentMethod: 'Chuyển khoản',
    roomId: 'R003',
    roomName: 'Phòng Standard',
    checkIn: '2025-03-21',
    checkOut: '2025-03-23',
    nights: 2,
    notes: 'Hoàn tiền do sự cố kỹ thuật'
  }
];

const refundMethods = [
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    icon: <PaymentIcon />,
    fields: ['accountNumber', 'bankName', 'accountName']
  },
  {
    id: 'credit_card',
    name: 'Hoàn tiền thẻ tín dụng',
    icon: <MoneyIcon />,
    fields: ['cardNumber', 'cardHolder']
  },
  {
    id: 'cash',
    name: 'Hoàn tiền mặt',
    icon: <MoneyIcon />,
    fields: ['receiverName', 'receiverPhone']
  }
];

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('view'); 
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('');
  const [refundAccount, setRefundAccount] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
    cardNumber: '',
    cardHolder: '',
    receiverName: '',
    receiverPhone: ''
  });

  const handleOpenDialog = (transaction, type) => {
    setSelectedTransaction(transaction);
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTransaction(null);
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      

      
      setTransactions(prev => 
        prev.map(txn => 
          txn.id === selectedTransaction.id 
            ? { ...txn, status: 'completed' }
            : txn
        )
      );

      setSnackbar({
        open: true,
        message: 'Đã duyệt giao dịch thành công',
        severity: 'success'
      });
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi duyệt giao dịch',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    try {
      setLoading(true);

      
      setTransactions(prev => 
        prev.map(txn => 
          txn.id === selectedTransaction.id 
            ? { 
                ...txn, 
                status: 'refunded',
                refundAmount: refundAmount,
                refundReason: refundReason,
                refundMethod: refundMethod,
                refundAccount: refundAccount
              }
            : txn
        )
      );

      setSnackbar({
        open: true,
        message: 'Đã hoàn tiền thành công',
        severity: 'success'
      });
      handleCloseDialog();
      setRefundAmount(0);
      setRefundReason('');
      setRefundMethod('');
      setRefundAccount({
        accountNumber: '',
        bankName: '',
        accountName: '',
        cardNumber: '',
        cardHolder: '',
        receiverName: '',
        receiverPhone: ''
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi hoàn tiền',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefundMethodChange = (method) => {
    setRefundMethod(method);
    setRefundAccount({
      accountNumber: '',
      bankName: '',
      accountName: '',
      cardNumber: '',
      cardHolder: '',
      receiverName: '',
      receiverPhone: ''
    });
  };

  const getRefundMethodFields = () => {
    const method = refundMethods.find(m => m.id === refundMethod);
    if (!method) return null;

    return (
      <Stack spacing={2}>
        {method.fields.includes('accountNumber') && (
          <TextField
            label="Số tài khoản"
            value={refundAccount.accountNumber}
            onChange={(e) => setRefundAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
            fullWidth
          />
        )}
        {method.fields.includes('bankName') && (
          <TextField
            label="Tên ngân hàng"
            value={refundAccount.bankName}
            onChange={(e) => setRefundAccount(prev => ({ ...prev, bankName: e.target.value }))}
            fullWidth
          />
        )}
        {method.fields.includes('accountName') && (
          <TextField
            label="Tên chủ tài khoản"
            value={refundAccount.accountName}
            onChange={(e) => setRefundAccount(prev => ({ ...prev, accountName: e.target.value }))}
            fullWidth
          />
        )}
        {method.fields.includes('cardNumber') && (
          <TextField
            label="Số thẻ"
            value={refundAccount.cardNumber}
            onChange={(e) => setRefundAccount(prev => ({ ...prev, cardNumber: e.target.value }))}
            fullWidth
          />
        )}
        {method.fields.includes('cardHolder') && (
          <TextField
            label="Tên chủ thẻ"
            value={refundAccount.cardHolder}
            onChange={(e) => setRefundAccount(prev => ({ ...prev, cardHolder: e.target.value }))}
            fullWidth
          />
        )}
        {method.fields.includes('receiverName') && (
          <TextField
            label="Tên người nhận"
            value={refundAccount.receiverName}
            onChange={(e) => setRefundAccount(prev => ({ ...prev, receiverName: e.target.value }))}
            fullWidth
          />
        )}
        {method.fields.includes('receiverPhone') && (
          <TextField
            label="Số điện thoại người nhận"
            value={refundAccount.receiverPhone}
            onChange={(e) => setRefundAccount(prev => ({ ...prev, receiverPhone: e.target.value }))}
            fullWidth
          />
        )}
      </Stack>
    );
  };

  const isRefundFormValid = () => {
    if (!refundMethod || refundAmount <= 0 || !refundReason) return false;

    const method = refundMethods.find(m => m.id === refundMethod);
    if (!method) return false;

    return method.fields.every(field => refundAccount[field]?.trim());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'completed':
        return 'Hoàn thành';
      case 'processing':
        return 'Đang xử lý';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  const filteredData = transactions.filter((txn) => {
    const matchesSearch = 
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || txn.type === filterType;
    const matchesStatus = filterStatus === 'all' || txn.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Quản lý giao dịch
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => alert('Tính năng đang phát triển')}
          >
            Xuất Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => alert('Tính năng đang phát triển')}
          >
            In báo cáo
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Tìm kiếm..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                displayEmpty
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">Tất cả loại</MenuItem>
                <MenuItem value="Đặt phòng">Đặt phòng</MenuItem>
                <MenuItem value="Hủy phòng">Hủy phòng</MenuItem>
                <MenuItem value="Hoàn tiền">Hoàn tiền</MenuItem>
              </Select>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                <MenuItem value="pending">Chờ duyệt</MenuItem>
                <MenuItem value="completed">Hoàn thành</MenuItem>
                <MenuItem value="processing">Đang xử lý</MenuItem>
                <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
              </Select>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Mã giao dịch</strong></TableCell>
                  <TableCell><strong>Khách hàng</strong></TableCell>
                  <TableCell><strong>Phòng</strong></TableCell>
                  <TableCell><strong>Ngày</strong></TableCell>
                  <TableCell><strong>Số tiền</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell><strong>Hành động</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ReceiptIcon color="primary" />
                        <Typography>{txn.id}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {txn.customer.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{txn.customer}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {txn.customerEmail}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{txn.roomName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {txn.checkIn} - {txn.checkOut}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography>{txn.date}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        color={txn.amount >= 0 ? 'success.main' : 'error.main'}
                        fontWeight={500}
                      >
                        {txn.amount.toLocaleString('vi-VN')}₫
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(txn.status)}
                        color={getStatusColor(txn.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SettingsIcon />}
                        onClick={() => handleOpenDialog(txn, 'process')}
                        disabled={txn.status === 'refunded'}
                      >
                        Xử lý
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Xử lý giao dịch
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={3} sx={{ mt: 1 }}>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Thông tin khách hàng
                    </Typography>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonIcon color="action" />
                        <Typography>{selectedTransaction.customer}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Email: {selectedTransaction.customerEmail}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        SĐT: {selectedTransaction.customerPhone}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Thông tin đặt phòng
                    </Typography>
                    <Stack spacing={2}>
                      <Typography variant="body2">
                        Phòng: {selectedTransaction.roomName}
                      </Typography>
                      <Typography variant="body2">
                        Check-in: {selectedTransaction.checkIn}
                      </Typography>
                      <Typography variant="body2">
                        Check-out: {selectedTransaction.checkOut}
                      </Typography>
                      <Typography variant="body2">
                        Số đêm: {selectedTransaction.nights}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Thông tin giao dịch
                    </Typography>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Mã giao dịch:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedTransaction.id}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Loại giao dịch:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedTransaction.type}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Phương thức thanh toán:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedTransaction.paymentMethod}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Số tiền:</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight={500}
                          color={selectedTransaction.amount >= 0 ? 'success.main' : 'error.main'}
                        >
                          {selectedTransaction.amount.toLocaleString('vi-VN')}₫
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Trạng thái:</Typography>
                        <Chip
                          label={getStatusText(selectedTransaction.status)}
                          color={getStatusColor(selectedTransaction.status)}
                          size="small"
                        />
                      </Stack>
                      {selectedTransaction.notes && (
                        <>
                          <Divider />
                          <Typography variant="body2" color="text.secondary">
                            Ghi chú: {selectedTransaction.notes}
                          </Typography>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleApprove}
                    disabled={loading || selectedTransaction.status !== 'pending'}
                  >
                    {loading ? 'Đang xử lý...' : 'Duyệt (Chuyển tiền cho chủ phòng)'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<MoneyIcon />}
                    onClick={handleRefund}
                    disabled={loading || selectedTransaction.status === 'refunded'}
                  >
                    {loading ? 'Đang xử lý...' : 'Hoàn tiền cho khách hàng'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
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
