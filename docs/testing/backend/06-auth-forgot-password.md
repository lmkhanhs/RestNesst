# Đặc tả kiểm thử — Quên mật khẩu và cấp mật khẩu mới qua email

**Trạng thái:** Thiết kế bổ sung, chưa thực thi 15 ID dưới đây (5 unit, 10 integration). Không suy từ test liên quan rằng các ID mới đã được cài đặt/chạy. Đọc [quy ước [CODE]/[DOC]/[ĐX], headers và fixture](README.md) trước khi dùng.

## 1. Phạm vi và nguồn

Phạm vi: API hiện nhận username/email, sinh mật khẩu mới và gửi mail trực tiếp; không có reset link, OTP hoặc màn hình đặt mật khẩu mới trong hợp đồng API này. Đặc tả luồng đang có, đồng thời chỉ ra các quyết định bảo mật/vận hành cần xác nhận.

Nguồn: [AuthenticationController](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/controller/AuthenticationController.java), [AuthenticationService](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/service/AuthenticationService.java), [SecurityConfig](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/SecurityConfig.java), [CustomJwtDecoder](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/CustomJwtDecoder.java), [GlobalExceptionHandler](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/GlobalExceptionHandler.java), [ErrorCode](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/ErrorCode.java), [UserRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/repository/UserRepository.java), [UserEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/entity/UserEntity.java), [ForgetPasswordRequest](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/dto/request/ForgetPasswordRequest.java), [MailerService](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/mail/MailerService.java), [PasswordEncoderConfig](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/PasswordEncoderConfig.java) và [ApiResponse](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/dto/response/ApiResponse.java).

Luồng: `postMethodName` → `handleForgetPass` → `findByUsername` → `user.email.equals(email)` → sinh 12 ký tự bằng SecureRandom → `sendSimpleEmail` → BCrypt.encode → `save` → true. Email không khớp trả false, nhưng controller bỏ qua boolean này và vẫn trả cùng response thành công. Không có mapper/native SQL riêng; không cập nhật lastLogin, không thu hồi JWT/blacklist. Lệnh gửi mail diễn ra trước lưu DB, không có transaction chung SMTP/MySQL.

Đây là thiết kế đặc tả, chưa gửi email, chưa đổi mật khẩu và chưa thực thi test cho các ID mới.

## 2. Ma trận yêu cầu và hợp đồng

| ID | Nội dung | Căn cứ |
| --- | --- | --- |
| R-FP01 | POST /auth/forget công khai, dùng username/email. | [CODE] controller + SecurityConfig; không đòi Bearer. |
| R-FP02 | Email khớp chính xác email của username thì sinh 12 ký tự [A-Za-z0-9], gửi đúng địa chỉ và chỉ lưu BCrypt hash. | [CODE] service + PasswordEncoderConfig. |
| R-FP03 | Email không khớp không gửi mail, không encode/save; user không tồn tại ném USER_NOT_EXISTED. | [CODE] service; response controller cần Q-FP01. |
| R-FP04 | Chỉ password của user được đổi khi thành công; role/profile/lastLogin và user khác giữ nguyên. | [CODE] và [ĐX] tính toàn vẹn. |
| R-FP05 | Lỗi SMTP hoặc DB phải có phản hồi kiểm soát; phải xử lý nguy cơ mail đã gửi nhưng mật khẩu chưa lưu. | [ĐX], Q-FP03; source chưa điều phối hai hệ thống. |
| R-FP06 | Chính sách tài khoản khóa, input, thu hồi phiên, chống lạm dụng và đồng thời phải được quyết định. | [ĐX], Q-FP02/Q-FP04/Q-FP05/Q-FP06. |

Request `FORGET_A`, H0:

```json
{"username":"qa_guest_a","email":"qa.guest.a@example.invalid"}
```

Email giả này chỉ là định danh fixture; khi kiểm thử phải route vào mail sink trong mạng test, không SMTP công khai. Thành công theo controller: HTTP 200, `code=200`, `message="update new pass"`, timestamp động, **không có result**, không trả password/hash.

