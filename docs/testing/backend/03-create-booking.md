# Đặc tả kiểm thử — Tạo đặt phòng

**Trạng thái lúc soạn:** Chưa thực thi; các nhãn Not Run bên dưới là trạng thái ban đầu. Xem [kết quả chạy mới nhất](execution-results.md). [Quy ước chung, fixture và headers](README.md).

## 1. Phạm vi và nguồn

Chỉ đặc tả tạo booking bằng `POST /api/bookings`. Không bao gồm thanh toán/VNPay, xác nhận/hủy của host, trả phòng, đánh giá hoặc danh sách booking; bảng payments/listings được quan sát để phát hiện tác dụng phụ ngoài phạm vi tạo booking.

Nguồn mô tả: [README dự án](../../../README.md), [kiến trúc](../../architecture.md) (chỗ ở/đặt phòng), [database](../../database.md) (booked, FK và payment). Chưa có SRS riêng định nghĩa giá, tồn phòng, ngày hoặc role được phép đặt. Source: [BookingController](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/booking/controller/BookingController.java) (`booking`), [BookingService](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/booking/service/BookingService.java) (`handleBooking`), [BookingRequest](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/booking/dto/request/BookingRequest.java), [BookingResponse](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/booking/dto/response/BookingResponse.java), [BookingMapper](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/booking/mapper/BookingMapper.java), [BookingEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/booking/entity/BookingEntity.java), [BookingRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/booking/repository/BookingRepository.java), [ListingEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/listing/entity/ListingEntity.java), [ListingStatus](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/listing/enums/ListingStatus.java), [UserRepository](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/user/repository/UserRepository.java), [BaseEntity](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/entity/BaseEntity.java), [SecurityConfig](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/configuration/SecurityConfig.java), [GlobalExceptionHandler](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/GlobalExceptionHandler.java), [ErrorCode](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/shared/exception/ErrorCode.java).

Luồng: SecurityFilterChain → controller lấy principal.username → `handleBooking` → UserRepository.findByUsername → BookingMapper.toBookingEntity → `toListingEntity` gọi ListingsRepository.findById → set PENDING/user/commented/deleted → BookingRepository.save → toBookingResponse. Không có native SQL riêng trên đường tạo này. `findAllByListingHost` là JPQL dùng ở chức năng khác, không được coi là bước kiểm tra phòng trống của create.

## 2. Ma trận yêu cầu và hợp đồng

| ID | Nội dung | Căn cứ |
| --- | --- | --- |
| R-B01 | Người gọi phải được xác thực; chủ booking lấy từ principal, không từ userId client | [CODE] controller + SecurityConfig |
| R-B02 | listingId tham chiếu listing tồn tại; FK user/listing bắt buộc | [DOC] database; [CODE] mapper + entity |
| R-B03 | Booking mới PENDING, commented=false, deleted=false; không tự tạo payment hoặc đổi trạng thái listing | [CODE] handleBooking |
| R-B04 | Response phản ánh booking persisted và thông tin listing; HTTP status phân biệt body code | [CODE] controller/mapper; Q-B01 cần xác nhận status |
| R-B05 | Ngày hợp lệ, checkout sau checkin, không đặt quá khứ, thời gian nằm trong lịch cho phép | [ĐX] Q-B02, source chưa kiểm tra |
| R-B06 | Giá phải được backend xác minh theo giá listing và quy tắc giá được duyệt, không tin tùy ý totalPrice client | [ĐX] Q-B03, source đang map trực tiếp |
| R-B07 | Không nhận booking cho listing không được phép đặt, lịch đã chiếm hoặc vượt sức chứa | [ĐX] Q-B04/Q-B05; mô hình tồn phòng và trạng thái chưa rõ |
| R-B08 | Đầu vào sai/lỗi persistence không để lại booking một phần hoặc dữ liệu ngoài chủ thể | [ĐX] toàn vẹn và validation; source hiện có @Transactional cấp class ở BookingService, cần kiểm chứng rollback thực |
| R-B09 | Vai trò/tài khoản được phép đặt phải rõ; quyền khác với việc có JWT hợp lệ | [CODE] hiện chỉ authenticated; [ĐX] cần Q-B06/Q-G03 |

Request `BOOK_A`, dùng H_A:

```json
{"listingId":93001,"checkInDate":"${D1}","checkOutDate":"${D2}","totalPrice":1000000,"content":"Ghi chú đặt phòng QA"}
```

Thay D1/D2 bằng ngày thực trong fixture trước gửi. Tổng 1000000 chỉ là fixture khớp hai đêm giá 500000; **không phải công thức giá đã được phê duyệt**.

Response `BOOK_OK` theo source:

```json
{"code":201,"timestamp":"<DYNAMIC_TIMESTAMP>","message":"booking sucess","result":{"bookingId":"<GENERATED_LONG_ID>","listingId":93001,"checkInDate":"${D1}","checkOutDate":"${D2}","totalPrice":1000000,"content":"Ghi chú đặt phòng QA","bookingStatus":"PENDING","commented":false,"paymentStatus":null}}
```

