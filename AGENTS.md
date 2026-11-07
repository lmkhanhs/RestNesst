# RestNesst — hướng dẫn chung cho Codex

## Giao tiếp và phạm vi

- Luôn trả lời bằng tiếng Việt; giữ nguyên tên file, hàm, lệnh và thông báo lỗi khi trích dẫn.
- Bắt đầu câu trả lời cuối cùng bằng đúng `⭐ `; nêu kết quả trước, rồi kiểm tra đã chạy và phần còn vướng.
- Khi kết thúc cuộc trò chuyện, xuống dòng thêm `Kết thúc rồi Khánh 😊`.
- Thực hiện yêu cầu bằng những thay đổi nhỏ, dễ review. Giữ nguyên thay đổi sẵn có của người dùng; không tự commit, push hoặc dọn file ngoài phạm vi.
- Khi refactor, giữ nguyên API, request/response, HTTP status, phân quyền, schema và hành vi nghiệp vụ trừ khi người dùng yêu cầu đổi.
- Không biến yêu cầu của một lượt thành quy tắc vĩnh viễn. Chỉ cập nhật hướng dẫn lâu dài khi được yêu cầu.

## Đọc hướng dẫn đúng phạm vi

Trước khi sửa một module, đọc `AGENTS.md` tương ứng bên dưới, kể cả khi bắt đầu từ repo gốc. Quy tắc module bổ sung cho file này; yêu cầu hiện tại của người dùng được ưu tiên.

| Phạm vi | Hướng dẫn | Tài liệu chi tiết |
| --- | --- | --- |
| Java/Spring Boot, seed, ảnh upload | [airbnb_service/AGENTS.md](airbnb_service/AGENTS.md) | [Backend README](airbnb_service/README.md), [kiến trúc theo nghiệp vụ](docs/architecture.md#backend-tổ-chức-theo-nghiệp-vụ) |
| React/Vite, giao diện | [frontend/AGENTS.md](frontend/AGENTS.md) | [Frontend README](frontend/README.md), [kiến trúc](frontend/docs/architecture.md) |
| FastAPI/BARTpho | [ai-service/AGENTS.md](ai-service/AGENTS.md) | [AI README](ai-service/README.md) |
| MCP MySQL, mọi thao tác dữ liệu dev | [tools/database-toolbox/AGENTS.md](tools/database-toolbox/AGENTS.md) | [Toolbox README](tools/database-toolbox/README.md) |

[README.md](README.md) là hướng dẫn chạy toàn hệ thống. Giữ giải thích dài trong README/tài liệu, không chép lại vào mọi `AGENTS.md`.

<!-- CODEGRAPH_START -->
## Tìm hiểu code bằng CodeGraph

- Nếu repo có `.codegraph/`, dùng `codegraph_explore` hoặc `codegraph explore "<file, symbol hoặc câu hỏi>"` trước khi tìm kiếm/đọc source để hiểu hoặc định vị code. Gọi tên file/symbol để lấy source và các đường gọi liên quan.
- Với Booking hoặc User/Auth Entity/DTO, lần theo controller, service, mapper, repository, native SQL và caller trước khi sửa.
- Nếu CodeGraph báo source cũ hoặc thiếu phần cần đọc, đọc trực tiếp phần đó. Nếu không có `.codegraph/`, bỏ qua; không tự khởi tạo index.
<!-- CODEGRAPH_END -->

## Cách làm việc và kiểm tra

- Kiểm tra `git status`, manifest và hướng dẫn module trước khi chọn lệnh. Dùng `rg` cho tài liệu/cấu hình và tìm file khi không thuộc trường hợp CodeGraph ở trên.
- Tái sử dụng cấu trúc, thư viện và cách đặt tên hiện tại. Không đổi tên module hoặc thêm tầng trừu tượng nếu nhiệm vụ không cần.
- Chọn kiểm tra theo phần đã đổi; ghi rõ kết quả thật và lỗi có sẵn. Không tuyên bố đã chạy test, kiểm tra trình duyệt hay kết nối DB nếu chưa thực hiện.
- Nếu người dùng yêu cầu bỏ test: giữ nguyên file test, không thêm/sửa/chạy test trong lượt đó. Dùng lệnh build bỏ test của module nếu cần.
- Chỉ sửa tài liệu/`AGENTS.md`: kiểm tra đường dẫn, lệnh được nhắc tới và `git diff --check`; không cần khởi động dịch vụ hay chạy toàn bộ test.
- Cập nhật hướng dẫn chạy khi thay đổi cấu hình, dependency hoặc quy trình. Không lưu số bản ghi, trạng thái container hay kết quả cũ như sự thật luôn đúng; kiểm tra lại khi cần.

## Cấu hình, bí mật và dữ liệu

- MySQL lưu nghiệp vụ; Redis lưu blacklist JWT. Backend hiện không yêu cầu MongoDB. Dịch vụ AI có cấu hình riêng; kiểm tra endpoint thực tế của các caller khi thay đổi tích hợp.
- Không in hoặc commit mật khẩu, token, khóa ký/API hay dữ liệu cá nhân. Khi đọc cấu hình, chỉ trích phần cần thiết và che giá trị nhạy cảm. Không đọc file credentials vào hội thoại.
- Mật khẩu qua môi trường hoặc file local bị Git bỏ qua; chỉ ghi tên biến và placeholder vào tài liệu. Giữ nguyên MCP hiện có khi sửa `.codex/config.toml`.
- Trước mọi thao tác DB, kể cả seed Java trong backend, đọc [quy tắc database](tools/database-toolbox/AGENTS.md). Seed phải có preview; UPDATE/DELETE phải có ID, xem trước dòng thật và xác nhận của người dùng.
- Không tự xóa volume, database, bản ghi, checkpoint hoặc dataset để giải quyết lỗi môi trường. Báo lỗi cụ thể và chọn cách phục hồi giữ dữ liệu.