| Nhánh đọc từ source | Kết quả service / HTTP dự kiến tại MVC | Điều cần phân biệt |
| --- | --- | --- |
| Username tồn tại, email khớp | true; HTTP 200 với response trên | Mail đã được sender chấp nhận chưa chứng minh mail đến người nhận |
| Email không khớp hoặc email request=null khi user.email không null | false; controller vẫn HTTP 200 cùng message | Không gửi mail/không đổi password; Q-FP01 |
| Username không tồn tại | AppException USER_NOT_EXISTED; HTTP 500/code1009, message user not existd | Chênh lệch với response chung; Q-FP01 |
| RuntimeException SMTP/DB hoặc user.email=null | Handler chung có thể trả HTTP 400, body code200 và message exception | Chưa là schema lỗi vận hành được chấp thuận; Q-FP03 |

Nội dung mail có prefix `Mật khẩu mới của bạn là: `, subject `Đặt lại mật khẩu`. Có thể kiểm tra nguyên văn bên trong harness/mail sink cô lập; mọi artifact chia sẻ phải che phần mật khẩu sau prefix. BCrypt cấu hình cost 10 trong source; không đưa hash thật vào tài liệu/log. Không dùng kết quả ngẫu nhiên cố định làm oracle.

## 3. Điểm cần xác nhận

| ID | Câu hỏi / chênh lệch source |
| --- | --- |
| Q-FP01 | Có muốn response chung chống dò username/email không? Source email mismatch trả 200/update new pass nhưng unknown username trả 500/code1009. Chốt message/status; phân biệt thông báo trung tính chủ đích với báo đã đổi mật khẩu sai sự thật. |
| Q-FP02 | Chốt trim, phân biệt hoa/thường email/username, email syntax/độ dài, null/blank; DTO/controller chưa validation. Chốt user khóa/null isActive có được reset không; source không kiểm tra. |
| Q-FP03 | Chốt lỗi SMTP/DB và phục hồi khi mail đã gửi nhưng save/commit thất bại. [ĐX] không phát thông báo đổi mật khẩu thành công khi chưa lưu; không gửi lại mail mù quáng hoặc lộ exception qua API. |
| Q-FP04 | Sau reset có phải thu hồi access/refresh cũ của mọi phiên không? Source không làm; JWT hiện không mang phiên bản password và decoder không đối chiếu mật khẩu. |
| Q-FP05 | Chốt chống spam/rate limit, xác minh quyền sở hữu email, và có chuyển sang link/OTP dùng một lần không. Source hiện chỉ đối chiếu username/email rồi gửi mật khẩu mới trực tiếp; không coi đề xuất này là tính năng đã có. |
| Q-FP06 | Chốt retry và hai request reset đồng thời: mail nào còn hiệu lực, idempotency/thứ tự và trải nghiệm người nhận. Source chưa có khóa/phiên bản yêu cầu để liên kết email với lần save thắng. |

## 4. Môi trường, fixture và giới hạn bằng chứng

Bổ sung cho fixture chung: U_A có email fixture `qa.guest.a@example.invalid`, password BCrypt ban đầu giữ trong vùng nhớ harness; U_B có email khác; U_LOCKED có isActive=false và email riêng. Dùng biến runtime <PASSWORD_QA>/<NEW_PASSWORD_QA> khi kiểm tra; không lưu các giá trị này vào báo cáo. Dùng thêm biến thể user.email=null riêng để quan sát dữ liệu cũ, không coi null là giá trị bắt buộc phải chấp nhận.

Unit dùng UserRepository/MailerService double; dùng encoder thật ở ca xác minh BCrypt, double ở ca kiểm tra thứ tự. Integration cần MySQL kiểm thử riêng, Redis kiểm thử cho ca token và mail sink không chuyển tiếp ra Internet. Lỗi SMTP dùng JavaMailSender kiểm thử có kiểm soát cùng MailerService thật, lỗi DB dùng harness test; không bật startup seed hoặc tác động tài khoản người dùng thực.

