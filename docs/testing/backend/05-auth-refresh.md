# Đặc tả kiểm thử — Làm mới access token và refresh token

**Trạng thái:** Thiết kế bổ sung, chưa thực thi 15 ID dưới đây (5 unit, 10 integration). Không suy từ test liên quan rằng các ID mới đã được cài đặt/chạy. Đọc [quy ước [CODE]/[DOC]/[ĐX], headers và fixture](README.md) trước khi dùng.

## 1. Phạm vi và nguồn

Phạm vi: kiểm tra refresh token, cấp cặp JWT mới, role lấy lại từ DB, lỗi blacklist/DB, sử dụng lại token và giao thoa với logout. Không mặc định hệ thống có refresh-token rotation hoặc frontend tự refresh.

Nguồn: [AuthenticationController](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/controller/AuthenticationController.java), [AuthenticationService](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/service/AuthenticationService.java), [SecurityConfig](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/SecurityConfig.java), [CustomJwtDecoder](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/CustomJwtDecoder.java), [GlobalExceptionHandler](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/GlobalExceptionHandler.java), [ErrorCode](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/ErrorCode.java), [UserRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/repository/UserRepository.java), [UserEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/entity/UserEntity.java), [RefreshTokenRequest](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/dto/request/RefreshTokenRequest.java), [AuthenticationResponse](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/dto/response/AuthenticationResponse.java), [InvalidTokenRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/repository/InvalidTokenRepository.java) và [README backend](../../../airbnb_service/README.md#blacklist-token).

Luồng: `refreshToken` → `handleRefreshToken` → `isValidToken` → kiểm tra `type_token=refresh`, `jti`, blacklist → `findByUsername(sub)` → `generationToken` hai lần. Không mapper/native SQL, không save user, không cập nhật lastLogin. Không kiểm tra isActive và không thu hồi refresh cũ.

Caller được khảo sát: [httpClient](../../../frontend/src/shared/api/httpClient.js) xóa token khi nhận 401, chưa tự gọi refresh; nó tự gắn access token từ localStorage. Không dùng hành vi này để khẳng định API refresh yêu cầu access token.

## 2. Ma trận yêu cầu và hợp đồng

| ID | Nội dung | Căn cứ |
| --- | --- | --- |
| R-RF01 | POST /auth/refresh có ý định công khai; chỉ cần refresh token trong body. | [CODE] controller; SecurityConfig khai báo auth/refresh thiếu dấu / đầu, cần xác minh matcher qua HTTP. |
| R-RF02 | Chỉ JWT ký đúng, exp>now, type_token=refresh, jti khác null và không blacklist mới đi đến truy vấn user. | [CODE] handleRefreshToken. |
| R-RF03 | Thành công cấp access/refresh mới, HS512, sub từ user, scope từ role DB hiện tại, jti độc lập, exp theo cấu hình. | [CODE] generationToken/DTO. |
| R-RF04 | Refresh không đổi user/password/lastLogin và không ghi blacklist; token cũ tiếp tục dùng được khi còn hạn. | [DOC]/[CODE] README backend và service; không áp rotation ngầm. |
| R-RF05 | Lỗi user/DB/Redis/ký token không phát cặp token thành công; hợp đồng lỗi cần chốt. | [CODE] và [ĐX], Q-RF02/Q-RF03. |
| R-RF06 | Quy tắc user khóa, input, Bearer hết hạn và refresh đồng thời cần quyết định riêng. | [ĐX], Q-RF01/Q-RF04/Q-RF05/Q-RF06. |

Request `REFRESH_A`, H0 (không Authorization):

```json
{"refresh_token":"<REFRESH_A>"}
```

Thành công dự kiến theo controller: HTTP 200, body `code=200`, `message="refresh token succesfully"`, result gồm `access_token`, `refresh_token`, `expired_token` dạng String. Timestamp động. JWT mới có issuer `inmobi.com.vn`; thời hạn đọc cấu hình test `security.duration_access`/`security.duration_refresh`, không lấy số runtime dev làm yêu cầu.

Token sai chữ ký/hết hạn/sai loại/thiếu jti/bị blacklist: service ném UNAUTHENTICATED; tại MVC là HTTP 401/E106. User theo sub không tồn tại: USER_NOT_EXISTED → HTTP 500/code1009/message `user not existd` theo ErrorCode. RuntimeException dependency tại MVC hiện bị handler trả HTTP 400, body code mặc định có thể 200; đây là hành vi source, không phải hợp đồng lỗi đề xuất.

Matcher công khai hiện dùng chuỗi `"auth/refresh"` trong SecurityConfig. Phải chạy REFRESH-IT-001 qua filter thật để chứng minh H0 truy cập được; không coi standalone controller/service là bằng chứng matcher.

## 3. Điểm cần xác nhận

| ID | Câu hỏi / chênh lệch source |
| --- | --- |
| Q-RF01 | User đã bị khóa sau login có được refresh không? Source hiện không xét isActive; [ĐX] từ chối cấp token mới cho user khóa, chốt status/code và xử lý null. |
| Q-RF02 | Chốt user bị xóa hoặc sub không tồn tại: giữ 500/code1009 theo source hay 401/E106 thống nhất? Không tự sửa oracle thành chính sách mới. |
| Q-RF03 | Chốt 5xx có kiểm soát khi DB/Redis hoặc ký JWT lỗi; source có thể trả 400/body code200 hoặc để JOSEException thoát. Không trả token/lộ SQL hay khóa ký. |
| Q-RF04 | Có cần rotation, phát hiện reuse và xử lý refresh đồng thời không? README nói rõ chưa thu hồi refresh cũ; không gắn Fail hiện trạng chỉ vì reuse thành công. |
| Q-RF05 | Chốt hành vi khi access token Bearer hết hạn nhưng body refresh còn hạn; cần gọi H0 hay client phải bỏ Bearer? Lỗi decoder/filter liên quan Q-G01. |
| Q-RF06 | Chốt thiếu/null/blank/sai kiểu refresh_token, độ dài và schema lỗi; DTO/controller chưa có validation. Không đoán null luôn cùng nhánh với chuỗi hỏng. |

## 4. Môi trường, fixture và giới hạn bằng chứng

Dùng U_A, U_LOCKED, U_NO_ROLE; R1 là refresh còn hạn, A1 là access tương ứng, R2 là refresh mới khi thành công. Chuẩn bị JWT test ký đúng với exp quá khứ, bằng giây hiện tại, tương lai; bỏ type_token/jti/exp; sửa type thành access hoặc giá trị khác. JWT sai chữ ký tạo riêng bằng khóa test khác. Role DB trước/sau phải là fixture đã chuẩn bị riêng, không gửi SQL cập nhật vào DB dev.

Unit dùng repository/blacklist/mailer doubles và key ký riêng. Integration qua HTTP/filter/controller/service thật; MySQL và Redis cô lập để đọc role thực, kiểm tra blacklist và snapshot dữ liệu sau commit. Thu hồi token fixture bằng API logout trong ca liên quan; không xóa blacklist dùng chung.

Mọi thao tác dữ liệu thực phải tuân theo [quy tắc database](../../../tools/database-toolbox/AGENTS.md). Tài liệu không cấp quyền seed/reset dữ liệu hoặc gửi thư thật. Dùng fixture và preview được duyệt trước khi ghi; không xóa DB/volume/blacklist để tạo môi trường. Việc soạn này chỉ đọc source và ghi Markdown.

Không so JWT/password/hash nguyên vẹn trong log. Ghi build/commit, HTTP status và code trong body riêng, response đã che bí mật, snapshot trước/sau, key jti fixture đã che khi cần và cửa sổ thời gian đo. Kết quả mock không chứng minh TTL Redis, SMTP delivery, collation/transaction/locking MySQL. Biến thể dữ liệu chạy độc lập và ghi kết quả riêng.

## 5. Test case

### REFRESH-UT-001 — Cấp cặp token có chữ ký và claim đúng

- **Yêu cầu:** R-RF02, R-RF03, R-RF04.
- **Mục tiêu:** Cấp cặp token có chữ ký và claim đúng.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** R1 ký đúng, còn hạn; blacklist=false; repository trả U_A có roles; cấu hình test hợp lệ.
- **Dữ liệu / request:** REFRESH_A; duration access/refresh test khác nhau.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleRefreshToken(R1), parse và verify hai JWT bằng khóa test.
   **Kỳ vọng:** HS512/chữ ký đúng; type access/refresh, sub=username U_A, issuer đúng, scope từ user trả về; exp−iat đúng duration.

2. Đối chiếu jti và tương tác dependency.
   **Kỳ vọng:** Hai jti mới khác nhau và khác R1; expired_token là duration access dạng String; không save user, gửi mail hoặc invalidate.

**Hậu điều kiện / bằng chứng:** lastLogin/password/roles không đổi trong object; không suy ra persistence/HTTP.

### REFRESH-UT-002 — Token hết hạn hoặc chữ ký hỏng dừng trước dependency

- **Yêu cầu:** R-RF02.
- **Mục tiêu:** Token hết hạn hoặc chữ ký hỏng dừng trước dependency.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Doubles mới mỗi biến thể; signing key test cố định.
- **Dữ liệu / request:** R1 exp≤now, exp thiếu, chữ ký khóa khác, chuỗi không phải JWT; không-null.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleRefreshToken cho từng token.
   **Kỳ vọng:** Ném AppException UNAUTHENTICATED khi isValidToken=false.

2. Kiểm tra tương tác.
   **Kỳ vọng:** Không gọi UserRepository/blacklist/mailer và không cấp token.

**Hậu điều kiện / bằng chứng:** Không ghi dữ liệu; không log nguyên JWT khi kiểm thử lỗi parse.

### REFRESH-UT-003 — Sai loại, thiếu jti hoặc đã blacklist

- **Yêu cầu:** R-RF02.
- **Mục tiêu:** Sai loại, thiếu jti hoặc đã blacklist.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** JWT ký đúng, exp tương lai; mock blacklist chỉ khi cần.
- **Dữ liệu / request:** type=access/khác/thiếu; jti thiếu; refresh jti đã blacklist.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleRefreshToken mỗi biến thể.
   **Kỳ vọng:** UNAUTHENTICATED; không trả AuthenticationResponse.

2. Kiểm tra short-circuit.
   **Kỳ vọng:** Sai type/thiếu jti không đọc blacklist; bị blacklist không truy vấn user; không invalidate.

**Hậu điều kiện / bằng chứng:** Không thay user hoặc token cũ.

### REFRESH-UT-004 — Subject không có user

- **Yêu cầu:** R-RF05.
- **Mục tiêu:** Subject không có user.
- **Phân loại:** Unit test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE], Q-RF02. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** JWT refresh hợp lệ, không blacklist; findByUsername(sub) trả Optional.empty.
- **Dữ liệu / request:** sub=qa_missing; R1 hợp lệ.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleRefreshToken.
   **Kỳ vọng:** Ném AppException USER_NOT_EXISTED, không tạo kết quả thành công.

