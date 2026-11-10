# Đặc tả kiểm thử — Yêu cầu làm host

**Trạng thái tài liệu:** Chưa thực thi; mọi test case là Not Run. [Quy ước chung, fixture và headers](README.md).

## 1. Phạm vi và nguồn

Chức năng bao gồm gửi/cập nhật yêu cầu, danh sách chờ duyệt, duyệt và từ chối. Không bao gồm cập nhật hồ sơ host, duyệt listing, upload ảnh, email hay chuyển dữ liệu MongoDB.

Nguồn yêu cầu hiện có: phần “Yêu cầu làm host trong MySQL” của [README backend](../../../airbnb_service/README.md), phần luồng tài khoản/host của [kiến trúc](../../architecture.md), và [database](../../database.md). Source đối chiếu: [UserController](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/controller/UserController.java) (`postMethodName`, `getApplyPerson`, `updateStstusAccess`, `handleReject`), [UserService](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/service/UserService.java) (`handleApply`, `handleGetApplyPerson`, `handleAccsetHost`, `handleRejectAccess`, `syncUserLanguages`), [ApplyHostResquest](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/dto/request/ApplyHostResquest.java), [HostProfileResponse](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/dto/response/HostProfileResponse.java), [UserMapper](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/mapper/UserMapper.java), [UserRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/repository/UserRepository.java), [UserEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/entity/UserEntity.java), [CountriesRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/country/repository/CountriesRepository.java), [LanguageRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/language/repository/LanguageRepository.java), [SecurityConfig](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/SecurityConfig.java), [GlobalExceptionHandler](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/GlobalExceptionHandler.java), [ErrorCode](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/ErrorCode.java). Caller được đối chiếu: `applyHostRequest`/`handleHostRequestSubmit` trong [GuestProfilePage](../../../frontend/src/features/profile/pages/GuestProfilePage.jsx); validation UI chỉ là dấu hiệu cần xác nhận, không tự thành yêu cầu backend.

Luồng ghi: controller → UserService → UserRepository/CountriesRepository/LanguageRepository/RoleRepository → users, user_languages, user_roles. Danh sách chờ dùng `findAllByHostApplicationPendingTrue` rồi `UserMapper.toHostProfile`; không có native SQL riêng trên đường gọi này. Các phương thức ghi host có `@Transactional`.

## 2. Yêu cầu và API

| ID | Nội dung | Căn cứ |
| --- | --- | --- |
| R-H01 | Gửi yêu cầu cập nhật hồ sơ user, pending=true; không tự cấp HOST | [DOC] README backend |
| R-H02 | User đã có HOST không được gửi lại; user bị từ chối có thể gửi lại; gửi lặp cập nhật cùng user | [DOC] README backend; gửi lặp [CODE] handleApply |
| R-H03 | Quốc gia được tra theo tên đã trim; languageIds hợp lệ/active/chưa xóa được đồng bộ; experience/didHostYear được chuẩn hóa | [CODE] service + DTO, cần Q-H03/Q-H04 |
| R-H04 | Duyệt user đang pending: thêm HOST, giữ các role cũ, clear pending trong cùng transaction | [DOC] README backend |
| R-H05 | Từ chối clear pending, không xóa user/hồ sơ và không thu hồi HOST hiện có | [DOC] mô hình cờ; nhánh giữ role [CODE] |
| R-H06 | Danh sách chờ chỉ lấy pending=true; không thêm mới hoặc sửa dữ liệu | [DOC] README backend |
| R-H07 | Gửi yêu cầu cần xác thực; GET danh sách/PUT duyệt/DELETE từ chối chỉ ADMIN | [CODE] controller + security |
| R-H08 | Chỉ sửa hồ sơ/yêu cầu của chính người gửi; không tin userId bất kỳ từ client | [ĐX] cần xác nhận Q-H02; source đang thiếu đối chiếu principal |
| R-H09 | Validation thất bại hoặc lỗi transaction không để lại thay đổi hồ sơ/role/ngôn ngữ một phần | [DOC] duyệt cùng transaction; các nhánh khác [ĐX] toàn vẹn dữ liệu |

| API | Headers | Request | HTTP/body thành công ghi nhận từ source |
| --- | --- | --- | --- |
| POST `/api/users/host/apply` | H_A | APPLY_A | 200, code=200, message=`Apply to host success`, không có result |
| GET `/api/users/host/apply` | H_ADMIN | Không body | 200, code=200, message=`get user want to apply host`, result là array HostProfileResponse |
| PUT `/api/users/host/status/{id}` | H_ADMIN | Không body; id là user id | 200, code=200, message=`add role host successfully` hoặc `user had role host`; không result |
| DELETE `/api/users/host/status/{id}` | H_ADMIN | Không body; id là user id | 200, code=200, message=`Reject to host ` (có khoảng trắng cuối); không result |

