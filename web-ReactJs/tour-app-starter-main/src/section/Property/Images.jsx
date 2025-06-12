import {
  Box,
  Button,
  Grid,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import Image from "../../components/Image";
import { ImageSquare, X } from "@phosphor-icons/react";
import PropTypes from "prop-types";
import { useState } from "react";

const getImageUrl = (img) => {
  if (!img) return "/default-image.png";
  if (img.startsWith("http")) return img;
  return `http://175.41.233.105:8080/${img}`;
};

const Images = ({ images }) => {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedImage(null);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Grid container spacing={1}>
        {images && images.length > 0 ? (
          <>
            <Grid item xs={12} md={6}>
              <Image
                src={getImageUrl(images[0])}
                alt="Main property image"
                sx={{ height: 450, width: "100%", objectFit: "cover" }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={1}>
                {images.slice(1, 5).map((image, index) => (
                  <Grid item xs={6} key={index}>
                    <Image
                      src={getImageUrl(image)}
                      alt={`Property image ${index + 2}`}
                      sx={{ height: 220, width: "100%", objectFit: "cover" }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </>
        ) : (
          <Typography>No images available</Typography>
        )}
      </Grid>

      <Box sx={{ position: "absolute", bottom: 16, right: 16 }}>
        <Button
          startIcon={<ImageSquare weight="bold" />}
          variant="contained"
          onClick={handleOpen}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.9)",
            color: "text.primary",
            "&:hover": {
              bgcolor: "white",
            },
          }}
        >
          Show all photos
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ position: "relative", p: 3 }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              bgcolor: "rgba(255,255,255,0.8)",
              "&:hover": { bgcolor: "white" },
              zIndex: 1,
            }}
          >
            <X size={24} />
          </IconButton>

          {selectedImage ? (
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Image
                src={getImageUrl(selectedImage)}
                alt="Selected property image"
                sx={{
                  maxHeight: "70vh",
                  width: "100%",
                  objectFit: "contain",
                }}
              />
              <Button onClick={() => setSelectedImage(null)} sx={{ mt: 2 }}>
                Back to gallery
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {images.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 0.9,
                      },
                    }}
                    onClick={() => handleImageClick(image)}
                  >
                    <Image
                      src={getImageUrl(image)}
                      alt={`Property image ${index + 1}`}
                      sx={{ width: "100%", height: 200, objectFit: "cover" }}
                    />
                    <Typography
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        color: "white",
                        bgcolor: "rgba(0,0,0,0.5)",
                        padding: "4px 8px",
                        borderRadius: 1,
                      }}
                    >
                      Photo {index + 1}
                    </Typography>
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
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Images;
