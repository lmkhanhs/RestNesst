# Đặc tả kiểm thử — Đăng nhập backend

**Trạng thái tài liệu:** Chưa thực thi; mọi test case là Not Run. Đọc [quy ước, fixture, headers và oracle](README.md) trước khi sử dụng.

## 1. Phạm vi và nguồn

Chức năng chính là `POST /auth/login` bằng username/password. `POST /auth/introspect` và `GET /api/users/myInformation` chỉ làm điểm kiểm tra token sau đăng nhập; không đặc tả đầy đủ refresh/logout/quên mật khẩu/Google login.

Nguồn: [README backend](../../../airbnb_service/README.md), [kiến trúc](../../architecture.md), [AuthenticationController](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/controller/AuthenticationController.java) (`login`, `introspect`), [AuthenticationService](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/service/AuthenticationService.java) (`authenticate`, `generationToken`, `introspect`), [AuthenticationResquest](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/dto/request/AuthenticationResquest.java), [AuthenticationResponse](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/dto/response/AuthenticationResponse.java), [UserRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/repository/UserRepository.java), [UserEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/entity/UserEntity.java), [SecurityConfig](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/SecurityConfig.java), [CustomJwtDecoder](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/CustomJwtDecoder.java), [GlobalExceptionHandler](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/GlobalExceptionHandler.java), [ErrorCode](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/ErrorCode.java), [ApiResponse](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/dto/response/ApiResponse.java), [application.yml](../../../airbnb_service/src/main/resources/application.yml) (chỉ tham chiếu tên cấu hình, không sao chép bí mật).

Luồng source: controller → `authenticate` → `findByUsername` → kiểm tra isActive → BCrypt.matches → tạo hai JWT → cập nhật lastLogin → save → DTO. Không dùng mapper hoặc native SQL riêng trong luồng đăng nhập này. JWT đi vào API bảo vệ qua decoder/introspect và Redis blacklist.

## 2. Ma trận yêu cầu và hợp đồng

| ID | Nội dung | Căn cứ |
| --- | --- | --- |
| R-A01 | Login công khai; dùng username/password, không yêu cầu Bearer hoặc role trước đó | [CODE] controller + SecurityConfig |
| R-A02 | Chỉ tài khoản active có mật khẩu khớp mới được cấp token | [CODE] authenticate; cần xác nhận quy tắc isActive=null |
| R-A03 | Thành công HTTP 200, body code=200, message giữ đúng `Login succesfully!`, result có access_token, refresh_token, expired_token | [CODE] controller + DTO |
| R-A04 | JWT đúng chữ ký ứng dụng, sub=username, jti khác nhau, type_token=access/refresh, scope từ role DB, hạn theo cấu hình | [CODE] generationToken; cần chốt thời hạn và issuer |
| R-A05 | Chỉ đăng nhập thành công cập nhật lastLogin; không đổi credential, role, user khác hoặc tạo user mới | [CODE] authenticate và [ĐX] tính toàn vẹn |
| R-A06 | Sai credential phải bị từ chối nhất quán, không tiết lộ username tồn tại | [ĐX] cần xác nhận Q-A01 |
| R-A07 | Đầu vào thiếu/sai kiểu/sai JSON bị từ chối rõ ràng, không phát token hoặc ghi lastLogin | [ĐX] cần chốt validation Q-A02 |
| R-A08 | Token được cấp chỉ dùng trong đúng ngữ cảnh, refresh token không được dùng làm access token; token hết hạn/thu hồi bị từ chối | [CODE] introspect + decoder; HTTP lỗi cần Q-G01 |

Request chuẩn `LOGIN_A` với H0:

```json
{"username":"qa_guest_a","password":"<PASSWORD_QA>"}
```

Response thành công `LOGIN_OK`:

```json
{"code":200,"timestamp":"<DYNAMIC_TIMESTAMP>","message":"Login succesfully!","result":{"access_token":"<ACCESS_A>","refresh_token":"<REFRESH_A>","expired_token":"<DURATION_ACCESS_AS_STRING>"}}
```

Timestamp chỉ minh họa vị trí, không áp đặt format. Đối chiếu token trong môi trường kiểm thử, không đưa giá trị thật vào báo cáo. Không giả định access token luôn sống ngắn hơn refresh token.