`APPLY_A` (id là fixture giả, không phải dữ liệu dev thật):

```json
{"userId":91001,"fullname":"QA Guest A","country":"QA Country","languageIds":[94001,94002],"language":"QA Vietnamese, QA English","didHostYear":3,"experience":"3 năm kinh nghiệm","description":"Mô tả hồ sơ QA"}
```

Ký hiệu `HOST_OK(message)` là ApiResponse có code=200, message đúng như bảng, timestamp động, result vắng khi null. `HOST_LIST` có result là mảng với các field từ DTO: id, username, fullname, thumnailUrl, email, phone, address, country, languages, languageIds, didHostYear, hostExperience, description, totalListings, totalReviews, avgRating. DTO không trả cờ pending hoặc roles; kiểm tra các trạng thái đó ở DB. Chốt chính sách field null trước khi so sánh toàn bộ JSON; không ép thứ tự mảng khi repository không có sort hoặc quan hệ là Set.

Lỗi source: INVALID → 400/E(1011,"data invalid"); COUNTRY_NOT_EXISTED → 400/E(1014,"countriy not existed!"); LANGUAGE_NOT_EXISTED → 400/E(1027,"Ngôn ngữ không tồn tại"); USER_NOT_EXISTED → 500/E(1009,"user not existd"); ROLE_NOT_EXISTED → 500/E(1001,"role not exited!"). Error code và chính tả được ghi nhận để phát hiện tương thích, không chứng minh lựa chọn HTTP đã đúng nghiệp vụ.

## 3. Điểm cần xác nhận

| ID | Khoảng trống / mâu thuẫn |
| --- | --- |
| Q-H01 | GET `/api/users/host/apply` còn khớp allowlist GET `/api/users/host/{id}`; method security vẫn ADMIN. Không có token có thể bị từ chối 403 ở MVC thay vì 401 ở filter. Chốt 401 cho thiếu xác thực và 403 cho thiếu quyền, kiểm thử HTTP thực. |
| Q-H02 | POST nhận userId từ body, service không so với principal và không kiểm tra trạng thái active của target. Đề xuất không cho U_A sửa U_B; quản trị viên có được nộp hộ không, và tài khoản khóa có được nộp không? Không coi việc API hiện cho phép là đúng. |
| Q-H03 | Chưa có yêu cầu backend bắt buộc fullname/description/experience/ngôn ngữ hoặc giới hạn độ dài. UI có kiểm tra bắt buộc nhưng DTO/controller không có validation tương ứng. Quy tắc nào là chính thức? |
| Q-H04 | Numeric didHostYear dùng max(0,intValue) không cap 80, còn text có regex/năm bắt đầu và cap 80; số thực bị cắt phần lẻ. Chốt phạm vi, năm lịch, số âm/quá lớn và độ ưu tiên experience/didHostYear; không tự lấy 80 làm yêu cầu. |
| Q-H05 | languageIds có dữ liệu sẽ ưu tiên hơn language; raw language fallback có thể giữ tên không khớp catalog. Chốt có cho chuỗi tự do, danh sách rỗng, null hoặc ngôn ngữ inactive không; không bảo đảm thứ tự Set sau reload. |
| Q-H06 | User/ID không tồn tại đang trả 500; ID không phải số có lỗi binding. Đề xuất 404 cho user không tồn tại, 400 cho ID sai kiểu/phạm vi; cần chốt schema lỗi. |
| Q-H07 | Duyệt lại user đã HOST trả 200/user had role host dù không pending; từ chối user không pending cũng 200. Chốt tính idempotent và có phải kiểm tra pending trước mọi thao tác không. Từ chối không phải thu hồi HOST. |
| Q-H08 | Chưa thấy version/locking cho hai admin duyệt và từ chối đồng thời; cần quy tắc thắng/thua, HTTP conflict và bảo đảm không tạo user_roles trùng. |
| Q-H09 | JWT cũ không tự thêm HOST sau khi duyệt. Chốt người dùng đăng nhập/refresh để lấy role mới hay dùng chiến lược khác; không kỳ vọng cờ pending tự cấp quyền. |

## 4. Test case

### HOST-UT-001 — Gửi yêu cầu cập nhật đúng user và cờ pending

- **ID:** HOST-UT-001
- **Yêu cầu liên quan:** R-H01, R-H03
- **Mục tiêu:** Gửi yêu cầu cập nhật đúng user và cờ pending.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A chưa HOST; countriesRepository trả C_QA; languageRepository trả L_VI/L_EN.
- **Dữ liệu đầu vào:** APPLY_A.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi UserService.handleApply(APPLY_A).
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Trả true.
- **Trạng thái dữ liệu:** save U_A với fullname/description/country/experience và pending=true; roles không thêm HOST; user_languages khớp hai ngôn ngữ.
- **Căn cứ / điểm cần xác nhận:** Unit chỉ kiểm tra object và tương tác, không chứng minh transaction/quan hệ DB.

