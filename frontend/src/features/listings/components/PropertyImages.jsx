import { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import { getMediaUrl } from "@/shared/utils/mediaUrl.js";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";

const getImageUrl = (img) => {
  return getMediaUrl(img) || FALLBACK_IMAGE;
};

const Images = ({ images = [], title = "Chỗ nghỉ RestNesst" }) => {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const validImages =
    Array.isArray(images) && images.filter(Boolean).length > 0
      ? images.filter(Boolean)
      : [FALLBACK_IMAGE];

  // Đảm bảo lưới 5 ảnh luôn cân đối như thiết kế chuẩn (1 ảnh lớn bên trái + 4 ảnh nhỏ 2x2 bên phải)
  const mosaicSlots = Array.from({ length: 5 }, (_, idx) => ({
    src: validImages[idx % validImages.length],
    originalIndex: idx % validImages.length,
    slotIndex: idx,
  }));

  const handleOpenGallery = (index = null) => {
    setSelectedIndex(typeof index === "number" ? index : null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedIndex(null);
  };

  const handlePrevImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      (prev) => (prev - 1 + validImages.length) % validImages.length
    );
  };

  const handleNextImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <Box sx={{ position: "relative", mb: 3.5 }}>
      {/* Lưới 5 ảnh kiểu Airbnb: 1 ảnh lớn bên trái (2 cột x 2 hàng) + 4 ảnh nhỏ 2x2 bên phải */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "2fr 1fr 1fr",
          },
          gridTemplateRows: {
            xs: "260px",
            sm: "240px 180px",
            md: "repeat(2, 224px)",
          },
          gap: "8px",
          borderRadius: "18px",
          overflow: "hidden",
          position: "relative",
          bgcolor: "var(--rn-surface-2)",
          boxShadow: "var(--rn-shadow-sm)",
        }}
      >
        {/* Ảnh chính lớn bên trái */}
        <Box
          onClick={() => handleOpenGallery(mosaicSlots[0].originalIndex)}
          sx={{
            gridColumn: { xs: "1 / -1", sm: "1 / -1", md: "1 / 2" },
            gridRow: { xs: "1 / 2", sm: "1 / 2", md: "1 / 3" },
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            "&:hover img": {
              transform: "scale(1.03)",
              filter: "brightness(0.94)",
            },
          }}
        >
          <Box
            component="img"
            src={getImageUrl(mosaicSlots[0].src)}
            alt={`${title} - ảnh chính`}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.35s ease, filter 0.25s ease",
            }}
          />
        </Box>

        {/* 4 ảnh nhỏ 2x2 bên phải */}
        {mosaicSlots.slice(1, 5).map((slot, idx) => (
          <Box
            key={slot.slotIndex}
            onClick={() => handleOpenGallery(slot.originalIndex)}
            sx={{
              display: {
                xs: "none",
                sm: idx < 2 ? "block" : "none",
                md: "block",
              },
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              "&:hover img": {
                transform: "scale(1.04)",
                filter: "brightness(0.92)",
              },
            }}
          >
            <Box
              component="img"
              src={getImageUrl(slot.src)}
              alt={`${title} - ảnh ${idx + 2}`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.35s ease, filter 0.25s ease",
              }}
            />
          </Box>
        ))}

        {/* Nút nổi "Hiển thị tất cả ảnh" ở góc phải dưới giống ảnh mẫu */}
        <Box
          sx={{
            position: "absolute",
            bottom: { xs: 12, md: 18 },
            right: { xs: 12, md: 18 },
            zIndex: 2,
          }}
        >
          <Button
            startIcon={<AppsRoundedIcon sx={{ fontSize: 19 }} />}
            variant="contained"
            onClick={() => handleOpenGallery(null)}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.96)",
              color: "#0F172A",
              border: "1px solid rgba(15, 23, 42, 0.2)",
              borderRadius: "10px",
              px: 2,
              py: 0.9,
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.18)",
              backdropFilter: "blur(6px)",
              "&:hover": {
                bgcolor: "#FFFFFF",
                boxShadow: "0 6px 20px rgba(15, 23, 42, 0.24)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Hiển thị tất cả ảnh
          </Button>
        </Box>
      </Box>

      {/* Hộp thoại xem toàn bộ ảnh & trình chiếu chi tiết */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: "var(--rn-surface-card)",
            color: "var(--rn-text-primary)",
            border: "1px solid var(--rn-border-subtle)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--rn-border-subtle)",
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: "var(--rn-font-display)",
                color: "var(--rn-text-primary)",
              }}
            >
              Thư viện hình ảnh chỗ ở
            </Typography>
            <Chip
              size="small"
              label={
                selectedIndex !== null
                  ? `Ảnh ${selectedIndex + 1} / ${validImages.length}`
                  : `${validImages.length} ảnh`
              }
              sx={{
                fontWeight: 700,
                bgcolor: "var(--rn-brand-soft)",
                color: "var(--rn-brand-primary)",
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {selectedIndex !== null && (
              <Button
                size="small"
                startIcon={<GridViewRoundedIcon fontSize="small" />}
                onClick={() => setSelectedIndex(null)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  color: "var(--rn-text-primary)",
                }}
              >
                Xem dạng lưới
              </Button>
            )}
            <IconButton
              onClick={handleClose}
              aria-label="Đóng thư viện ảnh"
              sx={{
                color: "var(--rn-text-secondary)",
                "&:hover": {
                  bgcolor: "var(--rn-surface-2)",
                  color: "var(--rn-text-primary)",
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          {selectedIndex !== null ? (
            <Box
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: "52vh", md: "68vh" },
                  bgcolor: "var(--rn-surface-2)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  component="img"
                  src={getImageUrl(validImages[selectedIndex])}
                  alt={`${title} - ảnh ${selectedIndex + 1}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                  sx={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />

                {validImages.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevImage}
                      aria-label="Ảnh trước"
                      sx={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "rgba(255,255,255,0.92)",
                        color: "#0F172A",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
                        "&:hover": { bgcolor: "#FFFFFF" },
                      }}
                    >
                      <ArrowBackIosNewRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={handleNextImage}
                      aria-label="Ảnh tiếp theo"
                      sx={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "rgba(255,255,255,0.92)",
                        color: "#0F172A",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
                        "&:hover": { bgcolor: "#FFFFFF" },
                      }}
                    >
                      <ArrowForwardIosRoundedIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Box>

              {/* Thanh thumbnail chuyển nhanh */}
              {validImages.length > 1 && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    overflowX: "auto",
                    maxWidth: "100%",
                    py: 0.5,
                  }}
                >
                  {validImages.map((img, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      sx={{
                        width: 76,
                        height: 54,
                        borderRadius: "8px",
                        overflow: "hidden",
                        cursor: "pointer",
                        flexShrink: 0,
                        border:
                          idx === selectedIndex
                            ? "2px solid var(--rn-brand-primary)"
                            : "2px solid transparent",
                        opacity: idx === selectedIndex ? 1 : 0.65,
                        transition: "all 0.2s ease",
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={getImageUrl(img)}
                        alt={`Thumbnail ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {validImages.map((image, index) => (
                <Grid item xs={12} sm={6} md={index === 0 ? 8 : 4} key={index}>
                  <Box
                    onClick={() => setSelectedIndex(index)}
                    sx={{
                      position: "relative",
                      height: { xs: 220, md: index === 0 ? 320 : 240 },
                      borderRadius: "14px",
                      overflow: "hidden",
                      cursor: "pointer",
                      bgcolor: "var(--rn-surface-2)",
                      "&:hover img": {
                        transform: "scale(1.03)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={getImageUrl(image)}
                      alt={`${title} - ảnh ${index + 1}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        color: "#FFFFFF",
                        bgcolor: "rgba(15, 23, 42, 0.68)",
                        px: 1.25,
                        py: 0.4,
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      Ảnh {index + 1}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

Images.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string,
};

export default Images;