| Nhánh lỗi source | HTTP / body ghi nhận | Vấn đề nghiệm thu |
| --- | --- | --- |
| Sai password | 401 / E106 | Tương thích kỳ vọng từ chối |
| Username không tồn tại | 500 / E(1000, `user existd`) | Mâu thuẫn ngữ nghĩa, khác sai password; Q-A01 |
| isActive=false | 400 / E(1022, `account not acccess`) | Chốt có giữ 400 hay dùng 403; Q-A03 |
| RuntimeException tại MVC | 400, body code mặc định có thể là 200 và message exception | Chưa là schema lỗi chấp nhận; Q-A02/Q-A06 |

## 3. Điểm cần xác nhận

| ID | Câu hỏi và chênh lệch source |
| --- | --- |
| Q-A01 | Đề xuất mọi username không tồn tại/sai password đều 401/E106. Source trả 500/code1000 cho username không tồn tại; cần xác nhận thông điệp chống dò tài khoản. |
| Q-A02 | DTO không có constraint và controller không `@Valid`; chốt null, blank, kiểu JSON, trim/case-sensitive và giới hạn độ dài. Không lấy validation đăng ký làm quy tắc login. |
| Q-A03 | Chốt HTTP cho user khóa và xử lý isActive=null; source so sánh Boolean với false có thể NPE khi null. |
| Q-A04 | Issuer trong generationToken đang là chuỗi cứng `inmobi.com.vn`; có đúng issuer dự án không? Scope lấy role từ DB, không từ request. |
| Q-A05 | Source tính duration theo giây. Cấu hình khảo sát có access=360000 giây và refresh=86400 giây, khiến access dài hơn refresh; cần xác nhận ý định, không cố định giá trị này làm yêu cầu lâu dài. expired_token chỉ trả duration access dạng String. |
| Q-A06 | Lỗi đọc/lưu DB hoặc ký JWT phải được ánh xạ ra sao? Đề xuất 5xx có kiểm soát, không phát token khi không hoàn thành cập nhật lastLogin, không lộ exception/SQL. |
| Q-A07 | Chốt phản hồi malformed JSON (400), sai media type (415), schema lỗi và việc Bearer hỏng trên endpoint public vẫn bị filter từ chối. Không gán nhầm lỗi parse thành lỗi credential. |

## 4. Test case

### AUTH-UT-001 — Đăng nhập hợp lệ tại service

- **ID:** AUTH-UT-001
- **Yêu cầu liên quan:** R-A02, R-A03, R-A05
- **Mục tiêu:** Đăng nhập hợp lệ tại service.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** UserRepository trả U_A, isActive=true; BCrypt double trả true; save trả cùng user; cấu hình ký dành riêng cho test.
- **Dữ liệu đầu vào:** LOGIN_A; lastLogin ban đầu=t_old.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi AuthenticationService.authenticate(LOGIN_A).
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** DTO có đủ hai token và expired_token; không có password/hash.
- **Trạng thái dữ liệu:** save đúng U_A một lần; lastLogin tăng trong cửa sổ gọi; không đổi password/roles.
- **Căn cứ / điểm cần xác nhận:** Oracle [CODE]; unit không chứng minh BCrypt thật hoặc commit DB.

### AUTH-UT-002 — Sai mật khẩu không ghi lastLogin

- **ID:** AUTH-UT-002
- **Yêu cầu liên quan:** R-A02, R-A05
- **Mục tiêu:** Sai mật khẩu không ghi lastLogin.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A tồn tại active; BCrypt double trả false.
- **Dữ liệu đầu vào:** username=qa_guest_a, password=&lt;WRONG_PASSWORD_QA&gt;.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi authenticate với mật khẩu sai.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** AppException UNAUTHENTICATED; không có DTO token.
- **Trạng thái dữ liệu:** Không gọi save; lastLogin/roles/credential không đổi.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### AUTH-UT-003 — Tài khoản khóa bị chặn trước bước kiểm tra mật khẩu

- **ID:** AUTH-UT-003
- **Yêu cầu liên quan:** R-A02, R-A05
- **Mục tiêu:** Tài khoản khóa bị chặn trước bước kiểm tra mật khẩu.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Repository trả U_LOCKED có isActive=false.
- **Dữ liệu đầu vào:** Đúng username/password của U_LOCKED.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi authenticate.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** AppException ACCOUNT_NOT_ACCESS theo source.
- **Trạng thái dữ liệu:** Không gọi passwordEncoder.matches và không save; không cấp token.
- **Căn cứ / điểm cần xác nhận:** HTTP chỉ được kiểm tra ở integration; Q-A03 quyết định status nghiệm thu.

