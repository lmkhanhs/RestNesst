import { Box, Typography } from "@mui/material";

const PropertyDescription = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        pl: { md: 2.5 },
        borderLeft: {
          md: "1px solid var(--rn-border-subtle)",
          xs: "none",
        },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "var(--rn-text-secondary)",
          lineHeight: 1.65,
          fontWeight: 500,
        }}
      >
        Một trong những chỗ nghỉ được khách hàng đánh giá cao nhờ vị trí thuận
        tiện, tiện nghi đúng mô tả và sự hỗ trợ tận tình từ chủ nhà.
      </Typography>
    </Box>
  );
};

export default PropertyDescription;
