# 05 — Đánh giá và tóm tắt đánh giá bằng AI

- Thêm đánh giá: `ListingsController.createCommnet` → [`ListingsServices.handleAddReview`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/listing/service/ListingsServices.java)
- Tóm tắt: [`AiSummarizeService`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/review/service/AiSummarizeService.java) gọi `POST {ai.service.url}/api/summarize-text` (connect timeout 10s, read timeout 60s)
- Entity: [`ReviewEntity`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/review/entity/ReviewEntity.java)

## Endpoint

| Method | Path | Quyền | Body |
| --- | --- | --- | --- |
| POST | `/api/listings/reviews/{bookingId}` | Đăng nhập | `multipart/form-data`: `comment`, `rating`, `image`, `status` (`POSITIVE`/`NEGATIVE`) |
| POST | `/api/listings/reviews/summarize` | Public | JSON `{ text, maxInputLength, maxOutputLength, ratio, minSummaryLength }` |
| POST | `/api/listings/{id}/reviews/summarize` | Public | Không có body |

> [!NOTE]
> Path variable của endpoint thêm đánh giá tên là `id` nhưng là **id booking**, không phải id listing.

## Dữ liệu chuẩn bị

- `g1` có booking `B_SUCCESS` (status `SUCCESS`, `commented = false`), `B_PAID` (`PAID`), `B_DONE` (`SUCCESS`, `commented = true`).
- `g2` là user khác.
- Mock `CloudinaryService.uploadImageCloddy` trả URL cố định.
- AI service giả (WireMock/MockRestServiceServer hoặc server thật ở cổng cấu hình).

## Test case

### Thêm đánh giá — `POST /api/listings/reviews/{bookingId}`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| REVIEW-ADD-01 | Đánh giá booking đã hoàn tất | `g1`, `B_SUCCESS`, `rating = 5`, `status = POSITIVE`, có ảnh | HTTP 200, `message: "Add comment successfully!"`; tạo review gắn user + listing của booking, `reviewDate = hôm nay`, `imageUrl` = URL Cloudinary, `status = POSITIVE`; booking `commented = true` | P1 | U/I | — |
| REVIEW-ADD-02 | Đánh giá lần 2 | `B_DONE` | HTTP 400, `code: 1011`; không tạo review | P1 | U | — |
| REVIEW-ADD-03 | Booking chưa hoàn tất | `B_PAID` hoặc PENDING/CONFIRMED | HTTP 400, `code: 1011` | P1 | U | — |
| REVIEW-ADD-04 | Booking của người khác | `g2` gửi `B_SUCCESS` | HTTP 400, `code: 1011` | P1 | S | — |
| REVIEW-ADD-05 | Booking không tồn tại | | HTTP **502**, `code: 1017` | P2 | U | — |
| REVIEW-ADD-06 | `status = NEGATIVE` | | Review lưu `status = NEGATIVE` | P2 | U | — |
| REVIEW-ADD-07 | `status` giá trị khác | `status = "NEUTRAL"` | Review lưu `status = null` | P3 | U | — |
| REVIEW-ADD-08 | Thiếu `status` | | Hiện tại NPE → HTTP 400, booking vẫn `commented = false` ⚠️ | P2 | U | — |
| REVIEW-ADD-09 | Không gửi ảnh | `image = null` | Mong đợi lưu review không ảnh; xác nhận hành vi của `uploadImageCloddy(null)` ⚠️ | P2 | U | — |
| REVIEW-ADD-10 | Rating ngoài khoảng | `rating = 0`, `rating = 6`, `rating = -1` | Ghi nhận: hiện không validate ⚠️ | P2 | U | — |
| REVIEW-ADD-11 | ANON | | HTTP 401 | P1 | S | — |
| REVIEW-ADD-12 | Ảnh hưởng điểm trung bình | Sau khi job `updateAvgStart` chạy | `listings.avg_start` = trung bình rating | P3 | I | — |

### Tóm tắt văn bản — `POST /api/listings/reviews/summarize`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| REVIEW-SUM-01 | Tóm tắt thành công | `text = "  Phòng sạch ...  "`, AI trả 200 | HTTP 200, `message: "Summarize review comment successfully!"`, `result` là phản hồi từ AI | P1 | U | — |
| REVIEW-SUM-02 | Payload mặc định | Chỉ gửi `text` | AI nhận `text` đã trim, `max_input_length = 512`, `max_output_length = 160`, `ratio = 0.35`, `min_summary_length = 10` | P2 | U | — |
| REVIEW-SUM-03 | Payload tuỳ chỉnh | Gửi đủ tham số | AI nhận đúng giá trị gửi lên | P3 | U | — |
| REVIEW-SUM-04 | Text rỗng / chỉ khoảng trắng / null | `""`, `"   "`, thiếu `text` | HTTP 400, `code: 1024`; không gọi AI | P1 | U | — |
| REVIEW-SUM-05 | AI không chạy | Cổng AI đóng | HTTP 503, `code: 1025` | P1 | U/I | — |
| REVIEW-SUM-06 | AI trả lỗi 5xx / 4xx | | HTTP 503, `code: 1025` | P2 | U | — |
| REVIEW-SUM-07 | AI trả body rỗng | | HTTP 503, `code: 1025` | P2 | U | — |
| REVIEW-SUM-08 | AI chậm quá 60s | | HTTP 503, `code: 1025` sau timeout | P3 | I | — |
| REVIEW-SUM-09 | Gọi không cần token | `ANON` | Không bị 401 | P2 | S | — |
| REVIEW-SUM-10 | Text rất dài | 100.000 ký tự | Ghi nhận: không giới hạn ở backend, chuyển nguyên cho AI ⚠️ | P3 | U | — |

### Tóm tắt đánh giá của listing — `POST /api/listings/{id}/reviews/summarize`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| REVIEW-LSUM-01 | Listing có nhiều review | Comment: `"Sạch sẽ"`, `"Chủ thân thiện!"`, `"  Gần biển  "` | AI nhận `text = "Sạch sẽ. Chủ thân thiện! Gần biển."`, `max_output_length = 200`, `min_summary_length = 15`; HTTP 200, `message: "Summarize listing reviews successfully!"` | P1 | U | — |
| REVIEW-LSUM-02 | Bỏ comment rỗng | Có comment `null` và `"   "` | Bị bỏ qua khi ghép | P2 | U | — |
| REVIEW-LSUM-03 | Listing không có review | | HTTP 400, `code: 1024` | P2 | U | — |
| REVIEW-LSUM-04 | Mọi comment đều rỗng | | HTTP 400, `code: 1024` | P3 | U | — |
| REVIEW-LSUM-05 | Listing không tồn tại | | HTTP 500, `code: 1008` | P2 | U | — |
| REVIEW-LSUM-06 | AI lỗi | | HTTP 503, `code: 1025` | P2 | U | — |
| REVIEW-LSUM-07 | Gọi không cần token | `ANON` | Không bị 401 | P2 | S | — |

## Phát hiện từ code

| Liên quan | Mô tả | Đề xuất |
| --- | --- | --- |
| REVIEW-ADD-05 | `BOOKING_NOT_EXIT` dùng HTTP 502 | Đổi sang 404/400 |
| REVIEW-ADD-08/10 | Không validate `status`, `rating` | Thêm validate, dùng `"POSITIVE".equals(status)` |
| REVIEW-SUM-10 | Endpoint public, không giới hạn độ dài và tần suất | Giới hạn kích thước body, cân nhắc rate limit |