Mọi thao tác dữ liệu thực phải tuân theo [quy tắc database](../../../tools/database-toolbox/AGENTS.md). Tài liệu không cấp quyền seed/reset dữ liệu hoặc gửi thư thật. Dùng fixture và preview được duyệt trước khi ghi; không xóa DB/volume/blacklist để tạo môi trường. Việc soạn này chỉ đọc source và ghi Markdown.

Không so JWT/password/hash nguyên vẹn trong log. Ghi build/commit, HTTP status và code trong body riêng, response đã che bí mật, snapshot trước/sau, key jti fixture đã che khi cần và cửa sổ thời gian đo. Kết quả mock không chứng minh TTL Redis, SMTP delivery, collation/transaction/locking MySQL. Biến thể dữ liệu chạy độc lập và ghi kết quả riêng.

## 5. Test case

### FORGET-UT-001 — Email khớp sinh mật khẩu và lưu BCrypt

- **Yêu cầu:** R-FP02, R-FP04.
- **Mục tiêu:** Email khớp sinh mật khẩu và lưu BCrypt.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** UserRepository trả U_A; MailerService double capture mail trong bộ nhớ; encoder BCrypt thật.
- **Dữ liệu / request:** FORGET_A; snapshot password/role/lastLogin/profile của U_A.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleForgetPass, lấy password mới từ mail capture trong harness.
   **Kỳ vọng:** Trả true; đúng recipient, subject; password 12 ký tự khớp [A-Za-z0-9]{12}; mail trước save.

2. Kiểm tra password đã lưu bằng BCrypt.matches và tương tác.
   **Kỳ vọng:** Hash khác plaintext, matches mật khẩu gửi mail; save đúng user một lần; không đổi role/profile/lastLogin hoặc blacklist.

**Hậu điều kiện / bằng chứng:** Không log plaintext/hash; không khẳng định độ ngẫu nhiên từ vài mẫu hoặc yêu cầu mật khẩu cố định.

### FORGET-UT-002 — Email không khớp không đổi mật khẩu

- **Yêu cầu:** R-FP03, R-FP04.
- **Mục tiêu:** Email không khớp không đổi mật khẩu.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** U_A tồn tại, email không null; repository/password/mailer doubles.
- **Dữ liệu / request:** Email U_B, chuỗi khác và null trong request, chạy riêng.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleForgetPass với username U_A, email biến thể.
   **Kỳ vọng:** Trả false theo so sánh String.equals.

2. Kiểm tra object và dependency.
   **Kỳ vọng:** Không gọi mailer/encode/save; password/role/lastLogin giữ nguyên.

**Hậu điều kiện / bằng chứng:** Không dùng boolean false để suy controller trả lỗi; cần FORGET-IT-002.

### FORGET-UT-003 — Username không tồn tại dừng trước mail/hash

- **Yêu cầu:** R-FP03.
- **Mục tiêu:** Username không tồn tại dừng trước mail/hash.
- **Phân loại:** Unit test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** findByUsername trả Optional.empty; doubles chưa tương tác.
- **Dữ liệu / request:** username=qa_missing; email fixture bất kỳ.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleForgetPass.
   **Kỳ vọng:** AppException USER_NOT_EXISTED.

2. Kiểm tra lịch sử gọi.
   **Kỳ vọng:** Không gửi mail, không encode/save, không tạo user.

**Hậu điều kiện / bằng chứng:** Không thay dữ liệu; HTTP kiểm tra riêng qua handler.

### FORGET-UT-004 — Gửi mail thất bại không lưu mật khẩu

- **Yêu cầu:** R-FP05.
- **Mục tiêu:** Gửi mail thất bại không lưu mật khẩu.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP03. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Email khớp; mailer double ném MailSendException; encoder/save chưa gọi.
- **Dữ liệu / request:** FORGET_A; lỗi gửi giả lập không chứa dữ liệu cá nhân.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleForgetPass và bắt exception.
   **Kỳ vọng:** Lỗi gửi được truyền lên; không trả true.

