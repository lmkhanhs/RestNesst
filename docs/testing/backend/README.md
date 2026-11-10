# Đặc tả kiểm thử backend RestNesst

## Phạm vi và trạng thái

Đã có code kiểm thử gắn ID cho bộ đặc tả. Xem [kết quả chạy và mức hoàn thành từng ca](execution-results.md). Nhãn `Not Run` trong từng mục test case giữ trạng thái **lúc soạn đặc tả**, không phải kết quả chạy mới nhất. Integration cục bộ dùng H2 và blacklist double, chưa thay việc nghiệm thu trên MySQL/Redis thật.

Bộ tài liệu sử dụng skill `qa-test-planner`, chỉ đặc tả ba chức năng:

| Chức năng | Tài liệu | Unit | Integration | Tổng |
| --- | --- | --- | --- | --- |
| Đăng nhập bằng username/password và kiểm tra token được cấp | [01-auth-login.md](01-auth-login.md) | 5 | 14 | 19 |
| Gửi, liệt kê, duyệt và từ chối yêu cầu làm host | [02-host-application.md](02-host-application.md) | 7 | 25 | 32 |
| Tạo đặt phòng | [03-create-booking.md](03-create-booking.md) | 5 | 23 | 28 |

Tổng cộng **79 test case** (17 unit, 62 integration), chưa tính số lượt chạy của các biến thể dữ liệu. Tất cả test case bắt đầu ở **Not Run**. Không có test case nào được thực thi trong lần viết tài liệu này. Không khởi động Spring, chạy Maven, gọi API, kết nối DB/Redis, seed hoặc tạo test tự động. Các trạng thái và response mô tả bên dưới là kỳ vọng để kiểm thử, không phải kết quả đo thực tế.

Chạy bộ đặc tả và cập nhật báo cáo từ repo gốc:

```bash
python3 airbnb_service/scripts/run_backend_specs.py --offline
```

Bỏ `--offline` nếu cần tải dependency. Profile `backend-specs` chỉ nạp cấu hình test tường minh, H2 in-memory riêng và dữ liệu giả; không khởi động ứng dụng chính/seed hoặc dùng datasource dev. Profile chủ động này có cả assertion `proposal` theo các tiêu chí [ĐX]/Q, nên có thể trả exit code khác 0 khi code lệch đề xuất. Không sửa kỳ vọng thành hành vi đang lỗi chỉ để đạt màu xanh.

## Căn cứ và cách hiểu yêu cầu

Đã đọc [AGENTS.md gốc](../../../AGENTS.md), [hướng dẫn backend](../../../airbnb_service/AGENTS.md), [README dự án](../../../README.md), [README backend](../../../airbnb_service/README.md), [kiến trúc](../../architecture.md), [database](../../database.md), và code được liên kết trong từng chức năng. Chưa tìm thấy SRS, user story có tiêu chí nghiệm thu, hoặc OpenAPI độc lập trong các tài liệu hiện có được khảo sát. Đây là khoảng trống cần chủ sản phẩm xác nhận, không phải khẳng định mọi yêu cầu đều nằm trong source.

Mã `R-*` là ID truy vết do bộ tài liệu này đặt, **không phải ID yêu cầu có sẵn hoặc đã được phê duyệt**. Phân biệt nguồn:

- **[DOC]:** quy tắc được nêu trong tài liệu dự án, có chỉ rõ tài liệu nguồn.
- **[CODE]:** hợp đồng hoặc hành vi ghi nhận từ source. Dùng để kiểm tra tương thích; không tự trở thành quy tắc nghiệp vụ đúng.
- **[ĐX]:** tiêu chí đề xuất để bảo vệ dữ liệu, xử lý đầu vào hoặc chặn truy cập; cần được xác nhận trước nghiệm thu.

Các `Q-*` trong từng file là câu hỏi mở. Ca liên quan vẫn ở **Not Run**, nhưng chưa thể kết luận Pass/Fail nghiệp vụ nếu câu hỏi quyết định oracle chưa được chốt. Khi source và kỳ vọng khác nhau, giữ cả hai để nhận diện sai lệch; không sửa kỳ vọng chỉ để test đi qua. Không dùng test hiện có làm tài liệu yêu cầu thay thế.

