import {
  Wifi,
  Pool,
  Kitchen,
  LocalParking,
  Landscape,
  Mountain,
  Tv,
  LocalLaundryService,
} from "@mui/icons-material";

const amenityIconMap = {
  // Vietnamese names from the JSON
  "Hướng nhìn ra vườn": Landscape,
  "Hướng nhìn ra núi": Mountain,
  Bếp: Kitchen,
  "Chỗ đỗ xe miễn phí tại nơi ở": LocalParking,
  "Máy giặt": LocalLaundryService,
  Wifi: Wifi,
  "Hồ bơi chung": Pool,
  "Ti vi": Tv,

  // Keep English versions as fallback
  "Garden view": Landscape,
  "Mountain view": Mountain,
  Kitchen: Kitchen,
  "Free parking at the accommodation": LocalParking,
  "Washing machine": LocalLaundryService,
  "Common swimming pool": Pool,
  TV: Tv,
};

export const getAmenityIcon = (amenityName) => {
  return amenityIconMap[amenityName] || null;
};

export default amenityIconMap;