Ví dụ trên chỉ trích các field cần kiểm tra; bookingId thực phải là số Long, chuỗi placeholder chỉ để minh họa. Response còn có primaryUrl, title, avgStart, popular, address, city, price, area theo BookingResponse; phải đối chiếu giá trị fixture listing và chính sách null được chốt, không coi ví dụ là danh sách đầy đủ. `primaryUrl` hiện là URL ảnh đầu tiên trong collection, không phải một cờ ảnh chính. Payment mới chưa tồn tại nên paymentStatus không có giá trị PAID.

**HTTP ghi nhận:** controller trả object thường, body code=201 nhưng không ResponseEntity/@ResponseStatus, nên hợp đồng hiện suy từ source là **HTTP 200**. Tiêu chí REST mong muốn 201 cần quyết định Q-B01. Đặt body code=201 không đủ chứng minh HTTP 201.

## 3. Điểm cần xác nhận

| ID | Khoảng trống và hành vi source |
| --- | --- |
| Q-B01 | Tạo booking phải HTTP 201 hay giữ HTTP 200 tương thích? Có cần Location header? Chưa tự thêm Location khi không có hợp đồng. |
| Q-B02 | Chốt múi giờ/ngày nghiệp vụ, nhận phòng hôm nay, số đêm min/max, giới hạn startDate/endDate và khoảng ngày có bao gồm checkout không. DTO/controller chưa có validation; service không kiểm tra ngày. |
| Q-B03 | totalPrice bắt buộc hay backend tự tính? Quy tắc số đêm, tiền tệ, thuế/phí, giảm giá, số thập phân và giới hạn giá? Source dùng Double do client gửi, chưa tính lại. |
| Q-B04 | Những trạng thái ACTIVE/AVAILABLE/INACTIVE/OCCUPIED, access/deleted nào được phép đặt? Có cho host đặt listing của mình không? Mapper chỉ findById, không lọc trạng thái/xóa mềm. |
| Q-B05 | Booking PENDING có giữ chỗ không; trạng thái nào chiếm lịch, số phòng mỗi listing, xử lý overlap và đồng thời? Chưa có truy vấn overlap/lock/unique ngày trong luồng create đã đọc. Không mặc định mô hình một listing=một phòng là yêu cầu đã duyệt. |
| Q-B06 | Chỉ GUEST, hay mọi user active kể cả HOST/ADMIN/không role được đặt? Source không có @PreAuthorize riêng; không tự thêm kỳ vọng 403 chỉ vì thiếu GUEST. |
| Q-B07 | listing thiếu hiện 500/code1008; user principal không còn trong DB dùng Optional.get có thể thành 400/body code=200. Đề xuất lỗi nghiệp vụ rõ ràng (listing 404; principal không hợp lệ 401), không lộ exception. |
| Q-B08 | Null/blank/độ dài content và totalPrice, request unknown fields, định dạng lỗi JSON chưa được yêu cầu định nghĩa. Cần chốt trả 400/415 và schema, không dựa vào DB để làm validation duy nhất. |
| Q-B09 | Đối chiếu lại khi triển khai test: BookingService hiện có @Transactional cấp class, bao quanh save+map. BOOK-IT-022 cần kiểm chứng rollback khi mapper lỗi, không suy từ unit mock. Vẫn cần chốt HTTP/schema lỗi và chính sách retry/idempotency. |
| Q-B10 | Không có quy tắc idempotency key/hạn thời gian giữ chỗ trong hợp đồng đã đọc. Hai request giống nhau có tạo hai booking không? Cần quyết định độc lập với kiểm tra overlap. |

## 4. Test case

### BOOK-UT-001 — Service gán chủ sở hữu và trạng thái khởi tạo

- **ID:** BOOK-UT-001
- **Yêu cầu liên quan:** R-B01, R-B03
- **Mục tiêu:** Service gán chủ sở hữu và trạng thái khởi tạo.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Repository trả U_A; mapper double trả entity; save trả entity có id; mapper response trả DTO tương ứng.
- **Dữ liệu đầu vào:** BOOK_A và username=qa_guest_a.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi BookingService.handleBooking(request,"qa_guest_a").
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** BookingResponse của bản ghi đã save.
- **Trạng thái dữ liệu:** Entity gửi save có user=U_A, PENDING, commented=false, deleted=false; không gọi listingsRepository.save hoặc payment save.
- **Căn cứ / điểm cần xác nhận:** Oracle [CODE]; không khẳng định DB commit từ unit.

### BOOK-UT-002 — Mapper từ chối listingId không tồn tại

- **ID:** BOOK-UT-002
- **Yêu cầu liên quan:** R-B02
- **Mục tiêu:** Mapper từ chối listingId không tồn tại.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Mapper thật, ListingsRepository double trả Optional.empty cho ID_MISSING.
- **Dữ liệu đầu vào:** BookingRequest listingId=999999999, ngày/giá hợp lệ.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi BookingMapper.toBookingEntity.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** AppException LISTING_NOT_EXISTED.
- **Trạng thái dữ liệu:** Không ghi booking/listing hoặc user.
- **Căn cứ / điểm cần xác nhận:** HTTP source 500 và đề xuất 404 được xử lý ở BOOK-IT-005/Q-B07.

### BOOK-UT-003 — Response mapper xử lý listing không có ảnh

