# 02 — Người dùng (User)

- Controller: [`UserController`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/controller/UserController.java)
- Service: [`UserService`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/service/UserService.java)
- Phần đăng ký host, duyệt host và hồ sơ host nằm ở [03-host-application.md](03-host-application.md).

## Endpoint

| Method | Path | Quyền | Ghi chú |
| --- | --- | --- | --- |
| POST | `/api/users` | Public | Đăng ký, JSON `UserRequest`, có `@Valid` |
| GET | `/api/users` | ADMIN | Danh sách user |
| GET | `/api/users/myInformation` | Đăng nhập | Đọc username từ header `Authorization` |
| PUT | `/api/users` | Đăng nhập | `multipart/form-data`: `fullname`, `email`, `phone`, `address`, `thumnail` |
| GET | `/api/users/counts` | ADMIN | Tổng số user |
| PUT | `/api/users/password` | **Public** | JSON `{ username, password, newPassword, verifyPassword }` |
| GET | `/api/users/{id}` | ADMIN | Chi tiết user |
| PUT | `/api/users/active/{id}/{status}` | ADMIN | Khoá/mở tài khoản |
| PUT | `/api/users/admin/change/profile` | ADMIN | JSON `{ id, fullname, email, phone, address, role }` |
| GET | `/api/users/booked?param=` | Đăng nhập | Endpoint rỗng, trả chuỗi rỗng |

## Dữ liệu chuẩn bị

- Role `GUEST`, `HOST`, `ADMIN` có trong bảng role.
- `image.customer` cấu hình URL ảnh đại diện mặc định.
- Mock `MailerService` (gửi mail chào mừng chạy ở thread riêng) và `CloudinaryService`.

## Test case

### Đăng ký — `POST /api/users`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| USER-REG-01 | Đăng ký hợp lệ | `username` ≥ 8 ký tự, `password` ≥ 6 ký tự, email, fullname, phone | HTTP 201, `code: 201`, `message: "Created user successfully!"`; DB: mật khẩu đã mã hoá (khác chuỗi gốc), roles = `{GUEST}`, `isActive = true`, `thumnailUrl = image.customer`, `hostApplicationPending = false` | P1 | I | `UserServiceHostApplicationTest.newUsersAreNotPending` (một phần) |
| USER-REG-02 | Response không lộ mật khẩu | Như trên | `result` không chứa `password` | P1 | U | — |
| USER-REG-03 | Gửi mail chào mừng | Như trên | `sendHtmlEmail(email, "Welcome to Airbnb", ...)` được gọi (bất đồng bộ) | P3 | U | — |
| USER-REG-04 | Mail lỗi không chặn đăng ký | `sendHtmlEmail` ném `MessagingException` | Vẫn HTTP 201, user được lưu | P2 | U | — |
| USER-REG-05 | Username đã tồn tại | Trùng username | HTTP 500, `code: 1002` (`USERNAME_EXISTED`); không gửi mail; không lưu | P1 | U/I | — |
| USER-REG-06 | Username < 8 ký tự | `username = "abc"` | HTTP 400, `code: 105` (`INVALID_KEY` — message `USERNAME_INVALID` không có trong `ErrorCode`) ⚠️ | P2 | I | — |
| USER-REG-07 | Password < 6 ký tự | `password = "123"` | HTTP 400, `code: 1004`, `message: "password is vaild!"` | P2 | I | — |
| USER-REG-08 | Biên username = 8 ký tự | `username = "abcdefgh"` | HTTP 201 | P3 | I | — |
| USER-REG-09 | Biên password = 6 ký tự | `password = "123456"` | HTTP 201 | P3 | I | — |
| USER-REG-10 | Thiếu username/password | `{ "email": "a@b.c" }` | Không tạo user với username/password null (hiện `@Size` cho phép null) ⚠️ | P2 | I | — |
| USER-REG-11 | Thiếu role GUEST trong DB | Bảng role trống | HTTP 500, `code: 1001` | P3 | U | — |
| USER-REG-12 | Email trùng user khác | Email đã dùng | Ghi nhận hành vi: hiện không kiểm tra trùng email ⚠️ | P3 | I | — |

