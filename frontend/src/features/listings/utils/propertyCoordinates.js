import { MAPTILER_API_KEY } from "@/shared/config/ui.js";

const STORAGE_CACHE_KEY = "rn_geocode_cache_v1";
const memoryCache = new Map();

const DEFAULT_VN_CENTER = { latitude: 16.0544, longitude: 108.2022 };

const LANDMARK_COORDINATES = [
  ["ba son", { latitude: 10.7849, longitude: 106.71 }],
  ["ben thanh", { latitude: 10.7725, longitude: 106.698 }],
  ["ben nghe", { latitude: 10.7789, longitude: 106.7035 }],
  ["nguyen hue", { latitude: 10.7744, longitude: 106.7035 }],
  ["thao dien", { latitude: 10.8034, longitude: 106.7336 }],
  ["phu my hung", { latitude: 10.7294, longitude: 106.7196 }],
  ["landmark 81", { latitude: 10.795, longitude: 106.7218 }],
  ["hoan kiem", { latitude: 21.0288, longitude: 105.8522 }],
  ["pho co ha noi", { latitude: 21.0341, longitude: 105.8506 }],
  ["tay ho", { latitude: 21.0688, longitude: 105.8235 }],
  ["ba dinh", { latitude: 21.0359, longitude: 105.8142 }],
  ["vo nguyen giap", { latitude: 16.0588, longitude: 108.2458 }],
  ["my khe", { latitude: 16.0605, longitude: 108.2464 }],
  ["ngu hanh son", { latitude: 16.0033, longitude: 108.2633 }],
  ["son tra", { latitude: 16.0912, longitude: 108.2608 }],
  ["cau rong", { latitude: 16.0611, longitude: 108.2275 }],
  ["an bang", { latitude: 15.9136, longitude: 108.3389 }],
  ["bai sau", { latitude: 10.3375, longitude: 107.0928 }],
  ["bai truoc", { latitude: 10.3468, longitude: 107.0725 }],
  ["tran phu", { latitude: 12.2388, longitude: 109.1967 }],
  ["xuan huong", { latitude: 11.9408, longitude: 108.4419 }],
  ["mui ne", { latitude: 10.9333, longitude: 108.2872 }],
  ["duong dong", { latitude: 10.2169, longitude: 103.9578 }],
  ["bai chay", { latitude: 20.9558, longitude: 107.0439 }],
];

const CITY_DIRECTORY = [
  {
    aliases: ["ho chi minh", "tp ho chi minh", "tphcm", "hcm", "sai gon", "saigon", "ho chi"],
    canonical: "Thành phố Hồ Chí Minh",
    latitude: 10.7769,
    longitude: 106.7009,
  },
  {
    aliases: ["ha noi", "hanoi", "thu do ha noi"],
    canonical: "Hà Nội",
    latitude: 21.0285,
    longitude: 105.8542,
  },
  {
    aliases: ["da nang", "danang"],
    canonical: "Đà Nẵng",
    latitude: 16.0544,
    longitude: 108.2022,
  },
  {
    aliases: ["hoi an", "quang nam"],
    canonical: "Hội An",
    latitude: 15.8801,
    longitude: 108.338,
  },
  {
    aliases: ["nha trang", "khanh hoa", "cam ranh"],
    canonical: "Nha Trang",
    latitude: 12.2388,
    longitude: 109.1967,
  },
  {
    aliases: ["da lat", "dalat", "lam dong"],
    canonical: "Đà Lạt",
    latitude: 11.9404,
    longitude: 108.4583,
  },
  {
    aliases: ["vung tau", "ba ria", "ho tram"],
    canonical: "Vũng Tàu",
    latitude: 10.346,
    longitude: 107.0843,
  },
  {
    aliases: ["phu quoc", "kien giang"],
    canonical: "Phú Quốc",
    latitude: 10.2899,
    longitude: 103.984,
  },
  {
    aliases: ["hue", "thua thien hue"],
    canonical: "Huế",
    latitude: 16.4637,
    longitude: 107.5909,
  },
  {
    aliases: ["ha long", "quang ninh", "cat ba", "hai phong"],
    canonical: "Hạ Long",
    latitude: 20.9599,
    longitude: 107.0425,
  },
  {
    aliases: ["sa pa", "sapa", "lao cai"],
    canonical: "Sa Pa",
    latitude: 22.3364,
    longitude: 103.8438,
  },
  {
    aliases: ["quy nhon", "binh dinh"],
    canonical: "Quy Nhơn",
    latitude: 13.783,
    longitude: 109.2197,
  },
  {
    aliases: ["phan thiet", "binh thuan"],
    canonical: "Phan Thiết",
    latitude: 10.9289,
    longitude: 108.1021,
  },
  {
    aliases: ["can tho"],
    canonical: "Cần Thơ",
    latitude: 10.0452,
    longitude: 105.7469,
  },
  {
    aliases: ["ninh binh", "trang an", "tam coc"],
    canonical: "Ninh Bình",
    latitude: 20.2506,
    longitude: 105.9745,
  },
  {
    aliases: ["ha giang", "dong van"],
    canonical: "Hà Giang",
    latitude: 22.8233,
    longitude: 104.9836,
  },
  {
    aliases: ["moc chau", "son la"],
    canonical: "Mộc Châu",
    latitude: 20.8444,
    longitude: 104.6392,
  },
  {
    aliases: ["tam dao", "vinh phuc"],
    canonical: "Tam Đảo",
    latitude: 21.4569,
    longitude: 105.6448,
  },
  {
    aliases: ["tuy hoa", "phu yen"],
    canonical: "Tuy Hòa",
    latitude: 13.0955,
    longitude: 109.3209,
  },
  {
    aliases: ["dong hoi", "quang binh", "phong nha"],
    canonical: "Đồng Hới",
    latitude: 17.4689,
    longitude: 106.6223,
  },
];