- **ID:** BOOK-UT-003
- **Yêu cầu liên quan:** R-B04
- **Mục tiêu:** Response mapper xử lý listing không có ảnh.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P2.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Booking persisted giả lập có listing với imagesEntities lần lượt null, rỗng và một ảnh; không có payment.
- **Dữ liệu đầu vào:** BookingEntity có id, ngày, price/content và user fixture.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi BookingMapper.toBookingResponse cho từng biến thể.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** bookingId/listingId/ngày/giá/content/status khớp entity; primaryUrl=null nếu không ảnh, bằng URL ảnh fixture khi có một ảnh; paymentStatus=null.
- **Trạng thái dữ liệu:** Không gọi save hoặc đổi entity.
- **Căn cứ / điểm cần xác nhận:** Không suy ra thứ tự ảnh khi collection có nhiều phần tử và không có yêu cầu ảnh chính.

### BOOK-UT-004 — Lỗi lưu booking không trả response thành công

- **ID:** BOOK-UT-004
- **Yêu cầu liên quan:** R-B03, R-B08
- **Mục tiêu:** Lỗi lưu booking không trả response thành công.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** User/mapper hợp lệ; BookingRepository.save ném lỗi persistence double.
- **Dữ liệu đầu vào:** BOOK_A, username=qa_guest_a.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi handleBooking.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Lỗi truyền lên; không gọi mapper.toBookingResponse như một lần lưu thành công.
- **Trạng thái dữ liệu:** Không gọi cập nhật listing/payment; unit không chứng minh rollback thực.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### BOOK-UT-005 — Không lấy chủ booking từ dữ liệu request

- **ID:** BOOK-UT-005
- **Yêu cầu liên quan:** R-B01, R-B08
- **Mục tiêu:** Không lấy chủ booking từ dữ liệu request.
- **Phân loại:** Unit test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Controller nhận Authentication có name=qa_guest_a; service double ghi nhận tham số gọi.
- **Dữ liệu đầu vào:** BookingRequest của BOOK_A và principal U_A; dữ liệu chủ thể khác không có trong DTO.
- **HTTP method và endpoint:** `Không áp dụng HTTP; gọi đơn vị được nêu trong bước thực hiện.`
- **Headers cần thiết:** Không áp dụng.
- **Request:** Không áp dụng HTTP.

**Bước thực hiện:**

1. Thiết lập đối tượng đầu vào và các test double đúng điều kiện trước; không dùng DB/Redis thật.
2. Gọi BookingController.booking(request) trong SecurityContext fixture.
3. Kiểm tra giá trị trả về/exception và các tương tác ghi; không coi mock là bằng chứng persistence hoặc phân quyền HTTP.

**Kết quả mong đợi:**

- **HTTP status:** Không áp dụng.
- **Response/giá trị trả về:** Controller chuyển username=qa_guest_a cho service, body code=201 theo source.
- **Trạng thái dữ liệu:** Không dùng username/userId từ client để chọn user; không truy cập DB thật.
- **Căn cứ / điểm cần xác nhận:** Unit controller không chứng minh SecurityFilterChain hoặc JSON unknown-field policy; xem BOOK-IT-004.

### BOOK-IT-001 — Tạo booking hợp lệ và xác minh persistence

- **ID:** BOOK-IT-001
- **Yêu cầu liên quan:** R-B01, R-B02, R-B03, R-B04
- **Mục tiêu:** Tạo booking hợp lệ và xác minh persistence.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** U_A active; LISTING_OK thuộc U_HOST; D1/D2 hợp lệ; không có booking chồng lịch fixture; Redis hoạt động.
- **Dữ liệu đầu vào:** BOOK_A
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 200 theo [CODE]; Q-B01 quyết định 201
- **Response/giá trị trả về:** BOOK_OK; bookingId là số mới, result khớp dữ liệu vừa commit và listing fixture.
- **Trạng thái dữ liệu:** Đúng một dòng booked, user_id=91001, listing_id=93001, PENDING/commented=false/deleted=false; createdAt/updatedAt hợp lý; không thêm payment, không đổi listing/country/role.
- **Căn cứ / điểm cần xác nhận:** Không chấp nhận body code=201 như bằng chứng HTTP 201; giá hợp lệ theo fixture, công thức giá cần Q-B03.

### BOOK-IT-002 — Không có token không được tạo booking

- **ID:** BOOK-IT-002
- **Yêu cầu liên quan:** R-B01
- **Mục tiêu:** Không có token không được tạo booking.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Fixture listing/user sẵn sàng; chụp số và ID booked trước.
- **Dữ liệu đầu vào:** BOOK_A
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H0
- **Request:** BOOK_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** 401
- **Response/giá trị trả về:** E106; không có bookingId.
- **Trạng thái dữ liệu:** Không tạo booked/payment hoặc đổi listing.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### BOOK-IT-003 — Token hết hạn, sai chữ ký, bị thu hồi hoặc sai loại

- **ID:** BOOK-IT-003
- **Yêu cầu liên quan:** R-B01
- **Mục tiêu:** Token hết hạn, sai chữ ký, bị thu hồi hoặc sai loại.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Token test từng biến thể; Redis cô lập có jti bị thu hồi; không dùng mock authentication cho biến thể này.
- **Dữ liệu đầu vào:** BOOK_A
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_EXPIRED, H_TAMPERED, H_REVOKED, H_REFRESH; mỗi lượt riêng
- **Request:** BOOK_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 401 cho từng biến thể; Q-G01
- **Response/giá trị trả về:** E106; không có BOOK_OK hoặc bookingId.
- **Trạng thái dữ liệu:** Không tạo booked/payment, không đổi listing hoặc blacklist chỉ vì request bị từ chối.
- **Căn cứ / điểm cần xác nhận:** Decoder có khả năng để AppException thoát khỏi filter; phải xác minh status thực khi chạy, chưa coi 401 đã được bảo đảm.