2. Kiểm tra thứ tự và password object.
   **Kỳ vọng:** Chưa encode/save; password hash cũ giữ nguyên do sender được gọi trước cập nhật.

**Hậu điều kiện / bằng chứng:** Không kết luận SMTP chưa nhận mail nếu mô phỏng timeout sau khi gửi; trường hợp đó cần evidence sink.

### FORGET-UT-005 — Save lỗi sau khi mail đã gửi

- **Yêu cầu:** R-FP05.
- **Mục tiêu:** Save lỗi sau khi mail đã gửi.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP03. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Email khớp; mailer thành công; users.save ném lỗi; encoder hoạt động.
- **Dữ liệu / request:** FORGET_A; snapshot hash object và mail capture chỉ trong harness.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleForgetPass, dùng InOrder kiểm tra mail → encode → save.
   **Kỳ vọng:** Exception được truyền lên; mail đã được yêu cầu gửi trước lỗi save; không có true.

2. So sánh trạng thái object với mức persistence chưa biết.
   **Kỳ vọng:** Object trong bộ nhớ đã đổi hash, không coi đó là DB đã commit hoặc rollback.

**Hậu điều kiện / bằng chứng:** Ghi nguy cơ mật khẩu mail không dùng được; không đề xuất gửi lại/rollback SMTP như thể đã hỗ trợ.

### FORGET-IT-001 — Reset hợp lệ, đăng nhập bằng mật khẩu trong mail

- **Yêu cầu:** R-FP01, R-FP02, R-FP04.
- **Mục tiêu:** Reset hợp lệ, đăng nhập bằng mật khẩu trong mail.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; U_A/U_B và mail sink cô lập; snapshot DB độc lập; password cũ chỉ trong harness.
- **Dữ liệu / request:** FORGET_A; password mới lấy từ mail sink không ghi ra artifact.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. POST /auth/forget rồi đọc mail và DB sau commit bằng context độc lập.
   **Kỳ vọng:** HTTP 200/code200/update new pass, không result; một mail đúng recipient; password DB là BCrypt khớp mail, chỉ password U_A đổi.

2. Đăng nhập bằng password mới và thử password cũ.
   **Kỳ vọng:** Mới nhận 200/token; cũ nhận 401/E106 nếu khác mật khẩu mới; snapshot bảo toàn role/profile/user khác trước các login.

**Hậu điều kiện / bằng chứng:** Login thành công tự đổi lastLogin, nên đo invariant reset trước login; nếu ngẫu nhiên trùng password cũ, tạo lại fixture thay vì assertion sai.

### FORGET-IT-002 — Email sai vẫn 200 nhưng dữ liệu không đổi

- **Yêu cầu:** R-FP03, R-FP04.
- **Mục tiêu:** Email sai vẫn 200 nhưng dữ liệu không đổi.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP01. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; U_A email cố định; sink rỗng; snapshot user trước request.
- **Dữ liệu / request:** Username U_A, email của U_B.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi POST /auth/forget với email sai.
   **Kỳ vọng:** [CODE] HTTP 200/code200/update new pass, không result vì controller bỏ qua false.

2. Đọc snapshot DB và mail sink.
   **Kỳ vọng:** Password/role/lastLogin không đổi; không gửi mail cho A hoặc B; [ĐX] message/schema trung tính phải được chốt.

**Hậu điều kiện / bằng chứng:** Không coi HTTP 200 là bằng chứng reset thành công; không tạo bug nghiệp vụ đã phê duyệt khi Q-FP01 còn mở.

### FORGET-IT-003 — Username không tồn tại và nguy cơ dò tài khoản

- **Yêu cầu:** R-FP03.
- **Mục tiêu:** Username không tồn tại và nguy cơ dò tài khoản.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP01. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; qa_missing chắc chắn không có trong fixture; sink rỗng.
- **Dữ liệu / request:** Username qa_missing, email fixture.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. POST /auth/forget với username không tồn tại.
   **Kỳ vọng:** [CODE] HTTP 500/code1009/user not existd, không result.

