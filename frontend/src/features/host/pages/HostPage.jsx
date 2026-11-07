import HostProperties from "../components/HostProperties.jsx";
import HostAnalyticsManagement from "../components/HostAnalyticsManagement.jsx";
import { formatHostPrice, normalizeHostProperty } from "../utils/propertyDisplay.js";
import { BACKEND_URL } from "@/shared/config/environment.js";
import { getMediaUrl } from "@/shared/utils/mediaUrl.js";
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
  Divider,
  MenuItem,
  Stack,
  Alert,
  InputAdornment,
  Select,
  CircularProgress,
  CardContent,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Home as HomeIcon,
  BarChart as BarChartIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import axiosInstance from "@/shared/api/httpClient.js";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

function TabPanel({ children, value, index, flush = false }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: flush ? 0 : 3, minWidth: 0 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  flush: PropTypes.bool,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export default function HostPage() {
  const [tabValue, setTabValue] = useState(0);
  const [properties, setProperties] = useState([]);
  const [messages, setMessages] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState({});
  const [openPropertyDialog, setOpenPropertyDialog] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
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
        const parsedLanguages = Array.isArray(res.data.result.languages)
          ? res.data.result.languages
          : res.data.result.languages
          ? res.data.result.languages
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];
        setHostInfo({
          name: res.data.result.fullname || "Prateek",
          avatar:
            res.data.result.thumnailUrl ||
            "https://ui-avatars.com/api/?name=Prateek&background=random",
          reviews: 473,
          rating: 4.26,
          yearsHosting: res.data.result.didHostYear || 8,
          languages:
            parsedLanguages.length > 0 ? parsedLanguages : ["Tiếng Việt"],
          country: res.data.result.country || "Việt Nam",
          description: res.data.result.description || "Hi All! ...",
        });
        setHostEdit((prev) => ({
          ...prev,
          name: res.data.result.fullname || "",
          location: res.data.result.country || "",
          languages: parsedLanguages,
          yearsHosting: res.data.result.didHostYear || 0,
          description: res.data.result.description || "",
        }));
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
    axiosInstance
      .get("/api/languages")
      .then((res) => {
        setLanguageOptions((res.data?.result || []).map((l) => l.name));
      })
      .catch(() => setLanguageOptions([]));
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
      if (res.data?.result && [200, 201].includes(res.data.code ?? res.status)) {
        setShowSuccessAlert(true);
        handleClosePropertyDialog();
        setProperties((prev) => {
          if (isEditMode) {
            return prev.map((p) =>
              p.id === editingPropertyId ? normalizeHostProperty({ ...p, ...res.data.result,
                title: res.data.result?.title ?? res.data.result?.name ?? newProperty.title,
                reviews: res.data.result?.reviews ?? p.reviews }) : p
            );
          } else {
            return [...prev, normalizeHostProperty(res.data.result)];
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

  const handleOpenChat = (message) => {
    setSelectedChat(message.id);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
      setPropertiesLoading(true);
      setPropertiesError("");
      const res = await axiosInstance.get("/api/listings/host");
      if (!Array.isArray(res.data?.result)) throw new Error("Invalid host listings response");
      setProperties(res.data.result.map(normalizeHostProperty));
    } catch {
      setPropertiesError("Không thể tải danh sách chỗ ở. Vui lòng thử lại.");
    } finally {
      setPropertiesLoading(false);
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

  const prices = properties.map((room) => Number(room.price)).filter((price) => Number.isFinite(price) && price > 0);
  const ratings = properties.map((room) => Number(room.avgStart)).filter((rating) => Number.isFinite(rating) && rating > 0);
  const propertyStats = [
    { label: "Tổng chỗ ở", value: properties.length, icon: <HomeIcon /> },
    { label: "Đang hoạt động", value: properties.filter((room) => ["ACTIVE", "AVAILABLE"].includes(String(room.status).toUpperCase())).length, icon: <VisibilityIcon /> },
    { label: "Giá trung bình / đêm", value: prices.length ? formatHostPrice(prices.reduce((sum, price) => sum + price, 0) / prices.length) : "Chưa cập nhật", icon: <MoneyIcon /> },
    { label: "Điểm trung bình chỗ ở", value: ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) : "Chưa có đánh giá", icon: <StarIcon /> },
  ];

  return (
    <Container
      maxWidth="lg"
      sx={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}
    >
      <Box sx={{ mt: { xs: 3, md: 4 }, mb: 4 }}>
        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{ p: 0, mb: 3, bgcolor: "transparent" }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography component="h1" variant="h4" gutterBottom>
                Bảng điều khiển chủ nhà
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Theo dõi và cập nhật chỗ ở của bạn
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddProperty}
                  sx={{ minHeight: 48, borderRadius: 2 }}
                >
                  Thêm chỗ ở mới
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary uses listing data, not estimated booking revenue. */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 1.5, sm: 2 }, mb: 3 }}>
          {propertyStats.map((stat) => (
            <Paper key={stat.label} elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: 1, borderColor: "divider", borderRadius: 2.5, minWidth: 0 }}>
              <Stack direction="row" gap={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                <Box sx={{ display: "grid", placeItems: "center", color: "text.secondary", "& svg": { fontSize: 20 } }}>{stat.icon}</Box>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 750, overflowWrap: "anywhere" }}>{propertiesLoading || propertiesError ? "—" : stat.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Main Content */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Các mục chủ nhà">
            <Tab
              icon={<AdminPanelSettingsIcon />}
              label="Thông tin Host"
              iconPosition="start"
            />
            <Tab icon={<HomeIcon />} label="Tài sản" iconPosition="start" />
            <Tab
              icon={<BarChartIcon />}
              label="Thống kê & Quản lý"
              iconPosition="start"
            />
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
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={Array.from(
                    new Set([...languageOptions, ...(hostEdit.languages || [])])
                  )}
                  value={
                    Array.isArray(hostEdit.languages) ? hostEdit.languages : []
                  }
                  onChange={(_, newValue) =>
                    setHostEdit({
                      ...hostEdit,
                      languages: newValue,
                    })
                  }
                  noOptionsText="Chưa có ngôn ngữ khả dụng"
                  renderOption={(optionProps, option, { selected }) => (
                    <li {...optionProps} key={option}>
                      <Checkbox
                        icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ngôn ngữ có thể giao tiếp"
                      placeholder={
                        hostEdit.languages?.length
                          ? "Thêm ngôn ngữ..."
                          : "Chọn một hoặc nhiều ngôn ngữ..."
                      }
                      fullWidth
                    />
                  )}
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
        <TabPanel value={tabValue} index={1} flush>
          <HostProperties properties={properties} loading={propertiesLoading} error={propertiesError}
            onReload={fetchPropertiesFromAPI} onAdd={handleAddProperty} onEdit={handleEditProperty} />
        </TabPanel>

        {/* Tab Thống kê & Quản lý */}
        <TabPanel value={tabValue} index={2} flush>
          <HostAnalyticsManagement
            properties={properties}
            propertiesLoading={propertiesLoading}
            propertiesError={propertiesError}
            onReloadProperties={fetchPropertiesFromAPI}
            onAddProperty={handleAddProperty}
            onEditProperty={handleEditProperty}
          />
        </TabPanel>

        {/* Tab Tin nhắn */}
        <TabPanel value={tabValue} index={3}>
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

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert
          severity="success"
          onClose={() => setShowSuccessAlert(false)}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000 }}
        >
          Đã lưu chỗ ở thành công!
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
          {isEditMode ? "Chỉnh sửa chỗ ở" : "Thêm chỗ ở mới"}
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
                          src={getMediaUrl(img)}
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