2. Kiểm tra tương tác ghi.
   **Kỳ vọng:** Không save user/blacklist/mail; không tạo user từ claim.

**Hậu điều kiện / bằng chứng:** Không biến claim sub thành tài khoản mới; HTTP phải kiểm tra riêng.

### REFRESH-UT-005 — Dùng role DB và ghi nhận user khóa vẫn được refresh

- **Yêu cầu:** R-RF03, R-RF06.
- **Mục tiêu:** Dùng role DB và ghi nhận user khóa vẫn được refresh.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-RF01. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** JWT R1 mang scope cũ GUEST; repository trả user có roles HOST hoặc isActive=false/null theo biến thể.
- **Dữ liệu / request:** R1 có scope không trùng role DB; user khóa vẫn có roles hợp lệ.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi service rồi verify scope của JWT mới.
   **Kỳ vọng:** [CODE] lấy roles của user DB, không sao chép scope cũ hoặc input giả mạo.

2. Chạy biến thể user khóa/null isActive.
   **Kỳ vọng:** [CODE] service vẫn cấp cặp token; [ĐX] chính sách chặn user khóa cần chốt trước nghiệm thu.

**Hậu điều kiện / bằng chứng:** Không save user/lastLogin; ghi rõ characterization khác với yêu cầu đề xuất.

