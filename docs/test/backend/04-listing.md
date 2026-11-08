# 04 — Listing (chỗ ở)

- Controller: [`ListingsController`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/listing/controller/ListingsController.java) (base path `${api.base.path}` = `/api`)
- Service: [`ListingsServices`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/listing/service/ListingsServices.java), [`ListingImageUploadService`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/listing/service/ListingImageUploadService.java)
- SQL: [`ListingsRepositoryCustomImpl`](../../../airbnb_service/src/main/java/com/pbl5cnpm/airbnb_service/listing/repository/custom/impl/ListingsRepositoryCustomImpl.java)
- Đánh giá và tóm tắt AI ở [05-review-ai-summarize.md](05-review-ai-summarize.md).

## Endpoint

| Method | Path | Quyền | Ghi chú |
| --- | --- | --- | --- |
| GET | `/api/listings` | Public | Listing hiển thị cho khách |
| GET | `/api/listings/{id}` | Public | Chi tiết |
| GET | `/api/listings/search?keyword=` | Public | Tìm theo từ khoá |
| GET | `/api/listings/filter?...&amenities=` | Public | Lọc |
| POST | `/api/listings` | HOST, ADMIN | `multipart/form-data` `ListingRequest` |
| GET | `/api/listings/counts` | ADMIN | Số listing chưa xoá |
| GET | `/api/listings/all?page&size` | ADMIN | Danh sách quản trị |
| GET | `/api/listings/admin/{id}` | ADMIN | Chi tiết quản trị |
| PUT | `/api/listings/access/{id}?status=` | ADMIN | Duyệt/ẩn |
| PUT | `/api/listings/{id}/{position}` | ADMIN | Đổi vị trí hiển thị |
| DELETE | `/api/listings/{id}` | ADMIN | Xoá mềm |
| GET | `/api/listings/host` | HOST | Listing của host |
| PUT | `/api/listings/host` | HOST | `multipart/form-data` `UpdateListingRequest` |

## Dữ liệu chuẩn bị

| Mã | `status` | `deleted` | `access` | `start_date` – `end_date` | `position` | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| L1 | ACTIVE | false | true | hôm qua – tuần sau | 1 | Hiển thị bình thường, category "Biển", amenity "Wifi" (id 1), country "Việt Nam", price 500000 |
| L2 | ACTIVE | false | true | hôm qua – tuần sau | null | Không có vị trí, amenity "Wifi" + "Hồ bơi" (id 2), price 1500000 |
| L3 | ACTIVE | false | false | hôm qua – tuần sau | 2 | Chờ duyệt |
| L4 | ACTIVE | true | true | hôm qua – tuần sau | 3 | Đã xoá |
| L5 | INACTIVE | false | true | hôm qua – tuần sau | 4 | Host tắt |
| L6 | ACTIVE | false | true | tuần sau – tháng sau | 5 | Chưa tới ngày mở |
| L7 | OCCUPIED | false | true | hôm qua – tuần sau | 6 | Đang có khách |

- `hostA` (HOST) sở hữu L1, L3; `hostB` (HOST) sở hữu L2; `admin` (ADMIN).

## Test case

### Danh sách công khai — `GET /api/listings`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-PUB-01 | ANON xem danh sách | Bộ dữ liệu trên | HTTP 200, `message: "feetch listing successfuly!"`; chỉ có L1, L2 | P1 | I | — |
| LIST-PUB-02 | Loại trừ đúng điều kiện | | Không có L3 (access=false), L4 (deleted), L5 (INACTIVE), L6 (chưa tới ngày), L7 (OCCUPIED) | P1 | I | — |
| LIST-PUB-03 | Thứ tự | | `position` tăng dần, `position = null` xếp cuối, rồi `updated_at` giảm dần, `id` tăng dần → L1 trước L2 | P2 | I | — |
| LIST-PUB-04 | Biên ngày | `start_date = end_date = hôm nay` | Listing có trong kết quả | P3 | I | — |

### Chi tiết — `GET /api/listings/{id}`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-DETAIL-01 | Xem chi tiết listing hiển thị | `id = L1` | HTTP 200, `message: "get detail successfully!"`, có ảnh, host, category, amenity | P1 | I | — |
| LIST-DETAIL-02 | id không tồn tại | | HTTP 500, `code: 1008` | P2 | U | — |
| LIST-DETAIL-03 | Listing đã xoá / chưa duyệt | `id = L4`, `id = L3` | Mong đợi không trả cho khách; hiện tại vẫn trả HTTP 200 ⚠️ | P2 | S | — |

