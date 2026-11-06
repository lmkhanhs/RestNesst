package com.pbl5cnpm.airbnb_service.seed;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pbl5cnpm.airbnb_service.configuration.PasswordEncoderConfig;

/** Explicit dev command, not a Spring bean: preview never starts application runners or SMTP. */
public final class DaNangDevSeed {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String SEED_ID = "restnesst-danang-v1";
    private static final String HOST = "demo_dn_host01";
    private static final String URL = "jdbc:mysql://127.0.0.1:3306/johunter11?characterEncoding=UTF-8";
    private static final String LOCK = "restnesst:seed:danang-v1";

    private record ExistingUser(long id, String email, String description, boolean active) { }
    private record ExistingListing(long id, String title, String address) { }
    private record Plan(Object countryId, Object categoryId, Map<String, Object> roleIds,
            Map<String, Object> amenityIds, Map<String, ExistingUser> users,
            Map<String, ExistingListing> listings, List<String> problems) { }

    private static final class Counts {
        private final Map<String, Integer> created = new LinkedHashMap<>();
        private final Map<String, Integer> skipped = new LinkedHashMap<>();

        void add(boolean inserted, String table, int count) {
            (inserted ? created : skipped).merge(table, count, Integer::sum);
        }

        void print() {
            System.out.println("Created: " + created);
            System.out.println("Skipped planned rows: " + skipped);
        }
    }

    private DaNangDevSeed() { }

    public static void main(String[] args) {
        try {
            run(args);
        } catch (Exception exception) {
            // Do not dump JDBC properties, JSON credential input, password hashes or raw passwords.
            System.err.println("Seed failed (" + exception.getClass().getSimpleName() + "): "
                    + safeMessage(exception));
            System.exit(1);
        }
    }

    private static void run(String[] args) throws Exception {
        Path root = Path.of(System.getProperty("restnesst.root", ".")).toAbsolutePath().normalize();
        Path catalogPath = root.resolve("airbnb_service/scripts/seed/danang-hotels.json");
        byte[] catalogBytes = Files.readAllBytes(catalogPath);
        JsonNode catalog = JSON.readTree(catalogBytes);
        validateCatalog(root, catalog);
        String digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(catalogBytes));
        boolean apply = args.length == 3 && args[0].equals("--apply")
                && args[1].equals("--approve") && args[2].equals(digest);
        boolean preview = args.length == 0 || (args.length == 1 && args[0].equals("--preview"));
        if (!apply && !preview) {
            throw new IllegalArgumentException("Use --preview, or --apply --approve <exact preview SHA256>.");
        }