export function normalizeLocationText(input) {
  if (!input) return "";
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (latitude === null || latitude === undefined || latitude === "") return false;
  if (longitude === null || longitude === undefined || longitude === "") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function round6(val) {
  return Math.round(Number(val) * 1e6) / 1e6;
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function applyDeterministicOffset(base, seedText, maxRadiusDeg) {
  if (!seedText) {
    return { latitude: round6(base.latitude), longitude: round6(base.longitude) };
  }
  const hash = hashString(seedText);
  const angle = ((hash & 0xffff) / 65535) * Math.PI * 2;
  const ratio = 0.25 + (((hash >>> 16) & 0xffff) / 65535) * 0.75;
  return {
    latitude: round6(base.latitude + Math.sin(angle) * maxRadiusDeg * ratio),
    longitude: round6(base.longitude + Math.cos(angle) * maxRadiusDeg * ratio),
  };
}

export function findCityEntry(city, address = "") {
  const normCity = normalizeLocationText(city);
  const normAddr = normalizeLocationText(address);

  if (normCity) {
    for (const entry of CITY_DIRECTORY) {
      if (
        entry.aliases.some(
          (alias) => normCity === alias || normCity.includes(alias) || alias.includes(normCity)
        )
      ) {
        return entry;
      }
    }
  }

  if (normAddr) {
    for (const entry of CITY_DIRECTORY) {
      if (entry.aliases.some((alias) => normAddr.includes(alias))) {
        return entry;
      }
    }
  }

  return null;
}

export function formatCanonicalCity(city, address = "") {
  const matched = findCityEntry(city, address);
  if (matched) return matched.canonical;
  return city ? String(city).trim() : "";
}

export function resolveFallbackCoordinate({ id, address, city, country } = {}) {
  const normAddr = normalizeLocationText(address);
  const normCity = normalizeLocationText(city);
  const combined = `${normAddr} ${normCity}`.trim();
  const seed = `${normAddr}#${id ?? ""}`;

  for (const [landmark, coords] of LANDMARK_COORDINATES) {
    if (combined.includes(landmark)) {
      return applyDeterministicOffset(coords, seed, 0.0012);
    }
  }

  const cityEntry = findCityEntry(city, address);
  if (cityEntry) {
    if (normAddr === "ben" && cityEntry.canonical === "Thành phố Hồ Chí Minh") {
      return applyDeterministicOffset(
        { latitude: 10.7725, longitude: 106.698 },
        seed,
        0.0015
      );
    }
    return applyDeterministicOffset(cityEntry, seed, 0.0055);
  }

  if (normAddr || normCity || country) {
    return applyDeterministicOffset(DEFAULT_VN_CENTER, seed, 0.008);
  }

  return DEFAULT_VN_CENTER;
}

function readPersistentCache() {
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePersistentCache(key, coords) {
  try {
    const current = readPersistentCache();
    current[key] = coords;
    const keys = Object.keys(current);
    if (keys.length > 200) {
      delete current[keys[0]];
    }
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(current));
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage
  }
}

export async function geocodeAddress({ address, city, country, id, signal } = {}) {
  const trimmedAddress = address ? String(address).trim() : "";
  const canonicalCity = formatCanonicalCity(city, address);
  const cacheKey = `${normalizeLocationText(trimmedAddress)}|${normalizeLocationText(
    canonicalCity
  )}|${normalizeLocationText(country || "Việt Nam")}`;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  const persisted = readPersistentCache()[cacheKey];
  if (persisted && isValidCoordinate(persisted.latitude, persisted.longitude)) {
    memoryCache.set(cacheKey, persisted);
    return persisted;
  }

  const cityEntry = findCityEntry(city, address);
  const useStreetQuery = trimmedAddress.length > 4;
  const queryParts = useStreetQuery
    ? [trimmedAddress, canonicalCity || city, country || "Việt Nam"]
    : [canonicalCity || city, country || "Việt Nam"];
  const query = queryParts.filter(Boolean).join(", ").trim();

  if (MAPTILER_API_KEY && query) {
    try {
      const params = new URLSearchParams({
        key: MAPTILER_API_KEY,
        language: "vi",
        country: "vn",
        limit: "1",
      });
      if (cityEntry) {
        params.set("proximity", `${cityEntry.longitude},${cityEntry.latitude}`);
      }
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params.toString()}`,
        { signal }
      );
      if (response.ok) {
        const data = await response.json();
        const center = data?.features?.[0]?.center;
        if (Array.isArray(center) && center.length >= 2) {
          const [lng, lat] = center;
          if (isValidCoordinate(lat, lng)) {
            const rawCoords = { latitude: round6(lat), longitude: round6(lng) };
            const resolved = useStreetQuery
              ? rawCoords
              : applyDeterministicOffset(rawCoords, `${normalizeLocationText(trimmedAddress)}#${id ?? ""}`, 0.003);
            memoryCache.set(cacheKey, resolved);
            writePersistentCache(cacheKey, resolved);
            return resolved;
          }
        }
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        throw err;
      }
    }
  }

  const fallback = resolveFallbackCoordinate({ id, address, city: canonicalCity || city, country });
  memoryCache.set(cacheKey, fallback);
  return fallback;
}