### BOOK-IT-004 — Không cho client gán booking cho tài khoản khác

- **ID:** BOOK-IT-004
- **Yêu cầu liên quan:** R-B01, R-B08
- **Mục tiêu:** Không cho client gán booking cho tài khoản khác.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Caller U_A; U_B tồn tại; mỗi biến thể độc lập.
- **Dữ liệu đầu vào:** BOOK_A thêm userId=91002, username="qa_guest_b", user={"id":91002}, bookingStatus="PAID", deleted=true, commented=true.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A thêm userId=91002, username="qa_guest_b", user={"id":91002}, bookingStatus="PAID", deleted=true, commented=true.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Nếu bỏ unknown fields: 200 theo source; nếu strict: đề xuất 400, Q-B08
- **Response/giá trị trả về:** Nếu thành công: BOOK_OK vẫn PENDING/commented=false; nếu strict: E_VALIDATION. Không nhận chủ booking/status do client ép.
- **Trạng thái dữ liệu:** Tuyệt đối không có booked.user_id=91002 hoặc status PAID; thành công chỉ tạo một dòng của U_A, lỗi không tạo dòng.
- **Căn cứ / điểm cần xác nhận:** Chưa chốt chính sách unknown fields; bất biến sở hữu/trạng thái vẫn bắt buộc ở cả hai cách xử lý.

### BOOK-IT-005 — Listing không tồn tại

- **ID:** BOOK-IT-005
- **Yêu cầu liên quan:** R-B02, R-B08
- **Mục tiêu:** Listing không tồn tại.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** ID_MISSING không có listing; user/token hợp lệ.
- **Dữ liệu đầu vào:** BOOK_A đổi listingId=999999999.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A đổi listingId=999999999.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 404; Q-B07
- **Response/giá trị trả về:** Lỗi listing không tồn tại, không có bookingId; schema/mã cần xác nhận.
- **Trạng thái dữ liệu:** Không tạo booked hoặc thay bất kỳ listing/payment nào.
- **Căn cứ / điểm cần xác nhận:** Source dự báo 500/E(1008,"listing not existed!"); không coi là lỗi đã tái hiện hay hợp đồng đúng.

### BOOK-IT-006 — Thiếu hoặc sai listingId

- **ID:** BOOK-IT-006
- **Yêu cầu liên quan:** R-B02, R-B08
- **Mục tiêu:** Thiếu hoặc sai listingId.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** User/token hợp lệ; các biến thể độc lập.
- **Dữ liệu đầu vào:** BOOK_A bỏ listingId; null; 0; -1; "abc"; số lớn hơn Long.MAX_VALUE.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A bỏ listingId; null; 0; -1; "abc"; số lớn hơn Long.MAX_VALUE.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400; Q-B08
- **Response/giá trị trả về:** E_VALIDATION, không có bookingId hoặc thông tin SQL.
- **Trạng thái dữ liệu:** Không tạo booked/payment; không trông chờ FK fail như validation nghiệp vụ.
- **Căn cứ / điểm cần xác nhận:** Mapper null→listing null, FK bắt buộc có thể chỉ fail ở DB. ID 0/-1 hiện có thể đi vào nhánh listing thiếu/500.

### BOOK-IT-007 — Thiếu hoặc null ngày nhận/trả

- **ID:** BOOK-IT-007
- **Yêu cầu liên quan:** R-B05, R-B08
- **Mục tiêu:** Thiếu hoặc null ngày nhận/trả.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** User/listing/token hợp lệ.
- **Dữ liệu đầu vào:** BOOK_A lần lượt bỏ checkInDate; bỏ checkOutDate; cả hai null.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A lần lượt bỏ checkInDate; bỏ checkOutDate; cả hai null.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400; Q-B02
- **Response/giá trị trả về:** E_VALIDATION, không có BOOK_OK.
- **Trạng thái dữ liệu:** Không tạo booked/payment hoặc sửa listing.
- **Căn cứ / điểm cần xác nhận:** DTO không constraint; hai cột ngày không khai báo nullable=false ở entity, source có thể lưu null. Cần chốt yêu cầu thay vì coi lưu được là đúng.

### BOOK-IT-008 — Biên số đêm bằng 0 hoặc âm

- **ID:** BOOK-IT-008
- **Yêu cầu liên quan:** R-B05
- **Mục tiêu:** Biên số đêm bằng 0 hoặc âm.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** User/listing hợp lệ; D1 ở tương lai.
- **Dữ liệu đầu vào:** Lượt 1 checkOutDate=D1; lượt 2 checkOutDate=D1-1 ngày; checkInDate=D1.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** Lượt 1 checkOutDate=D1; lượt 2 checkOutDate=D1-1 ngày; checkInDate=D1.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400; Q-B02
- **Response/giá trị trả về:** E_VALIDATION mô tả khoảng ngày không hợp lệ.
- **Trạng thái dữ liệu:** Không tạo booked hoặc đổi listing/payment.
- **Căn cứ / điểm cần xác nhận:** Source không so sánh hai ngày. Đề xuất checkout phải sau checkin cần được phê duyệt.

