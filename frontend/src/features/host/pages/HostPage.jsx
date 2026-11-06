import { BACKEND_URL } from "@/shared/config/environment.js";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  Grid,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Alert,
  InputAdornment,
  Select,
  CircularProgress,
  CardContent,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Home as HomeIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import axiosInstance from "@/shared/api/httpClient.js";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export default function HostPage() {
  const [tabValue, setTabValue] = useState(0);
  const [properties, setProperties] = useState([]);
  const [messages, setMessages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState({});
  const [openPropertyDialog, setOpenPropertyDialog] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newProperty, setNewProperty] = useState({
    title: "",
    description: "",
    address: "",
    country: "",
    avgStart: 0,
    popular: false,
    startDate: "",
    endDate: "",
    price: "",
    images: [],
    amenites: [],
    categories: [],
    status: "",
  });

  const [hostInfo, setHostInfo] = useState(null);
  const [loadingHost, setLoadingHost] = useState(true);
  const [showMore, setShowMore] = useState(false);

  const [hostEdit, setHostEdit] = useState({
    name: "",
    location: "",
    languages: [],
    yearsHosting: 0,
    description: "",
  });

  const [hostAvatarPreview, setHostAvatarPreview] = useState(null);

  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [message, setMessage] = useState("");
  const stompClient = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const [amenities, setAmenities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [editingPropertyData, setEditingPropertyData] = useState(null);

  const [hostEditLoading, setHostEditLoading] = useState(false);
  const [hostEditSuccess, setHostEditSuccess] = useState(false);
  const [hostEditError, setHostEditError] = useState("");
  const [hostEditAvatarFile, setHostEditAvatarFile] = useState(null);

  const fetchHostInfo = async () => {
    try {
      setLoadingHost(true);
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.id)
        throw new Error("Không tìm thấy thông tin người dùng");
      const res = await axiosInstance.get(`/api/users/host/${user.id}`);
      if (res.data && res.data.result) {
        setHostInfo({
          name: res.data.result.fullname || "Prateek",
          avatar:
            res.data.result.thumnailUrl ||
            "https://ui-avatars.com/api/?name=Prateek&background=random",
          reviews: 473,
          rating: 4.26,
          yearsHosting: res.data.result.didHostYear || 8,
          languages: Array.isArray(res.data.result.languages)
            ? res.data.result.languages
            : res.data.result.languages
            ? [res.data.result.languages]
            : ["English", "French", "Hindi"],
          country: res.data.result.country || "Jaipur, India",
          description: res.data.result.description || "Hi All! ...",
        });
      }
    } catch (err) {
      setHostInfo(null);
    } finally {
      setLoadingHost(false);
    }
  };

  useEffect(() => {
    fetchHostInfo();
  }, []);

  useEffect(() => {
    axiosInstance.get("/api/countries").then((res) => {
      setCountryOptions(res.data.result.map((c) => c.name));
    });
  }, []);

  useEffect(() => {
    axiosInstance.get("/api/chat/persons").then((res) => {
      setPersons(res.data.result || []);
    });
  }, []);

  useEffect(() => {
    if (selectedPerson) {
      axiosInstance.get(`/api/chat/simple/${selectedPerson.id}`).then((res) => {
        setMessages(res.data.result || []);
      });
    }
  }, [selectedPerson]);

  useEffect(() => {
    const socket = new SockJS((BACKEND_URL + "/ws"));
    stompClient.current = Stomp.over(socket);

    stompClient.current.connect(
      { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      () => {
        stompClient.current.subscribe(
          `/user/${user.username}/queue/messages`,
          () => {
            if (selectedPerson) {
              axiosInstance
                .get(`/api/chat/simple/${selectedPerson.id}`)
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
  }, [user.username, selectedPerson]);

  useEffect(() => {
    axiosInstance.get("/api/amenities").then((res) => {
      setAmenities(res.data.result || []);
    });
  }, []);

  useEffect(() => {
    axiosInstance.get("/api/categories").then((res) => {
      setCategories(res.data.result || []);
    });
  }, []);

  useEffect(() => {
    if (isEditMode && editingPropertyData && categories.length > 0) {
      setSelectedCategories(
        categories.filter((cat) =>
          (editingPropertyData.categories || []).some(
            (selected) => selected.id === cat.id
          )
        )
      );
    }
    console.log("Editing data:", editingPropertyData);
    console.log("Categories:", categories);
  }, [isEditMode, editingPropertyData, categories]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddProperty = () => {
    setOpenPropertyDialog(true);
    setIsEditMode(false);
    setNewProperty({
      title: "",
      description: "",
      address: "",
      country: "",
      avgStart: 0,
      popular: false,
      startDate: "",
      endDate: "",
      price: "",
      images: [],
      amenites: [],
      categories: [],
      status: "ACTIVE",
    });
  };

  const handleEditProperty = (property) => {
    setIsEditMode(true);
    setEditingPropertyId(property.id);
    setOpenPropertyDialog(true);
    console.log("Editing property data:", property);
    setNewProperty({
      ...property,
      title: property.title || property.name || "",
      description: property.description || "",
      address: property.address || "",
      city: property.city || "",
      country: property.country || "",
      area: property.area || "",
      startDate: property.startDate || "",
      endDate: property.endDate || "",
      price: property.price || "",
      status: property.status || "ACTIVE",
      avgStart: property.avgStart || 0,
      popular: property.popular || false,
      images: property.images || [],
      amenites: property.amenites || [],
      categories: property.categories || [],
    });
    setEditingPropertyData(property);
  };

  const handleClosePropertyDialog = () => {
    setOpenPropertyDialog(false);
    setNewProperty({
      title: "",
      description: "",
      address: "",
      country: "",
      avgStart: 0,
      popular: false,
      startDate: "",
      endDate: "",
      price: "",
      images: [],
      amenites: [],
      categories: [],
      status: "",
    });
    setSelectedCategories([]);
    setIsEditMode(false);
    setEditingPropertyId(null);
    setEditingPropertyData(null);
  };

  const handleSaveProperty = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      if (isEditMode) {
        formData.append("id", editingPropertyId || "");
      }
      formData.append("title", newProperty.title || "");
      formData.append("description", newProperty.description || "");
      formData.append("address", newProperty.address || "");
      formData.append("city", newProperty.city || "");
      formData.append("country", newProperty.country || "");
      formData.append("area", newProperty.area || "");
      formData.append("startDate", newProperty.startDate || "");
      formData.append("endDate", newProperty.endDate || "");
      formData.append("price", newProperty.price || "");
      formData.append("status", newProperty.status || "ACTIVE");
      formData.append("avgStart", newProperty.avgStart || 0);
      formData.append("popular", newProperty.popular ? "true" : "false");
      formData.append(
        "amenites",
        newProperty.amenites && newProperty.amenites.length > 0
          ? newProperty.amenites.map((a) => a.name).join(",")
          : ""
      );
      formData.append(
        "categories",
        newProperty.categories && newProperty.categories.length > 0
          ? newProperty.categories.map((c) => c.name).join(",")
          : selectedCategories && selectedCategories.length > 0
          ? selectedCategories.map((c) => c.name).join(",")
          : ""
      );
      // Nếu có ảnh mới thì gửi lên
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("imgs", file);
        });
      }
      // Gửi request
      let res;
      if (isEditMode) {
        res = await axiosInstance.put("/api/listings/host", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        res = await axiosInstance.post("/api/listings", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      if (res.data && (res.data.code === 200 || res.status === 200)) {
        setShowSuccessAlert(true);
        handleClosePropertyDialog();
        setProperties((prev) => {
          if (isEditMode) {
            return prev.map((p) =>
              p.id === editingPropertyId ? { ...p, ...res.data.result } : p
            );
          } else {
            return [...prev, res.data.result];
          }
        });
      } else {
        alert(
          res.data.message ||
            (isEditMode
              ? "Cập nhật tài sản thất bại!"
              : "Đăng tài sản thất bại!")
        );
      }
      // Log lại dữ liệu gửi lên
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }
    } catch (err) {
      console.log(err.response?.data);
      alert(
        "Có lỗi xảy ra khi " + (isEditMode ? "cập nhật" : "đăng") + " tài sản!"
      );
    } finally {
      setIsLoading(false);
      setIsEditMode(false);
      setEditingPropertyId(null);
    }
  };

  const handleMenuOpen = (event, property) => {
    setAnchorEl(event.currentTarget);
    setSelectedProperty(property);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProperty(null);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSort = (value) => {
    setSortBy(value);
    handleMenuClose();
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  const handleShare = (property) => {
    // Implement share functionality
    console.log("Sharing property:", property);
    handleMenuClose();
  };

  const handleBookmark = (property) => {
    // Implement bookmark functionality
    console.log("Bookmarking property:", property);
    handleMenuClose();
  };

  const handleViewStats = (property) => {
    // Implement view stats functionality
    console.log("Viewing stats for property:", property);
    handleMenuClose();
  };

  const handleOpenChat = (message) => {
    setSelectedChat(message.id);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || property.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.avgStart - a.avgStart;
      default:
        return b.id - a.id;
    }
  });

  // Handle image file selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    // Nếu đang ở chế độ chỉnh sửa, chỉ hiển thị ảnh mới
    if (isEditMode) {
      setNewProperty({
        ...newProperty,
        images: files.map((file) => URL.createObjectURL(file)),
      });
    } else {
      // Nếu đang thêm mới, thêm vào danh sách ảnh hiện tại
      setNewProperty({
        ...newProperty,
        images: [
          ...newProperty.images,
          ...files.map((file) => URL.createObjectURL(file)),
        ],
      });
    }
  };

  // Ensure handleSendMessage is defined
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    const newChatMessage = {
      id: Date.now(),
      sender: "Host",
      message: newMessage,
      timestamp: new Date().toISOString(),
      isHost: true,
    };
    setChatMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newChatMessage],
    }));
    setNewMessage("");
  };

  const getImageUrl = (img) => {
    if (!img) return "/default-image.png"; // fallback nếu không có ảnh
    if (img.startsWith("http")) return img;
    return `${BACKEND_URL}/${img}`; // thay bằng domain backend thật của bạn
  };

  const getAmenityImageUrl = (url) => {
    if (!url) return "/default-image.png";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url}`;
  };

  const MAX_DESC = 180;
  const desc = hostInfo?.description || "";
  const isLong = desc.length > MAX_DESC;
  const displayDesc =
    showMore || !isLong ? desc : desc.slice(0, MAX_DESC) + "...";

  const handleSend = () => {
    if (!message.trim() || !selectedPerson) return;
    const newMsg = {
      id: Date.now(),
      senderUsername: user.username,
      receiverUsername: selectedPerson.username,
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    stompClient.current.send(
      "/app/chat",
      {},
      JSON.stringify({
        senderID: user.id,
        receiverID: selectedPerson.id,
        content: message,
      })
    );
    setMessage("");
  };

  const fetchPropertiesFromAPI = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/api/listings/host");
      if (res.data && res.data.result) {
        setProperties(
          res.data.result.map((item) => ({
            id: item.id,
            title: item.name,
            address: item.address,
            city: item.city,
            country: item.country,
            images: item.images || [],
            amenites: item.amenites || [],
            categories: item.categories || [],
            description: item.description || "",
            startDate: item.startDate,
            endDate: item.endDate,
            price: item.price,
            status: item.status,
            avgStart: item.avgStart,
            area: item.area || "",
            // ... các trường khác nếu cần
          }))
        );
      }
    } catch (err) {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertiesFromAPI();
  }, []);

  const handleCategoryChipClick = (cat) => {
    const exists = selectedCategories.find((c) => c.id === cat.id);
    let newSelected;
    if (exists) {
      newSelected = selectedCategories.filter((c) => c.id !== cat.id);
    } else {
      newSelected = [...selectedCategories, cat];
    }
    setSelectedCategories(newSelected);
    setNewProperty({ ...newProperty, categories: newSelected });
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}
    >
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{ p: 3, mb: 3, bgcolor: "background.default" }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>
                Bảng điều khiển chủ nhà
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Quản lý tài sản và đặt phòng của bạn
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Tooltip title="Thông báo">
                  <IconButton>
                    <Badge badgeContent={3} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddProperty}
                >
                  Thêm tài sản mới
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Search and Filter Section */}
        <Paper
          elevation={0}
          sx={{ p: 2, mb: 3, bgcolor: "background.default" }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm tài sản..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  startIcon={<FilterIcon />}
                  onClick={(e) => handleMenuOpen(e, { type: "filter" })}
                >
                  Lọc
                </Button>
                <Button
                  startIcon={<SortIcon />}
                  onClick={(e) => handleMenuOpen(e, { type: "sort" })}
                >
                  Sắp xếp
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    ${properties.reduce((sum, p) => sum + p.price, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng doanh thu
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <VisibilityIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{properties.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tài sản đang hoạt động
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <StarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {(
                      properties.reduce((sum, p) => sum + p.avgStart, 0) /
                      properties.length
                    ).toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đánh giá trung bình
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "info.main" }}>
                  <MessageIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{messages.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tin nhắn mới
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<AdminPanelSettingsIcon />}
              label="Thông tin Host"
              iconPosition="start"
            />
            <Tab icon={<HomeIcon />} label="Tài sản" iconPosition="start" />
            <Tab icon={<MessageIcon />} label="Tin nhắn" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Thông tin Host */}
        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              maxWidth: 700,
              mx: "auto",
              fontFamily: '"Be Vietnam Pro", sans-serif',
            }}
          >
            {/* Hiển thị thông tin host */}
            {loadingHost ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : !hostInfo ? (
              <Typography align="center" color="text.secondary">
                Chưa có thông tin host
              </Typography>
            ) : (
              <Card
                elevation={0}
                sx={{
                  my: 3,
                  borderRadius: 4,
                  p: 2,
                  bgcolor: "var(--rn-surface)",
                  color: "var(--rn-text-primary)",
                  border: "1px solid var(--rn-border)",
                  boxShadow: "var(--rn-shadow-sm)",
                }}
              >
                <CardContent>
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Grid
                      item
                      xs={12}
                      md={4}
                      sx={{ display: "flex", justifyContent: "center" }}
                    >
                      <Avatar
                        src={hostInfo.avatar}
                        alt={hostInfo.name}
                        sx={{
                          width: 90,
                          height: 90,
                          fontSize: 36,
                          bgcolor: "primary.main",
                          color: "#FFFFFF",
                          fontWeight: 700,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: { xs: "center", md: "flex-start" },
                        }}
                      >
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{ color: "var(--rn-text-primary)" }}
                        >
                          {hostInfo.name}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: "var(--rn-text-secondary)", mb: 1 }}
                        >
                          Host
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item>
                            <Typography
                              variant="body2"
                              sx={{ color: "var(--rn-text-primary)", fontWeight: 700 }}
                            >
                              {hostInfo.reviews}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "var(--rn-text-secondary)" }}
                            >
                              Reviews
                            </Typography>
                          </Grid>
                          <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ mx: 1, borderColor: "var(--rn-border)" }}
                          />
                          <Grid
                            item
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ color: "var(--rn-text-primary)", fontWeight: 700 }}
                            >
                              {hostInfo.rating}
                            </Typography>
                            <StarIcon
                              sx={{
                                color: "#F59E0B",
                                fontSize: 18,
                                ml: 0.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "var(--rn-text-secondary)", ml: 0.5 }}
                            >
                              Rating
                            </Typography>
                          </Grid>
                          <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ mx: 1, borderColor: "var(--rn-border)" }}
                          />
                          <Grid item>
                            <Typography
                              variant="body2"
                              sx={{ color: "var(--rn-text-primary)", fontWeight: 700 }}
                            >
                              {hostInfo.yearsHosting} Years
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "var(--rn-text-secondary)" }}
                            >
                              Hosting
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2, borderColor: "var(--rn-border)" }} />
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <LanguageIcon sx={{ color: "var(--rn-text-secondary)" }} />
                    <Typography variant="body2" sx={{ color: "var(--rn-text-primary)" }}>
                      Speaks {hostInfo.languages.join(", ")}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <LocationOnIcon sx={{ color: "var(--rn-text-secondary)" }} />
                    <Typography variant="body2" sx={{ color: "var(--rn-text-primary)" }}>
                      Lives in {hostInfo.country}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: "var(--rn-text-primary)", mb: 1 }}>
                    {displayDesc}
                    {isLong && (
                      <Button
                        size="small"
                        sx={{
                          color: "primary.main",
                          textTransform: "none",
                          ml: 1,
                          fontWeight: 600,
                        }}
                        endIcon={
                          showMore ? <ExpandLessIcon /> : <ExpandMoreIcon />
                        }
                        onClick={() => setShowMore((v) => !v)}
                      >
                        {showMore ? "Show Less" : "Show More"}
                      </Button>
                    )}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Chỉnh sửa thông tin Host */}
            <Card
              sx={{ p: 3, mt: 3, fontFamily: '"Be Vietnam Pro", sans-serif' }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Chỉnh sửa thông tin Host
              </Typography>
              {hostEditError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {hostEditError}
                </Alert>
              )}
              {hostEditSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Cập nhật thành công!
                </Alert>
              )}
              <Box
                component="form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setHostEditLoading(true);
                  setHostEditError("");
                  setHostEditSuccess(false);
                  try {
                    const formData = new FormData();
                    formData.append("country", hostEdit.location);
                    formData.append(
                      "languages",
                      Array.isArray(hostEdit.languages)
                        ? hostEdit.languages.join(",")
                        : ""
                    );
                    formData.append("didHostYear", hostEdit.yearsHosting);
                    formData.append("description", hostEdit.description);
                    await axiosInstance.put(
                      "/api/users/host/profile",
                      formData,
                      {
                        headers: { "Content-Type": "multipart/form-data" },
                      }
                    );
                    setHostEditSuccess(true);
                    setTimeout(() => setHostEditSuccess(false), 2000);
                    fetchHostInfo();
                  } catch (err) {
                    setHostEditError(
                      err.response?.data?.message || "Cập nhật thất bại!"
                    );
                  } finally {
                    setHostEditLoading(false);
                  }
                }}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Autocomplete
                  options={countryOptions}
                  value={hostEdit.location || ""}
                  onChange={(_, newValue) =>
                    setHostEdit({ ...hostEdit, location: newValue || "" })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Quốc gia"
                      placeholder="Chọn quốc gia..."
                      size="small"
                      fullWidth
                      sx={{ borderRadius: 2, bgcolor: "background.paper" }}
                      InputProps={{
                        ...params.InputProps,
                        sx: { borderRadius: 2 },
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, val) => option === val}
                  autoHighlight
                  clearOnEscape
                />
                <TextField
                  label="Ngôn ngữ (phân cách bởi dấu phẩy)"
                  value={
                    Array.isArray(hostEdit.languages)
                      ? hostEdit.languages.join(", ")
                      : ""
                  }
                  onChange={(e) =>
                    setHostEdit({
                      ...hostEdit,
                      languages: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Số năm làm Host"
                  type="number"
                  value={hostEdit.yearsHosting}
                  onChange={(e) =>
                    setHostEdit({
                      ...hostEdit,
                      yearsHosting: Number(e.target.value),
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Mô tả bản thân"
                  value={hostEdit.description}
                  onChange={(e) =>
                    setHostEdit({ ...hostEdit, description: e.target.value })
                  }
                  fullWidth
                  multiline
                  minRows={3}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 2, alignSelf: "flex-end" }}
                  disabled={hostEditLoading}
                >
                  {hostEditLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </Box>
            </Card>
          </Box>
        </TabPanel>

        {/* Tab Tài sản */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {sortedProperties.map((property) => (
              <Grid item xs={12} md={6} key={property.id}>
                <Card
                  sx={{
                    p: 0,
                    borderRadius: 6,
                    // boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                    bgcolor: "rgba(24,25,26,0.7)",
                    color: "#fff",
                    overflow: "hidden",
                    mb: 3,
                    position: "relative",
                    // border: "1.5px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    minHeight: 420,
                    transition: "box-shadow 0.3s, transform 0.2s",
                    "&:hover": {
                      boxShadow: 16,
                      transform: "translateY(-4px) scale(1.01)",
                    },
                  }}
                >
                  {/* Ảnh đại diện với overlay */}
                  <Box
                    sx={{
                      position: "relative",
                      height: 200,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={getImageUrl(property.images[0])}
                      alt={property.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        filter: "brightness(0.85)",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(180deg,rgba(0,0,0,0.2) 60%,rgba(24,25,26,0.8) 100%)",
                      }}
                    />
                    {property.status && (
                      <Chip
                        label={
                          property.status?.toLowerCase() === "active"
                            ? "Đang hoạt động"
                            : "Không hoạt động"
                        }
                        sx={{
                          position: "absolute",
                          top: 16,
                          left: 16,
                          bgcolor:
                            property.status?.toLowerCase() === "active"
                              ? "#43ea7f"
                              : "#bdbdbd",
                          color: "#18191a",
                          fontWeight: 700,
                          fontSize: 13,
                          borderRadius: 99,
                          px: 2,
                          py: 0.5,
                          boxShadow: 2,
                          letterSpacing: 0.5,
                        }}
                      />
                    )}
                  </Box>
                  {/* Nội dung */}
                  <Box
                    sx={{
                      p: 3,
                      pt: 2,
                      fontFamily: '"Be Vietnam Pro", sans-serif',
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{
                        mb: 0.5,
                        color: "#fff",
                        textAlign: "center",
                        letterSpacing: 0.2,
                        textShadow: "0 2px 8px rgba(0,0,0,0.18)",
                      }}
                    >
                      {property.title}
                    </Typography>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <LocationOnIcon sx={{ fontSize: 18, color: "#ff385c" }} />
                      <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
                        {property.address}, {property.city}, {property.country}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <StarIcon sx={{ color: "#ffd700", fontSize: 22 }} />
                        <Typography
                          variant="body1"
                          sx={{
                            color: "#ffd700",
                            fontWeight: 700,
                            fontFamily: '"Be Vietnam Pro", sans-serif',
                          }}
                        >
                          {property.avgStart}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        sx={{
                          color: "#ff385c",
                          ml: 2,
                          background: "rgba(255,255,255,0.08)",
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          boxShadow: 1,
                          fontFamily: '"Be Vietnam Pro", sans-serif',
                        }}
                      >
                        {property.price?.toLocaleString("vi-VN")}₫/đêm
                      </Typography>
                    </Stack>
                    {/* Amenities dạng icon tròn nhỏ */}
                    <Stack
                      direction="row"
                      spacing={1.5}
                      justifyContent="center"
                      sx={{ flexWrap: "wrap", mb: 2 }}
                    >
                      {property.amenites.slice(0, 5).map((amenity, idx) => (
                        <Tooltip title={amenity.name} key={idx}>
                          <Avatar
                            src={getAmenityImageUrl(amenity.thumnailUrl)}
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "#232323",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: 16,
                              border: "2px solid #232323",
                              boxShadow: 1,
                              fontFamily: '"Be Vietnam Pro", sans-serif',
                            }}
                          >
                            {amenity.thumnailUrl ? "" : amenity.name?.[0]}
                          </Avatar>
                        </Tooltip>
                      ))}
                      {property.amenites.length > 5 && (
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "#232323",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 16,
                            fontFamily: '"Be Vietnam Pro", sans-serif',
                          }}
                        >
                          +{property.amenites.length - 5}
                        </Avatar>
                      )}
                    </Stack>
                    <Divider
                      sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.12)" }}
                    />
                    {/* Nút Edit icon tròn nổi bật */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <IconButton
                        sx={{
                          bgcolor: "#ff385c",
                          color: "#fff",
                          borderRadius: "50%",
                          boxShadow: 2,
                          fontFamily: '"Be Vietnam Pro", sans-serif',
                          "&:hover": { bgcolor: "#d32f2f" },
                        }}
                        onClick={() => handleEditProperty(property)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tab Tin nhắn */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2.5}>
            {/* Danh sách chat */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  height: "calc(100dvh - 210px)",
                  minHeight: 540,
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
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: "var(--rn-text-primary)" }}
                    >
                      Hộp thư khách hàng
                    </Typography>
                    <Chip
                      size="small"
                      label={persons.length}
                      sx={{
                        height: 22,
                        fontWeight: 700,
                        bgcolor: "var(--rn-primary-soft)",
                        color: "primary.main",
                      }}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Tìm kiếm tin nhắn..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon
                            fontSize="small"
                            sx={{ color: "var(--rn-text-secondary)" }}
                          />
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
                      "& .MuiInputBase-input::placeholder": {
                        color: "var(--rn-text-secondary)",
                        opacity: 0.85,
                      },
                    }}
                  />
                </Box>
                <List sx={{ flexGrow: 1, overflow: "auto", py: 1 }}>
                  {persons.length === 0 ? (
                    <Box
                      sx={{
                        height: "100%",
                        minHeight: 280,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        px: 3,
                        textAlign: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          bgcolor: "var(--rn-primary-soft)",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1.5,
                        }}
                      >
                        <MessageIcon fontSize="small" />
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: "var(--rn-text-primary)",
                          mb: 0.5,
                        }}
                      >
                        Chưa có cuộc trò chuyện nào
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--rn-text-secondary)" }}
                      >
                        Tin nhắn từ khách hàng quan tâm chỗ nghỉ sẽ hiển thị tại đây.
                      </Typography>
                    </Box>
                  ) : (
                    persons.map((person) => {
                      const isSelected = selectedPerson?.id === person.id;
                      return (
                        <ListItem
                          key={person.id}
                          button
                          selected={isSelected}
                          onClick={() => setSelectedPerson(person)}
                          sx={{
                            px: 2,
                            py: 1.25,
                            borderLeft: isSelected
                              ? "3px solid"
                              : "3px solid transparent",
                            borderColor: isSelected
                              ? "primary.main"
                              : "transparent",
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
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: isSelected
                                  ? "primary.main"
                                  : "var(--rn-surface-subtle)",
                                color: isSelected
                                  ? "#FFFFFF"
                                  : "var(--rn-text-primary)",
                                fontWeight: 700,
                                border: "1px solid var(--rn-border)",
                              }}
                            >
                              {person.fullname?.[0]?.toUpperCase() || "K"}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
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
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "var(--rn-text-secondary)",
                                  display: "block",
                                }}
                                noWrap
                              >
                                {person.email}
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })
                  )}
                </List>
              </Paper>
            </Grid>
            {/* Cửa sổ chat */}
            <Grid item xs={12} md={8}>
              <Paper
                elevation={0}
                sx={{
                  height: "calc(100dvh - 210px)",
                  minHeight: 540,
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
                {/* Header chat */}
                {selectedPerson ? (
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.75,
                      borderBottom: "1px solid var(--rn-border)",
                      bgcolor: "var(--rn-surface-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "primary.main",
                        color: "#FFFFFF",
                        fontWeight: 700,
                      }}
                    >
                      {selectedPerson.fullname?.[0]?.toUpperCase() || "K"}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "var(--rn-text-primary)",
                          fontWeight: 700,
                          lineHeight: 1.25,
                        }}
                        noWrap
                      >
                        {selectedPerson.fullname}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--rn-text-secondary)" }}
                        noWrap
                      >
                        {selectedPerson.email}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.75,
                      borderBottom: "1px solid var(--rn-border)",
                      bgcolor: "var(--rn-surface-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "var(--rn-text-secondary)",
                        fontWeight: 600,
                      }}
                    >
                      Chưa chọn người nhận
                    </Typography>
                  </Box>
                )}
                {/* Tin nhắn */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    p: 2.5,
                    bgcolor: "var(--rn-bg)",
                  }}
                >
                  {!selectedPerson ? (
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
                          mb: 2,
                        }}
                      >
                        <MessageIcon />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "var(--rn-text-primary)",
                          mb: 0.75,
                        }}
                      >
                        Chọn một cuộc trò chuyện để bắt đầu
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--rn-text-secondary)",
                          maxWidth: 380,
                        }}
                      >
                        Chọn khách hàng từ danh sách bên trái để xem lịch sử trao đổi và phản hồi tin nhắn trực tiếp.
                      </Typography>
                    </Box>
                  ) : messages.length === 0 ? (
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
                        Hãy gửi lời chào đầu tiên tới {selectedPerson.fullname}!
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1.75}>
                      {messages.map((msg) => {
                        const isOwn = msg.senderUsername === user.username;
                        return (
                          <Box
                            key={msg.id}
                            sx={{
                              display: "flex",
                              justifyContent: isOwn ? "flex-end" : "flex-start",
                            }}
                          >
                            <Box
                              sx={{
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
                                px: 2,
                                py: 1.25,
                                borderRadius: isOwn
                                  ? "18px 18px 4px 18px"
                                  : "18px 18px 18px 4px",
                                boxShadow: "var(--rn-shadow-sm)",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  lineHeight: 1.55,
                                  wordBreak: "break-word",
                                }}
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
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
                {/* Input */}
                <Box
                  sx={{
                    p: 2,
                    borderTop: "1px solid var(--rn-border)",
                    bgcolor: "var(--rn-surface)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Tooltip title="Đính kèm tệp">
                    <span>
                      <IconButton
                        aria-label="Đính kèm tệp"
                        disabled={!selectedPerson}
                        sx={{ color: "var(--rn-text-secondary)" }}
                      >
                        <AttachFileIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Biểu tượng cảm xúc">
                    <span>
                      <IconButton
                        aria-label="Biểu tượng cảm xúc"
                        disabled={!selectedPerson}
                        sx={{ color: "var(--rn-text-secondary)" }}
                      >
                        <EmojiIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={
                      selectedPerson
                        ? "Nhập tin nhắn..."
                        : "Chọn một cuộc trò chuyện để nhắn tin..."
                    }
                    disabled={!selectedPerson}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
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
                      "& .MuiInputBase-input::placeholder": {
                        color: "var(--rn-text-secondary)",
                        opacity: 0.85,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon fontSize="small" />}
                    onClick={handleSend}
                    disabled={!message.trim() || !selectedPerson}
                    sx={{
                      ml: 0.5,
                      px: 2.5,
                      py: 0.9,
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: "none",
                      bgcolor: "primary.main",
                      "&:hover": { bgcolor: "primary.dark" },
                    }}
                  >
                    Gửi
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Property Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleSort("price-asc")}>
          Sắp xếp theo giá (Thấp đến cao)
        </MenuItem>
        <MenuItem onClick={() => handleSort("price-desc")}>
          Sắp xếp theo giá (Cao đến thấp)
        </MenuItem>
        <MenuItem onClick={() => handleSort("rating")}>
          Sắp xếp theo đánh giá
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleFilter("all")}>Tất cả tài sản</MenuItem>
        <MenuItem onClick={() => handleFilter("active")}>
          Tài sản đang hoạt động
        </MenuItem>
        <MenuItem onClick={() => handleFilter("inactive")}>
          Tài sản không hoạt động
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleViewStats(selectedProperty)}>
          Xem thống kê
        </MenuItem>
        <MenuItem onClick={() => handleShare(selectedProperty)}>
          Chia sẻ tài sản
        </MenuItem>
        <MenuItem onClick={() => handleBookmark(selectedProperty)}>
          Lưu tài sản
        </MenuItem>
      </Menu>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert
          severity="success"
          onClose={() => setShowSuccessAlert(false)}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000 }}
        >
          Đã lưu tài sản thành công!
        </Alert>
      )}

      {/* Add Property Dialog */}
      <Dialog
        open={openPropertyDialog}
        onClose={handleClosePropertyDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? "Chỉnh sửa tài sản" : "Thêm tài sản mới"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Tiêu đề"
                fullWidth
                value={newProperty.title}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, title: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mô tả"
                fullWidth
                multiline
                rows={4}
                value={newProperty.description}
                onChange={(e) =>
                  setNewProperty({
                    ...newProperty,
                    description: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Địa chỉ"
                fullWidth
                value={newProperty.address}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, address: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Thành phố"
                fullWidth
                value={newProperty.city}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, city: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Select
                fullWidth
                value={newProperty.country}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, country: e.target.value })
                }
                displayEmpty
                renderValue={(selected) => selected || "Chọn quốc gia"}
              >
                <MenuItem value="" disabled>
                  Chọn quốc gia
                </MenuItem>
                {countryOptions.map((country, idx) => (
                  <MenuItem key={idx} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Ngày bắt đầu"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newProperty.startDate}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, startDate: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Ngày kết thúc"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newProperty.endDate}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, endDate: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Giá mỗi đêm"
                type="number"
                fullWidth
                value={newProperty.price}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, price: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Diện tích"
                type="number"
                fullWidth
                value={newProperty.area}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, area: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Danh mục
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    clickable
                    color={
                      selectedCategories.some((c) => c.id === cat.id)
                        ? "primary"
                        : "default"
                    }
                    onClick={() => handleCategoryChipClick(cat)}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tiện nghi
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {amenities.map((amenity, index) => (
                  <Chip
                    key={index}
                    label={amenity.name}
                    onClick={() => {
                      const newAmenities = [...newProperty.amenites];
                      const existingIndex = newAmenities.findIndex(
                        (a) => a.name === amenity.name
                      );
                      if (existingIndex === -1) {
                        newAmenities.push(amenity);
                      } else {
                        newAmenities.splice(existingIndex, 1);
                      }
                      setNewProperty({
                        ...newProperty,
                        amenites: newAmenities,
                      });
                    }}
                    color={
                      newProperty.amenites.some((a) => a.name === amenity.name)
                        ? "primary"
                        : "default"
                    }
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tải lên hình ảnh
              </Typography>
              <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                Chọn hình ảnh
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                {imageFiles.length > 0
                  ? imageFiles.map((file, idx) => (
                      <Box
                        key={idx}
                        sx={{ width: 100, height: 100, position: "relative" }}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`preview-${idx}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      </Box>
                    ))
                  : newProperty.images.map((img, idx) => (
                      <Box
                        key={idx}
                        sx={{ width: 100, height: 100, position: "relative" }}
                      >
                        <img
                          src={img}
                          alt={`preview-${idx}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      </Box>
                    ))}
              </Box>
            </Grid>
            {isEditMode && (
              <Grid item xs={12} md={6}>
                <Select
                  fullWidth
                  value={newProperty.status}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, status: e.target.value })
                  }
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) return "Chọn trạng thái";
                    if (selected === "ACTIVE") return "Đang hoạt động";
                    if (selected === "INACTIVE") return "Không hoạt động";
                    return selected;
                  }}
                  error={!newProperty.status}
                >
                  <MenuItem value="" disabled>
                    Chọn trạng thái
                  </MenuItem>
                  <MenuItem value="ACTIVE">Đang hoạt động</MenuItem>
                  <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
                </Select>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePropertyDialog} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSaveProperty}
            variant="contained"
            disabled={isLoading || !newProperty.status}
            startIcon={
              isLoading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {isLoading ? "Đang tải lên..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
