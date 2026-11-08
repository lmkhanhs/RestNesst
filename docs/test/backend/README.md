# Test case backend — RestNesst (`airbnb_service`)

Bộ tài liệu này mô tả test case cho API Spring Boot trong `airbnb_service/`, chia theo nghiệp vụ. Nội dung được viết từ source hiện tại (controller, service, repository, `SecurityConfig`, `GlobalExceptionHandler`), nên phần **Kết quả mong đợi** phản ánh hợp đồng API đang chạy. Khi hành vi hiện tại có lỗi hoặc rủi ro, test case được gắn nhãn ⚠️ và giải thích ở mục **Phát hiện từ code** của từng file.

## Danh sách file

| # | Chức năng | File | Package nguồn |
| --- | --- | --- | --- |
| 01 | Xác thực: đăng nhập, introspect, refresh, logout, quên mật khẩu | [01-auth.md](01-auth.md) | `auth/` |
| 02 | Người dùng: đăng ký, hồ sơ, đổi mật khẩu, quản trị user | [02-user.md](02-user.md) | `user/` |
| 03 | Đăng ký làm host, duyệt/từ chối, hồ sơ host | [03-host-application.md](03-host-application.md) | `user/` |
| 04 | Listing: xem, tìm kiếm, lọc, tạo, quản lý admin/host | [04-listing.md](04-listing.md) | `listing/` |
| 05 | Đánh giá và tóm tắt đánh giá bằng AI | [05-review-ai-summarize.md](05-review-ai-summarize.md) | `review/`, `listing/` |
| 06 | Đặt phòng (booking) | [06-booking.md](06-booking.md) | `booking/` |
| 07 | Thanh toán VNPay | [07-payment.md](07-payment.md) | `payment/` |
| 08 | Yêu thích (favorite) | [08-favorite.md](08-favorite.md) | `favorite/` |
| 09 | Chat (REST + WebSocket/STOMP) | [09-chat.md](09-chat.md) | `chat/` |
| 10 | Danh mục (category) | [10-category.md](10-category.md) | `category/` |
| 11 | Tiện nghi (amenity) | [11-amenity.md](11-amenity.md) | `amenity/` |
| 12 | Quốc gia (country) | [12-country.md](12-country.md) | `country/` |
| 13 | Ngôn ngữ (language) | [13-language.md](13-language.md) | `language/` |
| 14 | Thống kê (statistics) | [14-statistics.md](14-statistics.md) | `statistics/` |

## Quy ước

### Mã test case

`<MODULE>-<NHÓM>-<STT>`, ví dụ `AUTH-LOGIN-01`, `BOOK-HOST-03`. Khi thêm test tự động, nên ghi ID vào `@DisplayName` hoặc tên method để truy vết.

### Cột trong bảng

| Cột | Ý nghĩa |
| --- | --- |
| **ID** | Mã test case |
| **Kịch bản** | Điều cần kiểm tra |
| **Tiền điều kiện / Dữ liệu** | Trạng thái DB, token, payload |
| **Kết quả mong đợi** | HTTP status, `code`, `message`, thay đổi DB |
| **Ưu tiên** | `P1` bắt buộc (bảo mật, tiền, trạng thái), `P2` quan trọng, `P3` bổ sung |
| **Loại** | `U` unit (Mockito), `I` integration (`@SpringBootTest`/`@DataJpaTest`/MockMvc), `S` bảo mật/phân quyền |
| **Tự động** | Test hiện có trong `src/test/java` (nếu có), `—` nếu chưa có |

### Tài khoản / vai trò dùng chung

| Ký hiệu | Mô tả |
| --- | --- |
| `ANON` | Không gửi header `Authorization` |
| `GUEST` | User có role `GUEST` (mặc định khi đăng ký) |
| `HOST` | User có role `HOST` (thường kèm `GUEST`) |
| `ADMIN` | User có role `ADMIN`, username `admin` (chat dùng username này) |
| `TOKEN_INVALID` | Token sai chữ ký / hết hạn / đã logout / là refresh token |

Token gửi qua header `Authorization: Bearer <access_token>`. Scope trong JWT là tên role không có tiền tố (`ADMIN`, `HOST`, `GUEST`), khớp `hasAuthority('...')`.

### Định dạng phản hồi chung

```json
{ "code": 200, "timestamp": "...", "message": "...", "result": { } }
```

- `ApiResponse` dùng `@JsonInclude(NON_NULL)`. Trường `code` khai báo `int code = 200` nhưng **không** có `@Builder.Default`, nên endpoint dựng bằng builder mà không gọi `.code(...)` sẽ trả `"code": 0` (ví dụ `GET /api/countries`, `GET /api/users/myInformation`).
- `code` trong body là mã nghiệp vụ, **có thể khác** HTTP status (ví dụ `POST /api/bookings` trả HTTP 200 nhưng `code: 201`).