### REFRESH-IT-001 — Refresh qua H0 khi access đã hết hạn

- **Yêu cầu:** R-RF01, R-RF03.
- **Mục tiêu:** Refresh qua H0 khi access đã hết hạn.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE], cần xác minh matcher. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** R1 hợp lệ; A1 đã hết hạn; không gửi A1 trong header; snapshot DB.
- **Dữ liệu / request:** REFRESH_A với H0.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi POST /auth/refresh qua SecurityFilterChain thật.
   **Kỳ vọng:** HTTP 200, code200, message refresh token succesfully; result đúng ba field token, không password/hash.

2. Verify JWT mới và gọi introspect bằng access mới trong body.
   **Kỳ vọng:** Chữ ký/type/subject/scope đúng; introspect HTTP 200/vaild=true; DB không đổi.

**Hậu điều kiện / bằng chứng:** Nếu H0 bị 401, ghi chênh lệch matcher Q-RF05/R-RF01, không sửa app trong lượt đặc tả.

### REFRESH-IT-002 — Token cũ và token mới dùng lại đúng hành vi hiện tại

- **Yêu cầu:** R-RF04.
- **Mục tiêu:** Token cũ và token mới dùng lại đúng hành vi hiện tại.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [DOC]/[CODE], Q-RF04. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** R1 còn đủ hạn; H0; blacklist chưa có các jti.
- **Dữ liệu / request:** Gửi R1 lần đầu, gửi lại R1, rồi gửi R2 nhận từ lần đầu.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Thực hiện ba request refresh tuần tự.
   **Kỳ vọng:** HTTP 200 mỗi lần theo hành vi chưa rotation; các JWT mới có jti khác nhau.