### Tìm kiếm — `GET /api/listings/search`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-SEARCH-01 | Theo tiêu đề, không phân biệt hoa thường | `keyword` là một phần title L1 viết hoa | Trả L1 | P1 | I | — |
| LIST-SEARCH-02 | Theo địa chỉ | `keyword` một phần address | Trả listing tương ứng | P2 | I | — |
| LIST-SEARCH-03 | Theo tên category / amenity | `keyword = "biển"`, `keyword = "wifi"` | Trả L1 (và L2 với "wifi"), không trùng dòng (`DISTINCT`) | P2 | I | — |
| LIST-SEARCH-04 | Loại listing không hợp lệ | keyword khớp L3, L4, L5 | Không trả L3, L4, L5 | P1 | I | — |
| LIST-SEARCH-05 | Không giới hạn ngày | keyword khớp L6 | Ghi nhận: L6 vẫn được trả (khác `GET /api/listings`) ⚠️ | P3 | I | — |
| LIST-SEARCH-06 | Không có kết quả | `keyword = "zzzz"` | HTTP 200, `result = []` | P3 | I | — |
| LIST-SEARCH-07 | Ký tự đặc biệt / SQL | `keyword = "' OR 1=1 --"` | HTTP 200, `result = []` (truy vấn có tham số) | P1 | S | — |
| LIST-SEARCH-08 | Thiếu keyword | Không gửi | Dùng mặc định `" "` → chỉ khớp chuỗi chứa khoảng trắng | P3 | I | — |
| LIST-SEARCH-09 | Ký tự `%`, `_` | `keyword = "%"` | Ghi nhận: wildcard không được escape, trả mọi listing hợp lệ | P3 | I | — |

### Lọc — `GET /api/listings/filter`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-FILTER-01 | Không tham số | | Mọi listing `deleted = false`, `access = true`, `status = ACTIVE` (L1, L2, L6) | P2 | I | — |
| LIST-FILTER-02 | Khoảng giá | `lowestPrice=400000&highestPrice=1000000` | Chỉ L1 | P1 | I | — |
| LIST-FILTER-03 | Quốc gia | `country=Việt Nam` | Listing thuộc country đó | P2 | I | — |
| LIST-FILTER-04 | Category | `category_id=<id Biển>` | L1 | P2 | I | — |
| LIST-FILTER-05 | Một amenity | `amenities=1` | L1, L2 | P2 | I | — |
| LIST-FILTER-06 | Nhiều amenity (AND) | `amenities=1&amenities=2` | Chỉ L2 (phải có đủ cả hai) | P1 | I | — |
| LIST-FILTER-07 | Khoảng ngày | `startDate=<hôm nay>&endDate=<hôm nay>` | Listing có `start_date ≤ startDate` và `end_date ≥ endDate` | P2 | I | — |
| LIST-FILTER-08 | Popular | `popular=true` | Chỉ listing `popular = true` | P3 | I | — |
| LIST-FILTER-09 | Kết hợp nhiều điều kiện | giá + amenity + country | Giao các điều kiện | P2 | I | — |
| LIST-FILTER-10 | SQL injection qua `country` | `country=' OR '1'='1` | Mong đợi `result = []` hoặc 400, không trả dữ liệu ngoài điều kiện; hiện tại câu SQL bị nối chuỗi ⚠️ | P1 | S | — |
| LIST-FILTER-11 | SQL injection qua số | `lowestPrice=0 OR 1=1`, `amenities=1) OR (1=1`, `popular=true OR 1=1` | Như trên ⚠️ | P1 | S | — |
| LIST-FILTER-12 | Giá không phải số | `lowestPrice=abc` | Mong đợi HTTP 400 có kiểm soát; hiện tại lỗi SQL ⚠️ | P2 | I | — |
| LIST-FILTER-13 | Ngày sai định dạng | `startDate=31-12-2026` | HTTP 400 có kiểm soát | P3 | I | — |