### Danh sách / chi tiết / đếm (ADMIN)

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| USER-ADM-01 | ADMIN lấy danh sách | `GET /api/users` | HTTP 200, `message: "Fetched users successfully!"`, đủ số user trong DB | P2 | I | — |
| USER-ADM-02 | GUEST/HOST lấy danh sách | | HTTP 403, `code: 1010` | P1 | S | — |
| USER-ADM-03 | ANON lấy danh sách | | HTTP 401, `code: 106` | P1 | S | — |
| USER-ADM-04 | ADMIN xem chi tiết | `GET /api/users/{id}` hợp lệ | HTTP 200, `message: "get user by api"` | P2 | I | — |
| USER-ADM-05 | Chi tiết id không tồn tại | `id = 999999` | HTTP 500, `code: 1009` | P2 | U | — |
| USER-ADM-06 | GUEST xem chi tiết user khác | | HTTP 403 | P1 | S | — |
| USER-ADM-07 | Đếm user | `GET /api/users/counts` | HTTP 200, `result = userRepository.count()` | P3 | U | — |
| USER-ADM-08 | Path `/api/users/counts` không bị hiểu là `{id}` | ADMIN gọi | Trả số đếm, không lỗi parse `Long` | P3 | I | — |

### Thông tin cá nhân — `GET /api/users/myInformation`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| USER-ME-01 | Lấy thông tin bản thân | Token hợp lệ | HTTP 200, `result` là `UserInfor` của đúng user trong `sub`; `code: 0` (builder không set code) ⚠️ | P1 | I | — |
| USER-ME-02 | Không có token | `ANON` | HTTP 401 | P1 | S | — |
| USER-ME-03 | Token đã logout | | HTTP 401 | P1 | S | — |

### Cập nhật hồ sơ — `PUT /api/users` (multipart)

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| USER-PROF-01 | Cập nhật đủ trường | `fullname`, `email`, `phone`, `address` khác rỗng | HTTP 200, `message: "Update success"`; DB cập nhật đúng user trong token | P1 | I | — |
| USER-PROF-02 | Trường rỗng giữ nguyên | `email = ""`, `fullname = ""`, `phone = ""` | Giá trị cũ được giữ | P2 | U | — |
| USER-PROF-03 | Upload ảnh đại diện | Có `thumnail` | Gọi `cloudinaryService.uploadImageCloddy`; `thumnailUrl` = URL trả về | P2 | U | — |
| USER-PROF-04 | Thiếu trường `email`/`fullname`/`phone` | Chỉ gửi `address` | Hiện tại NPE → HTTP 400 với message lỗi Java ⚠️ | P2 | U | — |
| USER-PROF-05 | Không sửa được user khác | Gửi kèm `id`/`username` của user khác | Chỉ user trong token bị cập nhật | P1 | S | — |

### Đổi mật khẩu — `PUT /api/users/password`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| USER-PASS-01 | Đổi mật khẩu đúng | Mật khẩu cũ đúng, `newPassword = verifyPassword` | HTTP 200, `message: "change password succcessfully!"`; đăng nhập được bằng mật khẩu mới | P1 | I | — |
| USER-PASS-02 | Mật khẩu cũ sai | | HTTP 400, `code: 1015`; mật khẩu không đổi | P1 | U | — |
| USER-PASS-03 | Xác nhận không khớp | `newPassword ≠ verifyPassword` | HTTP 400, `code: 1016` | P1 | U | — |
| USER-PASS-04 | Username không tồn tại | | HTTP 500, `code: 1003` | P2 | U | — |
| USER-PASS-05 | Thiếu `newPassword` | | Hiện tại NPE → HTTP 400 ⚠️ | P3 | U | — |
| USER-PASS-06 | Gọi không cần token | `ANON` | Endpoint public: thành công nếu biết mật khẩu cũ; username lấy từ body, không từ token ⚠️ | P1 | S | — |
| USER-PASS-07 | Mật khẩu mới quá ngắn | `newPassword = "1"` | Ghi nhận: hiện không kiểm tra độ dài như lúc đăng ký ⚠️ | P2 | U | — |
| USER-PASS-08 | Token cũ sau khi đổi mật khẩu | | Ghi nhận: access token cũ vẫn dùng được ⚠️ | P3 | S | — |

