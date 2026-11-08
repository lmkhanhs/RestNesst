# 01 — Xác thực (Auth)

- Controller: [`AuthenticationController`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/controller/AuthenticationController.java)
- Service: [`AuthenticationService`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/service/AuthenticationService.java)
- Blacklist: [`InvalidTokenRepository`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/repository/InvalidTokenRepository.java) (Redis, key theo `jti`, TTL theo hạn token)
- Giải mã JWT cho mọi request: [`CustomJwtDecoder`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/CustomJwtDecoder.java) gọi `introspect` trước khi decode.

## Endpoint

| Method | Path | Quyền | Body |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | `{ "username", "password" }` |
| POST | `/auth/introspect` | Public | `{ "token" }` |
| POST | `/auth/refresh` | Public (matcher khai báo `auth/refresh`, thiếu `/`) | `{ "refresh_token" }` |
| POST | `/auth/logout` | Public | `{ "access_token", "refresh_token" }` |
| POST | `/auth/forget` | Public | `{ "username", "email" }` |

## Dữ liệu chuẩn bị

- `u_active`: user `isActive = true`, mật khẩu `Passw0rd!`, role `GUEST`.
- `u_locked`: user `isActive = false`.
- `u_admin`: role `ADMIN`.
- `security.duration_access`, `security.duration_refresh` là số giây; `security.secret` là khoá HS512.

## Test case

### Đăng nhập — `POST /auth/login`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-LOGIN-01 | Đăng nhập đúng | `u_active` + mật khẩu đúng | HTTP 200, `code: 200`, `message: "Login succesfully!"`, `result.access_token`, `result.refresh_token` khác rỗng, `result.expired_token = duration_access` | P1 | I | — |
| AUTH-LOGIN-02 | Claim của access token | Giải mã `access_token` từ AUTH-LOGIN-01 | `sub = username`, `iss = "inmobi.com.vn"`, `type_token = "access"`, có `jti` (UUID), `scope` chứa role cách nhau bởi dấu cách, `exp - iat = duration_access` | P1 | U | — |
| AUTH-LOGIN-03 | Claim của refresh token | Giải mã `refresh_token` | `type_token = "refresh"`, `exp - iat = duration_refresh`, `jti` khác access token | P1 | U | — |
| AUTH-LOGIN-04 | Cập nhật `lastLogin` | Đăng nhập thành công | `users.last_login` được cập nhật thời điểm hiện tại | P3 | U | — |
| AUTH-LOGIN-05 | Sai mật khẩu | `u_active` + mật khẩu sai | HTTP 401, `code: 106`; không phát token; `lastLogin` không đổi | P1 | U/I | — |
| AUTH-LOGIN-06 | Username không tồn tại | `username = "khong_ton_tai"` | HTTP 500, `code: 1000` (`USER_EXISTED` — tên mã gây hiểu nhầm) ⚠️ | P2 | U/I | — |
| AUTH-LOGIN-07 | Tài khoản bị khoá | `u_locked` + mật khẩu đúng | HTTP 400, `code: 1022` (`ACCOUNT_NOT_ACCESS`) | P1 | U | — |
| AUTH-LOGIN-08 | Tài khoản bị khoá + sai mật khẩu | `u_locked` + mật khẩu sai | Hiện tại vẫn trả `1022` vì kiểm tra `isActive` trước mật khẩu ⚠️ | P2 | U | — |
| AUTH-LOGIN-09 | Body thiếu trường | `{}` | Không phát token; lỗi 4xx/5xx, không phải 200 | P2 | I | — |

### Introspect — `POST /auth/introspect`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-INTRO-01 | Access token hợp lệ | Token từ login | HTTP 200, `result.vaild = true`, `message: "Introspect valid!"` | P1 | U | `AuthenticationServiceTest.acceptsUnblockedAccessToken` |
| AUTH-INTRO-02 | Token đã bị blacklist | `jti` có trong Redis | HTTP 401, `code: 106` | P1 | U | `AuthenticationServiceTest.rejectsBlacklistedAccessToken` |
| AUTH-INTRO-03 | Dùng refresh token để introspect | `token = refresh_token` | HTTP 401, `code: 106` (chỉ chấp nhận `type_token = access`) | P1 | U | — |
| AUTH-INTRO-04 | Token hết hạn | `exp` trong quá khứ | HTTP 401; không gọi Redis | P1 | U | `AuthenticationServiceTest.expiredTokensNeverReachRedis` (gián tiếp) |
| AUTH-INTRO-05 | Token sai chữ ký | Ký bằng secret khác | HTTP 401, `code: 106` | P1 | U | — |
| AUTH-INTRO-06 | Chuỗi không phải JWT | `token = "abc"` | HTTP 401, `code: 106` | P2 | U | — |
| AUTH-INTRO-07 | Token không có `jti` | Tự ký token hợp lệ nhưng thiếu `jti` | HTTP 401, `code: 106` | P2 | U | — |
| AUTH-INTRO-08 | Redis không phản hồi | Mock Redis ném lỗi | Không coi token là hợp lệ; request thất bại | P1 | U | `InvalidTokenRepositoryTest.doesNotTreatRedisOutageAsUnblockedToken` |

