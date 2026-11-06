import { Box, Stack } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
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
      {/* Header */}
      <Header />
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        {/* Main Content */}
        <Outlet />
      </Box>
      {/* ChatBot */}
      <ChatBot />
    </Stack>
  );
};
export default MainLayout;