### Phản hồi lỗi chung (dùng cho mọi file)

| Tình huống | HTTP | Body |
| --- | --- | --- |
| `ANON` gọi endpoint không public | 401 | `code: 106`, `message: "unauthenticated! \|\| token is invalid "` (`JwtAuthenticationEntryPoint`) |
| `TOKEN_INVALID` gọi endpoint không public | 401 | như trên |
| Đã đăng nhập nhưng thiếu quyền `@PreAuthorize` | 403 | `code: 1010`, `message: "Error: Authority"`, `result: "user have no permisson!"` |
| `ANON` gọi endpoint `permitAll` ở filter nhưng có `@PreAuthorize` (ví dụ `POST /api/categories`, `POST /api/countries`) | 403 | như dòng trên (không phải 401) |
| `AppException(ErrorCode.X)` | theo `ErrorCode.X.httpStatus` | `code`, `message` của `ErrorCode` |
| `RuntimeException` khác (NPE, `DateTimeParseException`, lỗi SQL...) | 400 | chỉ có `message` = message của exception, `code: 200` mặc định |
| `@Valid` sai | 400 | `code`/`message` của `ErrorCode` có tên bằng `message` của annotation; tên không tồn tại → `INVALID_KEY` (105) |

Bảng `ErrorCode` hay gặp:

| ErrorCode | code | HTTP |
| --- | --- | --- |
| `USER_EXISTED` | 1000 | 500 |
| `ROLE_NOT_EXISTED` | 1001 | 500 |
| `USERNAME_EXISTED` | 1002 | 500 |
| `USERNAME_VALID` | 1003 | 500 |
| `PASSWORD_VALID` | 1004 | 500 (nhưng qua `@Valid` trả 400) |
| `INVALID_KEY` | 105 | 500 (qua `@Valid` trả 400) |
| `UNAUTHENTICATED` | 106 | 401 |
| `COUNTRY_EXISTED` | 1007 | 500 |
| `LISTING_NOT_EXISTED` | 1008 | 500 |
| `USER_NOT_EXISTED` | 1009 | 500 |
| `UNAUTHORIZED` | 1010 | 403 |
| `INVALID` | 1011 | 400 |
| `FAVORITE_NOT_EXISTED` | 1012 | 400 |
| `COUNTRY_NOT_EXISTED` | 1014 | 400 |
| `PASSWORD_INVALID` | 1015 | 400 |
| `PASSWORD_CONFIRM_NOT_MATCH` | 1016 | 400 |
| `BOOKING_NOT_EXIT` | 1017 | **502** |
| `BOOKING_DIFFERECES_PAID` | 1018 | 400 |
| `PAYMENT_NOT_EXIST` | 1019 | 400 |
| `CATEGORY_NOT_EXIT` | 1020 | 400 |
| `EMENITIES_NOT_EXIT` | 1021 | 400 |
| `ACCOUNT_NOT_ACCESS` | 1022 | 400 |
| `LISTING_NOT_ADMIN_OR_HOST` | 1023 | 400 |
| `SUMMARIZE_TEXT_EMPTY` | 1024 | 400 |
| `AI_SERVICE_UNAVAILABLE` | 1025 | 503 |
| `LANGUAGE_EXISTED` | 1026 | 400 |
| `LANGUAGE_NOT_EXISTED` | 1027 | 400 |

## Môi trường chạy test

- Chạy từ `airbnb_service/`, JDK 17, Maven (xem [airbnb_service/AGENTS.md](../../../airbnb_service/AGENTS.md)).
- Unit test không cần DB: `mvn -Dtest=InvalidTokenRepositoryTest,AuthenticationServiceTest,UserServiceHostApplicationTest,ListingsAdminDetailTest,ListingsAdminDetailSecurityTest,BackendPackageDiscoveryTest test`.
- Toàn bộ test: `mvn test` (cần MySQL/Redis theo `application.yml`).
- Test integration chạm DB phải dùng DB test riêng hoặc `@DataJpaTest` với H2 như `FavoriteRepositoryTest`; không chạy trên DB dev thật. Mọi seed/xoá dữ liệu tuân theo [quy tắc database](../../../tools/database-toolbox/AGENTS.md).
- Mock các dịch vụ ngoài: `MailerService` (SMTP), `CloudinaryService`, AI service (`ai.service.url`), VNPay (chỉ cần `vnpay.hashSecret` để tự ký URL return).

## Đề xuất thứ tự tự động hoá

1. `P1` + `S`: phân quyền, IDOR, SQL injection, chữ ký VNPay, chuyển trạng thái booking/payment.
2. `P1` + `U`: logic service có nhánh lỗi (auth, booking, payment, host application).
3. `P2`: CRUD danh mục, favorite, chat, thống kê.
