import { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const AboutThisPlace = ({ description }) => {
  const [open, setOpen] = useState(false);

  const safeDescription =
    description?.trim() ||
    "Chỗ nghỉ được thiết kế ấm cúng, đầy đủ tiện nghi sinh hoạt và thuận tiện di chuyển tới các địa điểm tham quan nổi bật.";
  const isLong = safeDescription.length > 260;

  return (
    <Box sx={{ my: 3.5 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 1.5,
          fontWeight: 800,
          fontFamily: "var(--rn-font-display)",
          color: "var(--rn-text-primary)",
          fontSize: "1.25rem",
        }}
      >
        Giới thiệu về chỗ ở này
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: "var(--rn-text-secondary)",
          lineHeight: 1.75,
          whiteSpace: "pre-line",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {safeDescription}
      </Typography>

      {isLong && (
        <Button
          onClick={() => setOpen(true)}
          endIcon={<ArrowForwardIosRoundedIcon sx={{ fontSize: 13 }} />}
          sx={{
            mt: 1.5,
            px: 0,
            color: "var(--rn-brand-primary)",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              bgcolor: "transparent",
              textDecoration: "underline",
            },
          }}
        >
          Xem thêm chi tiết
        </Button>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: "var(--rn-surface-card)",
            color: "var(--rn-text-primary)",
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
          Giới thiệu về chỗ ở này
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: "var(--rn-text-secondary)" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography
            variant="body1"
            sx={{
              color: "var(--rn-text-secondary)",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}
          >
            {safeDescription}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

AboutThisPlace.propTypes = {
  description: PropTypes.string,
};

export default AboutThisPlace;
