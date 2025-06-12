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
import Logo from "../components/Logo";
import axios from "axios";

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
      const response = await axios.post(
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
        const loginResponse = await axios.post(
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

        console.log("Login response:", loginResponse.data); // Debug log

        if (loginResponse.data.code === 200) {
          const { accessToken, refreshToken } = loginResponse.data.result;

          // Store tokens
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);

          // Set default authorization header
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;

          // Store user data
          localStorage.setItem(
            "user",
            JSON.stringify(loginResponse.data.result)
          );

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
    <Container maxWidth="sm">
      <Box
        sx={{
          py: 12,
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
        <Logo sx={{ mb: 5 }} />

        <Typography variant="h4" paragraph sx={{ color: "text.primary" }}>
          Get started with Rhythm
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 5 }}>
          Already have an account? {""}
          <RouterLink
            to="/login"
            style={{ color: "primary.main", textDecoration: "none" }}
          >
            Sign in
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
                label="Username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                error={!!error}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="fullname"
                label="Full Name"
                value={formData.fullname}
                onChange={handleChange}
                disabled={loading}
                error={!!error}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                name="password"
                label="Password"
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
                      borderColor: "rgba(255, 255, 255, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.4)",
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
                "Create Account"
              )}
            </Button>
          </form>
        </Card>
      </Box>
    </Container>
  );
};

export default SignUp;
