import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Stack,
  Button,
  Checkbox,
  Container,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Logo from "@/shared/components/Logo.jsx";
import axiosInstance from "@/shared/api/httpClient.js";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "remember" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const loginResponse = await axiosInstance.post("/auth/login", {
        username: formData.username,
        password: formData.password,
      });
  
      if (loginResponse.data.code === 200) {
        const { access_token, refresh_token } = loginResponse.data.result;
  
        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("refreshToken", refresh_token);
  
        const userResponse = await axiosInstance.get("/api/users/myInformation", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
  
        if (userResponse.data.code === 200 || userResponse.data.code === 0) {
          const userData = userResponse.data.result;
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("userName", userData.username);
  
          // 🔥 Gửi sự kiện để Header cập nhật
          window.dispatchEvent(new Event("storage"));
        }
  
        setSuccess(true);
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 401) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
      } else if (err.response?.status === 404) {
        setError("API endpoint not found");
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          py: { xs: 4, sm: 8 },
          maxWidth: 480,
          mx: "auto",
          display: "flex",
          minHeight: "100vh",
          textAlign: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <Logo sx={{ mb: 3 }} />

        <Typography component="h1" variant="h4" paragraph>
          Đăng nhập RestNesst
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Bạn chưa có tài khoản? {""}
          <RouterLink
            to="/signup"
            style={{ color: "primary.main", textDecoration: "underline" }}
          >
            Tạo tài khoản
          </RouterLink>
        </Typography>

        <Card sx={{ p: 3, width: "100%" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Đăng nhập thành công! Đang chuyển tới trang chủ...
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                name="username"
                label="Tên đăng nhập"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                error={!!error}
              />

              <TextField
                fullWidth
                name="password"
                label="Mật khẩu"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                disabled={loading}
                error={!!error}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ my: 2 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    disabled={loading}
                  />
                }
                label="Ghi nhớ đăng nhập"
              />

              <RouterLink
                to="/reset-password"
                style={{ color: "primary.main", textDecoration: "underline" }}
              >
                Quên mật khẩu?
              </RouterLink>
            </Stack>

            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
