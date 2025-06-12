import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/users');
      const userData = Array.isArray(response.data?.result) ? response.data.result : [];
      setUsers(userData);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      console.error('Error fetching users:', err);
      setUsers([]); 
    } finally {
      setLoading(false);
    }
  };

  const getAccountType = (roles) => {
    if (Array.isArray(roles)) {
      if (roles.includes('ADMIN')) return 'Admin';
      if (roles.includes('HOST')) return 'Chủ cho thuê';
      if (roles.includes('GUEST')) return 'Khách';
    }
    return '';
  };

  const filteredUsers = Array.isArray(users) ? users.filter((user) => {
    const matchesSearch =
      user.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      roleFilter === 'all' ||
      getAccountType(user.roles) === roleFilter;
    const userStatus = user.isActive === true ? 'Đang hoạt động' : 'Đã khóa';
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }) : [];

  const handleAction = (user) => {
    setSelectedUser(user);
    setEditedUser({ ...user });
    setOpenDialog(true);
    setEditMode(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setEditedUser(null);
    setEditMode(false);
  };

  const handleSaveChanges = async () => {
    if (!editedUser) return;
    setLoading(true);
    setError(null);
    try {
      let role = '';
      let roles = [];
      const currentType = getAccountType(editedUser.roles);
      if (currentType === 'Chủ cho thuê') {
        role = 'HOST';
        roles = ['GUEST', 'HOST'];
      } else if (currentType === 'Khách') {
        role = 'GUEST';
        roles = ['GUEST'];
      } else {
        setError('Không thể thay đổi vai trò ADMIN!');
        setLoading(false);
        return;
      }
      const payload = {
        id: editedUser.id,
        email: editedUser.email,
        phone: editedUser.phone,
        address: editedUser.address,
        role: role
      };
      const response = await axiosInstance.put('/api/users/admin/change/profile', payload);
      if (response.data?.result) {
        setEditedUser(response.data.result);
        setUsers((prev) => prev.map((u) => (u.id === editedUser.id ? response.data.result : u)));
        setShowSuccessAlert(true);
        handleCloseDialog();
      }
    } catch (err) {
      setError('Không thể cập nhật thông tin người dùng!');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (event) => {
    if (!editedUser) return;
    const newIsActive = event.target.checked;
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/users/active/${editedUser.id}/${newIsActive}`);
      if (response.data?.result) {
        setEditedUser(response.data.result);
        setUsers((prev) =>
          prev.map((u) => (u.id === editedUser.id ? response.data.result : u))
        );
        setShowSuccessAlert(true);
      }
      setError(null);
    } catch (err) {
      setError('Không thể cập nhật trạng thái hoạt động!');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event) => {
    let roles = [];
    if (event.target.value === 'Admin') {
      setError('Không thể thay đổi vai trò ADMIN!');
      return;
    } else if (event.target.value === 'Chủ cho thuê') roles = ['GUEST', 'HOST'];
    else if (event.target.value === 'Khách') roles = ['GUEST'];
    setEditedUser({
      ...editedUser,
      roles
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedUser({
      ...editedUser,
      [name]: value
    });
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Quản lý người dùng
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Tìm kiếm người dùng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <Select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="Khách">Khách</MenuItem>
          <MenuItem value="Chủ cho thuê">Chủ cho thuê</MenuItem>
          <MenuItem value="Admin">Admin</MenuItem>
        </Select>
        <Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Trạng thái</MenuItem>
          <MenuItem value="Hoạt động">Hoạt động</MenuItem>
          <MenuItem value="Bị khóa">Bị khóa</MenuItem>
        </Select>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Ảnh đại diện</strong></TableCell>
                <TableCell><strong>Họ tên</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Loại tài khoản</strong></TableCell>
                <TableCell><strong>Trạng thái</strong></TableCell>
                <TableCell><strong>Hành động</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không tìm thấy người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const userStatus = user.isActive === true ? 'Đang hoạt động' : 'Đã khóa';
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar
                          src={user.thumnailUrl}
                          alt={user.fullname}
                          sx={{ width: 56, height: 56 }}
                        />
                      </TableCell>
                      <TableCell>{user.fullname}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getAccountType(user.roles)}</TableCell>
                      <TableCell>
                        <Typography 
                          color={userStatus === 'Đang hoạt động' ? 'success.main' : 'error.main'}
                          fontWeight={500}
                        >
                          {userStatus}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAction(user)}
                        >
                          Xử lý
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
              {editMode ? 'Chỉnh sửa thông tin người dùng' : 'Thông tin người dùng'}
            </Typography>
            <Stack direction="row" spacing={1}>
              {!editMode && (
                <Tooltip title="Chỉnh sửa">
                  <IconButton onClick={() => setEditMode(true)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={editedUser?.thumnailUrl}
                alt={editedUser?.fullname}
                sx={{ width: 120, height: 120, mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!editedUser?.isActive}
                    onChange={handleStatusChange}
                    disabled={!editMode}
                  />
                }
                label={
                  <Typography 
                    color={!!editedUser?.isActive ? 'success.main' : 'error.main'}
                    fontWeight={500}
                  >
                    {!!editedUser?.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên đăng nhập"
                name="username"
                value={editedUser?.username || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Họ tên"
                name="fullname"
                value={editedUser?.fullname || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={editedUser?.email || ''}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                name="phone"
                value={editedUser?.phone || ''}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Địa chỉ"
                name="address"
                value={editedUser?.address || ''}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Loại tài khoản</InputLabel>
                <Select
                  value={getAccountType(editedUser?.roles) || ''}
                  onChange={handleRoleChange}
                  label="Loại tài khoản"
                  disabled={!editMode}
                >
                  <MenuItem value="Khách">Khách</MenuItem>
                  <MenuItem value="Chủ cho thuê">Chủ cho thuê</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ngày tạo"
                value={editedUser?.createdAt ? new Date(editedUser.createdAt).toLocaleString() : ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lần đăng nhập cuối"
                value={editedUser?.lastLogin ? new Date(editedUser.lastLogin).toLocaleString() : ''}
                disabled
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {editMode && (
            <>
              <Button onClick={() => setEditMode(false)}>Hủy</Button>
              <Button 
                onClick={handleSaveChanges}
                variant="contained"
                startIcon={<SaveIcon />}
              >
                Lưu thay đổi
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {showSuccessAlert && (
        <Alert
          severity="success"
          onClose={() => setShowSuccessAlert(false)}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}
        >
          Cập nhật thông tin người dùng thành công!
        </Alert>
      )}
    </Box>
  );
}
