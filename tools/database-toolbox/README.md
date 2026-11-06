# MCP Toolbox cho MySQL dev RestNesst

Đã cài Toolbox **1.16.0**, binary Linux AMD64 riêng trong `.bin/`, xác minh SHA256
`ca04ab10581c019ed3e905d0331b51faaed8e48f92d97fe592ce2312acf3769f` từ bản phát hành.

## Kết nối hiện tại

| Mục | Giá trị |
| --- | --- |
| MySQL | Docker container `restnesst-mysql`, image `mysql:8.4.10` |
| Địa chỉ từ Toolbox chạy trên máy | `127.0.0.1:3306` |
| Database dev | `johunter11` |
| Tài khoản riêng | `codex_dev` |
| Quyền | `SELECT`, `INSERT`, `UPDATE`, `DELETE` trên `johunter11.*` |
| Transport | MCP stdio, không mở thêm cổng HTTP |

Đã đối chiếu README gốc, `airbnb_service/src/main/resources/application.yml`
và container đang chạy. Không thay đổi cấu hình datasource của backend.
`codex_dev@%` dùng được qua Docker NAT; cổng MySQL hiện chỉ publish trên loopback.
Không đổi mapping thành `0.0.0.0` khi dùng cấu hình này.

## Codex nhận MCP

MCP `restnesst_mysql` nằm trong `.codex/config.toml` của dự án. Cấu hình global,
gồm `chrome-devtools`, `codegraph`, `node_repl`, được giữ nguyên.
Khởi động lại phiên Codex/IDE extension trong thư mục RestNesst và cho phép cấu hình
của project nếu được hỏi trust. Với CLI, có thể xem bằng `codex mcp list` hoặc `/mcp`.
Đường dẫn trong TOML trỏ đến checkout hiện tại; nếu di chuyển repo thì sửa `args`, `cwd`.

`default_tools_approval_mode = "writes"` yêu cầu duyệt tool ghi. Quy tắc trong
`AGENTS.md` còn yêu cầu xem trước dòng và nhận xác nhận trước UPDATE/DELETE.

## Mật khẩu local

Mật khẩu ngẫu nhiên đã được tạo và lưu ở `.local/credentials.json`, quyền `0600`;
thư mục `.local/` có quyền `0700`. Git bỏ qua cả `.local/` và `.bin/`.
`run.py` chuyển mật khẩu vào biến `RESTNESST_MYSQL_PASSWORD` trong tiến trình con;
TOML/YAML không chứa mật khẩu. Có thể dùng biến môi trường này thay file local.
Không in file, không đưa mật khẩu vào chat, command line, README hoặc Git.

Nếu clone lại repo, cài binary bằng:

```bash
bash tools/database-toolbox/install.sh
```

Installer hiện dành cho Linux AMD64; nền tảng khác cần binary tương ứng từ trang
release chính thức và checksum của nền tảng đó.

Tài khoản đã được tạo theo yêu cầu của người dùng. Khi cần thiết lập ở một MySQL
dev khác, quản trị viên dùng `create-user.sql.example`, thay placeholder cục bộ:

```sql
CREATE USER 'codex_dev'@'%' IDENTIFIED BY 'REPLACE_LOCALLY_WITH_A_RANDOM_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON `johunter11`.* TO 'codex_dev'@'%';
SHOW GRANTS FOR 'codex_dev'@'%';
```

Không cấp `ALL PRIVILEGES`, `GRANT OPTION`, DDL hoặc quyền trên database khác.
Không tự ALTER/reset mật khẩu của tài khoản đã tồn tại. Không cần `FLUSH PRIVILEGES`
sau `CREATE USER`/`GRANT`. Tài khoản mới có dòng `USAGE ON *.*` mặc định;
đó không phải quyền đọc/ghi toàn cục.

Để lưu mật khẩu đã thiết lập từ terminal mà không hiển thị, chạy tại repo gốc:

```bash
python3 - <<'PY'
import getpass, json, os
from pathlib import Path
folder = Path('tools/database-toolbox/.local')
folder.mkdir(exist_ok=True)
folder.chmod(0o700)
password = getpass.getpass('Mật khẩu MySQL codex_dev: ')
if not password:
    raise SystemExit('Không chấp nhận mật khẩu rỗng.')
path = folder / 'credentials.json'
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as f:
    json.dump({'password': password}, f)
print('Đã lưu credentials local; không hiển thị mật khẩu.')
PY
```

