# 03 — Đăng ký làm host và hồ sơ host

- Controller: [`UserController`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/controller/UserController.java)
- Service: [`UserService`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/service/UserService.java) — `handleApply`, `handleGetApplyPerson`, `handleAccsetHost`, `handleRejectAccess`, `handlegetHost`, `handleUpdateHost`, `syncUserLanguages`
- DTO: [`ApplyHostResquest`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/dto/request/ApplyHostResquest.java) (tự parse `didHostYear` từ số hoặc chuỗi tự nhiên)
- Trạng thái chờ duyệt lưu ở `users.host_application_pending`; role `HOST` tách biệt với cờ này.

## Endpoint

| Method | Path | Quyền | Body |
| --- | --- | --- | --- |
| POST | `/api/users/host/apply` | Đăng nhập | JSON `{ userId, fullname, country, language, languageIds, didHostYear, experience, description }` |
| GET | `/api/users/host/apply` | ADMIN | Danh sách đang chờ duyệt |
| PUT | `/api/users/host/status/{id}` | ADMIN | Duyệt |
| DELETE | `/api/users/host/status/{id}` | ADMIN | Từ chối |
| GET | `/api/users/host/{id}` | Public | Hồ sơ host |
| PUT | `/api/users/host/profile` | HOST | `multipart/form-data` `UpdateProFileHost` |

## Dữ liệu chuẩn bị

- Country `Việt Nam` (chưa xoá).
- Language `Tiếng Việt` (id 1), `English` (id 2) active; `Français` (id 3) `deleted = true`; `Deutsch` (id 4) `isActive = false`.
- `g1`: GUEST chưa nộp đơn; `h1`: đã có role HOST.

## Test case

### Nộp đơn — `POST /api/users/host/apply`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| HOST-APPLY-01 | Nộp đơn hợp lệ | `g1`, `country = "Việt Nam"`, `fullname`, `description` | HTTP 200, `message: "Apply to host success"`; `hostApplicationPending = true`, country, description, fullname (đã trim) được lưu | P1 | U | `UserServiceHostApplicationTest.applicationStoresProfileAndPendingFlagOnUser` |
| HOST-APPLY-02 | Nộp lại khi đang chờ | Gọi 2 lần | Cập nhật cùng một user, không tạo bản ghi mới | P2 | U | `UserServiceHostApplicationTest.repeatApplicationUpdatesSameUser` |
| HOST-APPLY-03 | Thiếu `userId` | `userId = null` | HTTP 400, `code: 1011` | P1 | U | — |
| HOST-APPLY-04 | `userId` không tồn tại | | HTTP 500, `code: 1009` | P2 | U | — |
| HOST-APPLY-05 | User đã là HOST | `h1` | HTTP 400, `code: 1011` | P1 | U | `UserServiceHostApplicationTest.existingHostCannotApplyAgain` |
| HOST-APPLY-06 | Country không tồn tại / null | `country = "Atlantis"` hoặc thiếu | HTTP 400, `code: 1014`; `hostApplicationPending` giữ `false` | P1 | U | `UserServiceHostApplicationTest.missingCountryDoesNotMarkApplicationPending` |
| HOST-APPLY-07 | Country có khoảng trắng thừa | `country = "  Việt Nam  "` | Được trim và tìm thấy | P3 | U | — |
| HOST-APPLY-08 | `fullname` rỗng | `fullname = "   "` | Giữ fullname cũ | P3 | U | — |
| HOST-APPLY-09 | Chọn ngôn ngữ theo `languageIds` | `languageIds = [2, 1, 2]` | `languageEntities` = {English, Tiếng Việt} theo thứ tự id đầu vào, bỏ trùng; `languages = "English, Tiếng Việt"` | P2 | U | `UserServiceHostApplicationTest.jsonDeserializesNaturalLanguageExperienceAndSyncsSelectedLanguageEntities` |
| HOST-APPLY-10 | `languageIds` có id đã xoá / inactive / không tồn tại | `[1, 3]`, `[1, 4]`, `[1, 999]` | HTTP 400, `code: 1027` | P2 | U | — |
| HOST-APPLY-11 | Ngôn ngữ dạng chuỗi | `language = "tiếng việt, , English, Klingon"`, không có `languageIds` | `languages = "tiếng việt, English, Klingon"`; `languageEntities` chỉ gồm ngôn ngữ khớp tên (không phân biệt hoa thường) và đang active | P2 | U | — |
| HOST-APPLY-12 | Không gửi ngôn ngữ | `language = null`, `languageIds = null` | `languages = null`, `languageEntities` rỗng | P3 | U | — |
| HOST-APPLY-13 | `didHostYear` là số | `didHostYear = 3`, không có `experience` | `didHostYear = 3`, `hostExperience = "3 năm kinh nghiệm"` | P2 | U | — |
| HOST-APPLY-14 | `didHostYear` âm | `didHostYear = -5` | `didHostYear = 0` | P3 | U | — |
| HOST-APPLY-15 | `didHostYear` là chuỗi tự nhiên | `didHostYear = "khoảng 5 năm"`, không có `experience` | `experience = "khoảng 5 năm"`, `didHostYear = 5` | P2 | U | `UserServiceHostApplicationTest.jsonDeserializesNaturalLanguageExperienceAndSyncsSelectedLanguageEntities` |
| HOST-APPLY-16 | Chuỗi chứa năm bắt đầu | `experience = "Làm host từ 2020"`, `didHostYear = null` | `didHostYear = max(1, năm hiện tại − 2020)` | P3 | U | — |
| HOST-APPLY-17 | Số quá lớn | `experience = "200 năm"` | `didHostYear = 80` (giới hạn trên) | P3 | U | — |
| HOST-APPLY-18 | Chuỗi không có số | `experience = "nhiều năm"` | `didHostYear = 0` | P3 | U | — |
| HOST-APPLY-19 | `didHostYear` chuỗi rỗng | `didHostYear = ""` | `didHostYear = null` | P3 | U | — |
| HOST-APPLY-20 | Nộp đơn cho user khác | `g1` đăng nhập, gửi `userId` của `g2` | Mong đợi bị từ chối; hiện tại đơn của `g2` bị tạo/ghi đè (IDOR) ⚠️ | P1 | S | — |
| HOST-APPLY-21 | ANON nộp đơn | | HTTP 401 | P1 | S | — |

