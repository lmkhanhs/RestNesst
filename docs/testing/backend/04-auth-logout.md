# Đặc tả kiểm thử — Đăng xuất và thu hồi token

**Trạng thái:** Thiết kế bổ sung, chưa thực thi 15 ID dưới đây (5 unit, 10 integration). Không suy từ test liên quan rằng các ID mới đã được cài đặt/chạy. Đọc [quy ước [CODE]/[DOC]/[ĐX], headers và fixture](README.md) trước khi dùng.

## 1. Phạm vi và nguồn

Phạm vi: API đăng xuất, ghi blacklist theo `jti`, TTL, truy cập sau thu hồi và tính độc lập giữa các phiên. Không đặc tả lại đăng nhập; không mặc định đăng xuất một phiên là đăng xuất mọi thiết bị.

Nguồn: [AuthenticationController](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/controller/AuthenticationController.java), [AuthenticationService](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/service/AuthenticationService.java), [SecurityConfig](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/SecurityConfig.java), [CustomJwtDecoder](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/CustomJwtDecoder.java), [GlobalExceptionHandler](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/GlobalExceptionHandler.java), [ErrorCode](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/ErrorCode.java), [UserRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/repository/UserRepository.java), [UserEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/entity/UserEntity.java), [LogoutRequest](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/dto/request/LogoutRequest.java), [InvalidTokenRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/auth/repository/InvalidTokenRepository.java) và [quy tắc blacklist trong README backend](../../../airbnb_service/README.md#blacklist-token).

Luồng: `logout` → `handleLogout` → `invalidateToken(access_token)` → `invalidateToken(refresh_token)` → `isValidToken` → Redis. Không dùng mapper/native SQL và không ghi UserRepository. Hai lần ghi Redis chạy lần lượt, không có transaction chung.

Ghi nhận caller: [Header.handleLogout](../../../frontend/src/app/layouts/main/Header.jsx) chỉ xóa localStorage rồi chuyển trang, chưa gọi API logout. [httpClient](../../../frontend/src/shared/api/httpClient.js) tự gắn access token nếu còn trong localStorage. Các ca API chuẩn dùng H0 để tách kiểm tra Bearer ở filter khỏi token trong body.

## 2. Ma trận yêu cầu và hợp đồng

| ID | Nội dung | Căn cứ |
| --- | --- | --- |
| R-LO01 | Logout thành công trả HTTP 204, body rỗng; đường dẫn POST công khai. | [CODE] controller, SecurityConfig. |
| R-LO02 | JWT đúng chữ ký, chưa hết hạn và có jti được blacklist đến exp; chỉ lưu key jti và giá trị 1. | [DOC]/[CODE] README backend, service/repository. |
| R-LO03 | JWT hết hạn hoặc sai chữ ký/sai định dạng được bỏ qua khi isValidToken trả false; không ghi key cho token đó. | [CODE]; không suy rộng sang null gây RuntimeException. |
| R-LO04 | Token đã blacklist không introspect/refresh thành công; phiên khác không bị thu hồi theo. | [CODE] introspect/refresh kiểm tra từng jti. |
| R-LO05 | Lỗi Redis phải truyền lên, không báo thu hồi hoàn tất; xử lý ghi một phần cần được quyết định. | [DOC]/[CODE] và [ĐX], Q-LO02. |
| R-LO06 | Chính sách đầu vào, ghép cặp token, Bearer và tích hợp nút logout phải được chốt. | [ĐX], Q-LO01/Q-LO03/Q-LO04. |

Request `LOGOUT_A`, H0:

```json
{"access_token":"<ACCESS_A>","refresh_token":"<REFRESH_A>"}
```

Thành công: **HTTP 204, không có JSON/body**, không mong đợi `ApiResponse.code`. Key Redis: `restnesst:auth:blacklist:<jti>`, value `"1"`, TTL dương và không vượt thời gian còn lại đến `exp` trong cửa sổ đo; TTL giảm và key hết hạn tự nhiên. Không lưu nguyên JWT.

`isValidToken` kiểm tra chữ ký và `exp > now`; không kiểm tra type_token/sub/issuer hoặc liên hệ giữa hai token. Thiếu jti ở JWT hợp lệ ném UNAUTHENTICATED → HTTP 401/E106 tại MVC. Logout không đọc blacklist trước khi ghi, nên gọi lại có thể ghi lại cùng key với TTL còn lại, không kéo dài vượt exp. Không khẳng định lỗi null/JSON/Bearer đi cùng nhánh lỗi này.

## 3. Điểm cần xác nhận

| ID | Câu hỏi / chênh lệch source |
| --- | --- |
| Q-LO01 | Chốt thiếu/null/blank token, một token hợp lệ đi với token hỏng và cặp token khác subject: giữ cách bỏ qua theo source hay từ chối 4xx? Source không ràng buộc loại token hoặc cùng phiên. |
| Q-LO02 | Nếu ghi access thành công rồi ghi refresh thất bại: cần retry, thông báo hay cơ chế khác? [ĐX] không trả thành công toàn phần; HTTP 5xx có kiểm soát. Handler RuntimeException hiện có thể trả 400/body code=200; Redis không có rollback chung. |
| Q-LO03 | Endpoint công khai vẫn qua bearer filter khi có Authorization. Token header invalid/revoked có thể ném AppException ngoài MVC (Q-G01). Chốt 401/E106 và cách client gọi logout khi access đã hết hạn. |
| Q-LO04 | Nút frontend có phải gọi API và chỉ hoàn tất khi server thu hồi không? Chốt phạm vi một phiên/mọi thiết bị. Source hiện chỉ xóa localStorage; đây là khoảng trống tích hợp từ đọc code, chưa kiểm tra trình duyệt. |

## 4. Môi trường, fixture và giới hạn bằng chứng

Dùng U_A/U_B trong [fixture chung](README.md#fixture-và-dữ-liệu-đầu-vào-dùng-chung). A1/R1 là access/refresh của U_A; A2/R2 là phiên đăng nhập độc lập của cùng user; B1/RB là của U_B. Mỗi JWT có jti khác nhau và đủ thời gian chạy ca. Chuẩn bị token exp=T0−1s, exp=T0, exp=T0+60s; JWT sai chữ ký phải được ký bằng khóa test khác, không sửa trạng thái SignedJWT đã ký rồi ký lại sai cách. Dùng namespace Redis/instance kiểm thử riêng và chỉ quan sát key fixture.

Unit thay UserRepository/PasswordEncoder/Redis/MailerService bằng double. Integration cần HTTP/security thật và Redis kiểm thử thật; snapshot MySQL chỉ đọc chứng minh không đổi user/role/lastLogin. Không gọi UI logout thay cho API trong các ca IT.

Mọi thao tác dữ liệu thực phải tuân theo [quy tắc database](../../../tools/database-toolbox/AGENTS.md). Tài liệu không cấp quyền seed/reset dữ liệu hoặc gửi thư thật. Dùng fixture và preview được duyệt trước khi ghi; không xóa DB/volume/blacklist để tạo môi trường. Việc soạn này chỉ đọc source và ghi Markdown.

Không so JWT/password/hash nguyên vẹn trong log. Ghi build/commit, HTTP status và code trong body riêng, response đã che bí mật, snapshot trước/sau, key jti fixture đã che khi cần và cửa sổ thời gian đo. Kết quả mock không chứng minh TTL Redis, SMTP delivery, collation/transaction/locking MySQL. Biến thể dữ liệu chạy độc lập và ghi kết quả riêng.

## 5. Test case

### LOGOUT-UT-001 — Thu hồi hai JWT hợp lệ

- **Yêu cầu:** R-LO02.
- **Mục tiêu:** Thu hồi hai JWT hợp lệ.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Service có signing key test, repository double; không dùng DB/Redis thật.
- **Dữ liệu / request:** LOGOUT_A; access và refresh có jti/exp riêng.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleLogout với hai JWT đã ký và còn hạn.
   **Kỳ vọng:** invalidate được gọi lần lượt cho jti access, jti refresh và đúng expiration của từng token.

2. Kiểm tra các dependency còn lại.
   **Kỳ vọng:** Không gọi UserRepository, PasswordEncoder hoặc MailerService; không lưu nguyên JWT.

**Hậu điều kiện / bằng chứng:** Chỉ hai lệnh invalidate được yêu cầu; không kết luận key đã tồn tại trong Redis.

### LOGOUT-UT-002 — Bỏ qua JWT hết hạn hoặc không hợp lệ

- **Yêu cầu:** R-LO03.
- **Mục tiêu:** Bỏ qua JWT hết hạn hoặc không hợp lệ.
- **Phân loại:** Unit test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Repository double mới mỗi biến thể; token đối ứng hợp lệ.
- **Dữ liệu / request:** Lần lượt đặt exp≤now, sai chữ ký, chuỗi không phải JWT vào mỗi trường token.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleLogout riêng cho từng biến thể không-null.
   **Kỳ vọng:** Nhánh isValidToken=false không gọi invalidate cho token hỏng.

2. Kiểm tra token còn lại.
   **Kỳ vọng:** Token hợp lệ vẫn được invalidate; không truy vấn user.

**Hậu điều kiện / bằng chứng:** Không có invalidation ngoài token hợp lệ; ghi kết quả từng biến thể.

### LOGOUT-UT-003 — JWT hợp lệ nhưng thiếu jti

- **Yêu cầu:** R-LO02.
- **Mục tiêu:** JWT hợp lệ nhưng thiếu jti.
- **Phân loại:** Unit test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** JWT ký đúng, exp tương lai, bỏ claim jti; double chưa có tương tác.
- **Dữ liệu / request:** Biến thể thiếu jti ở access; biến thể thiếu jti ở refresh.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleLogout ở từng vị trí thiếu jti.
   **Kỳ vọng:** Ném AppException UNAUTHENTICATED; không invalidate JWT thiếu jti.

2. Kiểm tra thứ tự tương tác.
   **Kỳ vọng:** Thiếu jti ở access: không xử lý refresh; thiếu ở refresh: invalidate access đã xảy ra trước lỗi.

**Hậu điều kiện / bằng chứng:** Ghi nhận khả năng xử lý một phần, không giả định rollback.

### LOGOUT-UT-004 — Lỗi ghi blacklist không bị nuốt

- **Yêu cầu:** R-LO05.
- **Mục tiêu:** Lỗi ghi blacklist không bị nuốt.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [DOC]/[CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Repository double ném lỗi Redis tại lần invalidate được chọn.
- **Dữ liệu / request:** LOGOUT_A; lỗi tại lần 1 và lần 2 chạy độc lập.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi handleLogout và bắt exception.
   **Kỳ vọng:** Lỗi Redis được truyền lên, không có kết quả thành công.

2. Kiểm tra lịch sử gọi.
   **Kỳ vọng:** Lỗi lần 1: refresh chưa được xử lý; lỗi lần 2: access đã được yêu cầu invalidate.

**Hậu điều kiện / bằng chứng:** Không truy vấn/lưu user; không tuyên bố thu hồi nguyên tử.

### LOGOUT-UT-005 — Key blacklist và biên TTL

- **Yêu cầu:** R-LO02.
- **Mục tiêu:** Key blacklist và biên TTL.
- **Phân loại:** Unit test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** InvalidTokenRepository với StringRedisTemplate/ValueOperations double.
- **Dữ liệu / request:** jti test; expiration tương lai và expiration đã qua.
- **HTTP / headers:** Không áp dụng; gọi service/repository trong bộ nhớ, không kết nối dịch vụ ngoài.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi invalidate với exp tương lai; capture key/value/Duration.
   **Kỳ vọng:** Key đúng prefix+jti; value=1; TTL dương, nằm trong cửa sổ thời gian còn lại.

2. Gọi với exp đã qua; kiểm tra existsById riêng với hasKey true/false/lỗi Redis.
   **Kỳ vọng:** Không ghi token hết hạn; trả đúng trạng thái tồn tại và truyền lỗi kết nối.

**Hậu điều kiện / bằng chứng:** Không sử dụng Redis thật; biên TTL=0 không dựa vào sleep hoặc millisecond tuyệt đối dễ dao động.

### LOGOUT-IT-001 — Logout công khai trả 204 và tạo đúng hai key

- **Yêu cầu:** R-LO01, R-LO02.
- **Mục tiêu:** Logout công khai trả 204 và tạo đúng hai key.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; A1/R1 hợp lệ; chưa có key; snapshot user/role/lastLogin.
- **Dữ liệu / request:** LOGOUT_A dùng A1/R1.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi POST /auth/logout với H0.
   **Kỳ vọng:** HTTP 204, body rỗng.

2. Đọc đúng hai key fixture và TTL; đọc snapshot DB độc lập.
   **Kỳ vọng:** Hai value=1; TTL dương không vượt exp; DB không đổi.

**Hậu điều kiện / bằng chứng:** Chỉ jti A1/R1 bị thu hồi; chờ hết hạn hoặc phục hồi đúng fixture trong môi trường kiểm thử.

### LOGOUT-IT-002 — Token đã logout không introspect/refresh được

- **Yêu cầu:** R-LO04.
- **Mục tiêu:** Token đã logout không introspect/refresh được.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Hoàn thành logout A1/R1 trong setup cô lập; H0.
- **Dữ liệu / request:** POST /auth/introspect body token=A1; POST /auth/refresh body refresh_token=R1.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi introspect với token đã blacklist trong body, không Bearer.
   **Kỳ vọng:** HTTP 401/E106; không có result.

2. Gọi refresh với R1 qua H0.
   **Kỳ vọng:** HTTP 401/E106; không cấp token mới.

**Hậu điều kiện / bằng chứng:** Không đổi user hoặc tạo key ngoài fixture; đây là lỗi MVC, chưa chứng minh nhánh security filter.

### LOGOUT-IT-003 — Gọi logout lặp không kéo dài quá hạn token

- **Yêu cầu:** R-LO01, R-LO02.
- **Mục tiêu:** Gọi logout lặp không kéo dài quá hạn token.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** A1/R1 còn đủ hạn; ghi thời gian đo và exp.
- **Dữ liệu / request:** Gửi cùng LOGOUT_A hai lần qua H0.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gọi logout lần đầu và ghi TTL.
   **Kỳ vọng:** HTTP 204; hai key tồn tại.

2. Gọi lại rồi đo TTL trong cửa sổ có dung sai độ phân giải.
   **Kỳ vọng:** Vẫn HTTP 204; không phát sinh key mới và TTL không vượt thời gian còn lại tới exp gốc.

**Hậu điều kiện / bằng chứng:** Không đổi DB; không đòi TTL tuyệt đối bằng nhau giữa hai lần.

### LOGOUT-IT-004 — Thu hồi một phiên không ảnh hưởng phiên khác

- **Yêu cầu:** R-LO04.
- **Mục tiêu:** Thu hồi một phiên không ảnh hưởng phiên khác.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** A1/R1, A2/R2 cùng U_A và B1/RB của U_B đều còn hạn.
- **Dữ liệu / request:** Logout A1/R1; introspect A2/B1, refresh R2/RB.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Thu hồi A1/R1.
   **Kỳ vọng:** HTTP 204; chỉ hai jti tương ứng được ghi.

2. Kiểm tra A2/B1 và R2/RB bằng H0.
   **Kỳ vọng:** Introspect HTTP 200/vaild=true; refresh HTTP 200 có cặp token; không blacklist các phiên này.

**Hậu điều kiện / bằng chứng:** User/role/lastLogin không đổi trong các thao tác logout/refresh.

### LOGOUT-IT-005 — Token hết hạn/hỏng trong body không tạo key

- **Yêu cầu:** R-LO03.
- **Mục tiêu:** Token hết hạn/hỏng trong body không tạo key.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; các JWT hỏng không-null; reset riêng từng biến thể.
- **Dữ liệu / request:** Một hoặc cả hai token exp≤now, sai chữ ký hoặc chuỗi rác; token đối ứng có thể hợp lệ.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi từng biến thể POST /auth/logout.
   **Kỳ vọng:** Theo source, HTTP 204 khi các token hỏng chỉ đi qua nhánh isValidToken=false.

2. Đối chiếu key trước/sau.
   **Kỳ vọng:** Chỉ token còn hợp lệ được blacklist; không tạo key cho token hết hạn/hỏng.

**Hậu điều kiện / bằng chứng:** Không thay DB; không dùng ca này suy ra hợp đồng null.

### LOGOUT-IT-006 — Ghi nhận token đảo loại hoặc khác subject

- **Yêu cầu:** R-LO06.
- **Mục tiêu:** Ghi nhận token đảo loại hoặc khác subject.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-LO01. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; JWT ký đúng và có jti, còn hạn.
- **Dữ liệu / request:** Đảo A1/R1; hai token của U_A/U_B; chạy riêng.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi các cặp token biến thể.
   **Kỳ vọng:** [CODE] service không kiểm tra loại/cùng subject; dự kiến HTTP 204 và xử lý từng jti.

2. Đối chiếu với chính sách ghép cặp cần chốt.
   **Kỳ vọng:** [ĐX] nếu yêu cầu ràng buộc phiên: từ chối cặp sai với 4xx đã thống nhất, không thu hồi nhầm user khác.

**Hậu điều kiện / bằng chứng:** Ghi riêng kết quả tương thích và chênh lệch đề xuất; chưa kết luận nghiệm thu Q-LO01.

### LOGOUT-IT-007 — Đầu vào thiếu/null và JSON sai

- **Yêu cầu:** R-LO06.
- **Mục tiêu:** Đầu vào thiếu/null và JSON sai.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [CODE] và [ĐX], Q-LO01. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** H0; snapshot key/DB trước mỗi biến thể.
- **Dữ liệu / request:** {}, thiếu từng token, null, blank; body rỗng, JSON vỡ, token object/array.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi từng body riêng; ghi response và exception đã che bí mật.
   **Kỳ vọng:** JSON không đọc được bị từ chối; null/thiếu trường chưa có validation, phải ghi đường lỗi thực thay vì mặc định 204.

2. Kiểm tra snapshot và thứ tự token đã được xử lý.
   **Kỳ vọng:** [ĐX] lỗi định dạng phải là 400 có kiểm soát; xác minh có thu hồi một phần khi lỗi ở trường thứ hai.

**Hậu điều kiện / bằng chứng:** Không tự gắn Pass cho null; đối chiếu chính sách Q-LO01 và không làm mất bằng chứng key ghi trước lỗi.

### LOGOUT-IT-008 — Lỗi Redis khi thu hồi một phần

- **Yêu cầu:** R-LO05.
- **Mục tiêu:** Lỗi Redis khi thu hồi một phần.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [ĐX], Q-LO02. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Redis kiểm thử có fault injection, không dùng Redis dev; snapshot TTL/jti.
- **Dữ liệu / request:** LOGOUT_A; ngắt ghi lần đầu hoặc sau khi key access đã ghi.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi logout trong từng điểm lỗi.
   **Kỳ vọng:** Không được nhận HTTP 204 như thể cả cặp đã thu hồi; ghi HTTP/body thực, không làm lộ endpoint/credential Redis.

2. Khôi phục dependency và kiểm tra key; retry với H0.
   **Kỳ vọng:** Ghi rõ trạng thái một phần; retry hoàn tất các key còn thiếu theo quyết định Q-LO02.

**Hậu điều kiện / bằng chứng:** DB không đổi; không xóa toàn bộ blacklist để phục hồi; đề xuất lỗi 5xx chưa được phê duyệt.

### LOGOUT-IT-009 — Bearer hỏng không bị nhầm với token trong body

- **Yêu cầu:** R-LO06.
- **Mục tiêu:** Bearer hỏng không bị nhầm với token trong body.
- **Phân loại:** Integration test; **Độ ưu tiên:** P0; **Trạng thái:** Not Run.
- **Oracle:** [ĐX], Q-LO03/Q-G01. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Body A1/R1 hợp lệ; header lần lượt access hết hạn, revoked, sai chữ ký, refresh token.
- **Dữ liệu / request:** Authorization biến thể + LOGOUT_A; không log token.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Gửi request qua SecurityFilterChain thật.
   **Kỳ vọng:** [ĐX] Bearer không hợp lệ nhận 401/E106 trước controller; ghi exception nếu thoát filter.

2. So sánh với cùng body qua H0 trên fixture mới.
   **Kỳ vọng:** H0 đi đến logout và nhận 204; phân biệt rõ lỗi filter và xử lý body.

**Hậu điều kiện / bằng chứng:** Khi filter chặn, không có key mới từ controller; không khẳng định status 500 chỉ từ exception MockMvc.

### LOGOUT-IT-010 — Blacklist tự hết hạn và không lưu JWT nguyên vẹn

- **Yêu cầu:** R-LO02.
- **Mục tiêu:** Blacklist tự hết hạn và không lưu JWT nguyên vẹn.
- **Phân loại:** Integration test; **Độ ưu tiên:** P1; **Trạng thái:** Not Run.
- **Oracle:** [DOC]/[CODE]. Nhãn [ĐX]/Q chưa chốt không dùng làm kết luận nghiệm thu nghiệp vụ.
- **Điều kiện trước:** Redis kiểm thử thật; token TTL ngắn nhưng đủ thực hiện; biết chính xác hai key.
- **Dữ liệu / request:** LOGOUT_A với exp gần, có deadline chạy ca.
- **HTTP / headers:** `POST /auth/logout`, H0 trừ khi bước thực hiện chỉ rõ header/endpoint phụ.

**Bước thực hiện và kết quả mong đợi:**

1. Logout rồi đọc value và TTL bằng kết nối kiểm thử.
   **Kỳ vọng:** Value chỉ 1, key chỉ chứa jti; TTL còn lại dương.

2. Poll có giới hạn đến sau exp và độ trễ đã thống nhất.
   **Kỳ vọng:** Key tự biến mất, không cần lệnh xóa; token vẫn bị introspect từ chối do hết hạn.

**Hậu điều kiện / bằng chứng:** Không quét/xóa key toàn môi trường; không đặt TTL/SLA production mới từ kết quả ca.

## 6. Truy vết và kế hoạch hồi quy

| Yêu cầu | Unit test | Integration test |
| --- | --- | --- |
| R-LO01 | — | `LOGOUT-IT-001`, `LOGOUT-IT-003` |
| R-LO02 | `LOGOUT-UT-001`, `LOGOUT-UT-003`, `LOGOUT-UT-005` | `LOGOUT-IT-001`, `LOGOUT-IT-003`, `LOGOUT-IT-010` |
| R-LO03 | `LOGOUT-UT-002` | `LOGOUT-IT-005` |
| R-LO04 | — | `LOGOUT-IT-002`, `LOGOUT-IT-004` |
| R-LO05 | `LOGOUT-UT-004` | `LOGOUT-IT-008` |
| R-LO06 | — | `LOGOUT-IT-006`, `LOGOUT-IT-007`, `LOGOUT-IT-009` |

- **Smoke dự kiến:** LOGOUT-IT-001 → LOGOUT-IT-002 → LOGOUT-IT-004.
- **Targeted regression:** các ca unit + P0/P1 liên quan nhánh vừa thay đổi; kiểm tra lại login/introspect cùng chức năng này.
- **Full regression:** toàn bộ biến thể của 15 ID và giao thoa login/logout/refresh/reset; chỉ chạy SMTP/DB/Redis trong môi trường kiểm thử riêng.
- **Điều kiện bắt đầu:** fixture/môi trường đã sẵn sàng; Q quyết định oracle được chốt cho ca cần nghiệm thu; lỗi dependency được mô phỏng có kiểm soát.
- **Điều kiện kết thúc đề xuất:** mọi biến thể P0/P1 có kết quả và bằng chứng, không phát token/ghi dữ liệu vượt phạm vi; các Q và rủi ro chưa xử lý có quyết định rõ. Chưa có SLA hoặc tỷ lệ Pass được phê duyệt.

## 7. Tình trạng tự động hóa và ghi kết quả

Đã có [AuthenticationServiceTest](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/service/AuthenticationServiceTest.java) với `logoutInvalidatesAccessAndRefreshTokens`, và [InvalidTokenRepositoryTest](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/repository/InvalidTokenRepositoryTest.java) về key/TTL/lỗi Redis. Đây là bằng chứng có test liên quan, chưa phải ánh xạ đầy đủ 15 ID mới. Chưa tạo test tự động gắn các ID LOGOUT trong lượt soạn này.

Các ID `LOGOUT-*` chưa được `airbnb_service/scripts/run_backend_specs.py` nhận diện: script hiện chỉ nhận AUTH/HOST/BOOK và báo cáo bộ 79 ID cũ. Không dùng lệnh chạy bộ 79 ca làm bằng chứng đã chạy đặc tả này, không thêm nhãn Pass vào [báo cáo lịch sử](execution-results.md). Chỉ bổ sung runner/mapping khi có yêu cầu triển khai test tự động riêng.

Mẫu cập nhật khi thực thi:

| ID / biến thể | Build / môi trường / thời điểm | Actual HTTP + body đã che / exception | Thay đổi DB/Redis/mail | Pass/Fail/Blocked | Bằng chứng / Q / bug |
| --- | --- | --- | --- | --- | --- |
| Điền ID cụ thể khi chạy | Chưa chạy | Chưa có | Chưa có | Not Run | Chưa có |

Nếu hành vi lệch đề xuất [ĐX], lưu cả actual và expected cùng Q tương ứng; không sửa logic ứng dụng hay đổi oracle chỉ để đạt màu xanh. Lỗi cần báo gồm bước tái hiện theo ID, môi trường/build, expected/actual đã che bí mật, tác động, priority/severity và nguồn bằng chứng; không gọi nghi vấn từ đọc source là bug đã tái hiện.