### Khoá / mở tài khoản — `PUT /api/users/active/{id}/{status}`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| USER-ACT-01 | Khoá user | `status = false`, user có 2 listing chưa xoá | HTTP 200, `isActive = false`; mọi listing chưa xoá của user có `access = false` | P1 | U/I | — |
| USER-ACT-02 | User bị khoá đăng nhập | Sau USER-ACT-01 | Login trả HTTP 400, `code: 1022` | P1 | I | — |
| USER-ACT-03 | Mở khoá user | `status = true` | `isActive = true`; hiện tại listing cũng bị set `access = false` ⚠️ | P2 | U | — |
| USER-ACT-04 | User không tồn tại | | HTTP 500, `code: 1009` | P2 | U | — |
| USER-ACT-05 | `status` không phải boolean | `/active/1/abc` | HTTP 400 (lỗi convert path variable) | P3 | I | — |
| USER-ACT-06 | Không phải ADMIN | GUEST/HOST | HTTP 403 | P1 | S | — |
| USER-ACT-07 | Token của user đã bị khoá | Khoá user đang có access token | Ghi nhận: token cũ vẫn gọi API được tới khi hết hạn ⚠️ | P2 | S | — |

### Admin sửa hồ sơ — `PUT /api/users/admin/change/profile`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| USER-ADMPROF-01 | Sửa email, phone, address | `role = "GUEST"` hoặc `"HOST"` | Các trường được cập nhật | P2 | U | — |
| USER-ADMPROF-02 | Sửa fullname | `fullname = "Tên mới"` | Mong đợi fullname đổi; hiện tại **không đổi** (gán lại giá trị cũ) ⚠️ | P2 | U | — |
| USER-ADMPROF-03 | Nâng lên HOST | `role = "HOST"`, user đang pending | Thêm role HOST, giữ role cũ, `hostApplicationPending = false` | P1 | U | — |
| USER-ADMPROF-04 | Hạ xuống GUEST | `role = "GUEST"`, user là HOST có listing | Roles chỉ còn `{GUEST}`; listing chưa xoá có `access = false` | P1 | U | — |
| USER-ADMPROF-05 | Hạ ADMIN xuống GUEST | Áp dụng cho tài khoản ADMIN | Ghi nhận: mất quyền ADMIN, không có chặn tự hạ quyền ⚠️ | P2 | S | — |
| USER-ADMPROF-06 | `role` null | Không gửi `role` | Hiện tại NPE → HTTP 400 ⚠️ | P2 | U | — |
| USER-ADMPROF-07 | `role` khác HOST/GUEST | `role = "ADMIN"` | Role không đổi, các trường khác vẫn lưu | P3 | U | — |
| USER-ADMPROF-08 | `id` không tồn tại | | HTTP 500, `code: 1009` | P2 | U | — |
| USER-ADMPROF-09 | Không phải ADMIN | | HTTP 403 | P1 | S | — |

## Phát hiện từ code

| Liên quan | Mô tả | Đề xuất |
| --- | --- | --- |
| USER-REG-06 | `@Size(message = "USERNAME_INVALID")` không khớp enum → trả `INVALID_KEY` | Thêm `USERNAME_INVALID` vào `ErrorCode` hoặc đổi message thành `USERNAME_VALID` |
| USER-REG-10 | Không có `@NotBlank` cho username/password | Thêm `@NotBlank` |
| USER-PROF-04 | `getEmail().isBlank()` không kiểm tra null | Kiểm tra null trước `isBlank()` |
| USER-PASS-06 | Đổi mật khẩu public và lấy username từ body | Yêu cầu token, lấy username từ `SecurityContext` |
| USER-ACT-03 | Mở khoá vẫn tắt `access` của listing | Chỉ tắt khi `status = false` |
| USER-ADMPROF-02 | `setFullname(userEntity.getFullname())` | Dùng `newProfile.getFullname()` |
| USER-ADMPROF-06 | `getRole().equals(...)` khi role null | So sánh `"HOST".equals(role)` |