        Properties credentials = new Properties();
        credentials.setProperty("user", "codex_dev");
        credentials.setProperty("password", databasePassword(root));
        try (Connection connection = DriverManager.getConnection(URL, credentials)) {
            List<Map<String, Object>> identity = rows(connection,
                    "SELECT DATABASE() AS db, SUBSTRING_INDEX(CURRENT_USER(), '@', 1) AS account");
            if (!"johunter11".equals(identity.get(0).get("db"))
                    || !"codex_dev".equals(identity.get(0).get("account"))) {
                throw new IllegalStateException("Refusing a database or account other than the configured dev target.");
            }
            connection.setTransactionIsolation(apply ? Connection.TRANSACTION_SERIALIZABLE
                    : Connection.TRANSACTION_REPEATABLE_READ);
            connection.setReadOnly(!apply);
            connection.setAutoCommit(false);
            boolean locked = false;
            try {
                if (apply) {
                    locked = ((Number) rows(connection, "SELECT GET_LOCK(?, 10) AS acquired", LOCK)
                            .get(0).get("acquired")).intValue() == 1;
                    if (!locked) {
                        throw new IllegalStateException("Another seed is running; try again later.");
                    }
                }
                Plan plan = plan(connection, catalog);
                printPreview(catalog, digest, plan);
                if (!plan.problems().isEmpty()) {
                    throw new IllegalStateException("Resolve the preflight problems above before applying this seed.");
                }
                if (preview) {
                    connection.rollback();
                    System.out.println("PREVIEW ONLY: zero database writes; waiting for user confirmation.");
                    return;
                }
                Counts counts = apply(connection, root, catalog, plan);
                connection.commit();
                System.out.println("COMMITTED dev seed " + SEED_ID);
                counts.print();
                System.out.println("Login passwords are local only: tools/database-toolbox/.local/danang-seed-accounts.json");
            } catch (Exception exception) {
                connection.rollback();
                throw exception;
            } finally {
                if (locked) {
                    rows(connection, "SELECT RELEASE_LOCK(?) AS released", LOCK);
                }
            }
        }
    }

    private static Plan plan(Connection connection, JsonNode catalog) throws SQLException {
        List<String> problems = new ArrayList<>();
        verifyInsertSchema(connection, problems);
        Object countryId = lookup(connection,
                "SELECT id FROM countries WHERE name = ? AND deleted = false AND is_active = true",
                text(catalog, "country"), problems);
        Object categoryId = lookup(connection,
                "SELECT id FROM categories WHERE name = ? AND deleted = false AND is_active = true",
                text(catalog, "category"), problems);
        Map<String, Object> roleIds = new HashMap<>();
        for (String role : List.of("GUEST", "HOST")) {
            roleIds.put(role, lookup(connection, "SELECT id FROM roles WHERE role_name = ?", role, problems));
        }
        Map<String, Object> amenityIds = new HashMap<>();
        for (JsonNode hotel : catalog.path("hotels")) {
            for (JsonNode amenity : hotel.path("verifiedAmenities")) {
                String name = text(amenity, "name");
                if (!amenityIds.containsKey(name)) {
                    amenityIds.put(name, lookup(connection,
                            "SELECT id FROM amenites WHERE name = ? AND deleted = false", name, problems));
                }
            }
        }

        Map<String, ExistingUser> users = new HashMap<>();
        for (JsonNode seed : catalog.path("users")) {
            String username = text(seed, "username");
            List<Map<String, Object>> found = rows(connection,
                    "SELECT id, username, email, description, is_active FROM users WHERE username = ? OR email = ?",
                    username, text(seed, "email"));
            for (Map<String, Object> row : found) {
                if (!username.equals(row.get("username"))) {
                    problems.add("Email collision for " + username + "; no existing account will be changed.");
                    continue;
                }
                ExistingUser user = new ExistingUser(((Number) row.get("id")).longValue(),
                        (String) row.get("email"), (String) row.get("description"),
                        Boolean.TRUE.equals(row.get("is_active")));
                users.put(username, user);
                if (username.equals(HOST)) {
                    boolean owned = text(seed, "email").equals(user.email())
                            && userMarker(username).equals(user.description()) && user.active();
                    boolean hostRole = !rows(connection,
                            "SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
                                    + "WHERE ur.user_id = ? AND r.role_name = 'HOST'", user.id()).isEmpty();
                    if (!owned || !hostRole) {
                        problems.add("Existing host username is not an active host owned by this seed; refusing to attach hotels.");
                    }
                }
            }
        }

        List<Map<String, Object>> existing = rows(connection, "SELECT id, title, address FROM listings");
        Map<String, ExistingListing> listings = new HashMap<>();
        for (JsonNode hotel : catalog.path("hotels")) {
            String name = normalize(text(hotel, "name"));
            String address = normalize(text(hotel, "address"));
            for (Map<String, Object> row : existing) {
                boolean sameName = name.equals(normalize((String) row.get("title")));
                boolean sameAddress = address.equals(normalize((String) row.get("address")));
                if (sameName && sameAddress) {
                    listings.put(text(hotel, "key"), new ExistingListing(((Number) row.get("id")).longValue(),
                            (String) row.get("title"), (String) row.get("address")));
                } else if (sameName || sameAddress) {
                    problems.add("Potential duplicate for " + text(hotel, "name")
                            + " at existing listing ID " + row.get("id") + "; manual review required.");
                }
            }
            if (!listings.containsKey(text(hotel, "key")) && !rows(connection,
                    "SELECT id FROM images WHERE image_url = ?", placeholder(hotel)).isEmpty()) {
                problems.add("Placeholder URL already belongs to another listing: " + text(hotel, "key"));
            }
        }
        return new Plan(countryId, categoryId, roleIds, amenityIds, users, listings, problems);
    }

    private static void verifyInsertSchema(Connection connection, List<String> problems) throws SQLException {
        Map<String, Set<String>> insertedColumns = Map.of(
                "users", Set.of("username", "fullname", "email", "password", "address", "country_id", "is_active",
                        "host_application_pending", "languages", "did_host_year", "description", "created_at", "updated_at"),
                "user_roles", Set.of("user_id", "role_id"),
                "listings", Set.of("title", "description", "address", "city", "price", "area", "status", "access", "deleted",
                        "avg_start", "popular", "start_date", "end_date", "position", "host_id", "country_id", "created_at", "updated_at"),
                "images", Set.of("image_url", "deleted", "listing_id", "created_at", "updated_at"),
                "listing_categories", Set.of("listing_id", "category_id"),
                "listing_amenites", Set.of("listing_id", "amenites_id"));
        for (var table : insertedColumns.entrySet()) {
            Set<String> actual = new HashSet<>();
            try (ResultSet columns = connection.getMetaData().getColumns("johunter11", null, table.getKey(), "%")) {
                while (columns.next()) {
                    String name = columns.getString("COLUMN_NAME");
                    actual.add(name);
                    if (columns.getInt("NULLABLE") == java.sql.DatabaseMetaData.columnNoNulls
                            && columns.getObject("COLUMN_DEF") == null
                            && !"YES".equals(columns.getString("IS_AUTOINCREMENT"))
                            && !table.getValue().contains(name)) {
                        problems.add("Unhandled required column: " + table.getKey() + "." + name);
                    }
                }
            }
            if (!actual.containsAll(table.getValue())) {
                problems.add("Schema columns do not match the reviewed seed for " + table.getKey());
            }
        }
        List<Map<String, Object>> engines = rows(connection,
                "SELECT TABLE_NAME AS name, ENGINE AS engine FROM information_schema.TABLES "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN "
                        + "('users','user_roles','listings','images','listing_categories','listing_amenites')");
        if (engines.size() != insertedColumns.size()
                || engines.stream().anyMatch(row -> !"InnoDB".equals(row.get("engine")))) {
            problems.add("All seed target tables must use InnoDB for an atomic transaction.");
        }
    }

    private static Counts apply(Connection connection, Path root, JsonNode catalog, Plan plan) throws Exception {
        Counts counts = new Counts();
        Map<String, Long> userIds = new HashMap<>();
        Path secretPath = root.resolve("tools/database-toolbox/.local/danang-seed-accounts.json");
        ObjectNode secrets = loadLoginSecrets(secretPath);
        var encoder = new PasswordEncoderConfig().passwordEncoder();
        SecureRandom random = new SecureRandom();
        boolean createdUser = false;
        for (JsonNode user : catalog.path("users")) {
            String username = text(user, "username");
            ExistingUser existing = plan.users().get(username);
            if (existing != null) {
                userIds.put(username, existing.id());
                counts.add(false, "users", 1);
                counts.add(false, "user_roles", user.path("roles").size());
                continue;
            }
            byte[] bytes = new byte[24];
            random.nextBytes(bytes);
            String password = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            String hash = encoder.encode(password);
            if (!encoder.matches(password, hash)) {
                throw new IllegalStateException("The configured password encoder did not verify its generated hash.");
            }
            long id = insert(connection,
                    "INSERT INTO users (username, fullname, email, password, address, country_id, is_active, "
                            + "host_application_pending, languages, did_host_year, description, created_at, updated_at) "
                            + "VALUES (?, ?, ?, ?, ?, ?, true, false, ?, ?, ?, NOW(6), NOW(6))",
                    username, text(user, "fullname"), text(user, "email"), hash,
                    "Đà Nẵng (tài khoản giả phục vụ demo)", plan.countryId(), "Tiếng Việt (mẫu)", 0,
                    userMarker(username));
            userIds.put(username, id);
            counts.add(true, "users", 1);
            for (JsonNode role : user.path("roles")) {
                execute(connection, "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
                        id, plan.roleIds().get(role.asText()));
                counts.add(true, "user_roles", 1);
            }
            ObjectNode login = secrets.putObject(username);
            login.put("email", text(user, "email"));
            login.put("password", password);
            createdUser = true;
        }
        long position = ((Number) rows(connection,
                "SELECT COALESCE(MAX(position), -1) AS last_position FROM listings").get(0).get("last_position")).longValue() + 1;
        for (JsonNode hotel : catalog.path("hotels")) {
            boolean isNew = !plan.listings().containsKey(text(hotel, "key"));
            counts.add(isNew, "listings", 1);
            counts.add(isNew, "images", 1);
            counts.add(isNew, "listing_categories", 1);
            counts.add(isNew, "listing_amenites", hotel.path("verifiedAmenities").size());
            if (!isNew) {
                continue; // Never repair, reassign, or overwrite an existing listing or any of its relations.
            }
            long listingId = insert(connection,
                    "INSERT INTO listings (title, description, address, city, price, area, status, access, deleted, "
                            + "avg_start, popular, start_date, end_date, position, host_id, country_id, created_at, updated_at) "
                            + "VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', true, false, 0, false, ?, ?, ?, ?, ?, NOW(6), NOW(6))",
                    text(hotel, "name"), description(catalog, hotel), text(hotel, "address"), text(catalog, "city"),
                    hotel.path("demoPriceVnd").asLong(), hotel.path("demoAreaSqm").asInt() + " m² (mẫu)",
                    java.sql.Date.valueOf(text(catalog, "demoAvailableFrom")),
                    java.sql.Date.valueOf(text(catalog, "demoAvailableTo")), position++, userIds.get(HOST), plan.countryId());
            insert(connection, "INSERT INTO images (image_url, deleted, listing_id, created_at, updated_at) "
                    + "VALUES (?, false, ?, NOW(6), NOW(6))", placeholder(hotel), listingId);
            execute(connection, "INSERT INTO listing_categories (listing_id, category_id) VALUES (?, ?)",
                    listingId, plan.categoryId());
            for (JsonNode amenity : hotel.path("verifiedAmenities")) {
                execute(connection, "INSERT INTO listing_amenites (listing_id, amenites_id) VALUES (?, ?)",
                        listingId, plan.amenityIds().get(text(amenity, "name")));
            }
        }
        if (createdUser) {
            // Persist credentials before commit. On rollback, these unused local credentials are harmless.
            // Never print them, and never reset passwords of existing accounts on later seed runs.
            saveLoginSecrets(secretPath, secrets);
        }
        return counts;
    }

    private static void printPreview(JsonNode catalog, String digest, Plan plan) {
        System.out.println("Target: Docker MySQL 127.0.0.1:3306/johunter11, account codex_dev");
        System.out.println("Catalog SHA256: " + digest);
        System.out.println("Users to create: " + (catalog.path("users").size() - plan.users().size())
                + "; existing usernames to skip: " + plan.users().size());
        for (JsonNode user : catalog.path("users")) {
            System.out.println("  " + text(user, "username") + " | " + text(user, "email") + " | " + user.path("roles"));
        }
        System.out.println("Listings to create: " + (catalog.path("hotels").size() - plan.listings().size())
                + "; name/address duplicates to skip: " + plan.listings().size());
        for (JsonNode hotel : catalog.path("hotels")) {
            ExistingListing existing = plan.listings().get(text(hotel, "key"));
            System.out.println("  " + text(hotel, "name") + " | " + text(hotel, "address")
                    + " | DEMO " + hotel.path("demoPriceVnd").asLong() + " VND/night | "
                    + (existing == null ? "NEW" : "SKIP ID " + existing.id()));
        }
        System.out.println("Prerequisites: existing country, category, roles and amenities; none will be created or changed.");
        for (String problem : plan.problems()) {
            System.out.println("PREFLIGHT PROBLEM: " + problem);
        }
    }

    private static void validateCatalog(Path root, JsonNode catalog) throws Exception {
        if (!SEED_ID.equals(text(catalog, "seedId")) || catalog.path("users").size() != 5
                || catalog.path("hotels").size() != 10 || !"Đà Nẵng".equals(text(catalog, "city"))) {
            throw new IllegalArgumentException("Expected the reviewed 10-hotel, 5-user Da Nang dev catalog.");
        }
        Set<String> users = new HashSet<>();
        Set<String> emails = new HashSet<>();
        int hosts = 0;
        for (JsonNode user : catalog.path("users")) {
            String username = text(user, "username");
            String email = text(user, "email");
            if (!username.matches("demo_dn_(guest0[1-4]|host01)") || !email.endsWith("@example.com")
                    || !users.add(username) || !emails.add(email)) {
                throw new IllegalArgumentException("Invalid or duplicate synthetic account.");
            }
            Set<String> roles = new HashSet<>();
            user.path("roles").forEach(role -> roles.add(role.asText()));
            boolean host = username.equals(HOST);
            if (!roles.equals(host ? Set.of("HOST", "GUEST") : Set.of("GUEST"))) {
                throw new IllegalArgumentException("Only four guests and one host are allowed, with no ADMIN role.");
            }
            hosts += host ? 1 : 0;
        }
        if (hosts != 1) {
            throw new IllegalArgumentException("Missing the single synthetic host.");
        }
        Set<String> keys = new HashSet<>();
        Set<String> hotels = new HashSet<>();
        for (JsonNode hotel : catalog.path("hotels")) {
            String key = text(hotel, "key");
            if (!key.matches("[a-z0-9-]+") || !keys.add(key)
                    || !hotels.add(normalize(text(hotel, "name")) + "|" + normalize(text(hotel, "address")))
                    || hotel.path("demoPriceVnd").asLong() <= 0 || hotel.path("demoAreaSqm").asInt() <= 0
                    || !text(hotel, "primarySource").startsWith("https://")) {
                throw new IllegalArgumentException("Invalid or duplicate hotel in the reviewed catalog.");
            }
            if (!Files.isRegularFile(root.resolve("airbnb_service/src/main/resources/static" + placeholder(hotel)))) {
                throw new IllegalArgumentException("Missing local placeholder for " + key);
            }
            Set<String> amenities = new HashSet<>();
            for (JsonNode amenity : hotel.path("verifiedAmenities")) {
                if (!Set.of("Wifi", "Hồ bơi chung").contains(text(amenity, "name"))
                        || !amenities.add(text(amenity, "name")) || !text(amenity, "sourceUrl").startsWith("https://")) {
                    throw new IllegalArgumentException("Each amenity needs unique, reviewed source evidence.");
                }
            }
        }
        LocalDate start = LocalDate.parse(text(catalog, "demoAvailableFrom"));
        LocalDate end = LocalDate.parse(text(catalog, "demoAvailableTo"));
        if (start.isAfter(end) || end.isBefore(LocalDate.now(ZoneId.of("Asia/Bangkok")))) {
            throw new IllegalArgumentException("Demo availability has expired; revise and approve the catalog again.");
        }
    }

    private static String description(JsonNode catalog, JsonNode hotel) {
        Set<String> sources = new java.util.LinkedHashSet<>();
        sources.add(text(hotel, "primarySource"));
        hotel.path("verifiedAmenities").forEach(amenity -> sources.add(text(amenity, "sourceUrl")));
        return "[DEMO " + SEED_ID + ":" + text(hotel, "key") + "]\n" + text(hotel, "shortDescription")
                + "\nDỮ LIỆU MẪU: Giá " + hotel.path("demoPriceVnd").asLong() + " VND/đêm, diện tích "
                + hotel.path("demoAreaSqm").asInt() + " m², " + text(catalog, "demoRoomType")
                + "; lịch " + text(catalog, "demoAvailableFrom") + " đến " + text(catalog, "demoAvailableTo")
                + " chỉ để thử ứng dụng. Ảnh placeholder, chủ chỗ ở là tài khoản giả, không đại diện khách sạn."
                + "\nNguồn công khai (đối chiếu " + text(catalog, "checkedOn") + "): " + String.join(" ; ", sources);
    }

    private static String userMarker(String username) {
        return "[DEMO " + SEED_ID + ":user:" + username + "] Tài khoản giả; không đại diện khách sạn thực tế.";
    }

    private static String placeholder(JsonNode hotel) {
        return "/uploads/seed-danang/" + text(hotel, "key") + ".svg";
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT).replace('đ', 'd').replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static String text(JsonNode node, String field) {
        String value = node.path(field).asText("");
        if (value.isBlank()) {
            throw new IllegalArgumentException("Missing catalog field " + field);
        }
        return value;
    }

    private static Object lookup(Connection connection, String sql, String name, List<String> problems) throws SQLException {
        List<Map<String, Object>> found = rows(connection, sql, name);
        if (found.size() != 1) {
            problems.add("Expected exactly one active prerequisite: " + name + "; found " + found.size());
            return null;
        }
        return found.get(0).get("id");
    }

    private static PreparedStatement statement(Connection connection, String sql, Object... parameters) throws SQLException {
        PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        for (int i = 0; i < parameters.length; i++) {
            statement.setObject(i + 1, parameters[i]);
        }
        return statement;
    }

    private static List<Map<String, Object>> rows(Connection connection, String sql, Object... parameters) throws SQLException {
        try (PreparedStatement statement = statement(connection, sql, parameters); ResultSet result = statement.executeQuery()) {
            List<Map<String, Object>> rows = new ArrayList<>();
            while (result.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= result.getMetaData().getColumnCount(); i++) {
                    row.put(result.getMetaData().getColumnLabel(i), result.getObject(i));
                }
                rows.add(row);
            }
            return rows;
        }
    }

    private static void execute(Connection connection, String sql, Object... parameters) throws SQLException {
        try (PreparedStatement statement = statement(connection, sql, parameters)) {
            if (statement.executeUpdate() != 1) {
                throw new SQLException("Expected exactly one inserted row.");
            }
        }
    }

    private static long insert(Connection connection, String sql, Object... parameters) throws SQLException {
        try (PreparedStatement statement = statement(connection, sql, parameters)) {
            if (statement.executeUpdate() != 1) {
                throw new SQLException("Expected exactly one inserted row.");
            }
            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (!keys.next()) {
                    throw new SQLException("Missing generated primary key.");
                }
                return keys.getLong(1);
            }
        }
    }

    private static String databasePassword(Path root) throws Exception {
        String environment = System.getenv("RESTNESST_MYSQL_PASSWORD");
        if (environment != null && !environment.isBlank()) {
            return environment;
        }
        Path path = root.resolve("tools/database-toolbox/.local/credentials.json");
        requirePrivateFile(path);
        try {
            return text(JSON.readTree(Files.readAllBytes(path)), "password");
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot read local codex_dev credentials; password remains hidden.");
        }
    }

    private static ObjectNode loadLoginSecrets(Path path) throws Exception {
        if (!Files.exists(path)) {
            return JSON.createObjectNode();
        }
        requirePrivateFile(path);
        try {
            JsonNode value = JSON.readTree(Files.readAllBytes(path));
            if (value instanceof ObjectNode object) {
                return object;
            }
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot read local seed login credentials; contents remain hidden.");
        }
        throw new IllegalStateException("Invalid local seed login credentials; contents remain hidden.");
    }

    private static void requirePrivateFile(Path path) throws Exception {
        if (!Files.isRegularFile(path) || !Files.getOwner(path).equals(Files.getOwner(path.getParent()))
                || Files.getPosixFilePermissions(path).stream().anyMatch(permission -> permission.name().startsWith("GROUP_")
                        || permission.name().startsWith("OTHERS_"))) {
            throw new IllegalStateException("Credential file must be private (0600), with the same owner as its folder.");
        }
    }

    private static void saveLoginSecrets(Path path, ObjectNode secrets) throws Exception {
        Files.createDirectories(path.getParent());
        Files.setPosixFilePermissions(path.getParent(), PosixFilePermissions.fromString("rwx------"));
        Path temporary = Files.createTempFile(path.getParent(), "seed-accounts-", ".json",
                PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        try {
            Files.write(temporary, JSON.writerWithDefaultPrettyPrinter().writeValueAsBytes(secrets));
            Files.move(temporary, path, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(temporary);
        }
    }

    private static String safeMessage(Exception exception) {
        if (exception instanceof com.fasterxml.jackson.core.JsonProcessingException) {
            return "Invalid JSON input; contents are not printed.";
        }
        if (exception instanceof SQLException) {
            return "Database operation failed; transaction was rolled back. SQLState="
                    + ((SQLException) exception).getSQLState() + ", code=" + ((SQLException) exception).getErrorCode();
        }
        return exception.getMessage();
    }
}