### Danh sách chờ duyệt — `GET /api/users/host/apply`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| HOST-LIST-01 | ADMIN lấy danh sách | 2 user pending, 1 user không | HTTP 200, chỉ 2 user pending (lọc ở DB bằng `findAllByHostApplicationPendingTrue`) | P1 | U | `UserServiceHostApplicationTest.pendingListUsesDatabaseFilterAndPreservesResponse` |
| HOST-LIST-02 | Không phải ADMIN | GUEST/HOST | HTTP 403 | P1 | S | — |

### Duyệt — `PUT /api/users/host/status/{id}`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| HOST-APPROVE-01 | Duyệt đơn đang chờ | User pending, chưa có HOST | HTTP 200, `message: "add role host successfully"`; thêm role HOST, `hostApplicationPending = false` trong cùng một lần save | P1 | U | `UserServiceHostApplicationTest.approvalGrantsHostAndClearsPendingInSameSave` |
| HOST-APPROVE-02 | User không có đơn | Pending = false, chưa có HOST | HTTP 400, `code: 1011` | P1 | U | `UserServiceHostApplicationTest.cannotApproveUserWithoutApplication` |
| HOST-APPROVE-03 | User đã là HOST | Có role HOST, còn pending | HTTP 200, `message: "user had role host"`; không thêm role trùng; pending về `false` | P2 | U | `UserServiceHostApplicationTest.alreadyApprovedHostDoesNotReceiveDuplicateRole` |
| HOST-APPROVE-04 | Thiếu role HOST trong DB | | HTTP 500, `code: 1001`; pending vẫn `true` | P2 | U | `UserServiceHostApplicationTest.missingHostRoleKeepsApplicationPending` |
| HOST-APPROVE-05 | User không tồn tại | | HTTP 500, `code: 1009` | P2 | U | — |
| HOST-APPROVE-06 | Token mới có scope HOST | User đăng nhập lại sau khi duyệt | `scope` chứa `HOST`; gọi được `GET /api/listings/host` | P1 | I | — |
| HOST-APPROVE-07 | Không phải ADMIN | | HTTP 403 | P1 | S | — |

### Từ chối — `DELETE /api/users/host/status/{id}`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| HOST-REJECT-01 | Từ chối đơn | User pending | HTTP 200, `message: "Reject to host "`; pending = `false`; role không đổi | P1 | U | `UserServiceHostApplicationTest.rejectionClearsPendingAndAllowsReapplication` |
| HOST-REJECT-02 | Nộp lại sau khi bị từ chối | Sau HOST-REJECT-01 | Nộp đơn thành công, pending = `true` | P2 | U | `UserServiceHostApplicationTest.rejectionClearsPendingAndAllowsReapplication` |
| HOST-REJECT-03 | User không tồn tại | | HTTP 500, `code: 1009` | P3 | U | — |
| HOST-REJECT-04 | Không phải ADMIN | | HTTP 403 | P1 | S | — |

### Xem hồ sơ host — `GET /api/users/host/{id}`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| HOST-VIEW-01 | ANON xem hồ sơ | id hợp lệ | HTTP 200, `message: "get profile host"`, `result` là `HostProfileResponse` | P2 | I | — |
| HOST-VIEW-02 | Không lộ dữ liệu nhạy cảm | | `result` không chứa `password`, token | P1 | S | — |
| HOST-VIEW-03 | id không tồn tại | | HTTP 500, `code: 1009` | P3 | U | — |

### Cập nhật hồ sơ host — `PUT /api/users/host/profile`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| HOST-PROF-01 | Cập nhật đầy đủ | HOST, có `country`, `email`, `didHostYear`, `hostExperience`, `description` | HTTP 200, `message: "update profile host"`; các trường được lưu cho user trong token | P2 | U | — |
| HOST-PROF-02 | Country không tồn tại | | HTTP 400, `code: 1014` | P2 | U | — |
| HOST-PROF-03 | Chỉ gửi `phone` | `phone = "0909"`, `email = null` | Mong đợi phone đổi; hiện tại set `email = null`, phone giữ nguyên ⚠️ | P1 | U | — |
| HOST-PROF-04 | Cập nhật ngôn ngữ | `languageIds = [1]` | Giống HOST-APPLY-09/10 | P2 | U | — |
| HOST-PROF-05 | Không gửi ngôn ngữ | `languages = null`, `languageIds` rỗng | Giữ ngôn ngữ cũ | P2 | U | — |
| HOST-PROF-06 | Upload ảnh | `thumnail` có file | `thumnailUrl` = URL Cloudinary | P3 | U | — |
| HOST-PROF-07 | GUEST gọi | | HTTP 403 | P1 | S | — |

## Phát hiện từ code

| Liên quan | Mô tả | Đề xuất |
| --- | --- | --- |
| HOST-APPLY-20 | `userId` lấy từ body, không đối chiếu user đăng nhập | Lấy user từ `SecurityContext` hoặc kiểm tra trùng khớp |
| HOST-PROF-03 | `if (phone != null) entity.setEmail(fileHost.getEmail())` | Đổi thành `setPhone(fileHost.getPhone())` |