### AUTH-UT-004 — Claims và chữ ký của cặp token đăng nhập

- **ID:** AUTH-UT-004
- **Yêu cầu liên quan:** R-A04
- **Mục tiêu:** Claims và chữ ký của cặp token đăng nhập.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A có role GUEST; cấu hình test có hai duration dương và khóa ký riêng.
- **Dữ liệu đầu vào:** LOGIN_A; cấu hình duration test được ghi nhận bằng tên và số giây, không dùng khóa thật.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi authenticate; xác minh chữ ký của hai token bằng verifier và kiểm tra claims.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Hai JWT hợp lệ, sub=qa_guest_a, type_token lần lượt access/refresh, jti không rỗng và khác nhau; scope chứa đúng GUEST; exp-iat khớp từng duration với dung sai làm tròn 1 giây.
- **Trạng thái dữ liệu:** Chỉ U_A được save; không ghi token vào DB hoặc Redis từ nhánh authenticate.
- **Căn cứ / điểm cần xác nhận:** Oracle [CODE]; issuer và lựa chọn duration cần Q-A04/Q-A05. Không chỉ decode Base64 rồi coi là xác minh chữ ký.

### AUTH-UT-005 — Lỗi save không trả cặp token thành công

- **ID:** AUTH-UT-005
- **Yêu cầu liên quan:** R-A05
- **Mục tiêu:** Lỗi save không trả cặp token thành công.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Credential hợp lệ; userRepository.save ném lỗi persistence giả lập.
- **Dữ liệu đầu vào:** LOGIN_A.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi authenticate khi save lỗi.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Không trả AuthenticationResponse thành công; lỗi được truyền lên để ánh xạ ở HTTP.
- **Trạng thái dữ liệu:** Không gọi tác dụng phụ khác; unit không chứng minh rollback DB.
- **Căn cứ / điểm cần xác nhận:** Q-A06; token có thể đã được tạo trong bộ nhớ trước save nhưng không được trả cho client.

### AUTH-IT-001 — Đăng nhập không cần đăng nhập trước

- **ID:** AUTH-IT-001
- **Yêu cầu liên quan:** R-A01, R-A02, R-A03, R-A05
- **Mục tiêu:** Đăng nhập không cần đăng nhập trước.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A có mật khẩu fixture được BCrypt thật lưu đúng; lastLogin cũ; DB kiểm thử sẵn sàng.
- **Dữ liệu đầu vào:** LOGIN_A
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** LOGIN_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** LOGIN_OK; result có đúng tên ba field đã đặc tả.
- **Trạng thái dữ liệu:** lastLogin U_A cập nhật và persisted; không thêm user/role/booking/payment; credential không đổi.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### AUTH-IT-002 — Sai password bị từ chối qua HTTP

- **ID:** AUTH-IT-002
- **Yêu cầu liên quan:** R-A02, R-A06
- **Mục tiêu:** Sai password bị từ chối qua HTTP.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A active, tồn tại; ghi lastLogin trước.
- **Dữ liệu đầu vào:** LOGIN_A với password=&lt;WRONG_PASSWORD_QA&gt;.
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** LOGIN_A với password=&lt;WRONG_PASSWORD_QA&gt;.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 401
- **Response/giá trị trả về:** E106; không có access_token/refresh_token.
- **Trạng thái dữ liệu:** Không thay lastLogin hoặc hồ sơ U_A.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### AUTH-IT-003 — Username không tồn tại không tiết lộ tài khoản

- **ID:** AUTH-IT-003
- **Yêu cầu liên quan:** R-A05, R-A06
- **Mục tiêu:** Username không tồn tại không tiết lộ tài khoản.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** username qa_missing được xác nhận không tồn tại.
- **Dữ liệu đầu vào:** {"username":"qa_missing","password":"&lt;WRONG_PASSWORD_QA&gt;"}
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** {"username":"qa_missing","password":"&lt;WRONG_PASSWORD_QA&gt;"}

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 401; cần Q-A01
- **Response/giá trị trả về:** Đề xuất E106 giống ca sai password; không trả token.
- **Trạng thái dữ liệu:** Không thêm user hoặc cập nhật user khác.
- **Căn cứ / điểm cần xác nhận:** Source dự báo HTTP 500/code1000/message user existd. Đây là sai lệch cần xác nhận, chưa phải lỗi đã chạy tái hiện.

