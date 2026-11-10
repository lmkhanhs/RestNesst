# Backend RestNesst

## Cấu trúc source

Backend tổ chức theo nghiệp vụ trong `src/main/java/com/pbl5cnpm/airbnb_service/`: `user/`, `auth/`, `role/`, `listing/`, `booking/`, `payment/`, `favorite/`, `review/`, `chat/`, `amenity/`, `category/`, `country/`, `statistics/`.

Mỗi nghiệp vụ chứa controller, service, repository, mapper, entity, enum và DTO tương ứng khi cần. Ví dụ `user/controller/UserController.java`, `user/service/UserService.java`, `user/repository/UserRepository.java`. Package DTO dùng `dto/request/` và `dto/response/`; custom repository nằm trong `repository/custom/impl/`.

Phần dùng chung ở `shared/`; cấu hình Spring ở `configuration/`; công cụ seed ở `seed/`. Test phản chiếu cấu trúc nghiệp vụ dưới `src/test/java/`. Xem [kiến trúc](../docs/architecture.md#backend-tổ-chức-theo-nghiệp-vụ) và [hướng dẫn backend](AGENTS.md) trước khi thêm code.

Sau khi đổi package, dùng `mvn clean` trước lệnh test/build để xóa class và mapper sinh ở vị trí cũ. Việc tổ chức lại source giữ nguyên tên lớp, API và schema dữ liệu.

## Chạy backend với Redis blacklist

MySQL lưu dữ liệu nghiệp vụ và yêu cầu làm host ngay trong bảng `users`.
Backend không còn cần MongoDB.
Blacklist token dùng Redis qua `StringRedisTemplate` (Spring Boot 3.3).

Từ thư mục gốc project, chạy Redis độc lập với container MySQL hiện có:

```bash
docker compose -f compose.redis.yaml up -d
docker compose -f compose.redis.yaml exec redis redis-cli ping
```

Kết quả kiểm tra là `PONG`. Sau đó chạy backend:

```bash
cd airbnb_service
mvn clean spring-boot:run
```

Mặc định Redis ở `localhost:6379`. Có thể đặt `REDIS_HOST`, `REDIS_PORT`,
`REDIS_PASSWORD` trong môi trường backend. Nếu backend cũng chạy trong Docker,
đặt host Redis thành tên service trên cùng Docker network.

## Hành vi

### Danh sách yêu thích

`GET /api/users/favorites` đọc favorite bằng JPQL, fetch quan hệ `FavoriteEntity.listing` cùng review, lọc theo user hiện tại và `deteted = false`, sắp xếp theo ngày lưu mới nhất. Không dùng native `SELECT l.*` trả về entity khác với domain của `FavoriteRepository`, vì Spring Data có thể trả tuple/null hoặc lỗi chuyển kiểu sang `ListingEntity`. Việc đọc và map DTO nằm trong transaction read-only để đọc được quan hệ ảnh.

GET giữ `result.favorites` và các field ảnh `primaryThumnail`, giá, địa chỉ hiện tại; bổ sung `savedAt` từ `favorites.createdAt`, `avgStart` là trung bình rating của review thực tế (null nếu chưa có), `reviewCount`, `positiveReviewCount`, `negativeReviewCount`, `unclassifiedReviewCount`. Chỉ đếm nhãn `POSITIVE`/`NEGATIVE` đã lưu; nhãn khác hoặc null thuộc nhóm chưa phân loại, không suy diễn từ số sao và không gọi model AI trong GET. Không trả nội dung bình luận hoặc thông tin người đánh giá qua endpoint này.

POST vẫn trả `204`; DELETE xóa mềm và gửi ID trong request body. Không thay schema hay cập nhật dữ liệu có sẵn. Ngày lưu phản ánh lần lưu hiện tại theo hành vi POST có sẵn; thêm lại favorite đã bỏ sẽ cập nhật ngày này.

```bash
mvn -Dtest=FavoriteRepositoryTest test
```

Test này dùng H2 chỉ trong test scope, ép thay datasource bằng database trong bộ nhớ và cấu hình JPA riêng, không chạy startup seed hay truy cập MySQL dev. Kiểm tra lọc đúng user/xóa mềm, kiểu entity trả về, DTO ảnh và chu trình thêm, đọc, bỏ, thêm lại không tạo bản ghi trùng.

### Blacklist token

- Login tạo JWT như trước; không ghi blacklist.
- Logout ghi ID (`jti`) của access và refresh token với key
  `restnesst:auth:blacklist:<jti>` và TTL bằng thời gian còn lại đến `exp`.
- Redis tự xóa key hết hạn; không lưu toàn bộ JWT.
- Introspect/API được bảo vệ và refresh đều kiểm tra blacklist.
- Refresh vẫn giữ hành vi cấp cặp token mới như trước; không bổ sung rotation
  thu hồi refresh token cũ trong thay đổi này.
- Lỗi kết nối Redis được truyền lên; không coi token là hợp lệ khi không kiểm tra được.
- Compose bật AOF, fsync mỗi lần ghi và `noeviction` để giữ blacklist khi restart
  và tránh loại key trước hạn. Không xóa volume khi còn token hiệu lực.
  Fsync mỗi lần ghi ưu tiên độ bền; cần benchmark trên môi trường thực tế.

## Chuyển từ blacklist MongoDB đang có

Dữ liệu collection `InvalidToken` cũ không tự động chuyển sang Redis.
Trước khi cho phép lưu lượng vào phiên bản mới, phải nhập các bản ghi chưa hết hạn
sang Redis với key ở trên, giá trị `1`, TTL = `expired - thời gian hiện tại`.
Dừng các instance cũ trong quá trình chuyển để tránh ghi blacklist vào hai nơi.
Một lựa chọn khác là đổi `security.secret` đồng bộ trên mọi instance khi triển khai
để vô hiệu hóa toàn bộ JWT cũ và yêu cầu người dùng đăng nhập lại.
Không triển khai Redis rỗng với khóa ký cũ khi còn blacklist chưa hết hạn.

## Kiểm thử

### Bộ đặc tả đăng nhập, yêu cầu host và tạo booking

Chạy từ `airbnb_service/`:

```bash
python3 scripts/run_backend_specs.py --offline
```

Script chạy profile `backend-specs` và tạo [báo cáo từng ID](../docs/testing/backend/execution-results.md) từ XML mới. Bỏ `--offline` nếu cần Maven tải dependency. Profile chỉ dùng H2 in-memory riêng và blacklist double, không nạp `application.yml`, startup seed hoặc datasource dev. Kiểm tra HTTP đi qua Spring Security/controller/service/mapper/JPA thật; không thay thế nghiệm thu MySQL/Redis.

Profile dùng Byte Buddy agent từ dependency đã được Spring Boot quản lý để Mockito chạy được khi JVM không cho tự attach. Không đổi Java target 17; môi trường JVM thực tế xem trong log Maven. Các ca `proposal` dùng kỳ vọng [ĐX]/Q chưa chốt và có thể đang Fail; `observation` chưa đủ oracle. Lệnh giữ exit code lỗi, không che test thất bại.

Chạy riêng những ca đã có hợp đồng, không cập nhật báo cáo Markdown:

```bash
mvn -Pbackend-specs -DexcludedGroups=proposal,observation test
```

Các class `*AcceptanceIT` chỉ chạy khi gọi profile hoặc chọn `-Dtest` tường minh; 17 ca unit mới vẫn được `mvn test` phát hiện bình thường.

### Các regression test hiện có

```bash
mvn -Dtest=InvalidTokenRepositoryTest,AuthenticationServiceTest,UserServiceHostApplicationTest,ListingsAdminDetailTest,ListingsAdminDetailSecurityTest,BackendPackageDiscoveryTest test
```

Các unit test không cần MySQL/Redis đang chạy. Test context hiện có
vẫn cần các dịch vụ được cấu hình. Kiểm tra thực tế bằng cách login, gọi
`/auth/logout` với cặp token, rồi xác nhận access token bị từ chối và
`/auth/refresh` từ chối refresh token vừa logout. Có thể xem TTL bằng:

```bash
docker compose -f compose.redis.yaml exec redis redis-cli --scan --pattern 'restnesst:auth:blacklist:*'
docker compose -f compose.redis.yaml exec redis redis-cli TTL restnesst:auth:blacklist:JTI
```

Thay `JTI` bằng ID lấy từ kết quả scan. TTL dương giảm dần, key tự biến mất khi hết hạn.

`BackendPackageDiscoveryTest` kiểm tra component/MapStruct, entity JPA và các custom repository vẫn được Spring phát hiện từ package gốc sau khi tổ chức lại source. Test này không khởi động backend hay kết nối database; không thay thế kiểm tra tích hợp.

## Yêu cầu làm host trong MySQL

Chỉ thêm cột `users.host_application_pending` kiểu boolean, mặc định `false`:

- Gửi yêu cầu: cập nhật thông tin host trên user và đặt `true`.
- Danh sách chờ duyệt: truy vấn những user có cờ `true` ngay trong MySQL.
- Duyệt: thêm quyền `HOST` và đặt cờ `false` trong cùng transaction.
- Từ chối: đặt cờ `false`; user có thể gửi lại yêu cầu.
- User đã có quyền `HOST` không được gửi lại. Không duyệt user chưa gửi yêu cầu.

Giữ nguyên endpoint và DTO cho frontend. Cờ này không lưu lịch sử duyệt/từ chối;
quyền `HOST` hiện có cho biết user đã được cấp quyền.

Với `spring.jpa.hibernate.ddl-auto=update`, Hibernate thêm cột khi backend khởi động.
Nếu quản lý schema thủ công, chạy SQL sau **một lần trước khi chạy bản mới**, chỉ khi
cột chưa tồn tại:

```sql
ALTER TABLE users
    ADD COLUMN host_application_pending BOOLEAN NOT NULL DEFAULT FALSE;
```

Yêu cầu chờ duyệt cũ ở collection MongoDB `ApplyHost` không tự động chuyển sang MySQL.
Trước khi bỏ MongoDB, lấy các `hostId` có `deleted: false` (loại trùng), đối chiếu user
còn tồn tại và chưa có quyền `HOST`, rồi cập nhật cờ thành `TRUE` cho những user đó.
Ví dụ với danh sách ID đã đối chiếu:

```sql
UPDATE users SET host_application_pending = TRUE WHERE id IN (1, 2, 3);
```

Các ID trên chỉ minh họa; không chạy trực tiếp nếu chưa đối chiếu dữ liệu thực tế.
Dừng ghi yêu cầu trong lúc chuyển dữ liệu để không bỏ sót yêu cầu mới.

## Ảnh local và Cloudinary

Ảnh mới được lưu trong `upload.directory`, API tạm trả đường dẫn `/uploads/...`. `UploadResourceConfig` phục vụ trực tiếp thư mục này, nên ảnh vừa tạo đọc được ngay khi backend đang chạy, kể cả khi chạy từ JAR; không cần chép ảnh vào `target/classes` hay khởi động lại.

Frontend dùng `shared/utils/mediaUrl.js`: đường dẫn tương đối nhận prefix từ `VITE_BACKEND_URL` (mặc định `http://localhost:8080`); URL đầy đủ `http://` hoặc `https://` từ Cloudinary giữ nguyên. Backend phải được khởi động từ `airbnb_service/` nếu dùng đường dẫn upload tương đối; khi triển khai có thể đặt `upload.directory` bằng đường dẫn ổ đĩa/mount riêng qua `UPLOAD_DIRECTORY`.

Luồng chuyển ảnh lên Cloudinary chỉ bắt đầu sau khi transaction tạo phòng commit. Khi upload thành công, backend lưu URL cloud đầy đủ; khi lỗi hoặc không nhận được URL, đường dẫn local vẫn được giữ. Bản local chưa bị xóa sau upload để các response/trang đang mở tham chiếu `/uploads/...` vẫn tải được; hiện chưa có job tự dọn những bản sao này. Ảnh đã bị xóa hoặc URL đã thành `null` từ trước không được tự phục hồi.

Kiểm tra mapping HTTP và vòng đời upload không cần DB/cloud thật:

```bash
mvn -Dtest=UploadResourceConfigTest,ListingCreationImageTest,ListingImageUploadServiceTest test
```

## Chi tiết chỗ ở cho quản trị viên

`GET /api/listings/admin/{id}` yêu cầu JWT có quyền `ADMIN`, trả envelope
`code: 200`, `result` là thông tin chi tiết của một chỗ ở chưa bị xóa mềm.
API công khai `GET /api/listings/{id}` và API danh sách tiếp tục phục vụ các caller hiện có.

- Thông tin phòng: `title`, `description`, `address`, `city`, `country`, `area`,
  `price`, `images`, `avgStart`, `startDate`, `endDate`, `createdAt`, `updatedAt`.
- Thông tin chủ sở hữu: `hostId`, `hostName`, `hostThumnailUrl`; không trả entity user.
- `amenites` và `categories`: danh sách `{ id, name, thumnailUrl }`.
- Trạng thái quản trị: `access`, `status`, `popular`, `position`.

Giữ các tên field cũ như `amenites` và `thumnailUrl`. `createdAt` là ngày tạo,
khác với `startDate` là ngày bắt đầu cho thuê. Endpoint chỉ đọc dữ liệu,
không yêu cầu đổi schema hoặc seed. Cần chạy backend với mã mới để dùng endpoint này.