### HOST-UT-002 — User đã HOST bị chặn trước khi ghi

- **ID:** HOST-UT-002
- **Yêu cầu liên quan:** R-H02, R-H09
- **Mục tiêu:** User đã HOST bị chặn trước khi ghi.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** findById trả U_HOST có role HOST.
- **Dữ liệu đầu vào:** APPLY_A đổi userId=91004.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi handleApply.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** AppException INVALID.
- **Trạng thái dữ liệu:** Không gọi save user hoặc đồng bộ country/language sau khi phát hiện HOST.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-UT-003 — Biên và khác biệt chuẩn hóa kinh nghiệm

- **ID:** HOST-UT-003
- **Yêu cầu liên quan:** R-H03
- **Mục tiêu:** Biên và khác biệt chuẩn hóa kinh nghiệm.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P2.
- **Trạng thái:** Not Run
- **Điều kiện trước:** DTO mới cho từng biến thể; đồng hồ năm Y được kiểm soát cho nhánh năm lịch.
- **Dữ liệu đầu vào:** didHostYear lần lượt null, -1, 0, 80, 81, 2.9; chuỗi "81 năm", "từ 2020", "không có"; extractYearsFromText(null).
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi ApplyHostResquest.setDidHostYear và extractYearsFromText độc lập cho từng giá trị.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Ghi nhận [CODE]: null→null; numeric -1→0; 0→0; 80→80; 81→81; 2.9→2; "81 năm"→80; "từ 2020"→max(1,Y-2020) khi Y>=2020; "không có"→0; extract(null)→null.
- **Trạng thái dữ liệu:** Không có DB/Redis; không sửa fixture user.
- **Căn cứ / điểm cần xác nhận:** Q-H04: bảng này là characterization source, chưa là chuẩn nghiệp vụ. Sau chốt phạm vi phải bổ sung oracle nghiệm thu đúng yêu cầu, không mặc nhiên giữ cắt phần lẻ/cap không nhất quán.

### HOST-UT-004 — Loại ID ngôn ngữ trùng và chặn ngôn ngữ không hợp lệ

- **ID:** HOST-UT-004
- **Yêu cầu liên quan:** R-H03, R-H09
- **Mục tiêu:** Loại ID ngôn ngữ trùng và chặn ngôn ngữ không hợp lệ.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Repository double có L_VI/L_EN; từng lượt tách biệt.
- **Dữ liệu đầu vào:** APPLY_A languageIds=[94001,94002,94001]; lượt khác chứa ID_MISSING hoặc L_EN.deleted=true.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi handleApply cho từng biến thể.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Danh sách trùng được khử trùng; ID thiếu/inactive/deleted ném LANGUAGE_NOT_EXISTED.
- **Trạng thái dữ liệu:** Nhánh thành công gọi save; nhánh lỗi không gọi save. Không suy ra object đã mutate được rollback trong unit.
- **Căn cứ / điểm cần xác nhận:** Cần integration để kiểm tra rollback fullname/description/language quan hệ trước lỗi.

### HOST-UT-005 — Không duyệt user chưa có yêu cầu

- **ID:** HOST-UT-005
- **Yêu cầu liên quan:** R-H04
- **Mục tiêu:** Không duyệt user chưa có yêu cầu.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A chưa HOST, pending=false.
- **Dữ liệu đầu vào:** host_id=91001.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi handleAccsetHost(91001).
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** AppException INVALID.
- **Trạng thái dữ liệu:** Không thêm HOST và không gọi userRepository.save.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-UT-006 — Duyệt thêm HOST và từ chối không thu hồi role

- **ID:** HOST-UT-006
- **Yêu cầu liên quan:** R-H04, R-H05
- **Mục tiêu:** Duyệt thêm HOST và từ chối không thu hồi role.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Hai object độc lập: U_A pending=true/roles={GUEST}; U_HOST roles={HOST}, pending=true; roleRepository trả HOST.
- **Dữ liệu đầu vào:** Lượt 1 duyệt U_A; lượt 2 từ chối U_HOST.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi handleAccsetHost cho U_A, sau đó handleRejectAccess cho object U_HOST độc lập.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Lượt duyệt trả true; lượt từ chối không trả DTO.
- **Trạng thái dữ liệu:** U_A roles={GUEST,HOST}, pending=false; U_HOST vẫn HOST và pending=false; mỗi lượt save đúng user.
- **Căn cứ / điểm cần xác nhận:** Không gộp từ chối đơn với hủy quyền HOST; persistence được kiểm tra riêng.

### HOST-UT-007 — Mapper danh sách không đưa mật khẩu hoặc cờ nội bộ vào DTO

