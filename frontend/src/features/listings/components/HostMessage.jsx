import { BACKEND_URL } from "@/shared/config/environment.js";
import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PropTypes from "prop-types";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";

const HostMessage = ({ hostId }) => {
  const [message, setMessage] = useState("");
  const [sentNotice, setSentNotice] = useState(false);
  const stompClient = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user?.username) return undefined;

    const socket = new SockJS(`${BACKEND_URL}/ws`);
    stompClient.current = Stomp.over(socket);
    stompClient.current.debug = () => {};

    stompClient.current.connect(
      { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      () => {
        stompClient.current.subscribe(
          `/user/${user.username}/queue/messages`,
          () => {}
        );
      }
    );

    return () => {
      if (stompClient.current?.connected) {
        stompClient.current.disconnect();
      }
    };
  }, [user?.username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send(
        "/app/chat",
        {},
        JSON.stringify({
          senderID: user.id,
          receiverID: Number(hostId),
          content: message.trim(),
        })
      );
    }

    setMessage("");
    setSentNotice(true);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        mt: 2.5,
        borderRadius: "20px",
        bgcolor: "var(--rn-surface-card)",
        border: "1px solid var(--rn-border-subtle)",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
        <ChatBubbleOutlineRoundedIcon
          sx={{ color: "var(--rn-brand-primary)", fontSize: 22 }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontFamily: "var(--rn-font-display)",
            color: "var(--rn-text-primary)",
            fontSize: "1.15rem",
          }}
        >
          Nhắn tin trực tiếp cho chủ nhà
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2, borderColor: "var(--rn-border-subtle)" }} />

      {!user ? (
        <Box>
          <Alert severity="info" sx={{ mb: 2, borderRadius: "12px" }}>
            Vui lòng đăng nhập để trao đổi trực tiếp với chủ nhà về giờ nhận
            phòng hoặc tiện ích đi kèm.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate("/login")}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "var(--rn-brand-primary)",
              "&:hover": { bgcolor: "var(--rn-brand-primary-hover)" },
            }}
          >
            Đăng nhập để nhắn tin
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          {sentNotice && (
            <Alert
              severity="success"
              onClose={() => setSentNotice(false)}
              sx={{ mb: 2, borderRadius: "12px" }}
            >
              Đã gửi tin nhắn cho chủ nhà! Bạn có thể theo dõi phản hồi trong
              hộp thoại hỗ trợ.
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Nhập câu hỏi cho chủ nhà (ví dụ: giờ nhận phòng sớm, chỗ đậu xe, hướng dẫn di chuyển)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                bgcolor: "var(--rn-surface-2)",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendRoundedIcon />}
            disabled={!message.trim()}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1.1,
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "var(--rn-brand-primary)",
              "&:hover": { bgcolor: "var(--rn-brand-primary-hover)" },
            }}
          >
            Gửi tin nhắn
          </Button>
        </Box>
      )}
    </Paper>
  );
};

HostMessage.propTypes = {
  hostId: PropTypes.string,
};

export default HostMessage;