Lệnh từ chối ghi đè credentials đang có. File local không được commit kể cả khi
dùng `git add -f`. SQL cấp tài khoản chứa mật khẩu dùng trong lần cài đầu đã được
xóa sau khi kiểm tra quyền thành công; chỉ giữ template không có bí mật.

## Các tool được cấu hình

| Tool | Công việc |
| --- | --- |
| `mysql-connection-info` | Xác nhận database và user |
| `mysql-current-grants` | Xem quyền của chính `codex_dev` |
| `mysql-list-tables` | Liệt kê bảng/view trong database dev |
| `mysql-describe-table` | Xem cột, kiểu, null, default, khóa của bảng |
| `mysql-list-foreign-keys` | Xem các liên kết khóa ngoại |
| `countries-list` | Xem danh sách quốc gia, tối đa 200 dòng |
| `countries-get-by-id` | Xem dòng theo ID, số bản ghi tham chiếu và `row_version` |
| `countries-create` | Thêm một quốc gia với các giá trị cụ thể |
| `countries-update-details` | Sửa tên, mô tả, thumbnail, trạng thái theo ID |
| `countries-delete-unused` | Xóa vĩnh viễn một quốc gia không có user/listing tham chiếu |

SQL ghi chỉ nhận giá trị qua placeholder `?`, không nhận SQL tùy ý hoặc tên bảng/cột
nội suy. Chưa cung cấp thao tác ghi cho bảng khác: bổ sung tool nghiệp vụ riêng sau
khi xem schema, quan hệ và luồng backend. Quyền database rộng hơn tập tool đang mở.

Đây là công cụ quản trị dữ liệu dev trực tiếp, không chạy validation/upload ảnh/
audit hooks của Spring. `countries-delete-unused` là xóa vật lý; API backend hiện
xóa mềm qua `deleted`. Không dùng tool xóa vật lý để thay đổi hành vi API.

## Quy trình sửa/xóa

1. Người dùng cung cấp hoặc xác nhận ID cụ thể.
2. Gọi `countries-get-by-id`, cho người dùng xem dòng thật và các giá trị sẽ sửa
   hoặc thông báo xóa vĩnh viễn, rồi chờ xác nhận.
3. Gọi tool ghi tương ứng với ID và `row_version` lấy nguyên từ preview.
4. Nếu dòng đã thay đổi, hash không còn khớp nên SQL không sửa/xóa dòng đó.
   Khi ảnh hưởng 0 dòng, phải đọc lại và xin xác nhận mới; không tự thử bỏ điều kiện.
5. Đọc lại theo ID để xác nhận kết quả. UPDATE/DELETE có khóa chính và `LIMIT 1`.

Hash kiểm tra snapshot của dòng, không phải bằng chứng người dùng đã đồng ý.
Tool description, `AGENTS.md` và chế độ duyệt thao tác ghi duy trì quy trình xác nhận;
SQL chỉ giới hạn phạm vi và ngăn ghi đè snapshot cũ.

## Kiểm tra chỉ đọc

Từ repo gốc:

```bash
python3 tools/database-toolbox/check_connection.py
```

Script khởi chạy `run.py`, bắt tay MCP stdio, đọc manifest, kiểm tra tham số ID/hash
bắt buộc, rồi gọi tool đọc kết nối, quyền, danh sách bảng, cấu trúc `countries` và
khóa ngoại. Không gọi INSERT/UPDATE/DELETE.

Kết quả lần cài ngày 2026-11-06:

- MCP Toolbox 1.16.0 kết nối bằng `codex_dev@%` vào `johunter11` thành công.
- Liệt kê được **15 bảng**, đọc cấu trúc `countries` và khóa ngoại thành công.
- Quyền đúng bốn quyền DML trên database dev; không có quyền dữ liệu trên DB khác.
- Có 10 tool trong manifest, UPDATE/DELETE yêu cầu cả `id` và `row_version`.
- `codex mcp get restnesst_mysql --json` nhận server của project, enabled, transport stdio.
- Chưa kiểm thử ghi. Việc tạo tài khoản không phải đồng ý tạo bản ghi nghiệp vụ test.

## Tài liệu chính thức

- [Toolbox release 1.16.0 và checksum](https://github.com/googleapis/mcp-toolbox/releases/tag/v1.16.0)
- [MySQL source](https://mcp-toolbox.dev/integrations/mysql/source/)
- [mysql-sql và prepared statements](https://mcp-toolbox.dev/integrations/mysql/tools/mysql-sql/)
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
