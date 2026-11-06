import { Box, Typography, Link, Modal } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PropTypes from "prop-types";
import { useState } from "react";

const AboutThisPlace = ({ description }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
        Về nơi này
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          mb: 1,
        }}
      >
        {description}
      </Typography>
      <Link
        onClick={handleOpen}
        sx={{
          mt: 1,
          color: "error.main",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          cursor: "pointer",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        }}
      >
        Xem thêm
        <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
      </Link>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="about-place-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            About this place
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Modal>
    </Box>
  );
};

AboutThisPlace.propTypes = {
  description: PropTypes.string.isRequired,
};

export default AboutThisPlace;
