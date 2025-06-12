import { useState, useEffect, useRef } from "react";
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Chip,
  Stack,
  Badge,
  InputAdornment,
  Drawer,
  Button,
  Grid,
} from "@mui/material";
import {
  Send as SendIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import axiosInstance from "../../api/axiosConfig";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

export default function AdminMessages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [messages, setMessages] = useState([]);
  const [persons, setPersons] = useState([]);
  const stompClient = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    axiosInstance.get("/api/chat/persons").then((res) => {
      setPersons(res.data.result || []);
    });
    const socket = new SockJS("http://175.41.233.105:8080/ws");
    stompClient.current = Stomp.over(socket);

    stompClient.current.connect(
      { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      () => {
        stompClient.current.subscribe(
          `/user/${user.username}/queue/messages`,
          () => {
            if (selectedChat) {
              axiosInstance
                .get(`/api/chat/simple/${selectedChat.id}`)
                .then((res) => {
                  setMessages(res.data.result || []);
                });
            }
          }
        );
      }
    );

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [user.username]);

  useEffect(() => {
    if (selectedChat) {
      axiosInstance.get(`/api/chat/simple/${selectedChat.id}`).then((res) => {
        setMessages(res.data.result || []);
      });
    }
  }, [selectedChat]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;

    const newMsg = {
      id: Date.now(),
      senderUsername: user.username,
      receiverUsername: selectedChat.username,
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    stompClient.current.send(
      "/app/chat",
      {},
      JSON.stringify({
        senderID: user.id,
        receiverID: selectedChat.id,
        content: message,
      })
    );

    setMessage("");
  };

  const filteredConversations = persons.filter((person) => {
    return (
      person.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 3,
        bgcolor: "#18191a",
      }}
    >
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: "#fff" }}>
        Tin nhắn
      </Typography>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={12} md={4} lg={3}>
          <Paper
            elevation={3}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              bgcolor: "#232323",
              color: "#fff",
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <TextField
                fullWidth
                placeholder="Tìm kiếm cuộc trò chuyện..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#bdbdbd" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{ color: "#bdbdbd" }}
                      >
                        <FilterIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#18191a",
                    color: "#fff",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#ff385c",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#fff",
                  },
                }}
              />
            </Box>

            <List sx={{ flex: 1, overflow: "auto" }}>
              {filteredConversations.map((person) => (
                <ListItem
                  key={person.id}
                  button
                  selected={selectedChat?.id === person.id}
                  onClick={() => setSelectedChat(person)}
                  sx={{
                    borderLeft: selectedChat?.id === person.id ? 3 : 0,
                    borderColor: "#ff385c",
                    bgcolor:
                      selectedChat?.id === person.id
                        ? "rgba(255,56,92,0.1)"
                        : "transparent",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                    color: "#fff",
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      color={person.status === "online" ? "success" : "default"}
                    >
                      <Avatar
                        sx={{
                          bgcolor:
                            person.type === "user" ? "#ff385c" : "#2c3e50",
                        }}
                      >
                        {person.fullname?.[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                          {person.fullname}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#bdbdbd" }}>
                          {new Date(
                            person.lastMessageTime
                          ).toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#bdbdbd",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "200px",
                          }}
                        >
                          {person.lastMessage}
                        </Typography>
                        {person.unread > 0 && (
                          <Chip
                            label={person.unread}
                            size="small"
                            sx={{
                              bgcolor: "#ff385c",
                              color: "#fff",
                              minWidth: "20px",
                              height: "20px",
                              "& .MuiChip-label": {
                                px: 1,
                              },
                            }}
                          />
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8} lg={9}>
          {selectedChat ? (
            <Paper
              elevation={3}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#232323",
                color: "#fff",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  bgcolor: "#18191a",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    sx={{
                      bgcolor:
                        selectedChat.type === "user" ? "#ff385c" : "#2c3e50",
                    }}
                  >
                    {selectedChat.fullname?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" sx={{ color: "#fff" }}>
                        {selectedChat.fullname}
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          selectedChat.type === "user"
                            ? "Người dùng"
                            : "Đối tác"
                        }
                        sx={{
                          bgcolor:
                            selectedChat.type === "user"
                              ? "#ff385c"
                              : "#2c3e50",
                          color: "#fff",
                        }}
                      />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
                        {selectedChat.status === "online"
                          ? "Đang hoạt động"
                          : "Ngoại tuyến"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
                        •
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <StarIcon sx={{ fontSize: 16, color: "#ffd700" }} />
                        <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
                          {selectedChat.rating || 0}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "#18191a" }}>
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      justifyContent:
                        msg.senderUsername === user.username
                          ? "flex-end"
                          : "flex-start",
                      mb: 2,
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        maxWidth: "70%",
                        bgcolor:
                          msg.senderUsername === user.username
                            ? "#ff385c"
                            : "#232323",
                        color: "#fff",
                        "&:hover": {
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  bgcolor: "#18191a",
                }}
              >
                <Stack direction="row" spacing={1}>
                  <IconButton sx={{ color: "#bdbdbd" }}>
                    <AttachFileIcon />
                  </IconButton>
                  <IconButton sx={{ color: "#bdbdbd" }}>
                    <ImageIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="Nhập tin nhắn..."
                    variant="outlined"
                    size="small"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#232323",
                        color: "#fff",
                        "& fieldset": {
                          borderColor: "rgba(255,255,255,0.12)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(255,255,255,0.2)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#ff385c",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#fff",
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    sx={{
                      color: message.trim() ? "#ff385c" : "#bdbdbd",
                      "&:hover": {
                        bgcolor: "rgba(255,56,92,0.1)",
                      },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Stack>
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={3}
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#232323",
                color: "#fff",
              }}
            >
              <Stack spacing={2} alignItems="center">
                <Typography variant="h6" sx={{ color: "#bdbdbd" }}>
                  Chọn một cuộc trò chuyện để bắt đầu
                </Typography>
                <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
                  Hoặc tìm kiếm người dùng/đối tác để nhắn tin
                </Typography>
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        open={showFilters}
        onClose={() => setShowFilters(false)}
      >
        <Box sx={{ width: 300, p: 3, bgcolor: "#232323", color: "#fff" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Typography variant="h6">Bộ lọc</Typography>
            <IconButton
              onClick={() => setShowFilters(false)}
              sx={{ color: "#bdbdbd" }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={3}>
            <TextField
              label="Tìm kiếm"
              variant="outlined"
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#18191a",
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ff385c",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#bdbdbd",
                },
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
              }}
            />
            <TextField
              select
              label="Trạng thái"
              variant="outlined"
              size="small"
              fullWidth
              SelectProps={{
                native: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#18191a",
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ff385c",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#bdbdbd",
                },
                "& .MuiSelect-select": {
                  color: "#fff",
                },
              }}
            >
              <option value="all">Tất cả</option>
              <option value="online">Đang hoạt động</option>
              <option value="offline">Ngoại tuyến</option>
            </TextField>
            <TextField
              select
              label="Đánh giá"
              variant="outlined"
              size="small"
              fullWidth
              SelectProps={{
                native: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#18191a",
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#ff385c",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#bdbdbd",
                },
                "& .MuiSelect-select": {
                  color: "#fff",
                },
              }}
            >
              <option value="all">Tất cả</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao trở lên</option>
              <option value="3">3 sao trở lên</option>
            </TextField>
            <Button
              variant="contained"
              fullWidth
              sx={{
                bgcolor: "#ff385c",
                "&:hover": {
                  bgcolor: "#e61e4d",
                },
              }}
            >
              Áp dụng
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
