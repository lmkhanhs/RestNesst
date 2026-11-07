import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Translate as TranslateIcon,
  RecordVoiceOver as VoiceIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import axiosInstance from "@/shared/api/httpClient.js";

export default function AdminLanguages() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorAlert, setErrorAlert] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  const fetchLanguages = useCallback(async () => {
    try {
      setLoading(true);
      setErrorAlert("");
      const res = await axiosInstance.get("/api/languages/detail");
      setLanguages(res.data?.result || []);
    } catch {
      setErrorAlert("Không thể tải danh sách ngôn ngữ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLanguages = languages
    .filter((lang) => {
      const matchesSearch =
        !normalizedSearch ||
        (lang.name || "").toLowerCase().includes(normalizedSearch) ||
        (lang.code || "").toLowerCase().includes(normalizedSearch) ||
        (lang.description || "").toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && Boolean(lang.isActive)) ||
        (filterStatus === "inactive" && !lang.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "code":
          return (a.code || "").localeCompare(b.code || "", "vi");
        case "hosts":
          return (b.totalHosts || 0) - (a.totalHosts || 0);
        case "name":
        default:
          return (a.name || "").localeCompare(b.name || "", "vi");
      }
    });

  const activeCount = languages.filter((item) => item.isActive).length;

  const handleOpenDialog = (language = null) => {
    setDialogError("");
    if (language) {
      setSelectedLanguage(language);
      setFormData({
        name: language.name || "",
        code: language.code || "",
        description: language.description || "",
        isActive: language.isActive !== undefined ? language.isActive : true,
      });
    } else {
      setSelectedLanguage(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (submitting) return;
    setOpenDialog(false);
    setSelectedLanguage(null);
    setDialogError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim().toLowerCase();

    if (!trimmedName) {
      setDialogError("Vui lòng nhập tên ngôn ngữ.");
      return;
    }

    try {
      setSubmitting(true);
      setDialogError("");
      if (selectedLanguage) {
        await axiosInstance.put("/api/languages", {
          id: selectedLanguage.id,
          name: trimmedName,
          code: trimmedCode,
          description: formData.description.trim(),
          isActive: Boolean(formData.isActive),
        });
        setSuccessMessage("Đã cập nhật ngôn ngữ.");
      } else {
        await axiosInstance.post("/api/languages", {
          name: trimmedName,
          code: trimmedCode,
          description: formData.description.trim(),
          isActive: Boolean(formData.isActive),
        });
        setSuccessMessage("Đã thêm ngôn ngữ mới.");
      }
      await fetchLanguages();
      setOpenDialog(false);
      setSelectedLanguage(null);
    } catch (error) {
      setDialogError(
        error.response?.data?.message ||
          (selectedLanguage
            ? "Cập nhật ngôn ngữ thất bại."
            : "Thêm ngôn ngữ thất bại.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(`/api/languages/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessMessage("Đã xóa ngôn ngữ.");
      await fetchLanguages();
    } catch (error) {
      setErrorAlert(
        error.response?.data?.message || "Xóa ngôn ngữ thất bại!"
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        mb={3.5}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
            }}
          >
            <TranslateIcon color="primary" /> Quản lý Ngôn ngữ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Hiện có {languages.length} ngôn ngữ ({activeCount} đang hoạt động
            trong danh sách chọn của Host)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2, alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          Thêm Ngôn ngữ
        </Button>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <TextField
          label="Tìm kiếm ngôn ngữ hoặc mã ISO..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          inputProps={{
            autoCorrect: "off",
            autoCapitalize: "off",
            spellCheck: false,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: { xs: "100%", md: 180 } }}>
          <InputLabel id="language-status-filter-label">Trạng thái</InputLabel>
          <Select
            labelId="language-status-filter-label"
            value={filterStatus}
            label="Trạng thái"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="active">Đang hoạt động</MenuItem>
            <MenuItem value="inactive">Không hoạt động</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: { xs: "100%", md: 200 } }}>
          <InputLabel id="language-sort-select-label">Sắp xếp theo</InputLabel>
          <Select
            labelId="language-sort-select-label"
            value={sortBy}
            label="Sắp xếp theo"
            onChange={(e) => setSortBy(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <FilterIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="name">Tên (A–Z)</MenuItem>
            <MenuItem value="code">Mã ngôn ngữ</MenuItem>
            <MenuItem value="hosts">Số lượng Host</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredLanguages.length === 0 ? (
        <Card variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Không tìm thấy ngôn ngữ phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Thử đổi từ khóa tìm kiếm hoặc thêm một ngôn ngữ giao tiếp mới cho hệ thống.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Thêm Ngôn ngữ mới
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filteredLanguages.map((language) => (
            <Grid item xs={12} sm={6} lg={4} key={language.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  borderColor: "divider",
                  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    boxShadow: 4,
                    borderColor: "primary.light",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1.5}
                    mb={1.5}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          minWidth: 44,
                          height: 44,
                          px: 1,
                          borderRadius: 2,
                          bgcolor: "rgba(255, 56, 92, 0.1)",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {(language.code || language.name?.slice(0, 2) || "LG").toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                          {language.name}
                        </Typography>
                        {language.code && (
                          <Typography variant="caption" color="text.secondary">
                            Mã ISO: {language.code.toUpperCase()}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    <Chip
                      label={language.isActive ? "Hoạt động" : "Tạm ẩn"}
                      color={language.isActive ? "success" : "default"}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 42 }}
                  >
                    {language.description || "Chưa có mô tả cho ngôn ngữ này."}
                  </Typography>

                  <Chip
                    icon={<VoiceIcon sx={{ fontSize: "16px !important" }} />}
                    label={`${language.totalHosts || 0} Host sử dụng`}
                    variant="outlined"
                    size="small"
                  />
                </CardContent>
                <CardActions
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    justifyContent: "flex-end",
                  }}
                >
                  <Tooltip title="Chỉnh sửa ngôn ngữ">
                    <IconButton
                      aria-label={`Chỉnh sửa ${language.name}`}
                      onClick={() => handleOpenDialog(language)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa ngôn ngữ">
                    <IconButton
                      aria-label={`Xóa ${language.name}`}
                      onClick={() => setDeleteTarget(language)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box component="form" onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {selectedLanguage ? "Chỉnh sửa Ngôn ngữ" : "Thêm Ngôn ngữ mới"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {dialogError && <Alert severity="error">{dialogError}</Alert>}
              <TextField
                fullWidth
                required
                name="name"
                label="Tên ngôn ngữ"
                placeholder="VD: Tiếng Việt, Tiếng Anh, Tiếng Ý..."
                value={formData.name}
                onChange={(e) => {
                  if (dialogError) setDialogError("");
                  setFormData({ ...formData, name: e.target.value });
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TranslateIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <TextField
                  name="code"
                  label="Mã ngôn ngữ (ISO)"
                  placeholder="VD: vi, en, ko, it"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  inputProps={{
                    maxLength: 10,
                    autoCorrect: "off",
                    autoCapitalize: "off",
                    spellCheck: false,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CodeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(formData.isActive)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.checked,
                        })
                      }
                      color="primary"
                    />
                  }
                  label={formData.isActive ? "Hoạt động" : "Tạm ẩn"}
                  sx={{
                    ".MuiFormControlLabel-label": {
                      fontWeight: 600,
                      color: formData.isActive
                        ? "success.main"
                        : "text.secondary",
                    },
                  }}
                />
              </Stack>
              <TextField
                fullWidth
                name="description"
                label="Mô tả"
                placeholder="Mô tả ngắn về nhóm du khách hoặc phạm vi giao tiếp..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                minRows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              type="button"
              onClick={handleCloseDialog}
              variant="outlined"
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={selectedLanguage ? <EditIcon /> : <AddIcon />}
            >
              {submitting
                ? "Đang lưu..."
                : selectedLanguage
                ? "Lưu thay đổi"
                : "Thêm ngôn ngữ"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa ngôn ngữ</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Bạn có chắc chắn muốn xóa ngôn ngữ{" "}
            <Box component="strong" sx={{ color: "text.primary" }}>
              {deleteTarget?.name}
            </Box>{" "}
            khỏi danh sách chọn hiện tại không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Đang xóa..." : "Xóa ngôn ngữ"}
          </Button>
        </DialogActions>
      </Dialog>

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 1400,
          }}
        >
          {successMessage}
        </Alert>
      )}

      {errorAlert && (
        <Alert
          severity="error"
          onClose={() => setErrorAlert("")}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 24,
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 1400,
          }}
        >
          {errorAlert}
        </Alert>
      )}
    </Box>
  );
}