2. Đọc key jti liên quan và snapshot DB.
   **Kỳ vọng:** Refresh không tạo blacklist; không đổi password/role/lastLogin.

**Hậu điều kiện / bằng chứng:** Không khẳng định reuse phải bị chặn; chỉ thay oracle nếu rotation được phê duyệt.

### REFRESH-IT-003 — Sai chữ ký, hết hạn, thiếu claim hoặc sai loại

- **Yêu cầu:** R-RF02.
- **Mục tiêu:** Sai chữ ký, hết hạn, thiếu claim hoặc sai loại.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; token test ký đúng trừ biến thể chữ ký khác; snapshot user/keys.
- **Dữ liệu / request:** Token exp≤now, exp thiếu, type thiếu/access/khác, jti thiếu, chuỗi hỏng, refresh đã blacklist.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi từng token ở refresh_token trong body, không Bearer.
   **Kỳ vọng:** HTTP 401/E106 tại MVC cho các nhánh service đã định nghĩa; không có result.

2. Đọc snapshot và số token được cấp từ response.
   **Kỳ vọng:** Không cặp token mới; không đổi user hoặc thêm blacklist do refresh.

**Hậu điều kiện / bằng chứng:** Ghi từng biến thể; không gộp null vào nhóm lỗi parse đã bắt.

### REFRESH-IT-004 — Logout làm refresh token hết quyền sử dụng

- **Yêu cầu:** R-RF02, R-RF04.
- **Mục tiêu:** Logout làm refresh token hết quyền sử dụng.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** A1/R1 hợp lệ; Redis kiểm thử thật; H0.
- **Dữ liệu / request:** Logout A1/R1 rồi gửi REFRESH_A.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. POST /auth/logout và kiểm tra key R1.
   **Kỳ vọng:** HTTP 204, key R1 tồn tại và còn TTL.

2. POST /auth/refresh bằng R1.
   **Kỳ vọng:** HTTP 401/E106; không cấp token mới hoặc ghi user.

**Hậu điều kiện / bằng chứng:** Không dùng bearer bị revoked trong header; giữ khác biệt lỗi blacklist ở MVC/filter.

### REFRESH-IT-005 — Role thay đổi sau login được phản ánh ở JWT mới

- **Yêu cầu:** R-RF03.
- **Mục tiêu:** Role thay đổi sau login được phản ánh ở JWT mới.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** R1 có scope GUEST; fixture DB đã đổi role sang HOST theo setup được duyệt, R1 chưa blacklist.
- **Dữ liệu / request:** REFRESH_A; lặp thêm user không có role và user nhiều role.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Refresh qua H0.
   **Kỳ vọng:** HTTP 200; scope JWT mới bằng tập role DB hiện tại, so sánh tập không phụ thuộc thứ tự.

2. Đọc snapshot user/role/lastLogin sau request.
   **Kỳ vọng:** Refresh chỉ đọc; không tự thêm role từ scope cũ hoặc field roles gửi kèm.

**Hậu điều kiện / bằng chứng:** Setup role chỉ trong DB kiểm thử riêng; access cũ không tự đổi claim.

### REFRESH-IT-006 — Tài khoản khóa hoặc đã xóa sau login

