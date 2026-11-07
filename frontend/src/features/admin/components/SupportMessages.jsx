import { BACKEND_URL } from "@/shared/config/environment.js";
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
import axiosInstance from "@/shared/api/httpClient.js";
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
    const socket = new SockJS((BACKEND_URL + "/ws"));
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
        p: { xs: 2, md: 3 },
        height: "calc(100dvh - 150px)",
        minHeight: 600,
        display: "flex",
        flexDirection: "column",
        bgcolor: "transparent",
        color: "var(--rn-text-primary)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, color: "var(--rn-text-primary)" }}
          >
            Tin nhắn hỗ trợ
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "var(--rn-text-secondary)", mt: 0.25 }}
          >
            Trao đổi và hỗ trợ trực tiếp người dùng, chủ nhà trên hệ thống
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${filteredConversations.length} liên hệ`}
          sx={{
            fontWeight: 700,
            bgcolor: "var(--rn-primary-soft)",
            color: "primary.main",
          }}
        />
      </Stack>

      <Grid container spacing={2.5} sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={12} md={4} lg={3.5} sx={{ height: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              bgcolor: "var(--rn-surface)",
              color: "var(--rn-text-primary)",
              border: "1px solid var(--rn-border)",
              borderRadius: 4,
              boxShadow: "var(--rn-shadow-sm)",
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid var(--rn-border)",
                bgcolor: "var(--rn-surface-subtle)",
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
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "var(--rn-text-secondary)" }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Bộ lọc tin nhắn"
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{ color: "var(--rn-text-secondary)" }}
                      >
                        <FilterIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "var(--rn-surface)",
                    color: "var(--rn-text-primary)",
                    borderRadius: 2.5,
                    "& fieldset": {
                      borderColor: "var(--rn-border)",
                    },
                    "&:hover fieldset": {
                      borderColor: "var(--rn-border-strong)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "var(--rn-text-primary)",
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "var(--rn-text-secondary)",
                    opacity: 0.85,
                  },
                }}
              />
            </Box>

            <List sx={{ flex: 1, overflow: "auto", py: 1 }}>
              {filteredConversations.length === 0 ? (
                <Box
                  sx={{
                    height: "100%",
                    minHeight: 240,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 3,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: "var(--rn-text-primary)",
                      mb: 0.5,
                    }}
                  >
                    Không tìm thấy cuộc trò chuyện
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--rn-text-secondary)" }}
                  >
                    Thử tìm bằng tên hoặc email khác.
                  </Typography>
                </Box>
              ) : (
                filteredConversations.map((person) => {
                  const isSelected = selectedChat?.id === person.id;
                  return (
                    <ListItem
                      key={person.id}
                      button
                      selected={isSelected}
                      onClick={() => setSelectedChat(person)}
                      sx={{
                        px: 2,
                        py: 1.25,
                        borderLeft: isSelected
                          ? "3px solid"
                          : "3px solid transparent",
                        borderColor: isSelected ? "primary.main" : "transparent",
                        bgcolor: isSelected
                          ? "var(--rn-primary-soft)"
                          : "transparent",
                        transition: "background-color 0.15s ease",
                        "&.Mui-selected": {
                          bgcolor: "var(--rn-primary-soft)",
                          "&:hover": {
                            bgcolor: "var(--rn-primary-soft)",
                          },
                        },
                        "&:hover": {
                          bgcolor: "var(--rn-surface-subtle)",
                        },
                        color: "var(--rn-text-primary)",
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          variant="dot"
                          color={
                            person.status === "online" ? "success" : "default"
                          }
                        >
                          <Avatar
                            sx={{
                              bgcolor:
                                person.type === "user" || isSelected
                                  ? "primary.main"
                                  : "var(--rn-surface-subtle)",
                              color:
                                person.type === "user" || isSelected
                                  ? "#FFFFFF"
                                  : "var(--rn-text-primary)",
                              fontWeight: 700,
                              border: "1px solid var(--rn-border)",
                            }}
                          >
                            {person.fullname?.[0]?.toUpperCase() || "U"}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: "var(--rn-text-primary)",
                                fontWeight: isSelected ? 700 : 600,
                              }}
                              noWrap
                            >
                              {person.fullname}
                            </Typography>
                            {person.lastMessageTime && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "var(--rn-text-secondary)",
                                  flexShrink: 0,
                                }}
                              >
                                {new Date(
                                  person.lastMessageTime
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                            sx={{ mt: 0.25 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "var(--rn-text-secondary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "190px",
                              }}
                            >
                              {person.lastMessage || person.email}
                            </Typography>
                            {person.unread > 0 && (
                              <Chip
                                label={person.unread}
                                size="small"
                                sx={{
                                  bgcolor: "primary.main",
                                  color: "#FFFFFF",
                                  fontWeight: 700,
                                  minWidth: "20px",
                                  height: "20px",
                                  "& .MuiChip-label": {
                                    px: 0.75,
                                  },
                                }}
                              />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  );
                })
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8} lg={8.5} sx={{ height: "100%" }}>
          {selectedChat ? (
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "var(--rn-surface)",
                color: "var(--rn-text-primary)",
                border: "1px solid var(--rn-border)",
                borderRadius: 4,
                boxShadow: "var(--rn-shadow-sm)",
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: "1px solid var(--rn-border)",
                  bgcolor: "var(--rn-surface-subtle)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.75}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      color: "#FFFFFF",
                      fontWeight: 700,
                    }}
                  >
                    {selectedChat.fullname?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "var(--rn-text-primary)",
                          fontWeight: 700,
                        }}
                        noWrap
                      >
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
                          height: 22,
                          fontWeight: 600,
                          bgcolor:
                            selectedChat.type === "user"
                              ? "var(--rn-primary-soft)"
                              : "var(--rn-teal-soft)",
                          color:
                            selectedChat.type === "user"
                              ? "primary.main"
                              : "var(--rn-teal)",
                        }}
                      />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--rn-text-secondary)" }}
                      >
                        {selectedChat.email ||
                          (selectedChat.status === "online"
                            ? "Đang hoạt động"
                            : "Ngoại tuyến")}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--rn-text-secondary)" }}
                      >
                        •
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <StarIcon sx={{ fontSize: 15, color: "#F59E0B" }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--rn-text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedChat.rating || 5.0}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  p: 2.5,
                  bgcolor: "var(--rn-bg)",
                }}
              >
                {messages.length === 0 ? (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      px: 3,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "var(--rn-text-primary)",
                        mb: 0.5,
                      }}
                    >
                      Chưa có tin nhắn nào
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--rn-text-secondary)" }}
                    >
                      Gửi tin nhắn bên dưới để bắt đầu hỗ trợ{" "}
                      {selectedChat.fullname}.
                    </Typography>
                  </Box>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderUsername === user.username;
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: "flex",
                          justifyContent: isOwn ? "flex-end" : "flex-start",
                          mb: 1.75,
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            px: 2,
                            py: 1.25,
                            maxWidth: "72%",
                            bgcolor: isOwn
                              ? "primary.main"
                              : "var(--rn-surface)",
                            color: isOwn
                              ? "#FFFFFF"
                              : "var(--rn-text-primary)",
                            border: isOwn
                              ? "none"
                              : "1px solid var(--rn-border)",
                            borderRadius: isOwn
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                            boxShadow: "var(--rn-shadow-sm)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ lineHeight: 1.55, wordBreak: "break-word" }}
                          >
                            {msg.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isOwn
                                ? "rgba(255,255,255,0.82)"
                                : "var(--rn-text-secondary)",
                              display: "block",
                              textAlign: isOwn ? "right" : "left",
                              mt: 0.5,
                              fontSize: 11,
                            }}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Paper>
                      </Box>
                    );
                  })
                )}
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid var(--rn-border)",
                  bgcolor: "var(--rn-surface)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    aria-label="Đính kèm tệp"
                    sx={{ color: "var(--rn-text-secondary)" }}
                  >
                    <AttachFileIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Đính kèm hình ảnh"
                    sx={{ color: "var(--rn-text-secondary)" }}
                  >
                    <ImageIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="Nhập tin nhắn..."
                    variant="outlined"
                    size="small"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "var(--rn-bg)",
                        color: "var(--rn-text-primary)",
                        borderRadius: 2.5,
                        "& fieldset": {
                          borderColor: "var(--rn-border)",
                        },
                        "&:hover fieldset": {
                          borderColor: "var(--rn-border-strong)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "var(--rn-text-primary)",
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "var(--rn-text-secondary)",
                        opacity: 0.85,
                      },
                    }}
                  />
                  <IconButton
                    aria-label="Gửi tin nhắn"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    sx={{
                      bgcolor: message.trim()
                        ? "primary.main"
                        : "var(--rn-surface-subtle)",
                      color: message.trim()
                        ? "#FFFFFF"
                        : "var(--rn-text-secondary)",
                      "&:hover": {
                        bgcolor: message.trim()
                          ? "primary.dark"
                          : "var(--rn-surface-subtle)",
                      },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "var(--rn-surface)",
                color: "var(--rn-text-primary)",
                border: "1px solid var(--rn-border)",
                borderRadius: 4,
                boxShadow: "var(--rn-shadow-sm)",
                p: 4,
              }}
            >
              <Stack spacing={1.5} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "var(--rn-primary-soft)",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 0.5,
                  }}
                >
                  <SendIcon />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "var(--rn-text-primary)" }}
                >
                  Chọn một cuộc trò chuyện để bắt đầu
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--rn-text-secondary)", maxWidth: 360 }}
                >
                  Chọn người dùng hoặc đối tác từ danh sách bên trái để xem lịch
                  sử trao đổi và phản hồi hỗ trợ.
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
        PaperProps={{
          sx: {
            bgcolor: "var(--rn-surface)",
            color: "var(--rn-text-primary)",
            borderLeft: "1px solid var(--rn-border)",
          },
        }}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "var(--rn-text-primary)" }}
            >
              Bộ lọc tin nhắn
            </Typography>
            <IconButton
              aria-label="Đóng bộ lọc"
              onClick={() => setShowFilters(false)}
              sx={{ color: "var(--rn-text-secondary)" }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack spacing={2.5}>
            <TextField
              label="Tìm kiếm"
              variant="outlined"
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "var(--rn-bg)",
                  color: "var(--rn-text-primary)",
                  "& fieldset": {
                    borderColor: "var(--rn-border)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--rn-border-strong)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "var(--rn-text-secondary)",
                },
                "& .MuiInputBase-input": {
                  color: "var(--rn-text-primary)",
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
                  bgcolor: "var(--rn-bg)",
                  color: "var(--rn-text-primary)",
                  "& fieldset": {
                    borderColor: "var(--rn-border)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--rn-border-strong)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "var(--rn-text-secondary)",
                },
                "& .MuiSelect-select": {
                  color: "var(--rn-text-primary)",
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
                  bgcolor: "var(--rn-bg)",
                  color: "var(--rn-text-primary)",
                  "& fieldset": {
                    borderColor: "var(--rn-border)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--rn-border-strong)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "var(--rn-text-secondary)",
                },
                "& .MuiSelect-select": {
                  color: "var(--rn-text-primary)",
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
              onClick={() => setShowFilters(false)}
              sx={{
                py: 1,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: "primary.main",
                "&:hover": {
                  bgcolor: "primary.dark",
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