### Tạo listing — `POST /api/listings`

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-CREATE-01 | HOST tạo listing | Đủ trường, `country = "Việt Nam"`, 2 ảnh | HTTP 201, `code: 201`, `message: "Create listing successfully"`; DB: `host = hostA`, `deleted = false`, `status = ACTIVE`, `avgStart = 4.9`, `popular = true`, `position = số listing trước khi tạo`, **`access = false`** | P1 | U/I | — |
| LIST-CREATE-02 | ADMIN tạo listing | | `access = true` (hiển thị ngay) | P1 | U | — |
| LIST-CREATE-03 | Listing của HOST chưa hiển thị công khai | Sau LIST-CREATE-01 | Không có trong `GET /api/listings` cho tới khi admin duyệt | P1 | I | — |
| LIST-CREATE-04 | Ảnh lưu local trước, upload sau commit | | Response có URL `/uploads/...`; `ListingImageUploadService.uploadImages` chỉ chạy sau commit | P1 | U | `ListingCreationImageTest.returnsLocalImagesAndUploadsOnlyAfterCommit` |
| LIST-CREATE-05 | Rollback không upload | Transaction rollback | Không gọi upload | P2 | U | `ListingCreationImageTest.doesNotUploadWhenTheCreationTransactionRollsBack` |
| LIST-CREATE-06 | Country không tồn tại | `country = "Atlantis"` | HTTP 400, `code: 1014`; không lưu | P2 | U | — |
| LIST-CREATE-07 | Category/amenity không tồn tại | `categories = ["Không có"]` | Bỏ qua tên không khớp, vẫn tạo listing | P3 | U | — |
| LIST-CREATE-08 | Không gửi ảnh | `imgs` rỗng/null | Mong đợi 400 có kiểm soát; hiện tại NPE khi `imgs = null` ⚠️ | P2 | U | — |
| LIST-CREATE-09 | Dữ liệu không hợp lệ | `price < 0`, `endDate < startDate`, thiếu `title` | Ghi nhận: hiện không validate ⚠️ | P2 | U | — |
| LIST-CREATE-10 | GUEST tạo listing | | HTTP 403 | P1 | S | — |
| LIST-CREATE-11 | ANON tạo listing | | HTTP 401 | P1 | S | — |

### Upload ảnh lên Cloudinary (nền)

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-IMG-01 | Upload thành công | | Lưu URL cloud đầy đủ; URL local cũ vẫn đọc được | P2 | U | `ListingImageUploadServiceTest.savesTheFullCloudUrlAndKeepsExistingLocalUrlsReadable` |
| LIST-IMG-02 | Cloud trả URL rỗng | | Giữ URL và file local | P2 | U | `ListingImageUploadServiceTest.leavesTheLocalUrlAndFileIntactWhenCloudUploadReturnsNoUrl` |
| LIST-IMG-03 | Một ảnh lỗi | | Các ảnh khác vẫn được upload | P2 | U | `ListingImageUploadServiceTest.continuesWithOtherImagesAfterAnUploadFailure` |
| LIST-IMG-04 | File thiếu / đã ở cloud | | Bỏ qua | P3 | U | `ListingImageUploadServiceTest.skipsMissingFilesAndImagesAlreadyOnCloud` |
| LIST-IMG-05 | Phục vụ file upload | `GET /uploads/<file>` | HTTP 200, không cần token; không đọc được file ngoài thư mục upload | P1 | I/S | `UploadResourceConfigTest.*` |

### Quản trị (ADMIN)

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-ADM-01 | Đếm listing | `GET /api/listings/counts` | `result` = số listing `deleted = false` (L4 không tính) | P3 | U | — |
| LIST-ADM-02 | Danh sách quản trị | `GET /api/listings/all` | Mọi listing chưa xoá, theo `position` tăng dần; tên chủ lấy từ fullname hoặc username | P2 | U | `ListingsAdminDetailTest.managerListResolvesOwnerDisplayNameFromFullnameOrUsername` |
| LIST-ADM-03 | Tham số phân trang | `page=2&size=1` | Ghi nhận: `page`/`size` bị bỏ qua, trả toàn bộ ⚠️ | P3 | I | — |
| LIST-ADM-04 | Chi tiết quản trị | `GET /api/listings/admin/{L1}` | HTTP 200, đủ thông tin, không lộ `UserEntity` | P2 | U | `ListingsAdminDetailTest.returnsCompleteDetailWithoutExposingTheUserEntity`, `toleratesMissingOptionalInformationAndUsesTheHostUsername` |
| LIST-ADM-05 | Chi tiết listing đã xoá / không tồn tại | `L4`, `999999` | HTTP 500, `code: 1008` | P2 | U | `ListingsAdminDetailTest.rejectsMissingAndSoftDeletedListings` |
| LIST-ADM-06 | Phân quyền chi tiết quản trị | HOST, GUEST, ANON | 403 / 403 / 401 | P1 | S | `ListingsAdminDetailSecurityTest.*` |
| LIST-ADM-07 | Duyệt listing | `PUT /api/listings/access/{L3}?status=true` | HTTP 200, `message: "update status true"`; `access = true`; L3 xuất hiện ở danh sách công khai | P1 | U/I | — |
| LIST-ADM-08 | Ẩn listing | `status=false` | `access = false`; biến mất khỏi danh sách công khai | P1 | U | — |
| LIST-ADM-09 | Duyệt listing của user không còn HOST/ADMIN | Chủ listing chỉ còn GUEST | HTTP 400, `code: 1023` | P2 | U | — |
| LIST-ADM-10 | Listing không tồn tại | | HTTP 500, `code: 1008` | P3 | U | — |
| LIST-ADM-11 | Thiếu `status` | | HTTP 400 | P3 | I | — |
| LIST-ADM-12 | Đổi vị trí | `PUT /api/listings/{L1}/0` | `position = 0` | P2 | U | `ListingsAdminDetailTest.updatesDisplayPositionAndRejectsInvalidOrDeletedListings` |
| LIST-ADM-13 | Vị trí âm / listing đã xoá | `/{L1}/-1`, `/{L4}/1` | `code: 1011` / `code: 1008` | P2 | U | `ListingsAdminDetailTest.updatesDisplayPositionAndRejectsInvalidOrDeletedListings` |
| LIST-ADM-14 | Chỉ ADMIN đổi vị trí | HOST | HTTP 403 | P1 | S | `ListingsAdminDetailSecurityTest.onlyAdminCanUpdateListingPosition` |
| LIST-ADM-15 | Xoá mềm | `DELETE /api/listings/{L1}` | `deleted = true`, bản ghi còn trong DB; không còn ở mọi danh sách | P1 | U/I | — |
| LIST-ADM-16 | Xoá listing không tồn tại | | HTTP 500, `code: 1008` | P3 | U | — |
| LIST-ADM-17 | Phân quyền các endpoint ADMIN | HOST/GUEST gọi `counts`, `all`, `access`, `DELETE` | HTTP 403 | P1 | S | — |