- **ID:** HOST-UT-007
- **Yêu cầu liên quan:** R-H06
- **Mục tiêu:** Mapper danh sách không đưa mật khẩu hoặc cờ nội bộ vào DTO.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** User U_A có country C_QA, hai language; listing/review collections rỗng; mapper thật trong bộ nhớ.
- **Dữ liệu đầu vào:** UserEntity fixture, không log password/hash.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi UserMapper.toHostProfile(U_A).
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** HostProfileResponse đúng id/country/languageIds; totalListings=0, totalReviews=0, avgRating=null; không có field password/roles/hostApplicationPending trong DTO.
- **Trạng thái dữ liệu:** Không gọi repository save hoặc sửa entity.
- **Căn cứ / điểm cần xác nhận:** Unit mapper không thay HTTP serialization; không ép thứ tự languageIds từ Set.

### HOST-IT-001 — Gửi yêu cầu hợp lệ cho chính mình

- **ID:** HOST-IT-001
- **Yêu cầu liên quan:** R-H01, R-H03, R-H07
- **Mục tiêu:** Gửi yêu cầu hợp lệ cho chính mình.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A chưa HOST/pending=false; C_QA, L_VI/L_EN tồn tại hợp lệ; token A còn hạn.
- **Dữ liệu đầu vào:** APPLY_A
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** HOST_OK("Apply to host success").
- **Trạng thái dữ liệu:** Một user U_A được cập nhật; pending=true; hồ sơ/kinh nghiệm/country đúng; user_languages đúng hai liên kết; user_roles giữ GUEST, không thêm HOST; user khác không đổi.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-002 — Nộp lại khi đang chờ duyệt

- **ID:** HOST-IT-002
- **Yêu cầu liên quan:** R-H01, R-H02
- **Mục tiêu:** Nộp lại khi đang chờ duyệt.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true sau một yêu cầu trước; ghi snapshot ID/user_roles.
- **Dữ liệu đầu vào:** APPLY_A đổi description="Mô tả QA cập nhật", experience="4 năm kinh nghiệm", didHostYear=4.
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A đổi description="Mô tả QA cập nhật", experience="4 năm kinh nghiệm", didHostYear=4.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200 theo [CODE]
- **Response/giá trị trả về:** HOST_OK("Apply to host success").
- **Trạng thái dữ liệu:** Vẫn một user U_A; cập nhật thông tin mới; pending=true; không thêm user/role hoặc quan hệ ngôn ngữ trùng.
- **Căn cứ / điểm cần xác nhận:** Nghiệp vụ cho phép sửa đơn đang chờ cần xác nhận nếu có SRS; source hiện cập nhật cùng user.

### HOST-IT-003 — Chưa đăng nhập không được gửi đơn

- **ID:** HOST-IT-003
- **Yêu cầu liên quan:** R-H07
- **Mục tiêu:** Chưa đăng nhập không được gửi đơn.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=false; DB snapshot trước.
- **Dữ liệu đầu vào:** APPLY_A
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H0
- **Request:** APPLY_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 401
- **Response/giá trị trả về:** E106.
- **Trạng thái dữ liệu:** Không đổi bất kỳ user, pending hoặc bảng nối nào.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-004 — Ngăn sửa yêu cầu host của người khác

- **ID:** HOST-IT-004
- **Yêu cầu liên quan:** R-H08, R-H09
- **Mục tiêu:** Ngăn sửa yêu cầu host của người khác.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Token U_A hợp lệ; U_B chưa HOST; cả hai user tồn tại; chụp hồ sơ/pending/ngôn ngữ U_B.
- **Dữ liệu đầu vào:** APPLY_A đổi userId=91002, fullname="Tên ghi đè QA".
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A đổi userId=91002, fullname="Tên ghi đè QA".

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 403; Q-H02
- **Response/giá trị trả về:** Response từ chối quyền, không trả success; schema/mã cần chốt.
- **Trạng thái dữ liệu:** U_B và U_A không đổi; không tạo đơn hoặc gán ngôn ngữ cho U_B.
- **Căn cứ / điểm cần xác nhận:** Source handleApply chỉ findById(body.userId), không đối chiếu principal. Nguy cơ vượt quyền từ source, chưa chạy chứng minh.

### HOST-IT-005 — Thiếu userId hoặc ID sai phạm vi

- **ID:** HOST-IT-005
- **Yêu cầu liên quan:** R-H03, R-H09
- **Mục tiêu:** Thiếu userId hoặc ID sai phạm vi.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Token U_A; chuẩn bị userId null, 0, -1, và chuỗi không phải số riêng từng lượt.
- **Dữ liệu đầu vào:** APPLY_A với userId lần lượt bị bỏ, null, 0, -1, "abc".
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A với userId lần lượt bị bỏ, null, 0, -1, "abc".

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Null/bỏ: 400 theo source; các biến thể khác đề xuất 400, Q-H06
- **Response/giá trị trả về:** Null/bỏ: E(1011,"data invalid"); sai kiểu/phạm vi: E_VALIDATION sau chốt.
- **Trạng thái dữ liệu:** Không đổi user hoặc bảng nối.
- **Căn cứ / điểm cần xác nhận:** Source 0/-1 có thể trả 500/code1009 thay vì lỗi đầu vào; không coi đó là kết quả hợp lệ nghiệp vụ.

