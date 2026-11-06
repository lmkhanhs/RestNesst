import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { Hero } from "@/features/listings/index.js";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/shared/api/httpClient.js";

const Property = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/listings/${id}`, {
          headers: {
            Authorization: undefined,
          },
        });

        if (response.data?.code === 200) {
          setProperty(response.data.result);
        } else {
          setProperty(null);
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="xl" className="rn-page-shell" sx={{ py: 4 }}>
        <Stack spacing={2.5}>
          <Skeleton variant="rounded" width={200} height={28} />
          <Skeleton variant="rounded" width="60%" height={44} />
          <Skeleton
            variant="rounded"
            width="100%"
            height={448}
            sx={{ borderRadius: "18px" }}
          />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton
                variant="rounded"
                width="100%"
                height={340}
                sx={{ borderRadius: "18px" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton
                variant="rounded"
                width="100%"
                height={340}
                sx={{ borderRadius: "18px" }}
              />
            </Grid>
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (!property) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: "20px",
            bgcolor: "var(--rn-surface-card)",
            border: "1px solid var(--rn-border-subtle)",
            boxShadow: "var(--rn-shadow-sm)",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontFamily: "var(--rn-font-display)",
              color: "var(--rn-text-primary)",
              mb: 1,
            }}
          >
            Không tìm thấy thông tin chỗ nghỉ
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "var(--rn-text-secondary)", mb: 3 }}
          >
            Chỗ nghỉ này có thể đã ngừng hoạt động hoặc đường dẫn không chính xác.
          </Typography>
          <Button
            variant="contained"
            startIcon={<HomeRoundedIcon />}
            onClick={() => navigate("/")}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1.1,
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "var(--rn-brand-primary)",
              "&:hover": { bgcolor: "var(--rn-brand-primary-hover)" },
            }}
          >
            Quay về trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "var(--rn-bg-primary)", minHeight: "100vh", py: { xs: 2.5, md: 4 } }}>
      <Container maxWidth="xl" className="rn-page-shell">
        <Hero property={property} />
      </Container>
    </Box>
  );
};

export default Property;