### BOOK-IT-009 — Biên nhận phòng hôm qua, hôm nay và một đêm

- **ID:** BOOK-IT-009
- **Yêu cầu liên quan:** R-B05
- **Mục tiêu:** Biên nhận phòng hôm qua, hôm nay và một đêm.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Đồng hồ test cố định T0; listing có lịch cho phép; chốt Q-B02.
- **Dữ liệu đầu vào:** Ba lượt độc lập: checkin=T0-1/checkout=T0+1; checkin=T0/checkout=T0+1; checkin=D1/checkout=D1+1. totalPrice theo quy tắc giá đã chốt.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** Ba lượt độc lập: checkin=T0-1/checkout=T0+1; checkin=T0/checkout=T0+1; checkin=D1/checkout=D1+1. totalPrice theo quy tắc giá đã chốt.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Quá khứ: đề xuất 400; hôm nay: cần Q-B02; một đêm: 200/201 nếu min=1 đêm
- **Response/giá trị trả về:** Lỗi E_VALIDATION; lượt hợp lệ BOOK_OK với ngày/giá đúng input đã được backend xác minh.
- **Trạng thái dữ liệu:** Chỉ lượt được chính sách chấp nhận tạo một dòng; không side effect ở lượt lỗi.
- **Căn cứ / điểm cần xác nhận:** Không dùng ngày hệ điều hành không kiểm soát; hôm nay/min nights chưa có oracle chính thức.

### BOOK-IT-010 — Ngày sai định dạng và biên năm nhuận

- **ID:** BOOK-IT-010
- **Yêu cầu liên quan:** R-B05, R-B08
- **Mục tiêu:** Ngày sai định dạng và biên năm nhuận.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P2.
- **Trạng thái:** Not Run
- **Điều kiện trước:** User/token hợp lệ; biến thể năm nhuận dùng T0=2028-01-01 và listing có lịch phù hợp trong DB test.
- **Dữ liệu đầu vào:** Ngày sai: "31/12/2028", "2027-02-29", "2028-02-30"; hợp lệ: checkin="2028-02-29", checkout="2028-03-01", giá một đêm hợp lệ.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** Ngày sai: "31/12/2028", "2027-02-29", "2028-02-30"; hợp lệ: checkin="2028-02-29", checkout="2028-03-01", giá một đêm hợp lệ.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400 cho ngày sai; hợp lệ 200 theo source/201 sau Q-B01
- **Response/giá trị trả về:** Ngày sai: lỗi binding/validation, không token hoặc SQL; hợp lệ BOOK_OK đúng ngày nhuận.
- **Trạng thái dữ liệu:** Chỉ tạo một booking cho ngày được xác minh hợp lệ.
- **Căn cứ / điểm cần xác nhận:** Cần xác nhận Jackson không âm thầm chuẩn hóa ngày sai; nếu có phải ghi sai lệch, không chấp nhận ngày khác request như thành công.

### BOOK-IT-011 — Giá null, bằng 0 hoặc âm

- **ID:** BOOK-IT-011
- **Yêu cầu liên quan:** R-B06, R-B08
- **Mục tiêu:** Giá null, bằng 0 hoặc âm.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Listing price=500000, hai đêm; user/token hợp lệ; không có ưu đãi miễn phí được duyệt.
- **Dữ liệu đầu vào:** BOOK_A totalPrice lần lượt null, 0, -1.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A totalPrice lần lượt null, 0, -1.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400 nếu field bắt buộc; hoặc thành công với giá backend tính lại nếu field tùy chọn, Q-B03
- **Response/giá trị trả về:** Không bao giờ BOOK_OK với totalPrice null/0/âm khi không có chính sách cho phép; schema validation cần chốt.
- **Trạng thái dữ liệu:** Không lưu tổng tiền không hợp lệ; nếu backend tính lại theo hợp đồng phải lưu giá đúng, không giá client.
- **Căn cứ / điểm cần xác nhận:** Source map trực tiếp Double từ request; chưa có quy tắc giá và miễn phí. Cần chốt nhánh từ chối hay tính lại trước nghiệm thu.

### BOOK-IT-012 — Giá client thấp hơn, cao hơn hoặc khác độ chính xác

- **ID:** BOOK-IT-012
- **Yêu cầu liên quan:** R-B06
- **Mục tiêu:** Giá client thấp hơn, cao hơn hoặc khác độ chính xác.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** LISTING_OK hai đêm, tổng fixture 1000000 trước phí; chốt phí/tiền tệ/làm tròn Q-B03.
- **Dữ liệu đầu vào:** BOOK_A totalPrice=1; 999999; 1000001; 1000000.001; biến thể quá lớn 1e309 gửi dạng JSON number.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A totalPrice=1; 999999; 1000001; 1000000.001; biến thể quá lớn 1e309 gửi dạng JSON number.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400 khi giá không hợp lệ, hoặc 200/201 với giá server đã tính; Q-B03
- **Response/giá trị trả về:** Không trả thành công với giá tùy ý do client ép; nếu lỗi dùng E_VALIDATION, không SQL/stack trace.
- **Trạng thái dữ liệu:** Không lưu Infinity/NaN/giá âm hoặc tổng khác quy tắc giá được duyệt; không tạo payment.
- **Căn cứ / điểm cần xác nhận:** Ca chờ oracle giá cụ thể; việc source hiện lưu được 1 không chứng minh nghiệp vụ đúng.