### AUTH-IT-004 — Tài khoản bị khóa không nhận token

- **ID:** AUTH-IT-004
- **Yêu cầu liên quan:** R-A02, R-A05
- **Mục tiêu:** Tài khoản bị khóa không nhận token.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_LOCKED isActive=false; password đúng; chưa có thay đổi đồng thời.
- **Dữ liệu đầu vào:** {"username":"qa_locked","password":"&lt;PASSWORD_QA&gt;"}
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** {"username":"qa_locked","password":"&lt;PASSWORD_QA&gt;"}

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 400 theo [CODE]; chính sách cần Q-A03
- **Response/giá trị trả về:** E(1022,"account not acccess"); không có token.
- **Trạng thái dữ liệu:** lastLogin U_LOCKED không đổi.
- **Căn cứ / điểm cần xác nhận:** Chưa coi 400 là HTTP nghiệp vụ đã được duyệt; đề xuất cân nhắc 403.

### AUTH-IT-005 — Thiếu hoặc null credential

- **ID:** AUTH-IT-005
- **Yêu cầu liên quan:** R-A07
- **Mục tiêu:** Thiếu hoặc null credential.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A active; mỗi biến thể độc lập.
- **Dữ liệu đầu vào:** Lần lượt {}, {"username":null,"password":"x"}, {"username":"qa_guest_a"}, {"username":"qa_guest_a","password":null}.
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** Lần lượt {}, {"username":null,"password":"x"}, {"username":"qa_guest_a"}, {"username":"qa_guest_a","password":null}.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400; Q-A02
- **Response/giá trị trả về:** E_VALIDATION; không có token.
- **Trạng thái dữ liệu:** Không đổi lastLogin/user/role.
- **Căn cứ / điểm cần xác nhận:** DTO chưa validation; source có thể trả 500 hoặc 401 tùy nhánh. Không tự kỳ vọng một status duy nhất như đã được xác nhận.

### AUTH-IT-006 — Biên chuỗi rỗng và khoảng trắng

- **ID:** AUTH-IT-006
- **Yêu cầu liên quan:** R-A07
- **Mục tiêu:** Biên chuỗi rỗng và khoảng trắng.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A active; password fixture không chỉ gồm whitespace.
- **Dữ liệu đầu vào:** username="" hoặc "   " với password hợp lệ; tách riêng password="" hoặc "   " với username=qa_guest_a.
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** username="" hoặc "   " với password hợp lệ; tách riêng password="" hoặc "   " với username=qa_guest_a.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400; Q-A02
- **Response/giá trị trả về:** E_VALIDATION; không có token.
- **Trạng thái dữ liệu:** Không đổi lastLogin hoặc tạo user.
- **Căn cứ / điểm cần xác nhận:** Cần chốt trim username; không trim password rồi vô tình chấp nhận credential khác.

### AUTH-IT-007 — Phân biệt password đúng với password thêm khoảng trắng

- **ID:** AUTH-IT-007
- **Yêu cầu liên quan:** R-A02, R-A07
- **Mục tiêu:** Phân biệt password đúng với password thêm khoảng trắng.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Password fixture P được biết trong môi trường test; P không có whitespace ở đầu/cuối.
- **Dữ liệu đầu vào:** Hai lần độc lập: LOGIN_A password=P; LOGIN_A password=P+" ".
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** Hai lần độc lập: LOGIN_A password=P; LOGIN_A password=P+" ".

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200 cho P; đề xuất 401 cho P+space
- **Response/giá trị trả về:** P trả LOGIN_OK; P+space trả E106.
- **Trạng thái dữ liệu:** Chỉ lần P cập nhật lastLogin.
- **Căn cứ / điểm cần xác nhận:** Oracle mật khẩu chính xác [CODE]; quy tắc chuẩn hóa credential cần Q-A02.

### AUTH-IT-008 — JSON sai cú pháp hoặc không có body

