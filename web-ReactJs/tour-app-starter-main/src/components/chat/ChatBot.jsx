import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Fab,
  ClickAwayListener,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import { sendMessage } from "../../api/chat";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [...messages, { text: userMessage, sender: "user" }];
    setMessages(newMessages);
    setLoading(true);

    // Chuyển đổi lịch sử sang dạng backend yêu cầu
    const history = newMessages.slice(0, -1).map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    try {
      const response = await sendMessage(userMessage, history);
      setMessages((prev) => [
        ...prev,
        { text: response.message, sender: "bot" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Đóng chat khi click ra ngoài
  const handleClickAway = () => {
    if (open) setOpen(false);
  };

  return (
    <>
      {!open && (
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            zIndex: 1300,
            boxShadow: 6,
          }}
        >
          <ChatIcon sx={{ fontSize: 32 }} />
        </Fab>
      )}

      {open && (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper
            elevation={8}
            sx={{
              position: "fixed",
              bottom: 32,
              right: 32,
              width: 370,
              height: 540,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 1400,
              borderRadius: 4,
              boxShadow: 8,
              background: "#fff",
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chat với chúng tôi
              </Typography>
              <IconButton
                onClick={() => setOpen(false)}
                sx={{ color: "white" }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                background: "#f7f7f7",
              }}
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    alignSelf:
                      message.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    bgcolor:
                      message.sender === "user" ? "primary.light" : "grey.200",
                    color: message.sender === "user" ? "white" : "text.primary",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography>{message.text}</Typography>
                </Box>
              ))}
              {loading && (
                <Box sx={{ alignSelf: "flex-start" }}>
                  <CircularProgress size={20} />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                bgcolor: "#fff",
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </Paper>
        </ClickAwayListener>
      )}
    </>
  );
};

export default ChatBot;
