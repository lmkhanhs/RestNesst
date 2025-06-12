import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Grid,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import PropTypes from "prop-types";
import StarIcon from "@mui/icons-material/Star";
import LanguageIcon from "@mui/icons-material/Language";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";

const MAX_DESC = 180;

const HostInfo = ({ hostId }) => {
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const fetchHostInfo = async () => {
      try {
        setLoading(true);
        if (!hostId) throw new Error("Không có hostId");
        const res = await axiosInstance.get(`/api/users/host/${hostId}`);
        if (res.data && res.data.result) {
          setHost({
            name: res.data.result.fullname || "Prateek",
            avatar:
              res.data.result.thumnailUrl ||
              "https://ui-avatars.com/api/?name=Prateek&background=random",
            reviews: 473,
            rating: 4.26,
            yearsHosting: res.data.result.didHostYear || 8,
            languages: Array.isArray(res.data.result.languages)
              ? res.data.result.languages
              : res.data.result.languages
              ? [res.data.result.languages]
              : ["English", "French", "Hindi"],
            country: res.data.result.country || "Jaipur, India",
            description: res.data.result.description || "Hi All! ...",
          });
        }
      } catch (err) {
        setHost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchHostInfo();
  }, [hostId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hostId) {
    return (
      <Typography align="center" color="text.secondary">
        Không có hostId để lấy thông tin host
      </Typography>
    );
  }

  const desc = host.description || "";
  const isLong = desc.length > MAX_DESC;
  const displayDesc =
    showMore || !isLong ? desc : desc.slice(0, MAX_DESC) + "...";

  return (
    <Card
      sx={{
        my: 3,
        boxShadow: 3,
        borderRadius: 3,
        p: 2,
        color: "#fff",
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid
            item
            xs={12}
            md={4}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Avatar
              src={host.avatar}
              alt={host.name}
              sx={{ width: 90, height: 90, fontSize: 36, bgcolor: "#222" }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "center", md: "flex-start" },
              }}
            >
              <Typography variant="h5" fontWeight={700} sx={{ color: "#fff" }}>
                {host.name}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "#aaa", mb: 1 }}>
                Host
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Typography
                    variant="body2"
                    sx={{ color: "#fff", fontWeight: 600 }}
                  >
                    {host.reviews}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#aaa" }}>
                    Reviews
                  </Typography>
                </Grid>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ mx: 1, borderColor: "#333" }}
                />
                <Grid item sx={{ display: "flex", alignItems: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "#fff", fontWeight: 600 }}
                  >
                    {host.rating}
                  </Typography>
                  <StarIcon sx={{ color: "#FFD700", fontSize: 18, ml: 0.5 }} />
                  <Typography variant="caption" sx={{ color: "#aaa", ml: 0.5 }}>
                    Rating
                  </Typography>
                </Grid>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ mx: 1, borderColor: "#333" }}
                />
                <Grid item>
                  <Typography
                    variant="body2"
                    sx={{ color: "#fff", fontWeight: 600 }}
                  >
                    {host.yearsHosting} Years
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#aaa" }}>
                    Hosting
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2, borderColor: "#333" }} />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <LanguageIcon sx={{ color: "#aaa" }} />
          <Typography variant="body2" sx={{ color: "#fff" }}>
            Speaks {host.languages.join(", ")}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <LocationOnIcon sx={{ color: "#aaa" }} />
          <Typography variant="body2" sx={{ color: "#fff" }}>
            Lives in {host.country}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: "#fff", mb: 1 }}>
          {displayDesc}
          {isLong && (
            <Button
              size="small"
              sx={{
                color: "#ff385c",
                textTransform: "none",
                ml: 1,
                fontWeight: 600,
              }}
              endIcon={showMore ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowMore((v) => !v)}
            >
              {showMore ? "Show Less" : "Show More"}
            </Button>
          )}
        </Typography>
      </CardContent>
    </Card>
  );
};

HostInfo.propTypes = {
  hostId: PropTypes.string,
};

export default HostInfo;