- **ID:** AUTH-IT-008
- **Yêu cầu liên quan:** R-A07
- **Mục tiêu:** JSON sai cú pháp hoặc không có body.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Endpoint sẵn sàng; mỗi biến thể riêng.
- **Dữ liệu đầu vào:** Body thô {"username": hoặc body rỗng.
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** Body thô {"username": hoặc body rỗng.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400; Q-A07
- **Response/giá trị trả về:** Response lỗi parse theo schema đã chốt; không token, không SQL/stack trace.
- **Trạng thái dữ liệu:** Không thay dữ liệu.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### AUTH-IT-009 — Sai kiểu và độ dài credential vượt giới hạn

- **ID:** AUTH-IT-009
- **Yêu cầu liên quan:** R-A07
- **Mục tiêu:** Sai kiểu và độ dài credential vượt giới hạn.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P2.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Chốt Umax/Pmax ở Q-A02 trước khi dùng biến thể độ dài.
- **Dữ liệu đầu vào:** username là object hoặc array; biến thể độ dài Umax-1/Umax/Umax+1 và Pmax-1/Pmax/Pmax+1; không dùng payload khổng lồ tùy tiện.
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** username là object hoặc array; biến thể độ dài Umax-1/Umax/Umax+1 và Pmax-1/Pmax/Pmax+1; không dùng payload khổng lồ tùy tiện.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Sai kiểu/vượt max: đề xuất 400; trong max: xử lý credential bình thường
- **Response/giá trị trả về:** Lỗi E_VALIDATION nếu vi phạm giới hạn; trong giới hạn chỉ cấp token nếu fixture thực sự khớp.
- **Trạng thái dữ liệu:** Không ghi lastLogin cho mọi credential bị từ chối.
- **Căn cứ / điểm cần xác nhận:** Q-A02; Umax/Pmax chưa có số được phê duyệt. Ca này chưa sẵn sàng nghiệm thu biến thể độ dài.

### AUTH-IT-010 — Role khác nhau vẫn được login nhưng không tự nâng quyền

- **ID:** AUTH-IT-010
- **Yêu cầu liên quan:** R-A01, R-A04
- **Mục tiêu:** Role khác nhau vẫn được login nhưng không tự nâng quyền.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A/U_HOST/U_ADMIN active có credential riêng; ba lượt độc lập.
- **Dữ liệu đầu vào:** LOGIN_A; thay username/password tương ứng U_HOST rồi U_ADMIN; thử thêm field roles=["ADMIN"] vào request của U_A.
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** LOGIN_A; thay username/password tương ứng U_HOST rồi U_ADMIN; thử thêm field roles=["ADMIN"] vào request của U_A.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200 với credential hợp lệ
- **Response/giá trị trả về:** LOGIN_OK tương ứng; scope chỉ phản ánh role DB của mỗi user; request roles không làm U_A thành ADMIN.
- **Trạng thái dữ liệu:** user_roles và pending không đổi; lastLogin chỉ user đang login.
- **Căn cứ / điểm cần xác nhận:** Login không yêu cầu role trước đó; trường hợp thiếu quyền admin nằm ở HOST-IT-013, không ép login public phải trả 403.

### AUTH-IT-011 — Access token đăng nhập dùng được trên API bảo vệ

- **ID:** AUTH-IT-011
- **Yêu cầu liên quan:** R-A04, R-A08
- **Mục tiêu:** Access token đăng nhập dùng được trên API bảo vệ.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Lấy access token của U_A từ AUTH-IT-001; Redis kiểm thử hoạt động; user vẫn tồn tại.
- **Dữ liệu đầu vào:** Không có body.
- **HTTP method và endpoint:** `GET /api/users/myInformation`
- **Headers cần thiết:** H_A
- **Request:** Không có body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi GET `/api/users/myInformation` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200
- **Response/giá trị trả về:** ApiResponse.result là hồ sơ U_A, không chứa password/hash; không được là hồ sơ U_B.
- **Trạng thái dữ liệu:** Không thay lastLogin thêm lần nữa, user_roles/booking không đổi.
- **Căn cứ / điểm cần xác nhận:** Đây là probe token, không đặc tả toàn bộ hợp đồng hồ sơ.

### AUTH-IT-012 — Refresh token không được dùng làm access token

- **ID:** AUTH-IT-012
- **Yêu cầu liên quan:** R-A08
- **Mục tiêu:** Refresh token không được dùng làm access token.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Lấy refresh token từ đăng nhập hợp lệ; Redis kiểm thử hoạt động.
- **Dữ liệu đầu vào:** Không có body.
- **HTTP method và endpoint:** `GET /api/users/myInformation`
- **Headers cần thiết:** H_REFRESH
- **Request:** Không có body.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi GET `/api/users/myInformation` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 401; Q-G01
- **Response/giá trị trả về:** E106, không có hồ sơ người dùng.
- **Trạng thái dữ liệu:** Không thay dữ liệu, không tạo blacklist mới chỉ vì bị từ chối.
- **Căn cứ / điểm cần xác nhận:** introspect kiểm tra type_token=access, nhưng AppException đi qua filter cần xác minh HTTP.

### AUTH-IT-013 — Biên hết hạn và token bị thu hồi

- **ID:** AUTH-IT-013
- **Yêu cầu liên quan:** R-A08
- **Mục tiêu:** Biên hết hạn và token bị thu hồi.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Dùng token fixture có jti; đồng hồ test thống nhất; Redis riêng; chuẩn bị từng biến thể không ghi Redis dùng chung.
- **Dữ liệu đầu vào:** {"token":"&lt;TOKEN&gt;"}; lần lượt exp=T-1 giây, exp=T, exp=T+60 giây và token còn hạn nhưng jti đã blacklist.
- **HTTP method và endpoint:** `POST /auth/introspect`
- **Headers cần thiết:** H0
- **Request:** {"token":"&lt;TOKEN&gt;"}; lần lượt exp=T-1 giây, exp=T, exp=T+60 giây và token còn hạn nhưng jti đã blacklist.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/introspect` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 401 cho hết hạn/blacklist; 200 cho còn hạn không blacklist
- **Response/giá trị trả về:** Lỗi E106; thành công code=200/message="Introspect valid!"/result.vaild=true (giữ tên vaild).
- **Trạng thái dữ liệu:** Không sửa user/role hoặc thêm blacklist; chỉ đọc Redis.
- **Căn cứ / điểm cần xác nhận:** Oracle exp>now từ source; exp=T cần đồng hồ kiểm soát, không dùng sleep để đoán biên. Kiểm tra HTTP endpoint introspect, không thay cho filter Q-G01.

### AUTH-IT-014 — Lỗi persistence khi login không bị báo thành công

- **ID:** AUTH-IT-014
- **Yêu cầu liên quan:** R-A05
- **Mục tiêu:** Lỗi persistence khi login không bị báo thành công.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Cô lập DB/test fault; credential hợp lệ; gây lỗi ghi lastLogin; không dùng DB dev chung.
- **Dữ liệu đầu vào:** LOGIN_A.
- **HTTP method và endpoint:** `POST /auth/login`
- **Headers cần thiết:** H0
- **Request:** LOGIN_A.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/auth/login` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 5xx có kiểm soát; Q-A06
- **Response/giá trị trả về:** Response lỗi theo schema cần chốt; không trả cặp token và không lộ SQL/exception nhạy cảm.
- **Trạng thái dữ liệu:** Không được báo commit thành công; kiểm tra lastLogin thực sau lỗi bằng kết nối độc lập.
- **Căn cứ / điểm cần xác nhận:** Handler RuntimeException hiện có thể biến lỗi thành 400/body code=200; cần xác nhận hợp đồng vận hành.

## 5. Truy vết yêu cầu và phân loại

Các ID dưới đây trỏ tới test case trong mục 4. Một ca có nhiều biến thể phải ghi kết quả từng biến thể riêng.

| Yêu cầu | Unit test | Integration test |
| --- | --- | --- |
| R-A01 | — | `AUTH-IT-001`, `AUTH-IT-010` |
| R-A02 | `AUTH-UT-001`, `AUTH-UT-002`, `AUTH-UT-003` | `AUTH-IT-001`, `AUTH-IT-002`, `AUTH-IT-004`, `AUTH-IT-007` |
| R-A03 | `AUTH-UT-001` | `AUTH-IT-001` |
| R-A04 | `AUTH-UT-004` | `AUTH-IT-010`, `AUTH-IT-011` |
| R-A05 | `AUTH-UT-001`, `AUTH-UT-002`, `AUTH-UT-003`, `AUTH-UT-005` | `AUTH-IT-001`, `AUTH-IT-003`, `AUTH-IT-004`, `AUTH-IT-014` |
| R-A06 | — | `AUTH-IT-002`, `AUTH-IT-003` |
| R-A07 | — | `AUTH-IT-005`, `AUTH-IT-006`, `AUTH-IT-007`, `AUTH-IT-008`, `AUTH-IT-009` |
| R-A08 | — | `AUTH-IT-011`, `AUTH-IT-012`, `AUTH-IT-013` |