### HOST-IT-006 — Quốc gia thiếu, không tồn tại hoặc có khoảng trắng

- **ID:** HOST-IT-006
- **Yêu cầu liên quan:** R-H03, R-H09
- **Mục tiêu:** Quốc gia thiếu, không tồn tại hoặc có khoảng trắng.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** C_QA tồn tại; không có quốc gia tên rỗng; mỗi biến thể chạy độc lập.
- **Dữ liệu đầu vào:** APPLY_A country lần lượt null, "", "   ", "QA Missing Country", "  QA Country  ".
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A country lần lượt null, "", "   ", "QA Missing Country", "  QA Country  ".

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 400 cho bốn biến thể đầu; 200 cho tên có khoảng trắng ngoài
- **Response/giá trị trả về:** Lỗi E(1014,"countriy not existed!"); hợp lệ HOST_OK("Apply to host success").
- **Trạng thái dữ liệu:** Lỗi không đổi hồ sơ/pending/bảng nối; hợp lệ dùng đúng country_id C_QA sau trim.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-007 — Ngôn ngữ thiếu, đã xóa hoặc ngừng hoạt động

- **ID:** HOST-IT-007
- **Yêu cầu liên quan:** R-H03, R-H09
- **Mục tiêu:** Ngôn ngữ thiếu, đã xóa hoặc ngừng hoạt động.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Tạo riêng các fixture language không tồn tại/deleted=true/isActive=false; U_A có hồ sơ gốc.
- **Dữ liệu đầu vào:** APPLY_A languageIds=[94001,ID_MISSING]; sau đó thay ID lỗi bằng ngôn ngữ deleted/inactive.
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A languageIds=[94001,ID_MISSING]; sau đó thay ID lỗi bằng ngôn ngữ deleted/inactive.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 400
- **Response/giá trị trả về:** E(1027,"Ngôn ngữ không tồn tại").
- **Trạng thái dữ liệu:** Rollback toàn bộ fullname/description/experience/country/pending và user_languages; không ghi một phần dù service đã set một số field trước kiểm tra.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-008 — Ngôn ngữ trùng và ưu tiên ID hơn chuỗi tự do

- **ID:** HOST-IT-008
- **Yêu cầu liên quan:** R-H03
- **Mục tiêu:** Ngôn ngữ trùng và ưu tiên ID hơn chuỗi tự do.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P2.
- **Trạng thái:** Not Run
- **Điều kiện trước:** L_VI/L_EN hợp lệ; U_A chưa HOST.
- **Dữ liệu đầu vào:** APPLY_A languageIds=[94001,94002,94001], language="Tên khác không có trong catalog".
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A languageIds=[94001,94002,94001], language="Tên khác không có trong catalog".

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200 theo source; Q-H05
- **Response/giá trị trả về:** HOST_OK("Apply to host success").
- **Trạng thái dữ liệu:** user_languages có đúng hai liên kết duy nhất; users.languages phản ánh tên catalog, không dùng chuỗi khác; không ép thứ tự khi reload.
- **Căn cứ / điểm cần xác nhận:** Q-H05 quyết định có chấp nhận hai field mâu thuẫn hay phải trả validation error.

### HOST-IT-009 — Thông tin hồ sơ bắt buộc và biên độ dài

- **ID:** HOST-IT-009
- **Yêu cầu liên quan:** R-H03
- **Mục tiêu:** Thông tin hồ sơ bắt buộc và biên độ dài.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Chốt field bắt buộc và giới hạn tương ứng Q-H03 trước nghiệm thu.
- **Dữ liệu đầu vào:** Từng lượt APPLY_A bỏ hoặc đặt blank fullname/description/experience; languageIds=[] và language=null; độ dài trường đã chốt ở max-1/max/max+1.
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** Từng lượt APPLY_A bỏ hoặc đặt blank fullname/description/experience; languageIds=[] và language=null; độ dài trường đã chốt ở max-1/max/max+1.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400 cho bắt buộc thiếu/vượt max; hợp lệ theo contract
- **Response/giá trị trả về:** E_VALIDATION cho đầu vào sai; dữ liệu hợp lệ trả HOST_OK.
- **Trạng thái dữ liệu:** Nhánh bị từ chối giữ hồ sơ gốc; không ghi pending hay xóa ngôn ngữ.
- **Căn cứ / điểm cần xác nhận:** Source có thể giữ fullname cũ, ghi description blank/null, xóa ngôn ngữ hoặc nhận experience thiếu. UI bắt buộc chưa đủ xác lập backend đúng.

### HOST-IT-010 — User đã HOST không gửi yêu cầu mới