## Chọn mức kiểm thử

- **Unit test:** logic service/mapper/DTO trong bộ nhớ với dependency được thay bằng test double; phù hợp nhánh điều kiện, chuẩn hóa, token claims và kiểm tra không gọi save. Không chứng minh transaction, SQL, JSON binding hay Spring Security.
- **Integration test:** đi qua HTTP, JSON binding, SecurityFilterChain, method security, controller, service, mapper và persistence. Các ca có ghi DB cần MySQL kiểm thử riêng; ca có Bearer token thật cần Redis kiểm thử riêng để đi qua `CustomJwtDecoder`. Các hỏng hóc dependency chỉ được mô phỏng trong môi trường kiểm thử.

Unit test và integration test trong tài liệu là **phân loại kịch bản dự kiến**, không phải các test đã được cài đặt.

## Fixture và dữ liệu đầu vào dùng chung

Các ID dưới đây hoàn toàn giả định, chỉ dùng để thiết kế fixture trong DB kiểm thử trống/được cô lập. Không suy ra chúng tồn tại hoặc an toàn để ghi trong database dev hiện tại.

| Ký hiệu | Dữ liệu dự kiến |
| --- | --- |
| `U_A` | id `91001`, username `qa_guest_a`, active, role GUEST, chưa có HOST, pending=false |
| `U_B` | id `91002`, username `qa_guest_b`, active, role GUEST; độc lập U_A |
| `U_ADMIN` | id `91003`, username `qa_admin`, active, role ADMIN |
| `U_HOST` | id `91004`, username `qa_host`, active, role HOST, pending=false |
| `U_LOCKED` | id `91005`, username `qa_locked`, isActive=false |
| `U_NO_ROLE` | id `91006`, username `qa_no_role`, active, không có authority |
| `C_QA` | quốc gia tên chính xác `QA Country` |
| `L_VI`, `L_EN` | ngôn ngữ id `94001`, `94002`, active=true, deleted=false; tên `QA Vietnamese`, `QA English` |
| `LISTING_OK` | id `93001`, host=U_HOST, price=500000, status=AVAILABLE, access=true, deleted=false; lịch cho phép D1..D2 |
| `ID_MISSING` | `999999999`, được xác nhận không tồn tại trong fixture kiểm thử |
| `T0`, `D1`, `D2` | T0 là ngày tại đồng hồ kiểm thử đã thống nhất; D1=T0+7 ngày, D2=T0+9 ngày |

`<PASSWORD_QA>`, `<WRONG_PASSWORD_QA>`, `<ACCESS_A>`, `<ACCESS_ADMIN>`… là biến bí mật/giá trị runtime, không phải mật khẩu hoặc JWT thật. Tạo mật khẩu riêng trong môi trường kiểm thử; không ghi credential/token/hash thực vào tài liệu hay log. Mọi `${D1}`, `${D2}` và placeholder trong JSON phải được thay bằng giá trị đúng kiểu trước khi gửi; ngày có định dạng `yyyy-MM-dd`.

## Headers và response dùng chung

- `H0`: `Content-Type: application/json`, `Accept: application/json`; không có `Authorization`.
- `H_A`, `H_B`, `H_ADMIN`, `H_HOST`, `H_NO_ROLE`: H0 cộng `Authorization: Bearer <ACCESS_...>` của fixture tương ứng. Với GET/DELETE không body có thể bỏ Content-Type, giữ Accept và Authorization.
- `H_EXPIRED`, `H_TAMPERED`, `H_REVOKED`, `H_REFRESH`: H0 cộng Bearer lần lượt là token hết hạn, sai chữ ký, đã blacklist hoặc refresh token. Không đổi chúng thành mock authentication trong ca integration cần kiểm tra JWT thật.
- `E106`: JSON `code=106`, `message="unauthenticated! || token is invalid "`; không có `result` token. HTTP kỳ vọng nghiệp vụ là 401.
- `E1010`: tại method security, HTTP 403; JSON `code=1010`, `message="Error: Authority"`, `result="user have no permisson!"` theo `GlobalExceptionHandler`.
- `E(code,message)`: JSON theo `ApiResponse`, có code/message tương ứng, không có result khi null. `timestamp` là giá trị động, không so sánh bằng chuỗi cố định.
- `E_VALIDATION`: response lỗi 4xx có thông tin đầu vào sai, không có kết quả thành công/token hoặc chi tiết SQL/stack trace; schema/mã lỗi cụ thể **chưa được phê duyệt**, không tự đồng nhất với `E(1011,"data invalid")`.

