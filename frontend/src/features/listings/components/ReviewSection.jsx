import React from "react";
import { Box, Grid } from "@mui/material";
import GuestFavorite from "./GuestFavorite.jsx";
import RatingDisplay from "./RatingDisplay.jsx";
import PropertyDescription from "./PropertyDescription.jsx";
import PropTypes from "prop-types";

const ReviewSection = ({ property }) => {
  return (
    <Box
      sx={{
        mt: 6,
        padding: 4,
        borderRadius: 3,
        color: "white",
        maxWidth: "800px",
        margin: "0 auto",
        border: "1px solid rgb(255, 255, 255)",
      }}
    >
      <Grid container spacing={4} alignItems="center">
        {/* Left Column - Guest Favourite */}
        <Grid item xs={12} md={4}>
          <GuestFavorite isPopular={property.popular} />
        </Grid>

        {/* Middle Column - Rating Details & AI Summarize */}
        <Grid item xs={12} md={4}>
          <RatingDisplay
            listingId={property.id}
            rating={property.avgStart}
            reviewCount={Array.isArray(property.reviews) ? property.reviews.length : 0}
            reviews={Array.isArray(property.reviews) ? property.reviews : []}
          />
        </Grid>

        {/* Right Column - Description */}
        <Grid item xs={12} md={4}>
          <PropertyDescription />
        </Grid>
      </Grid>
    </Box>
  );
};

ReviewSection.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.number,
    avgStart: PropTypes.number.isRequired,
    reviews: PropTypes.array.isRequired,
    popular: PropTypes.bool,
  }).isRequired,
};

export default ReviewSection;