- **Yêu cầu:** R-RF05, R-RF06.
- **Mục tiêu:** Tài khoản khóa hoặc đã xóa sau login.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-RF01/Q-RF02. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** R1 đã cấp trước khi user fixture bị khóa hoặc không còn; các biến thể độc lập.
- **Dữ liệu / request:** R1 hợp lệ, không blacklist; H0.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Refresh với user bị khóa trong fixture.
   **Kỳ vọng:** [CODE] vẫn có thể nhận HTTP 200/token; [ĐX] chặn token mới với status/code cần chốt.

2. Refresh với sub không tồn tại trong fixture khác.
   **Kỳ vọng:** [CODE] HTTP 500/code1009/user not existd; [ĐX] cân nhắc 401/E106.

**Hậu điều kiện / bằng chứng:** Không kết luận Pass nghiệp vụ khi Q chưa chốt; không xóa user dev để tạo ca.

### REFRESH-IT-007 — Body thiếu/null/sai kiểu hoặc JSON vỡ

- **Yêu cầu:** R-RF06.
- **Mục tiêu:** Body thiếu/null/sai kiểu hoặc JSON vỡ.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-RF06. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; chưa có thao tác ghi; snapshot DB/Redis.
- **Dữ liệu / request:** {}, refresh_token=null/blank/object/array; body rỗng hoặc JSON vỡ.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi từng biến thể riêng.
   **Kỳ vọng:** JSON/sai kiểu không đọc được bị từ chối; blank đi nhánh parse; thiếu/null ghi status/body/exception thực, không suy từ unit.

2. Đối chiếu schema lỗi và dữ liệu.
   **Kỳ vọng:** [ĐX] đầu vào thiếu/sai kiểu phải 400 có kiểm soát, không token/ghi dữ liệu hoặc chi tiết nội bộ.

**Hậu điều kiện / bằng chứng:** Không coi body code200 từ handler chung là thành công; chưa có giới hạn độ dài được phê duyệt.

### REFRESH-IT-008 — Dependency hoặc ký JWT thất bại

- **Yêu cầu:** R-RF05.
- **Mục tiêu:** Dependency hoặc ký JWT thất bại.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [DOC]/[CODE] và [ĐX], Q-RF03. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Harness test kiểm soát lỗi đọc Redis, đọc DB và signer/config riêng; không đổi secret runtime dev.
- **Dữ liệu / request:** R1 hợp lệ; ba điểm lỗi chạy riêng.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi refresh khi dependency tương ứng thất bại.
   **Kỳ vọng:** Không được trả response có cặp token thành công; ghi HTTP/body thực sau exception đã che bí mật.

2. Khôi phục dependency, kiểm tra snapshot.
   **Kỳ vọng:** Không thay DB/blacklist; không trả access token riêng lẻ nếu ký refresh lỗi.

**Hậu điều kiện / bằng chứng:** Đề xuất HTTP 5xx có kiểm soát chưa được phê duyệt; không công bố khóa/config nhạy cảm trong evidence.

### REFRESH-IT-009 — Bearer hết hạn không được nhầm với body refresh

- **Yêu cầu:** R-RF01, R-RF06.
- **Mục tiêu:** Bearer hết hạn không được nhầm với body refresh.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [ĐX], Q-RF05/Q-G01. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** R1 còn hạn; Bearer lần lượt hết hạn, revoked, sai chữ ký, refresh token.
- **Dữ liệu / request:** Authorization biến thể + REFRESH_A; đối chứng H0.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi request qua filter thật.
   **Kỳ vọng:** [ĐX] Bearer invalid phải trả 401/E106, không cấp token; ghi lỗi thoát filter nếu có.

2. Gửi cùng body với H0 trên fixture mới.
   **Kỳ vọng:** Theo hợp đồng công khai dự kiến HTTP 200; xác định yêu cầu phía caller bỏ header cũ.

**Hậu điều kiện / bằng chứng:** Tách kết quả filter khỏi kiểm tra R1; không báo toàn chức năng hỏng chỉ do client gửi header không hợp lệ.

### REFRESH-IT-010 — Hai request refresh đồng thời

- **Yêu cầu:** R-RF04, R-RF06.
- **Mục tiêu:** Hai request refresh đồng thời.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-RF04. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Hai connection/request độc lập, R1 cùng giá trị còn hạn, barrier xuất phát; H0.
- **Dữ liệu / request:** Hai POST /auth/refresh đồng thời, timeout test có giới hạn.
- **HTTP / headers:** `POST /auth/refresh`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi hai request với cùng R1 và thu kết quả riêng.
   **Kỳ vọng:** [CODE] chưa có rotation/lock thu hồi; có thể cả hai 200 và mỗi response có jti riêng.

