import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Chip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  FilterAltOff as ClearFilterIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axiosInstance from '@/shared/api/httpClient.js';
import { getMediaUrl } from '@/shared/utils/mediaUrl.js';
import UserAnalyticsCharts from './UserAnalyticsCharts.jsx';

function getAccountType(roles) {
  if (Array.isArray(roles)) {
    if (roles.includes('ADMIN')) return 'Admin';
    if (roles.includes('HOST')) return 'Chủ cho thuê';
    if (roles.includes('GUEST')) return 'Khách';
  }
  return 'Khách';
}

function getRoleChipProps(accountType) {
  if (accountType === 'Admin') {
    return { color: 'secondary', variant: 'filled' };
  }
  if (accountType === 'Chủ cho thuê') {
    return { color: 'primary', variant: 'outlined' };
  }
  return { color: 'info', variant: 'outlined' };
}

function formatDateTimeVi(value) {
  if (!value) return 'Chưa ghi nhận';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Chưa ghi nhận';
  return parsed.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pendingHostIds, setPendingHostIds] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCharts, setShowCharts] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (signal) => {
    try {
      setLoading(true);
      const [usersResult, hostRequestsResult] = await Promise.allSettled([
        axiosInstance.get('/api/users', { signal }),
        axiosInstance.get('/api/users/host/apply', { signal }),
      ]);

      if (signal?.aborted) return;

      if (usersResult.status === 'fulfilled') {
        const userData = Array.isArray(usersResult.value.data?.result)
          ? usersResult.value.data.result
          : [];
        setUsers(userData);
        setError(null);
      } else {
        const err = usersResult.reason;
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
        setUsers([]);
      }

      if (hostRequestsResult.status === 'fulfilled') {
        const pendingList = Array.isArray(hostRequestsResult.value.data?.result)
          ? hostRequestsResult.value.data.result
          : [];
        setPendingHostIds(
          pendingList
            .map((item) => Number(item.id))
            .filter((id) => Number.isFinite(id))
        );
      } else {
        setPendingHostIds([]);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const pendingHostIdSet = useMemo(() => new Set(pendingHostIds), [pendingHostIds]);

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const normalizedQuery = search.trim().toLocaleLowerCase('vi-VN');

    return users.filter((user) => {
      const matchesSearch =
        !normalizedQuery ||
        [user.fullname, user.username, user.email, user.phone, user.address]
          .filter(Boolean)
          .some((field) =>
            String(field).toLocaleLowerCase('vi-VN').includes(normalizedQuery)
          );

      const matchesRole =
        roleFilter === 'all' || getAccountType(user.roles) === roleFilter;

      const userStatus = user.isActive === true ? 'Đang hoạt động' : 'Đã khóa';
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const hasActiveFilters =
    Boolean(search.trim()) || roleFilter !== 'all' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

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
    setSaving(true);
    setError(null);
    try {
      let role = '';
      const currentType = getAccountType(editedUser.roles);
      if (currentType === 'Chủ cho thuê') {
        role = 'HOST';
      } else if (currentType === 'Khách') {
        role = 'GUEST';
      } else {
        setError('Không thể thay đổi vai trò ADMIN!');
        setSaving(false);
        return;
      }
      const payload = {
        id: editedUser.id,
        email: editedUser.email,
        phone: editedUser.phone,
        address: editedUser.address,
        role,
      };
      const response = await axiosInstance.put('/api/users/admin/change/profile', payload);
      if (response.data?.result) {
        setEditedUser(response.data.result);
        setUsers((prev) =>
          prev.map((u) => (u.id === editedUser.id ? response.data.result : u))
        );
        setShowSuccessAlert(true);
        handleCloseDialog();
      }
    } catch {
      setError('Không thể cập nhật thông tin người dùng!');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (event) => {
    if (!editedUser) return;
    const newIsActive = event.target.checked;
    try {
      setSaving(true);
      const response = await axiosInstance.put(
        `/api/users/active/${editedUser.id}/${newIsActive}`
      );
      if (response.data?.result) {
        setEditedUser(response.data.result);
        setUsers((prev) =>
          prev.map((u) => (u.id === editedUser.id ? response.data.result : u))
        );
        setShowSuccessAlert(true);
      }
      setError(null);
    } catch {
      setError('Không thể cập nhật trạng thái hoạt động!');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (event) => {
    let roles = [];
    if (event.target.value === 'Admin') {
      setError('Không thể thay đổi vai trò ADMIN!');
      return;
    }
    if (event.target.value === 'Chủ cho thuê') {
      roles = ['GUEST', 'HOST'];
    } else if (event.target.value === 'Khách') {
      roles = ['GUEST'];
    }
    setEditedUser({
      ...editedUser,
      roles,
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedUser({
      ...editedUser,
      [name]: value,
    });
  };

  const activeUsersCount = users.filter((u) => u.isActive === true).length;
  const hostUsersCount = users.filter(
    (u) => getAccountType(u.roles) === 'Chủ cho thuê'
  ).length;

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 }, minWidth: 0 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Quản lý người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {users.length} tài khoản • {activeUsersCount} đang hoạt động •{' '}
            {hostUsersCount} chủ cho thuê
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.25} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Button
            variant={showCharts ? 'contained' : 'outlined'}
            size="small"
            startIcon={<BarChartIcon />}
            onClick={() => setShowCharts((prev) => !prev)}
            aria-expanded={showCharts}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            {showCharts ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => fetchUsers()}
            disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            Làm mới
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {showCharts && (
        <UserAnalyticsCharts
          users={users}
          pendingHostIds={pendingHostIds}
          loading={loading}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSelectRoleFilter={setRoleFilter}
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
          id="admin-users-table-heading"
          component="h2"
          variant="h6"
          sx={{ fontWeight: 700 }}
        >
          Danh sách tài khoản ({filteredUsers.length}/{users.length})
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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          label="Tìm kiếm theo họ tên, username, email, SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 } }}>
          <InputLabel id="admin-users-role-filter-label">Loại tài khoản</InputLabel>
          <Select
            labelId="admin-users-role-filter-label"
            label="Loại tài khoản"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả vai trò</MenuItem>
            <MenuItem value="Khách">Khách</MenuItem>
            <MenuItem value="Chủ cho thuê">Chủ cho thuê</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 190 } }}>
          <InputLabel id="admin-users-status-filter-label">Trạng thái</InputLabel>
          <Select
            labelId="admin-users-status-filter-label"
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả trạng thái</MenuItem>
            <MenuItem value="Đang hoạt động">Đang hoạt động</MenuItem>
            <MenuItem value="Đã khóa">Đã khóa</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          role="region"
          aria-labelledby="admin-users-table-heading"
          tabIndex={0}
          sx={{
            maxHeight: 520,
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
                <TableCell
                  scope="col"
                  sx={{
                    fontWeight: 700,
                    position: 'sticky',
                    insetInlineStart: 0,
                    zIndex: 3,
                    bgcolor: 'var(--rn-surface)',
                  }}
                >
                  Người dùng
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>
                  Email & Liên hệ
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>
                  Loại tài khoản
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>
                  Đăng nhập cuối
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 700 }}>
                  Trạng thái
                </TableCell>
                <TableCell scope="col" align="right" sx={{ fontWeight: 700 }}>
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Không tìm thấy người dùng nào khớp với bộ lọc hiện tại.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = user.isActive === true;
                  const userStatus = isActive ? 'Đang hoạt động' : 'Đã khóa';
                  const accountType = getAccountType(user.roles);
                  const roleChipProps = getRoleChipProps(accountType);
                  const displayName =
                    user.fullname?.trim() || user.username || `Người dùng #${user.id}`;
                  const avatarSrc = user.thumnailUrl
                    ? getMediaUrl(user.thumnailUrl)
                    : undefined;
                  const isPendingHost = pendingHostIdSet.has(Number(user.id));

                  return (
                    <TableRow key={user.id} hover>
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
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={avatarSrc}
                            alt={displayName}
                            sx={{ width: 44, height: 44 }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {displayName}
                            </Typography>
                            {user.username && (
                              <Typography variant="caption" color="text.secondary">
                                @{user.username}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {user.email || 'Chưa cập nhật email'}
                        </Typography>
                        {user.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {user.phone}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                          <Chip
                            size="small"
                            label={accountType}
                            color={roleChipProps.color}
                            variant={roleChipProps.variant}
                          />
                          {isPendingHost && (
                            <Chip
                              size="small"
                              color="warning"
                              variant="outlined"
                              label="Chờ duyệt Host"
                            />
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTimeVi(user.lastLogin)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={userStatus}
                          color={isActive ? 'success' : 'error'}
                          variant={isActive ? 'outlined' : 'filled'}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          aria-label={`Xử lý tài khoản ${displayName}`}
                          onClick={() => handleAction(user)}
                          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
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
        open={openDialog && Boolean(selectedUser)}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="span">
              {editMode ? 'Chỉnh sửa thông tin người dùng' : 'Thông tin người dùng'}
            </Typography>
            <Stack direction="row" spacing={1}>
              {!editMode && (
                <Tooltip title="Chỉnh sửa">
                  <IconButton
                    aria-label="Chỉnh sửa thông tin người dùng"
                    onClick={() => setEditMode(true)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton aria-label="Đóng hộp thoại" onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid
              item
              xs={12}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Avatar
                src={editedUser?.thumnailUrl ? getMediaUrl(editedUser.thumnailUrl) : undefined}
                alt={editedUser?.fullname || editedUser?.username || 'Ảnh đại diện'}
                sx={{ width: 112, height: 112, mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(editedUser?.isActive)}
                    onChange={handleStatusChange}
                    disabled={!editMode || saving}
                  />
                }
                label={
                  <Typography
                    color={editedUser?.isActive ? 'success.main' : 'error.main'}
                    fontWeight={600}
                  >
                    {editedUser?.isActive ? 'Đang hoạt động' : 'Đã khóa'}
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
                type="email"
                autoComplete="email"
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
                type="tel"
                autoComplete="tel"
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
                autoComplete="street-address"
                value={editedUser?.address || ''}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="admin-edit-user-role-label">Loại tài khoản</InputLabel>
                <Select
                  labelId="admin-edit-user-role-label"
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
                value={formatDateTimeVi(editedUser?.createdAt)}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lần đăng nhập cuối"
                value={formatDateTimeVi(editedUser?.lastLogin)}
                disabled
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {editMode && (
            <>
              <Button onClick={() => setEditMode(false)} disabled={saving}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveChanges}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
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
