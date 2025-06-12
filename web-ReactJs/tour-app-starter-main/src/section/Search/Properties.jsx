import { Card, Grid, Box, Typography, IconButton } from "@mui/material";
import Slider from "react-slick";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom"; // Chỉ giữ useNavigate
import axiosInstance from "../../api/axiosConfig";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const getImageUrl = (img) => {
  if (!img) return "/default-image.png";
  if (img.startsWith("http")) return img;
  return `http://175.41.233.105:8080/${img}`;
};

const Properties = ({ properties }) => {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy danh sách favorites của user khi load component
    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get("/api/users/favorites");
        if (res.data?.result?.favorites) {
          setFavoriteIds(res.data.result.favorites.map((fav) => fav.id || fav));
        }
      } catch (err) {
        // Có thể log lỗi nếu cần
      }
    };
    fetchFavorites();
  }, []);

  const handleFavorite = async (listingId) => {
    if (favoriteIds.includes(listingId)) {
      // Đã favorite, thì xóa
      setFavoriteIds((prev) => prev.filter((id) => id !== listingId));
      try {
        await axiosInstance.delete("/api/users/favorites", {
          data: { listingId },
        });
      } catch (err) {
        // Nếu lỗi, có thể rollback lại
        setFavoriteIds((prev) => [...prev, listingId]);
      }
    } else {
      // Chưa favorite, thì thêm
      setFavoriteIds((prev) => [...prev, listingId]);
      try {
        await axiosInstance.post("/api/users/favorites", { listingId });
      } catch (err) {
        // Nếu lỗi, có thể rollback lại
        setFavoriteIds((prev) => prev.filter((id) => id !== listingId));
      }
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2}>
        {properties && properties.length > 0 ? (
          properties.map((property) => (
            <Grid item xs={12} sm={6} md={4} key={property.id}>
              <Card
                sx={{
                  position: "relative",
                  boxShadow: 3,
                  borderRadius: 2,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <Slider {...settings}>
                  {property.images.map((image, index) => (
                    <div key={index}>
                      <img
                        src={getImageUrl(image)}
                        alt={`Image ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "250px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  ))}
                </Slider>
                {property.popular && (
                  <Typography
                    variant="body2"
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      backgroundColor: "#f0f0f0",
                      color: "#000000",
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: "35px",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    Được khách yêu thích
                  </Typography>
                )}
                <IconButton
                  sx={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    borderRadius: "50%",
                    padding: 1,
                    color: favoriteIds.includes(property.id)
                      ? "red"
                      : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(property.id);
                  }}
                >
                  <FavoriteIcon sx={{ fontSize: 30 }} />
                </IconButton>
                <Box sx={{ padding: 2 }}>
                  <Box sx={{ height: 10 }} /> {/* Added spacing */}
                  <Typography
                    variant="h6"
                    sx={{ fontSize: "1.1rem", fontWeight: 600 }}
                    gutterBottom
                  >
                    {property.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ marginBottom: 1 }}
                  >
                    {property.address}, {property.city}, {property.country}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 1,
                    }}
                  >
                    <StarIcon sx={{ color: "gold", fontSize: 18 }} />
                    <Typography
                      variant="body2"
                      color="textPrimary"
                      sx={{ marginLeft: 0.5 }}
                    >
                      {property.avgStart} sao
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="textPrimary"
                    sx={{ fontWeight: "bold" }}
                  >
                    {property.price} VND / đêm
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textPrimary"
                    sx={{ marginTop: 1 }}
                  >
                    <strong>Khả dụng từ:</strong> {property.startDate} đến{" "}
                    {property.endDate}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography>Không có bất động sản</Typography>
        )}
      </Grid>
    </Box>
  );
};

Properties.propTypes = {
  properties: PropTypes.array.isRequired,
};

export default Properties;