2. So với response email sai của user tồn tại và kiểm tra side effect.
   **Kỳ vọng:** Không mail/ghi DB; ghi khác biệt giúp nhận biết username; [ĐX] response thống nhất cần phê duyệt.

**Hậu điều kiện / bằng chứng:** Không dùng tài khoản thật để dò; không suy rate limit từ ca đơn lẻ.

### FORGET-IT-004 — Email hoa/thường và khoảng trắng

- **Yêu cầu:** R-FP02, R-FP06.
- **Mục tiêu:** Email hoa/thường và khoảng trắng.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP02. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; email DB là chuỗi fixture chữ thường; mỗi biến thể dùng fixture ban đầu.
- **Dữ liệu / request:** Email trùng chính xác, đổi hoa/thường, thêm space đầu/cuối; username thêm space.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi riêng từng biến thể.
   **Kỳ vọng:** [CODE] email String.equals yêu cầu trùng chính xác; mismatch vẫn 200 không đổi password. Username phụ thuộc truy vấn/collation DB, ghi kết quả thực.

2. Đối chiếu mail/DB với oracle chuẩn hóa đã chốt.
   **Kỳ vọng:** Không áp case-insensitive/trim từ suy đoán; chỉ biến thể match source mới gửi mail và lưu.

**Hậu điều kiện / bằng chứng:** Fixture độc lập tránh hash/mật khẩu reset trước ảnh hưởng ca sau; đề xuất chuẩn hóa là quyết định nghiệp vụ.

### FORGET-IT-005 — Thiếu/null/sai kiểu và JSON không hợp lệ

- **Yêu cầu:** R-FP06.
- **Mục tiêu:** Thiếu/null/sai kiểu và JSON không hợp lệ.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP02. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; user.email chuẩn không null; biến thể user.email=null dùng fixture riêng.
- **Dữ liệu / request:** Thiếu từng field, null, blank, email sai cú pháp, object/array; body rỗng/vỡ JSON.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi từng body riêng, thu HTTP/body/exception đã che bí mật.
   **Kỳ vọng:** JSON không đọc được bị từ chối; request email=null có thể trả 200 không save; email DB=null có thể RuntimeException; ghi thực tế, không giả định validation.

2. Kiểm tra sink/DB và đối chiếu [ĐX].
   **Kỳ vọng:** [ĐX] thiếu/sai input phải được xử lý kiểm soát, không đổi password/gửi mail ngoài fixture; schema/status cần chốt.

**Hậu điều kiện / bằng chứng:** Không chọn giới hạn độ dài tùy ý; tách lỗi binding khỏi nhánh username/email của service.

### FORGET-IT-006 — Tài khoản bị khóa vẫn có thể được reset theo source

- **Yêu cầu:** R-FP06.
- **Mục tiêu:** Tài khoản bị khóa vẫn có thể được reset theo source.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP02. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** U_LOCKED có email khớp và roles hợp lệ; H0; sink cô lập.
- **Dữ liệu / request:** username/email U_LOCKED; thêm biến thể isActive=null riêng.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. POST /auth/forget cho tài khoản bị khóa.
   **Kỳ vọng:** [CODE] không kiểm tra isActive nên có thể 200, gửi mail và đổi hash.

2. Đọc DB rồi thử login tài khoản khóa với password mới.
   **Kỳ vọng:** isActive vẫn false; login vẫn 400/code1022 theo source. [ĐX] có cho phép reset user khóa phải được quyết định riêng.

**Hậu điều kiện / bằng chứng:** Không tự kích hoạt user hoặc thêm role; không dùng kết quả reset để khẳng định login được.

### FORGET-IT-007 — SMTP lỗi và DB commit lỗi được phân biệt