2. Verify chữ ký/tập jti và snapshot.
   **Kỳ vọng:** Không ghi user/blacklist; ghi lịch xen kẽ và đối chiếu chính sách concurrency Q-RF04.

**Hậu điều kiện / bằng chứng:** Không áp oracle chỉ một request thắng khi chưa có rotation; không suy tính nguyên tử Redis/MySQL từ mock.

## 6. Truy vết và kế hoạch hồi quy

| Yêu cầu | Unit test | Integration test |
| --- | --- | --- |
| R-RF01 | — | `REFRESH-IT-001`, `REFRESH-IT-009` |
| R-RF02 | `REFRESH-UT-001`, `REFRESH-UT-002`, `REFRESH-UT-003` | `REFRESH-IT-003`, `REFRESH-IT-004` |
| R-RF03 | `REFRESH-UT-001`, `REFRESH-UT-005` | `REFRESH-IT-001`, `REFRESH-IT-005` |
| R-RF04 | `REFRESH-UT-001` | `REFRESH-IT-002`, `REFRESH-IT-004`, `REFRESH-IT-010` |
| R-RF05 | `REFRESH-UT-004` | `REFRESH-IT-006`, `REFRESH-IT-008` |
| R-RF06 | `REFRESH-UT-005` | `REFRESH-IT-006`, `REFRESH-IT-007`, `REFRESH-IT-009`, `REFRESH-IT-010` |

- **Smoke dự kiến:** REFRESH-IT-001 → REFRESH-IT-003 → REFRESH-IT-004.
- **Targeted regression:** các ca unit + P0/P1 liên quan nhánh vừa thay đổi; kiểm tra lại login/introspect cùng chức năng này.
- **Full regression:** toàn bộ biến thể của 15 ID và giao thoa login/logout/refresh/reset; chỉ chạy SMTP/DB/Redis trong môi trường kiểm thử riêng.
- **Điều kiện bắt đầu:** fixture/môi trường đã sẵn sàng; Q quyết định oracle được chốt cho ca cần nghiệm thu; lỗi dependency được mô phỏng có kiểm soát.
- **Điều kiện kết thúc đề xuất:** mọi biến thể P0/P1 có kết quả và bằng chứng, không phát token/ghi dữ liệu vượt phạm vi; các Q và rủi ro chưa xử lý có quyết định rõ. Chưa có SLA hoặc tỷ lệ Pass được phê duyệt.

## 7. Tình trạng tự động hóa và ghi kết quả

[AuthenticationServiceTest](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/service/AuthenticationServiceTest.java) có `refreshesUnblockedToken`, `rejectsBlacklistedRefreshTokenBeforeIssuingTokens`, `expiredTokensNeverReachRedis`. Các test này bao phủ một phần nhánh service; chưa chứng minh HTTP, matcher công khai, DB hoặc Redis thật. Chưa tạo test tự động gắn 15 ID REFRESH mới.

Các ID `REFRESH-*` chưa được `airbnb_service/scripts/run_backend_specs.py` nhận diện: script hiện chỉ nhận AUTH/HOST/BOOK và báo cáo bộ 79 ID cũ. Không dùng lệnh chạy bộ 79 ca làm bằng chứng đã chạy đặc tả này, không thêm nhãn Pass vào [báo cáo lịch sử](execution-results.md). Chỉ bổ sung runner/mapping khi có yêu cầu triển khai test tự động riêng.

Mẫu cập nhật khi thực thi:

| ID / biến thể | Build / môi trường / thời điểm | Actual HTTP + body đã che / exception | Thay đổi DB/Redis/mail | Pass/Fail/Blocked | Bằng chứng / Q / bug |
| --- | --- | --- | --- | --- | --- |
| Điền ID cụ thể khi chạy | Chưa chạy | Chưa có | Chưa có | Not Run | Chưa có |

Nếu hành vi lệch đề xuất [ĐX], lưu cả actual và expected cùng Q tương ứng; không sửa logic ứng dụng hay đổi oracle chỉ để đạt màu xanh. Lỗi cần báo gồm bước tái hiện theo ID, môi trường/build, expected/actual đã che bí mật, tác động, priority/severity và nguồn bằng chứng; không gọi nghi vấn từ đọc source là bug đã tái hiện.

