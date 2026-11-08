package com.pbl5cnpm.airbnb_service.listing.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pbl5cnpm.airbnb_service.listing.entity.ListingEntity;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ListingGeocodingService {

    public record Coordinates(double latitude, double longitude) {
    }

    private static final double DEFAULT_VN_LAT = 16.0544;
    private static final double DEFAULT_VN_LNG = 108.2022;

    private static final Map<String, Coordinates> LANDMARK_COORDINATES = new LinkedHashMap<>();
    private static final Map<String, Coordinates> CITY_COORDINATES = new LinkedHashMap<>();
    private static final Map<String, String> CITY_CANONICAL_NAMES = new LinkedHashMap<>();

    static {
        // Địa danh phổ biến tại các thành phố du lịch
        LANDMARK_COORDINATES.put("ba son", new Coordinates(10.7849, 106.7100));
        LANDMARK_COORDINATES.put("ben thanh", new Coordinates(10.7725, 106.6980));
        LANDMARK_COORDINATES.put("ben nghe", new Coordinates(10.7789, 106.7035));
        LANDMARK_COORDINATES.put("nguyen hue", new Coordinates(10.7744, 106.7035));
        LANDMARK_COORDINATES.put("thao dien", new Coordinates(10.8034, 106.7336));
        LANDMARK_COORDINATES.put("phu my hung", new Coordinates(10.7294, 106.7196));
        LANDMARK_COORDINATES.put("landmark 81", new Coordinates(10.7950, 106.7218));
        LANDMARK_COORDINATES.put("hoan kiem", new Coordinates(21.0288, 105.8522));
        LANDMARK_COORDINATES.put("pho co ha noi", new Coordinates(21.0341, 105.8506));
        LANDMARK_COORDINATES.put("tay ho", new Coordinates(21.0688, 105.8235));
        LANDMARK_COORDINATES.put("ba dinh", new Coordinates(21.0359, 105.8142));
        LANDMARK_COORDINATES.put("vo nguyen giap", new Coordinates(16.0588, 108.2458));
        LANDMARK_COORDINATES.put("my khe", new Coordinates(16.0605, 108.2464));
        LANDMARK_COORDINATES.put("ngu hanh son", new Coordinates(16.0033, 108.2633));
        LANDMARK_COORDINATES.put("son tra", new Coordinates(16.0912, 108.2608));
        LANDMARK_COORDINATES.put("cau rong", new Coordinates(16.0611, 108.2275));
        LANDMARK_COORDINATES.put("an bang", new Coordinates(15.9136, 108.3389));
        LANDMARK_COORDINATES.put("bai sau", new Coordinates(10.3375, 107.0928));
        LANDMARK_COORDINATES.put("bai truoc", new Coordinates(10.3468, 107.0725));
        LANDMARK_COORDINATES.put("tran phu", new Coordinates(12.2388, 109.1967));
        LANDMARK_COORDINATES.put("xuan huong", new Coordinates(11.9408, 108.4419));
        LANDMARK_COORDINATES.put("mui ne", new Coordinates(10.9333, 108.2872));
        LANDMARK_COORDINATES.put("duong dong", new Coordinates(10.2169, 103.9578));
        LANDMARK_COORDINATES.put("bai chay", new Coordinates(20.9558, 107.0439));

        // Tỉnh / thành phố trọng điểm
        registerCity(new String[] { "ho chi minh", "tp ho chi minh", "tphcm", "hcm", "sai gon", "saigon", "ho chi" },
                "Thành phố Hồ Chí Minh", 10.7769, 106.7009);
        registerCity(new String[] { "ha noi", "hanoi", "thu do ha noi" },
                "Hà Nội", 21.0285, 105.8542);
        registerCity(new String[] { "da nang", "danang" },
                "Đà Nẵng", 16.0544, 108.2022);
        registerCity(new String[] { "hoi an", "quang nam" },
                "Hội An", 15.8801, 108.3380);
        registerCity(new String[] { "nha trang", "khanh hoa", "cam ranh" },
                "Nha Trang", 12.2388, 109.1967);
        registerCity(new String[] { "da lat", "dalat", "lam dong" },
                "Đà Lạt", 11.9404, 108.4583);
        registerCity(new String[] { "vung tau", "ba ria", "ho tram" },
                "Vũng Tàu", 10.3460, 107.0843);
        registerCity(new String[] { "phu quoc", "kien giang" },
                "Phú Quốc", 10.2899, 103.9840);
        registerCity(new String[] { "hue", "thua thien hue" },
                "Huế", 16.4637, 107.5909);
        registerCity(new String[] { "ha long", "quang ninh", "cat ba", "hai phong" },
                "Hạ Long", 20.9599, 107.0425);
        registerCity(new String[] { "sa pa", "sapa", "lao cai" },
                "Sa Pa", 22.3364, 103.8438);
        registerCity(new String[] { "quy nhon", "binh dinh" },
                "Quy Nhơn", 13.7830, 109.2197);
        registerCity(new String[] { "phan thiet", "binh thuan" },
                "Phan Thiết", 10.9289, 108.1021);
        registerCity(new String[] { "can tho" },
                "Cần Thơ", 10.0452, 105.7469);
        registerCity(new String[] { "ninh binh", "trang an", "tam coc" },
                "Ninh Bình", 20.2506, 105.9745);
        registerCity(new String[] { "ha giang", "dong van" },
                "Hà Giang", 22.8233, 104.9836);
        registerCity(new String[] { "moc chau", "son la" },
                "Mộc Châu", 20.8444, 104.6392);
        registerCity(new String[] { "tam dao", "vinh phuc" },
                "Tam Đảo", 21.4569, 105.6448);
        registerCity(new String[] { "tuy hoa", "phu yen" },
                "Tuy Hòa", 13.0955, 109.3209);
        registerCity(new String[] { "dong hoi", "quang binh", "phong nha" },
                "Đồng Hới", 17.4689, 106.6223);
        registerCity(new String[] { "buon ma thuot", "dak lak" },
                "Buôn Ma Thuột", 12.6667, 108.0500);
        registerCity(new String[] { "mang den", "kon tum" },
                "Măng Đen", 14.5979, 108.2896);
        registerCity(new String[] { "pleiku", "gia lai" },
                "Pleiku", 13.9833, 108.0000);
        registerCity(new String[] { "sam son", "thanh hoa" },
                "Thanh Hóa", 19.8067, 105.7852);
        registerCity(new String[] { "vinh", "cua lo", "nghe an" },
                "Vinh", 18.6796, 105.6813);
    }

    private static void registerCity(String[] aliases, String canonicalName, double lat, double lng) {
        Coordinates coords = new Coordinates(lat, lng);
        for (String alias : aliases) {
            CITY_COORDINATES.put(alias, coords);
            CITY_CANONICAL_NAMES.put(alias, canonicalName);
        }
    }

    private final boolean remoteEnabled;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, Coordinates> geocodeCache = new ConcurrentHashMap<>();

    public ListingGeocodingService(
            @Value("${app.geocoding.remote-enabled:true}") boolean remoteEnabled) {
        this.remoteEnabled = remoteEnabled;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(1800))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public static boolean isValidCoordinate(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return false;
        }
        if (!Double.isFinite(latitude) || !Double.isFinite(longitude)) {
            return false;
        }
        if (Math.abs(latitude) < 1e-6 && Math.abs(longitude) < 1e-6) {
            return false;
        }
        return latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0;
    }

    public static Coordinates resolveOrFallback(ListingEntity entity) {
        if (entity == null) {
            return null;
        }
        if (isValidCoordinate(entity.getLatitude(), entity.getLongitude())) {
            return new Coordinates(round6(entity.getLatitude()), round6(entity.getLongitude()));
        }
        String country = entity.getCountriesEntity() != null ? entity.getCountriesEntity().getName() : null;
        return resolveStaticFallback(entity.getAddress(), entity.getCity(), country, entity.getId());
    }

    public static Coordinates resolveStaticFallback(String address, String city, String country, Long seedId) {
        boolean hasAddress = address != null && !address.isBlank();
        boolean hasCity = city != null && !city.isBlank();
        boolean hasCountry = country != null && !country.isBlank();
        if (!hasAddress && !hasCity && !hasCountry) {
            return null;
        }

        String normAddress = normalizeText(address);
        String normCity = normalizeText(city);
        String combined = (normAddress + " " + normCity).trim();

        for (Map.Entry<String, Coordinates> entry : LANDMARK_COORDINATES.entrySet()) {
            if (combined.contains(entry.getKey())) {
                return applyMicroJitterIfNeeded(entry.getValue(), normAddress, seedId, 0.0012);
            }
        }

        Coordinates cityCenter = findCityCenter(normCity, normAddress);
        if (cityCenter != null) {
            // Đặc thù từ ngắn như "Bến" tại TP.HCM ưu tiên khu vực trung tâm Bến Thành / Quận 1
            if (normAddress.equals("ben") && Math.abs(cityCenter.latitude() - 10.7769) < 0.05) {
                return applyMicroJitterIfNeeded(new Coordinates(10.7725, 106.6980), normAddress, seedId, 0.0015);
            }
            return applyMicroJitterIfNeeded(cityCenter, normAddress, seedId, 0.0055);
        }

        return applyMicroJitterIfNeeded(new Coordinates(DEFAULT_VN_LAT, DEFAULT_VN_LNG), combined, seedId, 0.0080);
    }

    public Coordinates resolveForPersist(
            Double requestedLatitude,
            Double requestedLongitude,
            String address,
            String city,
            String country,
            Long seedId) {
        if (isValidCoordinate(requestedLatitude, requestedLongitude)) {
            return new Coordinates(round6(requestedLatitude), round6(requestedLongitude));
        }

        String canonicalCity = canonicalizeCity(city);
        String cacheKey = normalizeText(address) + "|" + normalizeText(canonicalCity) + "|" + normalizeText(country);
        Coordinates cached = geocodeCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // Địa chỉ quá ngắn (<= 4 ký tự như "Bến") dễ khớp nhầm xã/ấp xa; dùng thẳng bộ từ điển địa phương
        String trimmedAddress = address == null ? "" : address.trim();
        if (remoteEnabled && (trimmedAddress.length() > 4 || !canonicalCity.isBlank())) {
            String query = trimmedAddress.length() > 4
                    ? joinNonBlank(trimmedAddress, canonicalCity, country)
                    : joinNonBlank(canonicalCity, country);
            Coordinates remote = queryNominatim(query);
            if (remote == null && !canonicalCity.isBlank()) {
                remote = queryNominatim(joinNonBlank(canonicalCity, country));
            }
            if (remote != null) {
                Coordinates adjusted = trimmedAddress.length() <= 4
                        ? applyMicroJitterIfNeeded(remote, normalizeText(trimmedAddress), seedId, 0.0035)
                        : remote;
                geocodeCache.put(cacheKey, adjusted);
                return adjusted;
            }
        }

        Coordinates fallback = resolveStaticFallback(address, canonicalCity.isBlank() ? city : canonicalCity, country, seedId);
        if (fallback != null) {
            geocodeCache.put(cacheKey, fallback);
        }
        return fallback;
    }

    private Coordinates queryNominatim(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            URI uri = URI.create("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=vi&q=" + encoded);
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofMillis(2200))
                    .header("User-Agent", "RestNesst-Accommodation-Service/1.0")
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.isArray() && !root.isEmpty()) {
                    double lat = root.get(0).path("lat").asDouble(Double.NaN);
                    double lon = root.get(0).path("lon").asDouble(Double.NaN);
                    if (isValidCoordinate(lat, lon)) {
                        return new Coordinates(round6(lat), round6(lon));
                    }
                }
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        } catch (Exception ex) {
            log.debug("Geocoding fallback activated for '{}': {}", query, ex.getMessage());
        }
        return null;
    }

    private static Coordinates findCityCenter(String normCity, String normAddress) {
        if (!normCity.isEmpty()) {
            if (CITY_COORDINATES.containsKey(normCity)) {
                return CITY_COORDINATES.get(normCity);
            }
            for (Map.Entry<String, Coordinates> entry : CITY_COORDINATES.entrySet()) {
                if (normCity.contains(entry.getKey()) || entry.getKey().contains(normCity)) {
                    return entry.getValue();
                }
            }
        }
        if (!normAddress.isEmpty()) {
            for (Map.Entry<String, Coordinates> entry : CITY_COORDINATES.entrySet()) {
                if (normAddress.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private static String canonicalizeCity(String city) {
        if (city == null || city.isBlank()) {
            return "";
        }
        String norm = normalizeText(city);
        if (CITY_CANONICAL_NAMES.containsKey(norm)) {
            return CITY_CANONICAL_NAMES.get(norm);
        }
        for (Map.Entry<String, String> entry : CITY_CANONICAL_NAMES.entrySet()) {
            if (norm.contains(entry.getKey()) || entry.getKey().contains(norm)) {
                return entry.getValue();
            }
        }
        return city.trim();
    }

    private static Coordinates applyMicroJitterIfNeeded(
            Coordinates base,
            String addressSeed,
            Long idSeed,
            double maxRadiusDeg) {
        if ((addressSeed == null || addressSeed.isEmpty()) && idSeed == null) {
            return new Coordinates(round6(base.latitude()), round6(base.longitude()));
        }
        String seedText = (addressSeed == null ? "" : addressSeed) + "#" + (idSeed == null ? "0" : idSeed);
        int hash = seedText.hashCode();
        double angle = ((hash & 0xFFFF) / 65535.0) * Math.PI * 2.0;
        double radiusRatio = 0.25 + ((((hash >>> 16) & 0xFFFF) / 65535.0) * 0.75);
        double dLat = Math.sin(angle) * maxRadiusDeg * radiusRatio;
        double dLng = Math.cos(angle) * maxRadiusDeg * radiusRatio;
        return new Coordinates(round6(base.latitude() + dLat), round6(base.longitude() + dLng));
    }

    private static String joinNonBlank(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                if (!sb.isEmpty()) {
                    sb.append(", ");
                }
                sb.append(part.trim());
            }
        }
        return sb.toString();
    }

    private static String normalizeText(String input) {
        if (input == null) {
            return "";
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized;
    }

    private static double round6(double value) {
        return Math.round(value * 1_000_000.0) / 1_000_000.0;
    }
}