Phân biệt HTTP status thật với `code` trong body. Chẳng hạn `POST /api/bookings` hiện đặt body code=201 nhưng controller không đặt HTTP 201. Response format lỗi JSON, media type và lỗi JWT trong filter có điểm chưa thống nhất; xem `Q-G01` và các Q riêng.

## Điểm cần xác nhận dùng chung

| ID | Vấn đề / quyết định cần có |
| --- | --- |
| Q-G01 | `CustomJwtDecoder` gọi `AuthenticationService.introspect`, nơi có thể ném `AppException`, nhưng decoder chỉ catch JOSEException/ParseException; handler MVC không bảo đảm xử lý lỗi trong security filter. Chốt mọi JWT invalid/revoked/refresh phải thành HTTP 401/E106 và xác minh bằng HTTP thực, không suy từ unit mock. |
| Q-G02 | Múi giờ/ngày nghiệp vụ, format timestamp, giới hạn độ dài chuỗi, giá tiền và schema lỗi chưa được yêu cầu độc lập quy định. Không tự áp giới hạn 255 hoặc giá tối đa dựa vào suy đoán schema. |
| Q-G03 | User bị khóa sau khi đã nhận access token có phải bị chặn tức thời không? Decoder hiện không truy vấn lại isActive/roles; cần quyết định HTTP status và chiến lược thu hồi. |
| Q-G04 | Fixture cần đối chiếu schema DB kiểm thử thực, đặc biệt `user_languages`, FK, nullable và unique. Tài liệu database mô tả tổng quan, chưa liệt kê bảng ngôn ngữ và `user_languages` như ánh xạ UserEntity hiện tại; không thay DDL thực tế. |

## Chuẩn bị, bằng chứng và tiêu chí kết thúc dự kiến

Trước lần chạy trong tương lai: chốt các Q ảnh hưởng ca kiểm thử; ghi commit/build và cấu hình không nhạy cảm; chuẩn bị MySQL/Redis cô lập; tắt/cô lập các tác dụng phụ không liên quan như email, seed startup và scheduler theo cấu hình kiểm thử được duyệt. Không khởi động Spring để xem trước dữ liệu vì `ApplicationInitConfig` có thể ghi DB.

Đối với môi trường dev dùng chung, mọi thao tác chuẩn bị/khôi phục hoặc thử ghi phải tuân theo [quy tắc database](../../../tools/database-toolbox/AGENTS.md): có bản ghi test xác định và xác nhận riêng, preview trước UPDATE/DELETE; không reset database/volume hay blacklist dùng chung. Bộ tài liệu này không cấp quyền thao tác dữ liệu.

Mỗi ca chạy độc lập, phục hồi fixture trong môi trường kiểm thử sau ca; các biến thể trong một ca phải chạy riêng và ghi kết quả từng biến thể. Ghi request đã che bí mật, HTTP status/header/body, snapshot dữ liệu trước/sau và exception đã che thông tin nhạy cảm. Không chỉ đọc lại entity từ persistence context: kiểm tra sau commit bằng context/kết nối độc lập khi cần chứng minh persistence/rollback.

P0: chặn truy cập trái phép/mất hoặc sai dữ liệu nghiêm trọng; P1: luồng chính, validation và nhánh lỗi quan trọng; P2: biên và tính tương thích ít ảnh hưởng hơn. Ưu tiên không đồng nghĩa đã xác nhận có lỗi.

Tiêu chí hoàn thành đề xuất: các Q quyết định nghiệm thu đã được chốt, mọi biến thể P0/P1 đạt, không có truy cập vượt quyền hay ghi dữ liệu ngoài fixture, P2 có kết quả hoặc quyết định hoãn rõ ràng. Chưa đặt tỷ lệ Pass hoặc SLA khi chưa có thỏa thuận. Cài Figma MCP không cần thiết cho bộ kiểm thử backend này.
