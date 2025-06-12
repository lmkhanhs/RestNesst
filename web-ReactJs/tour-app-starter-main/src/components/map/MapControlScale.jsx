import { ScaleControl } from "react-map-gl";
import { useTheme } from "@mui/material/styles";

const MapControlScale = () => {
  const theme = useTheme();

  return (
    <ScaleControl
      maxWidth={100}
      unit="imperial"
      style={{
        left: 16,
        bottom: 16,
      }}
    />
  );
};

export default MapControlScale;