### Host quản lý listing

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-HOST-01 | Host xem listing của mình | `hostA` gọi `GET /api/listings/host` | L1, L3 (không gồm listing đã xoá, không gồm listing host khác) | P1 | U/I | — |
| LIST-HOST-02 | GUEST/ADMIN không có HOST | | HTTP 403 | P1 | S | — |
| LIST-HOST-03 | Host sửa listing của mình | `hostA`, `id = L1`, đổi title/price/status=ACTIVE | HTTP 200, `message: "update listing by host"`; dữ liệu được lưu, **`access = false`** (phải duyệt lại) | P1 | U | — |
| LIST-HOST-04 | Status khác ACTIVE | `status = "abc"` | Lưu thành `INACTIVE` | P2 | U | — |
| LIST-HOST-05 | Thay ảnh | Có `imgs` mới | Ảnh cũ bị thay bằng ảnh mới, mỗi ảnh trỏ về listing | P2 | U | — |
| LIST-HOST-06 | Không gửi ảnh | | Giữ ảnh cũ | P2 | U | — |
| LIST-HOST-07 | Sửa listing của host khác | `hostA` gửi `id = L2` | Mong đợi HTTP 403; hiện tại sửa được (không kiểm tra chủ sở hữu — IDOR) ⚠️ | P1 | S | — |
| LIST-HOST-08 | Thiếu `status` | | Hiện tại NPE → HTTP 400 ⚠️ | P2 | U | — |
| LIST-HOST-09 | listing không tồn tại | | HTTP 500, `code: 1008` | P3 | U | — |
| LIST-HOST-10 | Cập nhật amenity | `amenites` mới | Ghi nhận: service không gán amenity mới vào entity ⚠️ | P2 | U | — |

### Tác vụ định kỳ

| ID | Kịch bản | Tiền điều kiện / Dữ liệu | Kết quả mong đợi | Ưu tiên | Loại | Tự động |
| --- | --- | --- | --- | --- | --- | --- |
| LIST-JOB-01 | Cập nhật `avg_start` | L1 có review rating 4 và 5 | `avg_start = 4.5`; listing không có review giữ nguyên | P2 | I | — |
| LIST-JOB-02 | Cập nhật `popular` | Listing có > 5 review | Mong đợi `popular = true`; hiện câu SQL nhóm theo `r.id` và so với `l.id` nên không đúng ⚠️ | P3 | I | — |

## Phát hiện từ code

| Liên quan | Mô tả | Đề xuất |
| --- | --- | --- |
| LIST-FILTER-10/11/12 | `filter()` nối trực tiếp `country`, `category_id`, giá, ngày, `popular`, `amenities` vào SQL | Dùng tham số `:name` và parse kiểu số/ngày trước |
| LIST-HOST-07 | `handleUpdateListingByHost` không kiểm tra `entity.getHost()` | So sánh host với user đăng nhập, trả `UNAUTHORIZED` |
| LIST-DETAIL-03 | Chi tiết công khai trả cả listing đã xoá/chưa duyệt | Lọc `deleted`/`access` ở endpoint public |
| LIST-CREATE-08/09 | Thiếu validate đầu vào | Thêm validate và mã lỗi rõ ràng |
| LIST-JOB-02 | `updatePopular` dùng `r.id` thay cho `r.listing_id` | Nhóm theo `r.listing_id` |
