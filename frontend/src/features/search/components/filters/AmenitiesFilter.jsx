import { BACKEND_URL } from "@/shared/config/environment.js";
import { useEffect, useState, useMemo } from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PropTypes from "prop-types";
import axios from "axios";

const PREVIEW_LIMIT = 2;

const getAmenityIconUrl = (thumbnailUrl) => {
  if (!thumbnailUrl) return "";
  if (thumbnailUrl.startsWith("http") || thumbnailUrl.startsWith("data:")) {
    return thumbnailUrl;
  }
  return `${BACKEND_URL}${thumbnailUrl.startsWith("/") ? "" : "/"}${thumbnailUrl}`;
};

const Amenities = ({ value = [], onChange, showIcon = true }) => {
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selected, setSelected] = useState(value || []);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchAmenities = async () => {
      const res = await axios.get(BACKEND_URL + "/api/amenities");
      setAmenitiesList(Array.isArray(res.data?.result) ? res.data.result : []);
    };
    fetchAmenities().catch(() => setAmenitiesList([]));
  }, []);

  useEffect(() => {
    setSelected(value || []);
  }, [value]);

  const updateSelection = (newSelectedIds) => {
    setSelected(newSelectedIds);
    if (onChange) {
      onChange(newSelectedIds);
    }
  };

  const handleToggleAmenity = (id) => {
    const nextSelected = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    updateSelection(nextSelected);
  };

  const handleAutocompleteChange = (_, selectedObjects) => {
    const nextSelectedIds = selectedObjects.map((item) => item.id);
    updateSelection(nextSelectedIds);
  };

  const handleClearAll = () => {
    updateSelection([]);
  };

  const previewAmenities = useMemo(
    () => amenitiesList.slice(0, PREVIEW_LIMIT),
    [amenitiesList]
  );

  const hiddenCount = Math.max(0, amenitiesList.length - PREVIEW_LIMIT);

  const selectedAmenityObjects = useMemo(
    () => amenitiesList.filter((item) => selected.includes(item.id)),
    [amenitiesList, selected]
  );

  const renderAmenityItem = (amenity) => {
    const isChecked = selected.includes(amenity.id);
    const iconUrl = getAmenityIconUrl(amenity.thumnailUrl);

    return (
      <Box
        component="label"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          minHeight: 44,
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          cursor: "pointer",
          border: "1px solid",
          borderColor: isChecked ? "primary.main" : "var(--rn-border)",
          bgcolor: isChecked ? "var(--rn-primary-soft)" : "var(--rn-surface)",
          transition: "border-color 150ms ease, background-color 150ms ease",
          "&:hover": {
            borderColor: isChecked ? "primary.main" : "var(--rn-border-strong)",
            bgcolor: isChecked
              ? "var(--rn-primary-soft)"
              : "var(--rn-surface-subtle)",
          },
        }}
      >
        {showIcon && iconUrl && (
          <Avatar
            src={iconUrl}
            alt=""
            aria-hidden="true"
            sx={{
              width: 22,
              height: 22,
              bgcolor: "transparent",
              flexShrink: 0,
            }}
            variant="rounded"
          />
        )}
        <Typography
          flex={1}
          variant="body2"
          sx={{
            fontWeight: isChecked ? 700 : 500,
            color: "var(--rn-text-primary)",
            lineHeight: 1.35,
          }}
        >
          {amenity.name}
        </Typography>
        <Checkbox
          inputProps={{ "aria-label": amenity.name }}
          checked={isChecked}
          onChange={() => handleToggleAmenity(amenity.id)}
          color="primary"
          size="small"
          sx={{ p: 0.5 }}
        />
      </Box>
    );
  };

  return (
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "var(--rn-text-primary)" }}
          >
            Tiện nghi phòng
          </Typography>
          {selected.length > 0 && (
            <Chip
              size="small"
              label={selected.length}
              sx={{
                height: 20,
                fontWeight: 700,
                fontSize: "0.72rem",
                bgcolor: "var(--rn-primary-soft)",
                color: "primary.main",
              }}
            />
          )}
        </Stack>

        {amenitiesList.length > PREVIEW_LIMIT && (
          <Tooltip title="Mở đầy đủ danh sách tiện nghi">
            <IconButton
              type="button"
              size="small"
              aria-label="Mở đầy đủ danh sách tiện nghi"
              onClick={() => setOpenModal(true)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                border: "1px solid var(--rn-border)",
                bgcolor: "var(--rn-surface-subtle)",
                color: "var(--rn-text-primary)",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  bgcolor: "var(--rn-primary-soft)",
                },
              }}
            >
              <MoreHorizRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {!amenitiesList.length && (
        <Typography variant="body2" color="text.secondary">
          Chưa có tiện nghi để lọc.
        </Typography>
      )}

      {/* Hiển thị các tag tiện nghi đã chọn để dễ theo dõi và xóa nhanh */}
      {selectedAmenityObjects.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {selectedAmenityObjects.map((amenity) => {
            const iconUrl = getAmenityIconUrl(amenity.thumnailUrl);
            return (
              <Chip
                key={amenity.id}
                size="small"
                avatar={
                  iconUrl ? (
                    <Avatar
                      src={iconUrl}
                      alt=""
                      sx={{ bgcolor: "transparent !important" }}
                    />
                  ) : undefined
                }
                label={amenity.name}
                onDelete={() => handleToggleAmenity(amenity.id)}
                sx={{
                  fontWeight: 600,
                  bgcolor: "var(--rn-primary-soft)",
                  color: "primary.main",
                  border: "1px solid",
                  borderColor: "primary.main",
                  "& .MuiChip-deleteIcon": {
                    color: "primary.main",
                    "&:hover": {
                      color: "primary.dark",
                    },
                  },
                }}
              />
            );
          })}
        </Box>
      )}

      {/* Chỉ hiển thị 2 tiện nghi đầu tiên ngoài thanh lọc để tránh kéo dài giao diện */}
      <Grid container spacing={1}>
        {previewAmenities.map((amenity) => (
          <Grid item xs={12} key={amenity.id}>
            {renderAmenityItem(amenity)}
          </Grid>
        ))}

        {/* Nút 3 chấm mở đầy đủ biểu tượng & chọn giống bên Admin */}
        {hiddenCount > 0 && (
          <Grid item xs={12}>
            <Button
              type="button"
              fullWidth
              onClick={() => setOpenModal(true)}
              aria-label={`Mở thêm ${hiddenCount} tiện nghi khác`}
              sx={{
                minHeight: 44,
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                textTransform: "none",
                justifyContent: "space-between",
                border: "1px dashed var(--rn-border-strong)",
                bgcolor: "var(--rn-surface-subtle)",
                color: "var(--rn-text-primary)",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "var(--rn-primary-soft)",
                  color: "primary.main",
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1.25,
                    bgcolor: "var(--rn-surface)",
                    border: "1px solid var(--rn-border)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "primary.main",
                  }}
                >
                  <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "inherit" }}
                >
                  Tiện nghi khác...
                </Typography>
              </Stack>
              <Chip
                size="small"
                label={`+${hiddenCount}`}
                sx={{
                  height: 22,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  bgcolor: "var(--rn-surface)",
                  color: "var(--rn-text-secondary)",
                  border: "1px solid var(--rn-border)",
                }}
              />
            </Button>
          </Grid>
        )}
      </Grid>

      {/* Hộp thoại chọn đầy đủ tiện nghi (kết hợp Autocomplete giống tạo phòng Admin + lưới biểu tượng) */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="amenities-filter-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            bgcolor: "var(--rn-surface)",
            color: "var(--rn-text-primary)",
            border: "1px solid var(--rn-border)",
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle
          id="amenities-filter-dialog-title"
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--rn-border)",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, color: "var(--rn-text-primary)" }}
            >
              Chọn tiện nghi phòng
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block", color: "var(--rn-text-secondary)" }}
            >
              Tìm kiếm nhanh hoặc nhấn chọn trực tiếp vào biểu tượng tiện nghi
            </Typography>
          </Box>
          <IconButton
            aria-label="Đóng hộp thoại tiện nghi"
            onClick={() => setOpenModal(false)}
            sx={{ color: "var(--rn-text-secondary)" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Ô chọn & tìm kiếm dạng tag giống phần Thêm chỗ ở mới bên Admin */}
            <Autocomplete
              multiple
              options={amenitiesList}
              value={selectedAmenityObjects}
              onChange={handleAutocompleteChange}
              disableCloseOnSelect
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              noOptionsText="Không tìm thấy tiện nghi phù hợp"
              renderOption={(props, option, { selected: isOptionSelected }) => {
                const iconUrl = getAmenityIconUrl(option.thumnailUrl);
                return (
                  <li {...props} key={option.id}>
                    <Checkbox
                      size="small"
                      checked={isOptionSelected}
                      sx={{ mr: 1, p: 0.5 }}
                    />
                    {iconUrl && (
                      <Avatar
                        src={iconUrl}
                        alt=""
                        variant="rounded"
                        sx={{
                          width: 22,
                          height: 22,
                          mr: 1.25,
                          bgcolor: "transparent",
                        }}
                      />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.name}
                    </Typography>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tiện nghi đã chọn"
                  placeholder="Gõ để tìm và chọn tiện nghi..."
                  size="small"
                />
              )}
            />

            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 1.25,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--rn-text-secondary)",
                }}
              >
                Tất cả biểu tượng tiện nghi ({amenitiesList.length})
              </Typography>
              <Grid container spacing={1.25}>
                {amenitiesList.map((amenity) => (
                  <Grid item xs={12} sm={6} key={amenity.id}>
                    {renderAmenityItem(amenity)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid var(--rn-border)",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="button"
            color="inherit"
            startIcon={<RestartAltRoundedIcon fontSize="small" />}
            disabled={selected.length === 0}
            onClick={handleClearAll}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "var(--rn-text-secondary)",
            }}
          >
            Bỏ chọn tất cả
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={() => setOpenModal(false)}
            sx={{
              px: 3,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {selected.length > 0 ? `Xong (${selected.length})` : "Đóng"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

Amenities.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  showIcon: PropTypes.bool,
};

export default Amenities;
