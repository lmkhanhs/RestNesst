import React, { useState, useEffect } from "react";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { Export, Heart } from "@phosphor-icons/react"; // Correct way to import
import Images from "./../Property/Images"; // Import Images component
import Details from "./detail"; // Import Details component
import axiosInstance from "../../api/axiosConfig";

const Hero = ({ property }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get("/api/users/favorites");
        if (res.data?.result?.favorites) {
          setIsFavorite(
            res.data.result.favorites.some((fav) => fav.id === property.id)
          );
        }
      } catch (err) {}
    };
    fetchFavorites();
  }, [property.id]);

  const handleSave = async () => {
    if (isFavorite) {
      setIsFavorite(false);
      try {
        await axiosInstance.delete("/api/users/favorites", {
          data: { listingId: property.id },
        });
      } catch (err) {
        setIsFavorite(true);
      }
    } else {
      setIsFavorite(true);
      try {
        await axiosInstance.post("/api/users/favorites", {
          listingId: property.id,
        });
      } catch (err) {
        setIsFavorite(false);
      }
    }
  };

  return (
    <Stack>
      <Box>
        <Grid container>
          <Grid item md={8} xs={12}>
            <Typography variant="h4">{property.title}</Typography>
            <Typography variant="body2" sx={{ marginBottom: 2 }}>
              {property.avgStart} stars - {property.price} VND / Night
            </Typography>
          </Grid>
          <Grid item container justifyContent="flex-end" md={4} xs={12}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                startIcon={<Export />}
                sx={{ textDecoration: "underline" }}
                color="primary"
              >
                Share
              </Button>
              <Button
                sx={{ textDecoration: "underline" }}
                color={isFavorite ? "error" : "primary"}
                startIcon={
                  <Heart
                    weight={isFavorite ? "fill" : "regular"}
                    color={isFavorite ? "red" : undefined}
                    size={24}
                  />
                }
                onClick={handleSave}
              >
                Save
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {/* Pass property data to Images and Details components */}
        <Images images={property.images} /> {/* Truyền hình ảnh vào Images */}
        <Details property={property} />
      </Box>
    </Stack>
  );
};

export default Hero;