- **ID:** HOST-IT-010
- **Yêu cầu liên quan:** R-H02
- **Mục tiêu:** User đã HOST không gửi yêu cầu mới.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_HOST có HOST, pending=false, token hợp lệ.
- **Dữ liệu đầu vào:** APPLY_A đổi userId=91004.
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_HOST
- **Request:** APPLY_A đổi userId=91004.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 400
- **Response/giá trị trả về:** E(1011,"data invalid").
- **Trạng thái dữ liệu:** Hồ sơ U_HOST, roles, pending và ngôn ngữ không đổi.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-011 — ADMIN lấy đúng danh sách chờ duyệt

- **ID:** HOST-IT-011
- **Yêu cầu liên quan:** R-H06, R-H07
- **Mục tiêu:** ADMIN lấy đúng danh sách chờ duyệt.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true; U_B=false; U_HOST=false; hồ sơ ngôn ngữ/country có fixture; không có yêu cầu ngoài fixture.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `GET /api/users/host/apply`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi GET `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** HOST_LIST chứa đúng U_A, tên country, languageIds theo tập hợp; không chứa U_B/U_HOST; không password/hash.
- **Trạng thái dữ liệu:** Không thay user/role/pending/bảng nối.
- **Căn cứ / điểm cần xác nhận:** Source DTO không có pending/status; kiểm tra trạng thái qua DB, không tự thêm field response.

### HOST-IT-012 — Danh sách chờ rỗng là mảng rỗng

- **ID:** HOST-IT-012
- **Yêu cầu liên quan:** R-H06
- **Mục tiêu:** Danh sách chờ rỗng là mảng rỗng.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P2.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Mọi user fixture pending=false.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `GET /api/users/host/apply`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi GET `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** code=200, message="get user want to apply host", result=[].
- **Trạng thái dữ liệu:** Không thay dữ liệu.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-013 — GUEST/HOST không được xem danh sách đơn

- **ID:** HOST-IT-013
- **Yêu cầu liên quan:** R-H07
- **Mục tiêu:** GUEST/HOST không được xem danh sách đơn.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Từng lượt dùng U_A rồi U_HOST đã xác thực, không có ADMIN.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `GET /api/users/host/apply`
- **Headers cần thiết:** H_A rồi H_HOST, chạy độc lập
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi GET `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 403
- **Response/giá trị trả về:** E1010, không lộ danh sách/hồ sơ người khác.
- **Trạng thái dữ liệu:** Không thay dữ liệu.
- **Căn cứ / điểm cần xác nhận:** Method security phải chặn dù route khớp allowlist GET /api/users/host/{id}.

### HOST-IT-014 — Chưa đăng nhập không được xem danh sách đơn

- **ID:** HOST-IT-014
- **Yêu cầu liên quan:** R-H07
- **Mục tiêu:** Chưa đăng nhập không được xem danh sách đơn.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Có ít nhất một user pending để phát hiện rò rỉ dữ liệu.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `GET /api/users/host/apply`
- **Headers cần thiết:** H0
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi GET `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 401; Q-H01
- **Response/giá trị trả về:** Response chưa xác thực, không chứa array/hồ sơ; E106 nếu hợp đồng thống nhất.
- **Trạng thái dữ liệu:** Không thay dữ liệu.
- **Căn cứ / điểm cần xác nhận:** Allowlist wildcard + method security có thể tạo 403 thay vì 401; phải ghi nhận status thực trước quyết định, không chấp nhận 200 có dữ liệu.

### HOST-IT-015 — ADMIN duyệt đơn đang chờ

- **ID:** HOST-IT-015
- **Yêu cầu liên quan:** R-H04, R-H07, R-H09
- **Mục tiêu:** ADMIN duyệt đơn đang chờ.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true, roles={GUEST}; role HOST có sẵn; token ADMIN.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `PUT /api/users/host/status/91001`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** HOST_OK("add role host successfully").
- **Trạng thái dữ liệu:** Cùng transaction: thêm một liên kết HOST, giữ GUEST, pending=false; hồ sơ/ngôn ngữ không đổi; không thêm listing hoặc user mới.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-016 — Không duyệt user chưa gửi đơn

- **ID:** HOST-IT-016
- **Yêu cầu liên quan:** R-H04
- **Mục tiêu:** Không duyệt user chưa gửi đơn.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=false, chưa HOST.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `PUT /api/users/host/status/91001`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 400
- **Response/giá trị trả về:** E(1011,"data invalid").
- **Trạng thái dữ liệu:** Không thêm role HOST hoặc đổi hồ sơ/pending.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-017 — Duyệt lặp không tạo role trùng

