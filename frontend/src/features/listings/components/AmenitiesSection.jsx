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
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { BACKEND_URL } from "@/shared/config/environment.js";

const getImageUrl = (img) => {
  if (!img || typeof img !== "string") return "";
  const trimmed = img.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `${BACKEND_URL}/${trimmed.replace(/^\/+/, "")}`;
};

const AmenityCard = ({ amenity }) => {
  const [imgError, setImgError] = useState(false);
  const hasThumbnail = Boolean(amenity?.thumnailUrl) && !imgError;

  return (
    <Stack
      direction="row"
      spacing={1.75}
      alignItems="center"
      sx={{
        py: 1.5,
        px: 2,
        height: "100%",
        borderRadius: "14px",
        bgcolor: "var(--rn-surface-2)",
        border: "1px solid var(--rn-border-subtle)",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "var(--rn-brand-primary)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "10px",
          bgcolor: "var(--rn-surface-card)",
          border: "1px solid var(--rn-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {hasThumbnail ? (
          <Box
            component="img"
            src={getImageUrl(amenity.thumnailUrl)}
            alt={amenity.name}
            onError={() => setImgError(true)}
            sx={{
              width: 24,
              height: 24,
              objectFit: "contain",
            }}
          />
        ) : (
          <CheckCircleOutlineRoundedIcon
            sx={{ fontSize: 22, color: "var(--rn-brand-primary)" }}
          />
        )}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            color: "var(--rn-text-primary)",
            fontWeight: 700,
            fontSize: "0.925rem",
          }}
        >
          {amenity?.name}
        </Typography>
        {amenity?.description && (
          <Typography
            variant="caption"
            sx={{
              color: "var(--rn-text-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {amenity.description}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

AmenityCard.propTypes = {
  amenity: PropTypes.shape({
    id: PropTypes.number,
    thumnailUrl: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
};

const AmenitiesList = ({ items }) => (
  <Grid container spacing={1.75}>
    {items.map((amenity, index) => (
      <Grid item xs={12} sm={6} key={amenity.id || index}>
        <AmenityCard amenity={amenity} />
      </Grid>
    ))}
  </Grid>
);

AmenitiesList.propTypes = {
  items: PropTypes.array.isRequired,
};

const AmenitiesSection = ({ amenities = [] }) => {
  const [open, setOpen] = useState(false);
  const safeAmenities = Array.isArray(amenities) ? amenities : [];
  const displayedAmenities = safeAmenities.slice(0, 8);

  return (
    <Box sx={{ my: 3.5 }}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ mb: 2.25 }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: "1.25rem",
            color: "var(--rn-text-primary)",
            fontFamily: "var(--rn-font-display)",
          }}
        >
          Tiện nghi chỗ ở cung cấp
        </Typography>
        {safeAmenities.length > 0 && (
          <Chip
            size="small"
            label={`${safeAmenities.length} tiện nghi`}
            sx={{
              fontWeight: 700,
              bgcolor: "var(--rn-brand-soft)",
              color: "var(--rn-brand-primary)",
            }}
          />
        )}
      </Stack>

      {safeAmenities.length === 0 ? (
        <Typography variant="body2" sx={{ color: "var(--rn-text-secondary)" }}>
          Danh sách tiện nghi đang được chủ nhà cập nhật.
        </Typography>
      ) : (
        <>
          <AmenitiesList items={displayedAmenities} />

          {safeAmenities.length > 8 && (
            <Box sx={{ mt: 2.5 }}>
              <Button
                onClick={() => setOpen(true)}
                variant="outlined"
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: "12px",
                  color: "var(--rn-text-primary)",
                  borderColor: "var(--rn-border-subtle)",
                  bgcolor: "var(--rn-surface-card)",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "var(--rn-brand-primary)",
                    bgcolor: "var(--rn-brand-soft)",
                  },
                }}
              >
                Hiển thị tất cả {safeAmenities.length} tiện nghi
              </Button>
            </Box>
          )}
        </>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "var(--rn-surface-card)",
            color: "var(--rn-text-primary)",
            borderRadius: "20px",
            border: "1px solid var(--rn-border-subtle)",
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
            fontWeight: 800,
            fontFamily: "var(--rn-font-display)",
          }}
        >
          Tất cả tiện nghi chỗ ở ({safeAmenities.length})
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: "var(--rn-text-secondary)" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <AmenitiesList items={safeAmenities} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

AmenitiesSection.propTypes = {
  amenities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      thumnailUrl: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ),
};

export default AmenitiesSection;
