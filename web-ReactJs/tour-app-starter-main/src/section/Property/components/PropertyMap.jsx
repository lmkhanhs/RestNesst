import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import MapGl, { NavigationControl, Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN"; // You'll need to replace this with your Mapbox token

const PropertyMap = ({ address, country }) => {
  const [viewport, setViewport] = useState({
    latitude: 21.0285,
    longitude: 105.8542,
    zoom: 12,
  });
  const [coordinates, setCoordinates] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const getCoordinates = async () => {
      try {
        const query = `${address}, ${country}`;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setCoordinates({ latitude: lat, longitude: lng });
          setViewport((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            zoom: 14,
          }));
        }
      } catch (error) {
        console.error("Error getting coordinates:", error);
      }
    };

    if (address && country) {
      getCoordinates();
    }
  }, [address, country]);

  return (
    <Box
      sx={{
        height: 400,
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <MapGl
        {...viewport}
        onMove={(evt) => setViewport(evt.viewport)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {coordinates && (
          <Marker
            latitude={coordinates.latitude}
            longitude={coordinates.longitude}
            onClick={() => setShowPopup(true)}
          />
        )}

        {coordinates && showPopup && (
          <Popup
            latitude={coordinates.latitude}
            longitude={coordinates.longitude}
            onClose={() => setShowPopup(false)}
            closeButton
            closeOnClick={false}
          >
            <div>{address}</div>
            <div>{country}</div>
          </Popup>
        )}
      </MapGl>
    </Box>
  );
};

PropertyMap.propTypes = {
  address: PropTypes.string.isRequired,
  country: PropTypes.string.isRequired,
};

export default PropertyMap;