- **ID:** HOST-IT-017
- **Yêu cầu liên quan:** R-H04
- **Mục tiêu:** Duyệt lặp không tạo role trùng.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A đã được duyệt, pending=false, roles={GUEST,HOST}.
- **Dữ liệu đầu vào:** Không body; gửi lại cùng thao tác.
- **HTTP method và endpoint:** `PUT /api/users/host/status/91001`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body; gửi lại cùng thao tác.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200 theo source; Q-H07
- **Response/giá trị trả về:** HOST_OK("user had role host").
- **Trạng thái dữ liệu:** Không tạo thêm liên kết HOST, pending vẫn false; không mất role GUEST.
- **Căn cứ / điểm cần xác nhận:** Chốt idempotent thay vì tự coi trả 200 cho user không pending là đúng mọi tình huống.

### HOST-IT-018 — User không ADMIN không được duyệt

- **ID:** HOST-IT-018
- **Yêu cầu liên quan:** R-H07
- **Mục tiêu:** User không ADMIN không được duyệt.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true; từng lượt caller=U_B GUEST hoặc U_HOST, không có ADMIN.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `PUT /api/users/host/status/91001`
- **Headers cần thiết:** H_B rồi H_HOST, độc lập
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 403
- **Response/giá trị trả về:** E1010.
- **Trạng thái dữ liệu:** U_A vẫn pending=true, không được thêm HOST; không thay user caller.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-019 — Chưa đăng nhập không được duyệt hoặc từ chối

- **ID:** HOST-IT-019
- **Yêu cầu liên quan:** R-H07
- **Mục tiêu:** Chưa đăng nhập không được duyệt hoặc từ chối.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true; chạy độc lập hai phương thức.
- **Dữ liệu đầu vào:** Không body cho từng PUT và DELETE.
- **HTTP method và endpoint:** `PUT và DELETE /api/users/host/status/91001`
- **Headers cần thiết:** H0
- **Request:** Không body cho từng PUT và DELETE.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT và DELETE `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 401 cho cả hai
- **Response/giá trị trả về:** E106 cho từng request.
- **Trạng thái dữ liệu:** U_A vẫn pending và roles không đổi; không thực hiện một phần.
- **Căn cứ / điểm cần xác nhận:** Hai biến thể cùng điều kiện và oracle; ghi riêng kết quả PUT/DELETE.

### HOST-IT-020 — Từ chối đơn không xóa user hoặc dữ liệu hồ sơ

- **ID:** HOST-IT-020
- **Yêu cầu liên quan:** R-H05, R-H07
- **Mục tiêu:** Từ chối đơn không xóa user hoặc dữ liệu hồ sơ.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true, roles={GUEST}.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `DELETE /api/users/host/status/91001`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi DELETE `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** HOST_OK("Reject to host ").
- **Trạng thái dữ liệu:** pending=false; user vẫn tồn tại, hồ sơ/country/experience/user_languages và GUEST giữ nguyên; không thêm HOST.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-021 — User không ADMIN không được từ chối

- **ID:** HOST-IT-021
- **Yêu cầu liên quan:** R-H07
- **Mục tiêu:** User không ADMIN không được từ chối.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true; caller U_B hoặc U_HOST, mỗi lượt riêng.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `DELETE /api/users/host/status/91001`
- **Headers cần thiết:** H_B rồi H_HOST, độc lập
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi DELETE `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 403
- **Response/giá trị trả về:** E1010.
- **Trạng thái dữ liệu:** pending/roles/hồ sơ U_A không đổi.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-022 — User gửi lại sau khi bị từ chối

- **ID:** HOST-IT-022
- **Yêu cầu liên quan:** R-H02, R-H05
- **Mục tiêu:** User gửi lại sau khi bị từ chối.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A vừa bị từ chối, pending=false, chưa HOST.
- **Dữ liệu đầu vào:** APPLY_A với description="Hồ sơ QA gửi lại".
- **HTTP method và endpoint:** `POST /api/users/host/apply`
- **Headers cần thiết:** H_A
- **Request:** APPLY_A với description="Hồ sơ QA gửi lại".

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/users/host/apply` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** HOST_OK("Apply to host success").
- **Trạng thái dữ liệu:** pending=true trên cùng id U_A; cập nhật description mới, không thêm user/role hoặc lịch sử đơn giả định.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### HOST-IT-023 — Duyệt user không tồn tại hoặc thiếu role HOST

- **ID:** HOST-IT-023
- **Yêu cầu liên quan:** R-H04, R-H09
- **Mục tiêu:** Duyệt user không tồn tại hoặc thiếu role HOST.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Lượt 1 id=ID_MISSING; lượt 2 U_A pending=true nhưng role HOST bị thiếu chỉ trong DB test cô lập.
- **Dữ liệu đầu vào:** Không body; id lần lượt 999999999 và 91001.
- **HTTP method và endpoint:** `PUT /api/users/host/status/{id}`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body; id lần lượt 999999999 và 91001.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT `/api/users/host/status/{id}` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** User thiếu: đề xuất 404, Q-H06; role nền thiếu: 500 theo source
- **Response/giá trị trả về:** User thiếu: schema 404 cần chốt (source E1009/500); role thiếu: E(1001,"role not exited!").
- **Trạng thái dữ liệu:** Không thêm user/role; lượt role thiếu U_A vẫn pending=true và giữ GUEST.
- **Căn cứ / điểm cần xác nhận:** Không xóa role nền trong DB dev để thực hiện ca này; dùng fixture môi trường kiểm thử riêng.