- **Yêu cầu:** R-FP05.
- **Mục tiêu:** SMTP lỗi và DB commit lỗi được phân biệt.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP03. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** MailerService thật với JavaMailSender test; MySQL riêng; fault injection SMTP trước gửi hoặc DB lúc commit.
- **Dữ liệu / request:** FORGET_A; hai điểm lỗi chạy độc lập; theo dõi sink.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi reset khi SMTP lỗi trước chấp nhận thư.
   **Kỳ vọng:** Không lưu password mới; không báo đổi mật khẩu thành công. Ghi HTTP thực; đề xuất 5xx/schema kiểm soát.

2. Chạy fixture khác: mail đã nhận trong sink nhưng DB commit lỗi.
   **Kỳ vọng:** Đọc DB độc lập và đối chiếu mail: phát hiện thư chứa password không được commit; không có response thành công.

**Hậu điều kiện / bằng chứng:** Không khẳng định transaction rollback mail; sau ca phục hồi fixture/mail sink riêng theo quy trình đã duyệt.

### FORGET-IT-008 — Hiệu lực token đã cấp trước khi reset

- **Yêu cầu:** R-FP04, R-FP06.
- **Mục tiêu:** Hiệu lực token đã cấp trước khi reset.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP04. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** A1/R1 của U_A còn hạn và chưa blacklist; H0; fixture reset hợp lệ.
- **Dữ liệu / request:** FORGET_A; introspect A1 và refresh R1 sau reset.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Reset thành công và đọc các key jti cũ.
   **Kỳ vọng:** [CODE] reset không ghi blacklist; password thay đổi nhưng jti cũ chưa bị thu hồi.

2. Gọi introspect(A1), refresh(R1) bằng H0.
   **Kỳ vọng:** [CODE] token cũ vẫn có thể dùng; [ĐX] nếu chính sách buộc kết thúc phiên thì cần từ chối theo hợp đồng mới.

**Hậu điều kiện / bằng chứng:** Không coi reset mật khẩu tự thu hồi JWT; không gắn Pass chính sách khi Q-FP04 còn mở.

### FORGET-IT-009 — Chống lạm dụng gửi mail và đổi password liên tục

- **Yêu cầu:** R-FP06.
- **Mục tiêu:** Chống lạm dụng gửi mail và đổi password liên tục.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [ĐX], Q-FP05. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Môi trường cô lập có mail sink và ngân sách số request được duyệt; không load test SMTP thật.
- **Dữ liệu / request:** Một username/email khớp; N request và cửa sổ W do nhóm sản phẩm chốt, chưa gán số cố định.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi request theo N/W đã thống nhất, ghi HTTP và số mail nhận.
   **Kỳ vọng:** Đề xuất giới hạn/tạm chặn có response thống nhất; source controller/service khảo sát chưa có rate-limit riêng, cần kiểm tra tầng triển khai.

2. Kiểm tra không gửi ra Internet và tình trạng password cuối.
   **Kỳ vọng:** Không lộ credential qua response/log; ghi số lần reset/mail để đánh giá lạm dụng.

**Hậu điều kiện / bằng chứng:** Giữ Not Run khi N/W chưa có; không khẳng định hệ thống triển khai không có gateway limit từ chỉ đọc source.

### FORGET-IT-010 — Hai reset đồng thời hoặc client retry

- **Yêu cầu:** R-FP05, R-FP06.
- **Mục tiêu:** Hai reset đồng thời hoặc client retry.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-FP03/Q-FP06. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Hai request độc lập có barrier; mail sink giữ thứ tự nhận; MySQL riêng, snapshot hash không đưa ra artifact.
- **Dữ liệu / request:** Hai FORGET_A đồng thời; biến thể retry sau timeout chạy riêng.
- **HTTP / headers:** `POST /auth/forget`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Thực hiện request và thu từng status/mail mà không ghi plaintext vào báo cáo.
   **Kỳ vọng:** Ghi thứ tự gửi mail và commit; source có thể gửi nhiều thư, không có idempotency key/khóa riêng.

2. Trong harness, dùng BCrypt.matches để xác định thư nào khớp hash cuối.
   **Kỳ vọng:** Đối chiếu chính sách lần reset thắng/hiệu lực email; không mặc định thư đến sau luôn chứa password hiện hành.

