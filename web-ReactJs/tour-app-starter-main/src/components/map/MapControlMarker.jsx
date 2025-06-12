import PropTypes from "prop-types";
import { Marker } from "react-map-gl";

const MapControlMarker = ({ latitude, longitude, onClick }) => {
  return (
    <Marker latitude={latitude} longitude={longitude} onClick={onClick}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 0C7.038 0 3 4.066 3 9.065C3 16.168 11.154 23.502 11.501 23.81C11.644 23.937 11.822 24 12 24C12.178 24 12.356 23.937 12.499 23.811C12.846 23.502 21 16.168 21 9.065C21 4.066 16.962 0 12 0Z"
          fill="#2196F3"
        />
      </svg>
    </Marker>
  );
};

MapControlMarker.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  onClick: PropTypes.func,
};

export default MapControlMarker;
