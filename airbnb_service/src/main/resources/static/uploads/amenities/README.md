# Icon tiện ích lưu local

10 icon nét viền tự tạo cho RestNesst, không dùng ảnh hoặc logo của bên thứ ba.
Mỗi tiện ích có PNG 128×128 nền trong suốt để ứng dụng sử dụng và SVG gốc để sửa.
`preview.png` là bảng xem trước, không gắn vào bản ghi tiện ích.

Ảnh nằm trên ổ đĩa backend trong `src/main/resources/static/uploads/amenities/`.
Database lưu đường dẫn tương đối `/uploads/amenities/<ten-icon>.png` ở cột
`amenites.thumnail_url`, tương tự ảnh danh mục đã có. Đây không phải `localStorage`
của trình duyệt và không cần Cloudinary.

| Tiện ích | File ảnh |
| --- | --- |
| Điều hòa | `air-conditioning.png` |
| Thang máy | `elevator.png` |
| Máy sấy tóc | `hair-dryer.png` |
| Bàn làm việc | `work-desk.png` |
| Phòng tập thể dục | `fitness-center.png` |
| Spa | `spa.png` |
| Lễ tân 24 giờ | `reception-24h.png` |
| Nhà hàng | `restaurant.png` |
| Đưa đón sân bay | `airport-transfer.png` |
| Trạm sạc xe điện | `ev-charging.png` |

Sinh lại ảnh và catalog từ repo gốc (cần Pillow):

```bash
python3 airbnb_service/scripts/generate-amenity-icons.py
```

Xem trước qua MCP Toolbox, chỉ đọc:

```bash
python3 tools/database-toolbox/seed_amenities.py
```

Thêm các tiện ích đã được yêu cầu khi MySQL dev sẵn sàng:

```bash
python3 tools/database-toolbox/seed_amenities.py --apply
```

Script dùng `codex_dev` qua MCP; mỗi lần gọi chỉ INSERT một tiện ích bằng SQL có
tham số. Kiểm tra tên đã có để bỏ qua, không cập nhật hay kích hoạt lại bản ghi cũ.
Các bản ghi mới có `deleted=false`, `is_active=true` và position tiếp theo.
Không tự gắn các tiện ích mới vào khách sạn, không chạy seed khách sạn/tài khoản.
Mỗi INSERT commit độc lập; nếu lỗi giữa chừng, chạy lại sẽ bỏ qua các tên đã thêm.

Sau khi đưa file mới vào classpath/backend đang chạy, ví dụ ảnh:
`http://localhost:8080/uploads/amenities/air-conditioning.png`.

Có thể sử dụng, chỉnh sửa và phân phối các icon tự tạo này trong dự án.
