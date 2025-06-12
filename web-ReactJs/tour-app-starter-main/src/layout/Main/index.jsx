import { Box, Stack } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import ChatBot from "../../components/chat/ChatBot";

const MainLayout = () => {
  return (
    <Stack spacing={2}>
      {/* Header */}
      <Header />
      <Box sx={{ overflowY: "scroll", height: "Calc(100vh-150px)" }}>
        {/* Main Content */}
        <Outlet />
      </Box>
      {/* ChatBot */}
      <ChatBot />
    </Stack>
  );
};
export default MainLayout;
