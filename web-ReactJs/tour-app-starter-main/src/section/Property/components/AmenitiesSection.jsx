import PropTypes from "prop-types";
import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Add your backend URL here - replace with your actual backend URL
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://175.41.233.105:8080";

const AmenitiesList = ({ items, inModal }) => (
  <Grid container spacing={2.5}>
    {items.map((amenity, index) => (
      <Grid item xs={12} sm={inModal ? 6 : 12} md={inModal ? 6 : 6} key={index}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            py: 1.75,
            px: 2,
            borderRadius: 2,
            transition: "all 0.2s ease-in-out",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
              transform: "translateX(4px)",
            },
          }}
        >
          <Box
            component="img"
            src={`${BASE_URL}${amenity.thumnailUrl}`}
            alt={amenity.name}
            sx={{
              width: 32,
              height: 32,
              objectFit: "contain",
              filter: "brightness(0.95)",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              fontWeight: 500,
              fontSize: "0.925rem",
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            }}
          >
            {amenity.name}
          </Typography>
        </Stack>
      </Grid>
    ))}
  </Grid>
);

const AmenitiesSection = ({ amenities: amenites }) => {
  const [open, setOpen] = useState(false);
  const displayedAmenities = open ? amenites : amenites.slice(0, 8);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "text.primary",
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
        }}
      >
        Những gì nơi này cung cấp
      </Typography>

      <AmenitiesList items={displayedAmenities} inModal={false} />

      {amenites.length > 8 && !open && (
        <Box sx={{ mt: 3 }}>
          <Button
            onClick={handleClickOpen}
            variant="outlined"
            size="large"
            sx={{
              px: 3,
              py: 1,
              color: "text.primary",
              borderColor: (theme) => alpha(theme.palette.text.primary, 0.24),
              backgroundColor: (theme) =>
                alpha(theme.palette.background.paper, 0.6),
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: "0.925rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: (theme) =>
                  alpha(theme.palette.background.paper, 0.9),
              },
            }}
          >
            Hiển thị tất cả {amenites.length} tiện nghi
          </Button>
        </Box>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.default",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 3,
            color: "text.primary",
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontWeight: 700,
          }}
        >
          Những gì nơi này cung cấp
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              color: (theme) => alpha(theme.palette.text.primary, 0.7),
              "&:hover": {
                color: "text.primary",
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.12),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 3,
            borderColor: (theme) => alpha(theme.palette.divider, 0.1),
          }}
        >
          <AmenitiesList items={amenites} inModal={true} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

AmenitiesList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      thumnailUrl: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  inModal: PropTypes.bool.isRequired,
};

AmenitiesSection.propTypes = {
  amenities: PropTypes.arrayOf(
    PropTypes.shape({
      thumnailUrl: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default AmenitiesSection;
