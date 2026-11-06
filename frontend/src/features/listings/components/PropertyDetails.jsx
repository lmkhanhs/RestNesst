import { Box, Divider, Grid, Paper } from "@mui/material";
import PropTypes from "prop-types";
import PropertyHeader from "./PropertyHeader.jsx";
import ReviewSection from "./ReviewSection.jsx";
import BookingCard from "./BookingCard.jsx";
import AmenitiesSection from "./AmenitiesSection.jsx";
import AboutThisPlace from "./AboutThisPlace.jsx";
import HostInfo from "./HostInfo.jsx";
import HostMessage from "./HostMessage.jsx";

const Details = ({ property }) => {
  const reviewCount = Array.isArray(property?.reviews)
    ? property.reviews.length
    : Number(property?.reviews) || 0;

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
        {/* Cột trái - Toàn bộ thông tin chi tiết chỗ nghỉ */}
        <Grid item md={8} xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5, md: 4 },
              borderRadius: "22px",
              bgcolor: "var(--rn-surface-card)",
              border: "1px solid var(--rn-border-subtle)",
              boxShadow: "var(--rn-shadow-sm)",
            }}
          >
            <PropertyHeader
              title={property.title}
              address={property.address}
              city={property.city}
              country={property.country}
              area={property.area}
              categories={property.categories}
              startDate={property.startDate}
              endDate={property.endDate}
              hostName={property.hostName}
              hostThumnailUrl={property.hostThumnailUrl}
            />

            <Divider sx={{ borderColor: "var(--rn-border-subtle)" }} />

            <AboutThisPlace description={property.description} />

            <Divider sx={{ borderColor: "var(--rn-border-subtle)" }} />

            <AmenitiesSection amenities={property.amenites || []} />

            <Divider sx={{ borderColor: "var(--rn-border-subtle)" }} />

            <ReviewSection property={property} />

            <Divider sx={{ borderColor: "var(--rn-border-subtle)" }} />

            <HostInfo
              hostId={property.hostId ? String(property.hostId) : undefined}
              fallbackHostName={property.hostName}
              fallbackHostAvatar={property.hostThumnailUrl}
              fallbackRating={property.avgStart}
              fallbackReviewCount={reviewCount}
              fallbackCountry={
                [property.city, property.country].filter(Boolean).join(", ") ||
                property.country
              }
            />

            <HostMessage
              hostId={property.hostId ? String(property.hostId) : undefined}
            />
          </Paper>
        </Grid>

        {/* Cột phải - Thẻ đặt phòng cố định khi cuộn */}
        <Grid item md={4} xs={12}>
          <BookingCard
            id={property.id}
            price={Number(property.price || 0)}
            startDate={property.startDate}
            endDate={property.endDate}
            images={property.images || []}
            title={property.title}
            avgStart={property.avgStart}
            reviews={property.reviews}
            popular={property.popular}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

Details.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    address: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    area: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.number.isRequired,
    description: PropTypes.string,
    amenites: PropTypes.array,
    categories: PropTypes.array,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    images: PropTypes.array,
    avgStart: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    reviews: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
    popular: PropTypes.bool,
    hostId: PropTypes.number,
    hostName: PropTypes.string,
    hostThumnailUrl: PropTypes.string,
  }).isRequired,
};

export default Details;
