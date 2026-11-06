import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  ButtonBase,
  Typography,
  Divider,
  ListItemIcon,
} from "@mui/material";
import Logo from "@/shared/components/Logo.jsx";
import SearchBar from "@/features/search/components/SearchBar.jsx";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LoginRounded,
  PersonAddRounded,
  LogoutRounded,
  PersonRounded,
  AdminPanelSettings,
  Home,
  Info,
  ConfirmationNumber,
  Dashboard,
  KeyboardArrowDownRounded,
} from "@mui/icons-material";
import axiosInstance from "@/shared/api/httpClient.js";

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const userName = [
    userInfo?.fullname,
    userInfo?.fullName,
    userInfo?.displayName,
    userInfo?.name,
    userInfo?.username,
    userInfo?.email,
  ].find((value) => typeof value === "string" && value.trim())?.trim() || "Bạn";
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHostPage = location.pathname.startsWith("/host");
  const isProfilePage = location.pathname.startsWith("/profile");
  const isAdminPage = location.pathname.startsWith("/admin");
  const isPropertyPage = location.pathname.startsWith("/property/");
  const isReservationPage = location.pathname.startsWith("/reservation");
  const isHost = userInfo?.roles?.includes("HOST");
  const isAdmin = userInfo?.roles?.includes("ADMIN");

  // Get available roles based on user's highest role
  const getAvailableRoles = () => {
    // Luôn có "USER" (Thông tin cá nhân) cho mọi role
    const roles = [];
    if (isAdmin) roles.push("ADMIN");
    if (isHost) roles.push("HOST");
    roles.push("USER");
    return roles;
  };

  const fetchUserInfo = async () => {
    try {
      const access_token = localStorage.getItem("accessToken");
      if (access_token) {
        const userResponse = await axiosInstance.get(
          "/api/users/myInformation"
        );

        if (userResponse.data.code === 0 || userResponse.data.code === 200) {
          const userData = userResponse.data.result;
          setUserInfo(userData);
          localStorage.setItem("user", JSON.stringify(userData));

          // Set initial selected role based on current path
          if (isAdminPage) {
            setSelectedRole("ADMIN");
          } else if (isHostPage) {
            setSelectedRole("HOST");
          } else if (isProfilePage) {
            setSelectedRole("USER");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    fetchUserInfo();

    const handleStorageChange = () => {
      fetchUserInfo();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userProfileUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userProfileUpdated", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (isAdminPage) {
      setSelectedRole("ADMIN");
    } else if (isHostPage) {
      setSelectedRole("HOST");
    } else if (isProfilePage) {
      setSelectedRole("USER");
    } else {
      setSelectedRole(null);
    }
  }, [location.pathname]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    navigate("/login");
    handleClose();
  };

  const handleSignup = () => {
    navigate("/signup");
    handleClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("user");
    setUserInfo(null);
    setSelectedRole(null);
    handleClose();
    navigate("/");
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    switch (role) {
      case "ADMIN":
        navigate("/admin");
        break;
      case "HOST":
        navigate("/host");
        break;
      case "USER":
        navigate("/profile");
        break;
      default:
        break;
    }
    handleClose();
  };

  const isLoggedIn = Boolean(userInfo);

  const getPageTitle = () => {
    if (isAdminPage)
      return {
        text: "Hệ thống quản trị",
        icon: <Dashboard sx={{ fontSize: 28, mr: 1 }} />,
      };
    if (isHostPage)
      return {
        text: "Quản lý chỗ nghỉ",
        icon: <Home sx={{ fontSize: 28, mr: 1 }} />,
      };
    if (isProfilePage)
      return {
        text: "Tài khoản của tôi",
        icon: <PersonRounded sx={{ fontSize: 28, mr: 1 }} />,
      };
    if (isPropertyPage)
      return {
        text: "Thông tin chi tiết",
        icon: <Info sx={{ fontSize: 28, mr: 1 }} />,
      };
    if (isReservationPage)
      return {
        text: "Xác nhận đặt phòng",
        icon: <ConfirmationNumber sx={{ fontSize: 28, mr: 1 }} />,
      };
    return null;
  };

  const renderCenterContent = () => {
    if (isAdminPage) {
      return <Box sx={{ flex: 1 }} />;
    }
    const titleData = getPageTitle();
    if (titleData) {
      return (
        <Box
          sx={{
            flex: { xs: "1 0 100%", md: 1 },
            order: { xs: 3, md: 0 },
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: { xs: 0, md: 2 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 56, 92, 0.05)",
              padding: "8px 24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              },
            }}
          >
            {titleData.icon}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                background: "linear-gradient(45deg, #FF385C 30%, #E61E4D 90%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textAlign: "center",
                letterSpacing: "0.5px",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40%",
                  height: "2px",
                  background:
                    "linear-gradient(45deg, #FF385C 30%, #E61E4D 90%)",
                  borderRadius: "2px",
                },
              }}
            >
              {titleData.text}
            </Typography>
          </Box>
        </Box>
      );
    }
    return (
      <Box sx={{ order: { xs: 3, md: 0 }, flex: { xs: "1 0 100%", md: 1 }, minWidth: 0 }}>
        <SearchBar />
      </Box>
    );
  };

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        bgcolor: "var(--rn-header-bg)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: { xs: 1.25, sm: 2 },
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 1.25, sm: 1.5 },
        }}
      >
        <Logo />
        {renderCenterContent()}
        <ButtonBase
          aria-label={isLoggedIn ? `Chào mừng trở lại, ${userName}. Mở menu tài khoản` : "Mở menu tài khoản"}
          aria-haspopup="menu"
          aria-controls={anchorEl ? "account-menu" : undefined}
          aria-expanded={Boolean(anchorEl)}
          onClick={handleClick}
          className="rn-interactive-btn"
          sx={{
            minWidth: isLoggedIn ? 0 : 44,
            minHeight: 44,
            maxWidth: isLoggedIn ? { xs: "calc(100% - 164px)", sm: 260, lg: 300 } : 44,
            flexShrink: 0,
            ml: "auto",
            gap: { xs: 1, sm: 1.25 },
            py: 0.5,
            px: { xs: 0.25, sm: 1 },
            borderRadius: 2,
            textAlign: "left",
            color: "text.primary",
            "&:hover": { bgcolor: "action.hover" },
            "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
            "& .MuiAvatar-root": {
              border: "2px solid",
              borderColor: "primary.main",
              flexShrink: 0,
            },
          }}
        >
          <Avatar
            alt={isLoggedIn ? userName : "Tài khoản"}
            src={userInfo?.thumnailUrl || undefined}
            sx={{
              width: 36,
              height: 36,
              cursor: "pointer",
            }}
          />
          {isLoggedIn && (
            <>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="span" noWrap sx={{ display: "block", fontSize: { xs: "0.6875rem", sm: "0.75rem" }, color: "text.secondary", lineHeight: 1.5 }}>
                  Chào mừng trở lại
                </Typography>
                <Typography component="span" noWrap sx={{ display: "block", fontSize: { xs: "0.8125rem", sm: "0.875rem" }, fontWeight: 700, lineHeight: 1.5 }}>
                  {userName}
                </Typography>
              </Box>
              <KeyboardArrowDownRounded aria-hidden="true" sx={{ display: { xs: "none", sm: "block" }, fontSize: 18, color: "text.secondary", flexShrink: 0 }} />
            </>
          )}
        </ButtonBase>
      </Box>
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 280,
            maxWidth: "100%",
            mt: 1.5,
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
          },
        }}
      >
        {isLoggedIn ? (
          <>
            <Box
              sx={{
                p: 2,
                pb: 1,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                alt={userName}
                src={userInfo?.thumnailUrl || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  border: "2px solid #f44336",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
                  {userName}
                </Typography>
              </Box>
            </Box>
            <Divider />
            {getAvailableRoles().map((role) => (
              <MenuItem
                key={role}
                onClick={() => handleRoleSelect(role)}
                selected={selectedRole === role}
                sx={{
                  "&.Mui-selected": {
                    bgcolor: "rgba(244, 67, 54, 0.08)",
                    "&:hover": {
                      bgcolor: "rgba(244, 67, 54, 0.12)",
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {role === "ADMIN" && (
                    <AdminPanelSettings
                      color={selectedRole === role ? "error" : "inherit"}
                    />
                  )}
                  {role === "HOST" && (
                    <Home color={selectedRole === role ? "error" : "inherit"} />
                  )}
                  {role === "USER" && (
                    <PersonRounded
                      color={selectedRole === role ? "error" : "inherit"}
                    />
                  )}
                </ListItemIcon>
                <Typography
                  color={selectedRole === role ? "error" : "inherit"}
                  fontWeight={selectedRole === role ? 600 : 400}
                >
                  {role === "ADMIN" && "Trang quản trị"}
                  {role === "HOST" && "Trang Host"}
                  {role === "USER" && "Thông tin cá nhân"}
                </Typography>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{
                "&:hover": {
                  bgcolor: "rgba(244, 67, 54, 0.08)",
                },
              }}
            >
              <ListItemIcon>
                <LogoutRounded color="error" />
              </ListItemIcon>
              <Typography color="error" fontWeight={500}>
                Đăng xuất
              </Typography>
            </MenuItem>
          </>
        ) : (
          <>
            <Box
              sx={{
                p: 3,
                pb: 2,
                background: "linear-gradient(45deg, #f44336 30%, #ff9800 90%)",
                color: "white",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={600}
                align="center"
                gutterBottom
              >
                Chào mừng
              </Typography>
              <Typography variant="body2" align="center" sx={{ opacity: 0.9 }}>
                Đăng nhập để truy cập tài khoản của bạn
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={handleLogin}
              sx={{
                "&:hover": {
                  bgcolor: "rgba(244, 67, 54, 0.08)",
                },
              }}
            >
              <ListItemIcon>
                <LoginRounded color="error" />
              </ListItemIcon>
              <Typography color="error" fontWeight={500}>
                Đăng nhập
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={handleSignup}
              sx={{
                "&:hover": {
                  bgcolor: "rgba(244, 67, 54, 0.08)",
                },
              }}
            >
              <ListItemIcon>
                <PersonAddRounded color="error" />
              </ListItemIcon>
              <Typography color="error" fontWeight={500}>
                Đăng ký
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default Header;