### BOOK-IT-013 — Listing xóa mềm, chưa được phép hoặc không nhận đặt

- **ID:** BOOK-IT-013
- **Yêu cầu liên quan:** R-B07
- **Mục tiêu:** Listing xóa mềm, chưa được phép hoặc không nhận đặt.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Từng fixture riêng: deleted=true; access=false; status=INACTIVE; status=OCCUPIED; host bị khóa.
- **Dữ liệu đầu vào:** BOOK_A đổi listingId theo từng fixture; ngày/giá khác đều hợp lệ.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A đổi listingId theo từng fixture; ngày/giá khác đều hợp lệ.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 409 cho listing không khả dụng; chốt Q-B04
- **Response/giá trị trả về:** Lỗi không khả dụng theo schema được chốt; không có bookingId.
- **Trạng thái dữ liệu:** Không tạo booked/payment hoặc tự bật lại access/deleted/status.
- **Căn cứ / điểm cần xác nhận:** Trạng thái OCCUPIED có cấm mọi ngày hay chỉ khoảng ngày cần Q-B04/Q-B05. Source mapper chỉ kiểm tra tồn tại.

### BOOK-IT-014 — Biên lịch được phép của listing

- **ID:** BOOK-IT-014
- **Yêu cầu liên quan:** R-B05, R-B07
- **Mục tiêu:** Biên lịch được phép của listing.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Listing startDate=S, endDate=E; chốt ý nghĩa ngày checkout trước khi chạy.
- **Dữ liệu đầu vào:** Từng lượt [S-1,S+1], [S,S+1], [E-1,E], [E,E+1]; giá khớp mỗi khoảng.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** Từng lượt [S-1,S+1], [S,S+1], [E-1,E], [E,E+1]; giá khớp mỗi khoảng.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Ngoài lịch: đề xuất 409; biên trong lịch: 200/201 theo Q-B01/Q-B02
- **Response/giá trị trả về:** Lỗi E_VALIDATION hoặc lỗi không khả dụng theo hợp đồng; hợp lệ BOOK_OK đúng ngày.
- **Trạng thái dữ liệu:** Chỉ các khoảng được chính sách cho phép tạo booked; listing/payment không thay đổi.
- **Căn cứ / điểm cần xác nhận:** Q-B02/Q-B04: chưa tự quy ước khoảng đóng/mở hoặc ý nghĩa endDate khi tài liệu chưa có.

### BOOK-IT-015 — Khoảng ngày trùng và hai booking liền kề

- **ID:** BOOK-IT-015
- **Yêu cầu liên quan:** R-B07
- **Mục tiêu:** Khoảng ngày trùng và hai booking liền kề.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Chốt trạng thái booking chiếm lịch/sức chứa; fixture giả định sức chứa=1 có booking được chọn chiếm [D1,D2).
- **Dữ liệu đầu vào:** Lượt độc lập: [D1,D2), [D1+1,D2+1), [D1-1,D1+1), [D1-1,D2+1), [D2,D2+1).
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_B
- **Request:** Lượt độc lập: [D1,D2), [D1+1,D2+1), [D1-1,D1+1), [D1-1,D2+1), [D2,D2+1).

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Overlap: đề xuất 409; liền kề 200/201 nếu quy ước [checkin,checkout) được duyệt
- **Response/giá trị trả về:** Lỗi conflict không có bookingId; liền kề BOOK_OK nếu lịch cho phép.
- **Trạng thái dữ liệu:** Không thêm booking vượt sức chứa; booking cũ không đổi; không thanh toán tự động.
- **Căn cứ / điểm cần xác nhận:** Q-B05: giả định sức chứa và khoảng nửa mở phải được duyệt. Source create chưa có kiểm tra overlap, không suy ra PENDING luôn giữ chỗ.

### BOOK-IT-016 — Hai request đặt cùng phòng đồng thời

- **ID:** BOOK-IT-016
- **Yêu cầu liên quan:** R-B07, R-B08
- **Mục tiêu:** Hai request đặt cùng phòng đồng thời.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** DB test cô lập; mô hình một suất theo Q-B05; U_A và U_B hợp lệ; cùng listing/ngày, chưa có booking.
- **Dữ liệu đầu vào:** Hai BOOK_A giống listing/ngày/giá, chạy có điều phối đồng thời.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A và H_B ở hai request độc lập
- **Request:** Hai BOOK_A giống listing/ngày/giá, chạy có điều phối đồng thời.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Theo đề xuất một suất: một 200/201, một 409; cần Q-B05
- **Response/giá trị trả về:** Chỉ một response thành công có bookingId; request còn lại báo conflict rõ.
- **Trạng thái dữ liệu:** Tối đa một booking giữ suất đã duyệt; không có orphan payment hoặc sửa dữ liệu user khác.
- **Căn cứ / điểm cần xác nhận:** Nếu PENDING không giữ chỗ hoặc sức chứa>1, phải thay oracle theo chính sách được duyệt; chưa có locking/overlap trong source create.

### BOOK-IT-017 — JSON lỗi, body rỗng và media type không hỗ trợ

