import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  Stack,
  Button,
  Container,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Logo from "@/shared/components/Logo.jsx";
import axiosInstance from "@/shared/api/httpClient.js";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullname: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        "/api/users",
        {
          username: formData.username,
          password: formData.password,
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Registration response:", response.data);

      if (response.data.code === 400) {
        setError(response.data.message || "Registration failed");
        return;
      }

      // After successful registration, try to login
      try {
        const loginResponse = await axiosInstance.post(
          "/auth/login",
          {
            username: formData.username,
            password: formData.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );


        if (loginResponse.data.code === 200) {
          const { access_token, refresh_token } = loginResponse.data.result;

          // Store tokens
          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);

          const profileResponse = await axiosInstance.get("/api/users/myInformation");
          localStorage.setItem("user", JSON.stringify(profileResponse.data.result));
          localStorage.setItem("userName", profileResponse.data.result.username);

          // Use window.location for full page refresh
          window.location.href = "/";
        } else {
          // Registration successful but login failed
          window.location.href = "/login";
        }
      } catch (loginError) {
        console.error(
          "Auto-login error:",
          loginError.response?.data || loginError
        );
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);
      if (err.response?.data?.message === "username exited!") {
        setError("Username already exists");
      } else {
        setError(
          err.response?.data?.message || "An error occurred during registration"
        );
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
          bgcolor: "background.default", // Add dark theme background
        }}
      >
        <Logo sx={{ mb: 3 }} />

        <Typography component="h1" variant="h4" paragraph sx={{ color: "text.primary" }}>
          Tạo tài khoản RestNesst
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Bạn đã có tài khoản? {""}
          <RouterLink
            to="/login"
            style={{ color: "primary.main", textDecoration: "underline" }}
          >
            Đăng nhập
          </RouterLink>
        </Typography>

        <Card
          sx={{
            p: 3,
            width: "100%",
            bgcolor: "background.paper", // Dark theme card background
            borderRadius: 2,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                name="username"
                label="Tên đăng nhập"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                error={!!error}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "text.primary",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="fullname"
                label="Họ và tên"
                autoComplete="name"
                value={formData.fullname}
                onChange={handleChange}
                disabled={loading}
                error={!!error}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "text.primary",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="email"
                label="Email"
                autoComplete="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "text.primary",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="phone"
                label="Số điện thoại"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "text.primary",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="password"
                label="Mật khẩu"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                disabled={loading}
                error={!!error}
                required
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "text.primary",
                    },
                  },
                }}
              />
            </Stack>

            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
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
                "Tạo tài khoản"
              )}
            </Button>
          </form>
        </Card>
      </Box>
    </Container>
  );
};

export default SignUp;
