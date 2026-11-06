import { Box, Card, CardContent, Grid, Divider } from "@mui/material";
import PropTypes from "prop-types";
import PropertyHeader from "./PropertyHeader.jsx";
import ReviewSection from "./ReviewSection.jsx";
import BookingCard from "./BookingCard.jsx";
import AmenitiesSection from "./AmenitiesSection.jsx";
import AboutThisPlace from "./AboutThisPlace.jsx";
import HostInfo from "./HostInfo.jsx";
import HostMessage from "./HostMessage.jsx";

const Details = ({ property }) => {
  return (
    <Box>
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Left Column - Property Details */}
            <Grid item md={8} xs={12}>
              <PropertyHeader
                title={property.title}
                address={property.address}
                country={property.country}
              />

              <Box sx={{ mb: 4 }}>
                <ReviewSection property={property} />
              </Box>
              <Divider />
              <AboutThisPlace description={property.description} />
              <Divider />
              <HostInfo
                hostId={property.hostId ? String(property.hostId) : undefined}
              />
              <HostMessage
                hostId={property.hostId ? String(property.hostId) : undefined}
              />

              <Divider />
              <AmenitiesSection amenities={property.amenites} />
              <Divider />
            </Grid>

            {/* Right Column - Booking Card */}
            <Grid item md={4} xs={12}>
              <BookingCard
                id={property.id}
                price={property.price}
                startDate={property.startDate}
                endDate={property.endDate}
                images={property.images}
                title={property.title}
                avgStart={property.avgStart}
                reviews={property.reviews}
                popular={property.popular}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

Details.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    amenites: PropTypes.array.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    images: PropTypes.array.isRequired,
    avgStart: PropTypes.number.isRequired,
    reviews: PropTypes.number.isRequired,
    popular: PropTypes.bool,
    hostId: PropTypes.number,
  }).isRequired,
};

export default Details;
