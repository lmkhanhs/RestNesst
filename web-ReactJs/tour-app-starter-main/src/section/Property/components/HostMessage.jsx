import { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PropTypes from "prop-types";
import axiosInstance from "../../../api/axiosConfig";
import SockJS from "sockjs-client";
import { CompatClient, Stomp } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";

const HostMessage = ({ hostId }) => {
  const [message, setMessage] = useState("");
  const stompClient = useRef(null);
  const navigate = useNavigate();

  // Lấy user hiện tại từ localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // Kết nối websocket khi mount và user đã đăng nhập
  useEffect(() => {
    if (!user) return; // Không kết nối nếu chưa đăng nhập

    const socket = new SockJS("http://175.41.233.105:8080/ws");
    stompClient.current = Stomp.over(socket);

    stompClient.current.connect(
      { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      () => {
        // Đăng ký nhận tin nhắn nếu muốn
        stompClient.current.subscribe(
          `/user/${user.username}/queue/messages`,
          (msg) => {
            // Xử lý khi nhận tin nhắn mới (nếu muốn realtime)
            // alert("Bạn có tin nhắn mới!");
          }
        );
      }
    );

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [user?.username]);

  // Hàm gửi tin nhắn
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!user) {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
      navigate("/login");
      return;
    }

    // Gửi qua WebSocket để lưu DB và realtime
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send(
        "/app/chat",
        {},
        JSON.stringify({
          senderID: user.id,
          receiverID: Number(hostId),
          content: message,
        })
      );
    }

    setMessage("");
  };

  if (!user) {
    return (
      <Paper elevation={0} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Message Host
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="info" sx={{ mb: 2 }}>
          Vui lòng đăng nhập để gửi tin nhắn cho chủ nhà
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/login")}
          fullWidth
        >
          Đăng nhập
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Message Host
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Write your message to the host..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          endIcon={<SendIcon />}
          disabled={!message.trim()}
        >
          Send Message
        </Button>
      </Box>
    </Paper>
  );
};

HostMessage.propTypes = {
  hostId: PropTypes.string,
};

export default HostMessage;