**Hậu điều kiện / bằng chứng:** Chưa có oracle thắng/thua khi Q-FP06 chưa chốt; reset fixture để không để user test bị khóa ngoài ý muốn.

## 6. Truy vết và kế hoạch hồi quy

| Yêu cầu | Unit test | Integration test |
| --- | --- | --- |
| R-FP01 | — | `FORGET-IT-001` |
| R-FP02 | `FORGET-UT-001` | `FORGET-IT-001`, `FORGET-IT-004` |
| R-FP03 | `FORGET-UT-002`, `FORGET-UT-003` | `FORGET-IT-002`, `FORGET-IT-003` |
| R-FP04 | `FORGET-UT-001`, `FORGET-UT-002` | `FORGET-IT-001`, `FORGET-IT-002`, `FORGET-IT-008` |
| R-FP05 | `FORGET-UT-004`, `FORGET-UT-005` | `FORGET-IT-007`, `FORGET-IT-010` |
| R-FP06 | — | `FORGET-IT-004`, `FORGET-IT-005`, `FORGET-IT-006`, `FORGET-IT-008`, `FORGET-IT-009`, `FORGET-IT-010` |

- **Smoke dự kiến:** FORGET-IT-001 → FORGET-IT-002 → FORGET-IT-007.
- **Targeted regression:** các ca unit + P0/P1 liên quan nhánh vừa thay đổi; kiểm tra lại login/introspect cùng chức năng này.
- **Full regression:** toàn bộ biến thể của 15 ID và giao thoa login/logout/refresh/reset; chỉ chạy SMTP/DB/Redis trong môi trường kiểm thử riêng.
- **Điều kiện bắt đầu:** fixture/môi trường đã sẵn sàng; Q quyết định oracle được chốt cho ca cần nghiệm thu; lỗi dependency được mô phỏng có kiểm soát.
- **Điều kiện kết thúc đề xuất:** mọi biến thể P0/P1 có kết quả và bằng chứng, không phát token/ghi dữ liệu vượt phạm vi; các Q và rủi ro chưa xử lý có quyết định rõ. Chưa có SLA hoặc tỷ lệ Pass được phê duyệt.

## 7. Tình trạng tự động hóa và ghi kết quả

Các test auth hiện tại được khảo sát chưa có ca tự động gọi `handleForgetPass` hoặc HTTP `/auth/forget`. [AuthLoginHttpTest](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/controller/AuthLoginHttpTest.java) chỉ kiểm tra login, không chứng minh reset mật khẩu/mail. Chưa tạo test tự động gắn 15 ID FORGET mới; không chuyển trạng thái thành Pass từ kết quả login.

Các ID `FORGET-*` chưa được `airbnb_service/scripts/run_backend_specs.py` nhận diện: script hiện chỉ nhận AUTH/HOST/BOOK và báo cáo bộ 79 ID cũ. Không dùng lệnh chạy bộ 79 ca làm bằng chứng đã chạy đặc tả này, không thêm nhãn Pass vào [báo cáo lịch sử](execution-results.md). Chỉ bổ sung runner/mapping khi có yêu cầu triển khai test tự động riêng.

Mẫu cập nhật khi thực thi:

| ID / biến thể | Build / môi trường / thời điểm | Actual HTTP + body đã che / exception | Thay đổi DB/Redis/mail | Pass/Fail/Blocked | Bằng chứng / Q / bug |
| --- | --- | --- | --- | --- | --- |
| Điền ID cụ thể khi chạy | Chưa chạy | Chưa có | Chưa có | Not Run | Chưa có |

Nếu hành vi lệch đề xuất [ĐX], lưu cả actual và expected cùng Q tương ứng; không sửa logic ứng dụng hay đổi oracle chỉ để đạt màu xanh. Lỗi cần báo gồm bước tái hiện theo ID, môi trường/build, expected/actual đã che bí mật, tác động, priority/severity và nguồn bằng chứng; không gọi nghi vấn từ đọc source là bug đã tái hiện.

