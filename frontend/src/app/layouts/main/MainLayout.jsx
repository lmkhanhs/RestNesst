import { Box, Stack } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import ChatBot from "@/features/chat/components/ChatBot.jsx";

const MainLayout = () => {
  return (
    <Stack
      sx={{
        minHeight: "100dvh",
        minWidth: 0,
        "--rn-admin-shell-max-width": "1800px",
        "--rn-admin-shell-gutter": { xs: "16px", sm: "24px", lg: "32px" },
        "--rn-admin-header-height": "73px",
      }}
    >
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 2000,
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 700,
          fontSize: "0.875rem",
          textDecoration: "none",
          boxShadow: "var(--rn-shadow-md)",
          transform: "translateY(-200%)",
          transition: "transform 160ms ease",
          "&:focus-visible": {
            transform: "translateY(0)",
            outline: "3px solid var(--rn-focus-ring, #38BDF8)",
            outlineOffset: "2px",
          },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        Chuyển đến nội dung chính
      </Box>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <Box
        id="main-content"
        component="main"
        tabIndex={-1}
        sx={{ flex: 1, minWidth: 0, outline: "none" }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Footer />

      {/* ChatBot */}
      <ChatBot />
    </Stack>
  );
};

export default MainLayout;