### Refresh — `POST /auth/refresh`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-REF-01 | Refresh hợp lệ | `refresh_token` còn hạn, chưa blacklist | HTTP 200, `message: "refresh token succesfully"`, cặp token mới | P1 | U | `AuthenticationServiceTest.refreshesUnblockedToken` |
| AUTH-REF-02 | Refresh token bị blacklist | Đã logout | HTTP 401, `code: 106`; không phát token | P1 | U | `AuthenticationServiceTest.rejectsBlacklistedRefreshTokenBeforeIssuingTokens` |
| AUTH-REF-03 | Dùng access token để refresh | `refresh_token = access_token` | HTTP 401, `code: 106` | P1 | U | — |
| AUTH-REF-04 | Refresh token hết hạn | | HTTP 401, `code: 106` | P1 | U | — |
| AUTH-REF-05 | User của token đã bị xoá | `sub` không còn trong DB | HTTP 500, `code: 1009` | P3 | U | — |
| AUTH-REF-06 | Truy cập không cần token | `ANON` gọi `/auth/refresh` | Không bị 401 bởi filter (xác nhận matcher `auth/refresh` thiếu `/` vẫn khớp) ⚠️ | P1 | S | — |
| AUTH-REF-07 | Refresh token cũ dùng lại sau khi refresh | Gọi refresh 2 lần cùng một token | Hiện tại cả hai lần đều thành công vì token cũ không bị blacklist ⚠️ | P2 | U | — |

### Logout — `POST /auth/logout`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-OUT-01 | Logout hợp lệ | Cả hai token còn hạn | HTTP 204, body rỗng; Redis lưu `jti` của cả hai với TTL = thời gian còn lại | P1 | U | `AuthenticationServiceTest.logoutInvalidatesAccessAndRefreshTokens`, `InvalidTokenRepositoryTest.storesOnlyTokenIdWithRemainingLifetime` |
| AUTH-OUT-02 | Dùng access token sau logout | Gọi `GET /api/users/myInformation` | HTTP 401, `code: 106` | P1 | S | — |
| AUTH-OUT-03 | Token hết hạn hoặc sai | | HTTP 204; không ghi Redis | P2 | U | `AuthenticationServiceTest.expiredTokensNeverReachRedis` |
| AUTH-OUT-04 | Thiếu một trong hai token | `{ "access_token": "<hợp lệ>" }` | HTTP 204; chỉ blacklist access token | P3 | U | — |
| AUTH-OUT-05 | Không lưu token đã hết hạn | | Redis không có key | P2 | U | `InvalidTokenRepositoryTest.doesNotStoreExpiredToken` |

### Quên mật khẩu — `POST /auth/forget`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-FORGET-01 | Username + email khớp | Mock `MailerService` | HTTP 200, `message: "update new pass"`; gửi 1 email tiêu đề "Đặt lại mật khẩu" chứa mật khẩu 12 ký tự `[A-Za-z0-9]`; mật khẩu trong DB được mã hoá bằng mật khẩu mới | P1 | U | — |
| AUTH-FORGET-02 | Đăng nhập bằng mật khẩu mới | Sau AUTH-FORGET-01 | Login thành công bằng mật khẩu trong email; mật khẩu cũ bị từ chối | P1 | I | — |
| AUTH-FORGET-03 | Email không khớp | Username đúng, email sai | HTTP 200, cùng message (không lộ thông tin); không gửi mail; mật khẩu không đổi | P1 | U | — |
| AUTH-FORGET-04 | Username không tồn tại | | HTTP 500, `code: 1009` — lộ việc username có tồn tại hay không ⚠️ | P2 | U | — |
| AUTH-FORGET-05 | Gửi mail lỗi | `sendSimpleEmail` ném `MessagingException` | Request thất bại; mật khẩu **không** bị đổi (mail gửi trước khi save) | P1 | U | — |
| AUTH-FORGET-06 | Bị gọi bởi người khác | Biết username + email của nạn nhân | Mật khẩu nạn nhân bị đặt lại ngay, không có bước xác nhận ⚠️ | P2 | S | — |

## Phát hiện từ code

| Liên quan | Mô tả | Đề xuất |
| --- | --- | --- |
| AUTH-LOGIN-06 | Username sai trả `USER_EXISTED` (1000, HTTP 500) | Dùng `USER_NOT_EXISTED` hoặc `UNAUTHENTICATED` chung để không lộ username |
| AUTH-LOGIN-08 | Kiểm tra `isActive` trước mật khẩu → lộ trạng thái khoá mà không cần mật khẩu | Kiểm tra mật khẩu trước |
| AUTH-REF-06 | `PUBLIC_POST` khai báo `"auth/refresh"` không có `/` đầu | Kiểm thử thực tế; nên sửa thành `/auth/refresh` |
| AUTH-REF-07 | Refresh không thu hồi refresh token cũ | Blacklist `jti` cũ khi refresh |
| AUTH-FORGET-04/06 | Quên mật khẩu đặt lại ngay và lộ username | Dùng link/OTP có hạn, luôn trả cùng một phản hồi |