### HOST-IT-024 — Rollback khi duyệt không commit được

- **ID:** HOST-IT-024
- **Yêu cầu liên quan:** R-H04, R-H09
- **Mục tiêu:** Rollback khi duyệt không commit được.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true; trong test context gây lỗi persistence khi ghi user_roles sau khi service đã thay object.
- **Dữ liệu đầu vào:** Không body.
- **HTTP method và endpoint:** `PUT /api/users/host/status/91001`
- **Headers cần thiết:** H_ADMIN
- **Request:** Không body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 5xx có kiểm soát; schema cần chốt
- **Response/giá trị trả về:** Không trả HOST_OK; không lộ SQL; body code không được biểu diễn thành công.
- **Trạng thái dữ liệu:** Sau rollback pending vẫn true và roles chỉ GUEST; không có liên kết HOST mồ côi; kiểm tra bằng kết nối độc lập.
- **Căn cứ / điểm cần xác nhận:** Source @Transactional cần xác minh persistence thật; RuntimeException handler hiện có thể trả 400.

### HOST-IT-025 — Hai admin duyệt và từ chối đồng thời

- **ID:** HOST-IT-025
- **Yêu cầu liên quan:** R-H04, R-H05, R-H09
- **Mục tiêu:** Hai admin duyệt và từ chối đồng thời.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A pending=true; hai session ADMIN trên DB test; điều khiển thời điểm transaction; chụp snapshot.
- **Dữ liệu đầu vào:** Không body; một PUT và một DELETE chạy có điều phối.
- **HTTP method và endpoint:** `PUT và DELETE /api/users/host/status/91001`
- **Headers cần thiết:** H_ADMIN cho hai session độc lập
- **Request:** Không body; một PUT và một DELETE chạy có điều phối.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi PUT và DELETE `/api/users/host/status/91001` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Cần chốt 200/409 theo quy tắc Q-H08
- **Response/giá trị trả về:** Response phải phản ánh kết quả nghiệp vụ được chốt, không chỉ HTTP success; chưa có oracle thắng/thua được phê duyệt.
- **Trạng thái dữ liệu:** Không trùng user_roles, không mất hồ sơ; pending/role cuối phải khớp thứ tự hoặc quy tắc xử lý đã chọn.
- **Căn cứ / điểm cần xác nhận:** Q-H07/Q-H08: source chưa có lịch sử duyệt/từ chối hoặc optimistic lock rõ ràng; không mặc nhiên yêu cầu cả hai trả 200.

## 5. Truy vết yêu cầu và phân loại

Các ID dưới đây trỏ tới test case trong mục 4. Một ca có nhiều biến thể phải ghi kết quả từng biến thể riêng.

| Yêu cầu | Unit test | Integration test |
| --- | --- | --- |
| R-H01 | `HOST-UT-001` | `HOST-IT-001`, `HOST-IT-002` |
| R-H02 | `HOST-UT-002` | `HOST-IT-002`, `HOST-IT-010`, `HOST-IT-022` |
| R-H03 | `HOST-UT-001`, `HOST-UT-003`, `HOST-UT-004` | `HOST-IT-001`, `HOST-IT-005`, `HOST-IT-006`, `HOST-IT-007`, `HOST-IT-008`, `HOST-IT-009` |
| R-H04 | `HOST-UT-005`, `HOST-UT-006` | `HOST-IT-015`, `HOST-IT-016`, `HOST-IT-017`, `HOST-IT-023`, `HOST-IT-024`, `HOST-IT-025` |
| R-H05 | `HOST-UT-006` | `HOST-IT-020`, `HOST-IT-022`, `HOST-IT-025` |
| R-H06 | `HOST-UT-007` | `HOST-IT-011`, `HOST-IT-012` |
| R-H07 | — | `HOST-IT-001`, `HOST-IT-003`, `HOST-IT-011`, `HOST-IT-013`, `HOST-IT-014`, `HOST-IT-015`, `HOST-IT-018`, `HOST-IT-019`, `HOST-IT-020`, `HOST-IT-021` |
| R-H08 | — | `HOST-IT-004` |
| R-H09 | `HOST-UT-002`, `HOST-UT-004` | `HOST-IT-004`, `HOST-IT-005`, `HOST-IT-006`, `HOST-IT-007`, `HOST-IT-015`, `HOST-IT-023`, `HOST-IT-024`, `HOST-IT-025` |