- **ID:** BOOK-IT-017
- **Yêu cầu liên quan:** R-B08
- **Mục tiêu:** JSON lỗi, body rỗng và media type không hỗ trợ.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** User/token hợp lệ; mỗi biến thể độc lập.
- **Dữ liệu đầu vào:** Body thô {"listingId": ; body rỗng; hoặc BOOK_A gửi Content-Type=text/plain.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A; biến thể text/plain thay Content-Type nhưng giữ Bearer/Accept
- **Request:** Body thô {"listingId": ; body rỗng; hoặc BOOK_A gửi Content-Type=text/plain.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 400 cho JSON/body; 415 cho media type, Q-B08
- **Response/giá trị trả về:** Response lỗi parse/media type đã chốt; không có BOOK_OK hoặc thông tin SQL/stack trace.
- **Trạng thái dữ liệu:** Không tạo booked/payment hoặc đổi listing.
- **Căn cứ / điểm cần xác nhận:** Theo các yêu cầu liên quan và nguồn tương ứng trong ma trận; đây là đặc tả chưa thực thi.

### BOOK-IT-018 — Content null, rỗng và giới hạn độ dài

- **ID:** BOOK-IT-018
- **Yêu cầu liên quan:** R-B08
- **Mục tiêu:** Content null, rỗng và giới hạn độ dài.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P2.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Chốt content có bắt buộc không và maxLength ở Q-B08; các field khác hợp lệ.
- **Dữ liệu đầu vào:** BOOK_A content null, "", "   "; khi chốt max: độ dài max-1/max/max+1; thêm chuỗi tiếng Việt có dấu để phân biệt ký tự/byte.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A content null, "", "   "; khi chốt max: độ dài max-1/max/max+1; thêm chuỗi tiếng Việt có dấu để phân biệt ký tự/byte.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Nếu optional: 200/201 với null/rỗng; nếu bắt buộc/vượt max: đề xuất 400
- **Response/giá trị trả về:** Lỗi E_VALIDATION; thành công BOOK_OK với content theo quy tắc chuẩn hóa đã chốt.
- **Trạng thái dữ liệu:** Không cắt ngầm dữ liệu hoặc lưu partial; chỉ ca hợp lệ tạo booking.
- **Căn cứ / điểm cần xác nhận:** Không tự coi độ dài cột mặc định là max nghiệp vụ; cần xác nhận tính theo ký tự hay byte.

### BOOK-IT-019 — Tài khoản bị khóa đang giữ JWT cũ

- **ID:** BOOK-IT-019
- **Yêu cầu liên quan:** R-B09
- **Mục tiêu:** Tài khoản bị khóa đang giữ JWT cũ.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Token của U_LOCKED được cấp trước khi khóa và còn hạn; DB test isActive=false; listing hợp lệ.
- **Dữ liệu đầu vào:** BOOK_A
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H0 cộng Authorization: Bearer &lt;ACCESS_LOCKED_BEFORE_BLOCK&gt;
- **Request:** BOOK_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 403 hoặc 401 nếu chính sách thu hồi token; Q-G03
- **Response/giá trị trả về:** Không có BOOK_OK; schema lỗi tài khoản khóa hoặc E106 theo chính sách được duyệt.
- **Trạng thái dữ liệu:** Không tạo booked/payment hoặc đổi listing.
- **Căn cứ / điểm cần xác nhận:** Source create và decoder không kiểm tra lại isActive; chưa có yêu cầu thu hồi tức thời. Không xác nhận đây là hành vi đã chặn.

### BOOK-IT-020 — Xác định quyền đặt của user không có role GUEST

- **ID:** BOOK-IT-020
- **Yêu cầu liên quan:** R-B01, R-B09
- **Mục tiêu:** Xác định quyền đặt của user không có role GUEST.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Từng lượt U_HOST, U_ADMIN, U_NO_ROLE active, có token; listing thuộc host khác để tránh lẫn quy tắc tự đặt.
- **Dữ liệu đầu vào:** BOOK_A trên listing fixture của host khác.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_HOST, H_ADMIN, H_NO_ROLE; chạy riêng
- **Request:** BOOK_A trên listing fixture của host khác.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Nếu chỉ authenticated: 200 theo source; nếu yêu cầu GUEST: đề xuất 403, Q-B06
- **Response/giá trị trả về:** Thành công BOOK_OK đúng chủ caller; thiếu quyền E1010 hoặc schema đã chốt.
- **Trạng thái dữ liệu:** Thành công chỉ tạo dòng cho caller; thiếu quyền không tạo dữ liệu.
- **Căn cứ / điểm cần xác nhận:** Không đủ quyền không thể suy từ tên role. Q-B06 phải chốt trước khi kết luận ca này Pass/Fail.

### BOOK-IT-021 — Principal không còn user tương ứng trong DB

- **ID:** BOOK-IT-021
- **Yêu cầu liên quan:** R-B01, R-B08
- **Mục tiêu:** Principal không còn user tương ứng trong DB.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Token có sub user fixture đã loại khỏi snapshot DB test; không xóa user thật/dev để chuẩn bị ca.
- **Dữ liệu đầu vào:** BOOK_A
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H0 cộng Authorization: Bearer &lt;ACCESS_MISSING_USER&gt;
- **Request:** BOOK_A

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 401; Q-B07
- **Response/giá trị trả về:** Response không xác thực theo schema chốt; không có BOOK_OK hoặc tên exception.
- **Trạng thái dữ liệu:** Không tạo user mới/booking/payment và không đổi listing.
- **Căn cứ / điểm cần xác nhận:** Source Optional.get có thể thành lỗi RuntimeException HTTP400/body code=200; ghi chênh lệch khi thực thi.

### BOOK-IT-022 — Lỗi sau save không để lại booking khi client nhận lỗi

- **ID:** BOOK-IT-022
- **Yêu cầu liên quan:** R-B08
- **Mục tiêu:** Lỗi sau save không để lại booking khi client nhận lỗi.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P0.
- **Trạng thái:** Not Run
- **Điều kiện trước:** DB/test context cô lập; gây lỗi tại response mapper sau khi repository.save đã trả về; ghi snapshot booked trước.
- **Dữ liệu đầu vào:** BOOK_A.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A
- **Request:** BOOK_A.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Đề xuất 5xx có kiểm soát; Q-B09
- **Response/giá trị trả về:** Response lỗi, không BOOK_OK hoặc thông tin SQL/stack trace.
- **Trạng thái dữ liệu:** Đề xuất rollback toàn bộ booking mới, không payment/listing thay đổi; xác minh bằng kết nối độc lập sau lỗi.
- **Căn cứ / điểm cần xác nhận:** Source không có transaction service bao quanh save+map; repository có thể commit trước mapper lỗi. Cần xác nhận cơ chế atomicity, không ghi nhận rollback như đã có.

### BOOK-IT-023 — Retry cùng request không tạo booking ngoài ý muốn

- **ID:** BOOK-IT-023
- **Yêu cầu liên quan:** R-B07, R-B08
- **Mục tiêu:** Retry cùng request không tạo booking ngoài ý muốn.
- **Phân loại:** Integration test.
- **Độ ưu tiên:** P1.
- **Trạng thái:** Not Run
- **Điều kiện trước:** Một request BOOK_A vừa thành công nhưng client giả lập mất response; fixture độc lập; chốt Q-B10 trước chạy.
- **Dữ liệu đầu vào:** Gửi lại đúng BOOK_A sau lần đầu mất response.
- **HTTP method và endpoint:** `POST /api/bookings`
- **Headers cần thiết:** H_A; chỉ thêm Idempotency-Key nếu hợp đồng được phê duyệt hỗ trợ
- **Request:** Gửi lại đúng BOOK_A sau lần đầu mất response.

**Bước thực hiện:**

1. Ghi nhận trạng thái dữ liệu trước của các fixture nêu trong điều kiện trước.
2. Gửi POST `/api/bookings` bằng headers và request của ca này.
3. Đối chiếu HTTP status, nội dung response và trạng thái dữ liệu sau với kết quả mong đợi.

**Kết quả mong đợi:**

- **HTTP status:** Nếu có idempotency: trả booking cũ 200/201; nếu lịch đã giữ: 409; chính sách cần Q-B05/Q-B10
- **Response/giá trị trả về:** Không báo thành công hai booking khác nhau khi nghiệp vụ chỉ cho một suất/request logic.
- **Trạng thái dữ liệu:** Không tạo booking trùng ngoài chính sách, không tạo payment; nếu chủ sản phẩm cho phép nhiều booking độc lập phải sửa oracle rõ ràng.
- **Căn cứ / điểm cần xác nhận:** Hiện không có Idempotency-Key trong controller; không tự viết nó thành header bắt buộc đã được hỗ trợ.

## 5. Truy vết yêu cầu và phân loại

Các ID dưới đây trỏ tới test case trong mục 4. Một ca có nhiều biến thể phải ghi kết quả từng biến thể riêng.

| Yêu cầu | Unit test | Integration test |
| --- | --- | --- |
| R-B01 | `BOOK-UT-001`, `BOOK-UT-005` | `BOOK-IT-001`, `BOOK-IT-002`, `BOOK-IT-003`, `BOOK-IT-004`, `BOOK-IT-020`, `BOOK-IT-021` |
| R-B02 | `BOOK-UT-002` | `BOOK-IT-001`, `BOOK-IT-005`, `BOOK-IT-006` |
| R-B03 | `BOOK-UT-001`, `BOOK-UT-004` | `BOOK-IT-001` |
| R-B04 | `BOOK-UT-003` | `BOOK-IT-001` |
| R-B05 | — | `BOOK-IT-007`, `BOOK-IT-008`, `BOOK-IT-009`, `BOOK-IT-010`, `BOOK-IT-014` |
| R-B06 | — | `BOOK-IT-011`, `BOOK-IT-012` |
| R-B07 | — | `BOOK-IT-013`, `BOOK-IT-014`, `BOOK-IT-015`, `BOOK-IT-016`, `BOOK-IT-023` |
| R-B08 | `BOOK-UT-004`, `BOOK-UT-005` | `BOOK-IT-004`, `BOOK-IT-005`, `BOOK-IT-006`, `BOOK-IT-007`, `BOOK-IT-010`, `BOOK-IT-011`, `BOOK-IT-016`, `BOOK-IT-017`, `BOOK-IT-018`, `BOOK-IT-021`, `BOOK-IT-022`, `BOOK-IT-023` |
| R-B09 | — | `BOOK-IT-019`, `BOOK-IT-020` |
