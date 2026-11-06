# Chạy backend với Redis blacklist

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

```bash
mvn -Dtest=InvalidTokenRepositoryTest,AuthenticationServiceTest,UserServiceHostApplicationTest test
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
