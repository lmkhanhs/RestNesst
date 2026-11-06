import PropTypes from "prop-types";
import { Popup } from "react-map-gl";
import { styled } from "@mui/material/styles";

const StyledPopup = styled(Popup)(({ theme }) => ({
  "& .mapboxgl-popup-content": {
    backgroundColor: theme.palette.grey[900],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
  },
  "& .mapboxgl-popup-close-button": {
    width: 24,
    height: 24,
    fontSize: 16,
    opacity: 0.48,
    color: theme.palette.common.white,
    right: theme.spacing(1),
    top: theme.spacing(1),
    "&:hover": {
      opacity: 1,
    },
  },
  "& .mapboxgl-popup-tip": {
    borderTopColor: theme.palette.grey[900],
  },
}));

const MapControlPopup = ({ children, ...other }) => {
  return (
    <StyledPopup
      tipSize={8}
      anchor="bottom"
      closeButton
      closeOnClick={false}
      {...other}
    >
      {children}
    </StyledPopup>
  );
};

MapControlPopup.propTypes = {
  children: PropTypes.node,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  onClose: PropTypes.func,
};

export default MapControlPopup; 