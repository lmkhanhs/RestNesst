# Backend Spring Boot

Áp dụng trong `airbnb_service/`; kế thừa [hướng dẫn gốc](../AGENTS.md).

## Cấu trúc và trách nhiệm

- Java 17, Spring Boot 3.3.8, Maven. Source: `src/main/java/com/pbl5cnpm/airbnb_service/`.
- `controller/`: HTTP, binding request và response; không truy vấn DB hoặc chứa nghiệp vụ phức tạp.
- `service/`: quy tắc nghiệp vụ, validation và transaction của một thao tác.
- `repository/`: JPA và native SQL; `mapper/`: chuyển đổi bằng MapStruct; `entity/` và `dto/`: mô hình dữ liệu và hợp đồng API.
- `configuration/`: cấu hình Spring; `src/main/resources/application.yml`: cấu hình runtime. Không tạo thêm `application.properties` chứa cùng khóa.
- `scripts/` và package `seed/`: công cụ dev gọi chủ động; không tự chạy seed mẫu khi backend khởi động.

## Khi sửa code

- Theo format xung quanh, Java thụt 4 dấu cách; PascalCase cho class, camelCase cho method/biến. Dùng constructor injection theo cách sẵn có.
- Refactor một luồng có phạm vi rõ. Giữ cả message, error code, HTTP status, thứ tự validation và cách xóa mềm hiện tại khi chúng ảnh hưởng kết quả.
- Không tự sửa tên cột/field cũ như `amenites`, `thumnailUrl`, `deteted`, `avgStart`; chúng có thể được dùng bởi SQL, mapper và frontend.
- Khi chuyển nghiệp vụ giữa service, giữ ranh giới transaction và exception. Truy vấn có tham số; không nối đầu vào vào SQL.
- Thay đổi entity/DTO phải kiểm tra mapper, repository/custom SQL và caller. Không dùng `ddl-auto=update` như lý do để đổi schema ngoài yêu cầu.
- Thay đổi auth, booking hoặc payment cần kiểm tra cả phân quyền, trạng thái và các nhánh lỗi liên quan.

## Persistence và asset

- MySQL lưu user, role, listing, booking và các nghiệp vụ khác. Yêu cầu làm host nằm ở `users.host_application_pending`; role HOST tách biệt với cờ chờ duyệt.
- Redis blacklist dùng `StringRedisTemplate`, key theo `jti` và TTL theo hạn token. Không bỏ qua lỗi Redis rồi coi token là hợp lệ. Xem [README](README.md) trước khi sửa luồng này.
- Seed hiện có trong `ApplicationInitConfig` tạo dữ liệu nền khi chạy Spring; xem tác động trước khi khởi động bằng database mới. Preview seed riêng không được khởi động Spring/SMTP/scheduler hoặc tự ghi dữ liệu.
- Ảnh local: `src/main/resources/static/uploads/`, URL `/uploads/...`; giữ đúng cách lưu đường dẫn của caller. Ảnh local không phải browser `localStorage` và không tự chuyển qua Cloudinary.
- Mọi seed/SQL dev tuân theo [quy tắc database](../tools/database-toolbox/AGENTS.md). Chạy lại phải bỏ qua bản trùng, không reset mật khẩu hoặc ghi đè dữ liệu cũ.

## Lệnh và kiểm tra

Chạy từ `airbnb_service/`. Dùng Maven đã cài; wrapper đang thiếu `.mvn`.

| Việc | Lệnh |
| --- | --- |
| Kiểm tra Java/Maven | `java -version`, `mvn -v` |
| Chạy backend | `mvn spring-boot:run` |
| Unit test không cần DB | `mvn -Dtest=InvalidTokenRepositoryTest,AuthenticationServiceTest,UserServiceHostApplicationTest test` |
| Toàn bộ test | `mvn test` |
| Build gồm test | `mvn clean package` |
| Build khi người dùng yêu cầu bỏ test | `mvn -DskipTests clean package` |

- Ưu tiên JDK 17. Nếu máy dùng JDK khác, báo phiên bản thực tế và khả năng build; không âm thầm thay cấu hình target của project.
- Test nằm trong `src/test/java/`; context test cần môi trường được cấu hình. Nếu không bị yêu cầu bỏ test, thêm/chạy regression test phù hợp cho auth, booking và payment.
- `-DskipTests` bỏ thực thi test nhưng Maven vẫn có thể biên dịch test. Không đổi sang cờ bỏ biên dịch test để che lỗi có sẵn.
- Backend thường ở cổng 8080; xác nhận log khởi động, cấu hình và dịch vụ phụ thuộc trước khi báo chạy được.
