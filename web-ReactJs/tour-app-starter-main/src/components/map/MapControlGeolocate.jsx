import { GeolocateControl } from "react-map-gl";

const MapControlGeolocate = () => {
  return (
    <GeolocateControl
      style={{
        right: 8,
        top: 44,
      }}
      positionOptions={{ enableHighAccuracy: true }}
      trackUserLocation
    />
  );
};

export default MapControlGeolocate;
