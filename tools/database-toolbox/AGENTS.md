# MCP Toolbox — MySQL dev

Áp dụng cho `tools/database-toolbox/` và làm quy tắc tham chiếu cho mọi seed/SQL dev trong repo. Kế thừa [hướng dẫn gốc](../../AGENTS.md).

## Đích kết nối và quyền

- Đích dev hiện được cấu hình: Docker MySQL `127.0.0.1:3306`, database `johunter11`, user riêng `codex_dev`, MCP `restnesst_mysql`.
- Trước khi làm việc, xác nhận container/kết nối và `mysql-connection-info`; không coi trạng thái hoặc số bản ghi của lần trước là hiện tại.
- `codex_dev` chỉ có `SELECT`, `INSERT`, `UPDATE`, `DELETE` trên database dev. Không thay bằng credential root/backend, không tự cấp thêm quyền hoặc chuyển sang database khác.
- Dùng tool cố định trong `tools.yaml`. Với nghiệp vụ mới, bổ sung tool có SQL tham số `?`, kiểm tra schema/caller, mô tả đúng tác động và khai báo annotation đọc/ghi chính xác.
- Không mở tool SQL tùy ý, nội suy tên bảng/cột hoặc thao tác ghi hàng loạt. Giữ allowlist trong `../../.codex/config.toml` và các MCP khác khi thêm tool.

## Đọc và ghi dữ liệu

- Thao tác đọc được thực hiện để phục vụ yêu cầu; chỉ lấy field cần thiết, không xuất mật khẩu/hash/token hay dữ liệu cá nhân ra hội thoại.
- INSERT phải thuộc dữ liệu/nghiệp vụ người dùng đã yêu cầu. Khi phạm vi tạo mới đã rõ và được cho phép, không hỏi lại cùng một quyền.
- Seed phải có danh sách xem trước, nguồn khi dùng dữ liệu công khai và nhãn cho giá/ảnh/tài khoản giả; chờ xác nhận trước khi apply. Cho phép chạy lại bằng cách bỏ qua bản trùng, không ghi đè dữ liệu cũ.
- Trước UPDATE/DELETE: yêu cầu ID cụ thể, gọi tool preview đúng nghiệp vụ, cho người dùng xem dòng thật và giá trị/tác động dự kiến, rồi chờ xác nhận.
- Nếu tool dùng `row_version`, truyền nguyên token của preview được duyệt. Token/approval kỹ thuật không thay việc cho người dùng xem dòng. Nếu ảnh hưởng 0 dòng hoặc snapshot cũ, đọc lại và nhận xác nhận mới.
- Kiểm thử INSERT/UPDATE/DELETE cần đồng ý riêng cho một bản ghi test xác định. Việc cho phép tạo tài khoản MySQL không phải đồng ý thử ghi dữ liệu nghiệp vụ.
- Đọc lại sau khi ghi; báo số tạo mới, bỏ qua, lỗi và việc commit/rollback thực tế. Không tự bỏ điều kiện khóa hoặc chuyển sang quyền cao hơn để vượt lỗi.

## Credentials và cài đặt

- Binary `.bin/` và secrets `.local/` phải được Git bỏ qua. Mật khẩu trong môi trường hoặc `.local/credentials.json` quyền 0600; thư mục secrets quyền 0700.
- Không in/read secrets vào context, đưa mật khẩu vào argv, TOML/YAML được commit, hoặc dùng SQL quản trị chứa mật khẩu làm nguồn credential runtime.
- `run.py` khởi động Toolbox qua stdio; stdout chỉ dành cho protocol. Không chuyển sang HTTP hoặc bật SQL/debug log để xử lý một lỗi thông thường.
- Installer pin phiên bản/checksum; khi nâng phiên bản phải cập nhật cả hai từ nguồn chính thức. Không tải rồi thực thi binary chưa xác minh.

## Kiểm tra không ghi

Chạy từ repo gốc:

```bash
python3 tools/database-toolbox/check_connection.py
python3 tools/database-toolbox/seed_amenities.py
```

- Lệnh đầu đọc kết nối, quyền, bảng, số bản ghi, schema và khóa ngoại; lệnh thứ hai chỉ preview tiện ích. `--apply` của seed là thao tác ghi, không dùng như lệnh kiểm tra mặc định.
- Nếu thiếu tool MCP trong phiên hiện tại, có thể dùng stdio client đã có để gọi chính Toolbox; không vòng qua root/admin. Báo khi cần phiên Codex mới để nạp allowlist.
- Docker socket/port/mount bị lỗi: kiểm tra đúng context và giữ dữ liệu; không tạo database trống thay thế, xóa volume hay tự chạy SQL quản trị. Xem [README](README.md) cho cài đặt và phạm vi các tool.
