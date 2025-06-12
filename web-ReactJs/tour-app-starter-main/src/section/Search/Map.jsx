import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { MAPTILER_API_KEY } from "../../config";
import "./Map.css";

// Ensure the API key is set
if (!MAPTILER_API_KEY) {
  console.error("MAPTILER_API_KEY is missing. Please provide a valid API key.");
}

maptilersdk.config.apiKey = MAPTILER_API_KEY;

const DEFAULT_CENTER = {
  lat: 21.0285,
  lng: 105.8542,
};

const Map = ({ data }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (map.current) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      return;
    }

    const center = data.length > 0 
      ? [data[0].longitude, data[0].latitude]
      : [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat];

    try {
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: "https://api.maptiler.com/maps/streets/style.json",
        center: center,
        zoom: 13,
      });

      map.current.addControl(new maptilersdk.NavigationControl(), "top-right");

      map.current.on("load", () => {
        data.forEach((property) => {
          if (property.longitude && property.latitude) {
            const el = document.createElement("div");
            el.className = "marker";
            
            const marker = new maptilersdk.Marker({
              element: el,
              anchor: "bottom"
            })
              .setLngLat([property.longitude, property.latitude])
              .addTo(map.current);

            el.addEventListener("click", () => {
              setPopupInfo(property);
            });

            markersRef.current.push(marker);
          }
        });
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (map.current) {
        markersRef.current.forEach(marker => marker.remove());
        map.current.remove();
        map.current = null;
      }
    };
  }, [data]);

  return (
    <Box sx={{ height: "85vh", position: "sticky", top: 16 }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {popupInfo && (
        <Box
          sx={{
            position: "absolute",
            top: "10px",
            left: "10px",
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 1,
            boxShadow: 1,
            zIndex: 1,
            maxWidth: 300
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {popupInfo.name || popupInfo.title}
          </Typography>
          <Typography variant="body2">${popupInfo.price} / night</Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            {popupInfo.address}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

Map.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
      title: PropTypes.string,
      name: PropTypes.string,
      price: PropTypes.number.isRequired,
      address: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Map;
