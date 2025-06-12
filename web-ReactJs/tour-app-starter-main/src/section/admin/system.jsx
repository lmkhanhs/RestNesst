import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const systemSettings = [
  {
    id: 'backup',
    name: 'Sao lưu dữ liệu',
    description: 'Tự động sao lưu hệ thống mỗi ngày',
    enabled: true,
    type: 'system'
  },
  {
    id: 'notifications',
    name: 'Thông báo hệ thống',
    description: 'Gửi thông báo đến toàn bộ người dùng khi có cập nhật',
    enabled: true,
    type: 'communication'
  },
  {
    id: 'maintenance',
    name: 'Chế độ bảo trì',
    description: 'Kích hoạt để bảo trì hệ thống',
    enabled: false,
    type: 'system'
  },
  {
    id: 'security',
    name: 'Bảo mật hệ thống',
    description: 'Cài đặt bảo mật và xác thực',
    enabled: true,
    type: 'security'
  }
];

export default function AdminSystem() {
  const [settings, setSettings] = useState(systemSettings);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleToggle = async (settingId) => {
    try {
      setLoading(true);
 
      await new Promise(resolve => setTimeout(resolve, 500));

      setSettings(prev => 
        prev.map(setting => 
          setting.id === settingId 
            ? { ...setting, enabled: !setting.enabled }
            : setting
        )
      );

      const updatedSetting = settings.find(s => s.id === settingId);
      setSnackbar({
        open: true,
        message: `Đã ${updatedSetting.enabled ? 'tắt' : 'bật'} ${updatedSetting.name}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSettingIcon = (type) => {
    switch (type) {
      case 'system':
        return <SettingsIcon />;
      case 'communication':
        return <NotificationsIcon />;
      case 'security':
        return <SecurityIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  const getSettingColor = (type) => {
    switch (type) {
      case 'system':
        return 'primary';
      case 'communication':
        return 'info';
      case 'security':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Quản lý hệ thống
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {settings.map((setting) => (
          <Grid item xs={12} md={6} lg={4} key={setting.id}>
            <Card 
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: `${getSettingColor(setting.type)}.main`,
                      color: 'white'
                    }}>
                      {getSettingIcon(setting.type)}
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        {setting.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={setting.type}
                        color={getSettingColor(setting.type)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={setting.enabled}
                        onChange={() => handleToggle(setting.id)}
                        color={getSettingColor(setting.type)}
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2" color={setting.enabled ? 'success.main' : 'error.main'}>
                        {setting.enabled ? 'Đang bật' : 'Đang tắt'}
                      </Typography>
                    }
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {setting.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </Box>
  );
}