export function spreadOverlappingMarkers(items) {
  const seenCounts = new Map();
  return items.map((item) => {
    const bucketKey = `${Math.round(item.latitude * 2500)}:${Math.round(item.longitude * 2500)}`;
    const index = seenCounts.get(bucketKey) || 0;
    seenCounts.set(bucketKey, index + 1);
    if (index === 0) return item;
    const angle = index * 2.399963229728653; // góc vàng giúp phân bố đều quanh tâm
    const radius = 0.0014 * Math.sqrt(index);
    return {
      ...item,
      latitude: round6(item.latitude + Math.sin(angle) * radius),
      longitude: round6(item.longitude + Math.cos(angle) * radius),
    };
  });
}

export function buildImmediateMapProperties(properties = []) {
  if (!Array.isArray(properties) || properties.length === 0) return [];
  const mapped = properties.map((property) => {
    const hasBackendCoords = isValidCoordinate(property.latitude, property.longitude);
    const coords = hasBackendCoords
      ? { latitude: Number(property.latitude), longitude: Number(property.longitude) }
      : resolveFallbackCoordinate({
          id: property.id,
          address: property.address,
          city: property.city,
          country: property.country,
        });
    const canonicalCity = formatCanonicalCity(property.city, property.address);
    return {
      ...property,
      id: property.id ?? "",
      latitude: coords.latitude,
      longitude: coords.longitude,
      hasBackendCoords,
      displayCity: canonicalCity || property.city || "Việt Nam",
      name: property.name || property.title || "Chỗ ở RestNesst",
      price: Number(property.price) || 0,
      address:
        [property.address, canonicalCity || property.city, property.country]
          .filter(Boolean)
          .join(", ") || "Việt Nam",
    };
  });

  return spreadOverlappingMarkers(mapped);
}
