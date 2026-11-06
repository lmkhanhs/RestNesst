# Frontend React/Vite

Áp dụng trong `frontend/`; kế thừa [hướng dẫn gốc](../AGENTS.md).

## Tổ chức code

- React 18, Vite, MUI, React Router và Redux theo dependency hiện tại trong `package.json`.
- `src/app/`: providers, router, layout và store; `src/features/`: code theo nghiệp vụ; `src/shared/`: UI, hooks, API/config, theme và asset dùng chung.
- Trong feature, chỉ tạo `pages/`, `components/`, `api/`, `hooks/`, `context/`, `utils/` khi có code tương ứng. Không tạo bộ khung thư mục rỗng.
- Dùng `@/` cho import giữa các thư mục và `./` cho file gần nhau. Giữ component riêng của nghiệp vụ trong feature đến khi thật sự có nhiều nơi dùng.
- JSX thụt 2 dấu cách, component PascalCase, hook bắt đầu bằng `use`. Theo `.eslintrc.cjs`; không tắt rule toàn cục để làm mất lỗi.

## API và hành vi

- Backend URL lấy từ `src/shared/config/environment.js` qua `BACKEND_URL`/`VITE_BACKEND_URL`; client chính ở `src/shared/api/httpClient.js`. Không thêm IP backend cứng vào component.
- Giữ REST, ảnh upload, Vite proxy và SockJS/WebSocket nhất quán. Các dịch vụ AI/chat/sentiment có thể có endpoint riêng; đọc caller trước khi đổi.
- Giữ nguyên route, request/response, tên field cũ, token và kiểm tra role khi refactor. Không thay hành vi tìm kiếm, lọc, đặt phòng hoặc thanh toán trong một thay đổi chỉ về giao diện.
- Dùng effect có dependency đúng, hủy request khi phù hợp và xử lý loading/empty/error. Hook phải luôn được gọi trước các nhánh return sớm.

## Thiết kế và kiểm tra trên trình duyệt

- Khi thiết kế hoặc chỉnh giao diện, đọc `frontend-design` và `ui-ux-pro-max` phù hợp trong `../.agents/skills/`; báo nếu skill cần dùng không có. Giữ theme/component đang dùng, không tự thay UI framework.
- Làm rõ thứ bậc nội dung, giá mỗi đêm và hành động chính. Ưu tiên nội dung thật; đánh dấu dữ liệu demo.
- Kiểm tra mobile, tablet và desktop: không tràn ngang, field/nút có nhãn, focus bàn phím rõ, tương phản đủ và tôn trọng `prefers-reduced-motion`.
- Dùng Chrome DevTools MCP khi có để xem console, network, ảnh và layout của phần vừa sửa. Giữ cửa sổ mở nếu người dùng yêu cầu; báo lỗi công cụ đúng thực tế.
- Không tự đăng nhập tài khoản mẫu hoặc gửi booking/payment chỉ để kiểm tra nếu chưa được người dùng cho phép thao tác đó.

## Lệnh và kiểm tra

Chạy trong `frontend/`; đây là nơi duy nhất cài dependency frontend.

| Việc | Lệnh |
| --- | --- |
| Cài theo lockfile | `npm ci` |
| Chạy dev | `npm run dev` |
| Kiểm tra toàn bộ import | `npm run check:imports` |
| Build | `npm run build` |
| ESLint | `npm run lint` |
| Xem build | `npm run preview` |

- Sau thay đổi JS/JSX hoặc cấu hình build: chạy `check:imports`, build và lint phù hợp phạm vi. Chỉ đổi tài liệu/ảnh thì không cần chạy lại toàn bộ build.
- Chưa có script frontend test. Không tự thêm test runner trong một thay đổi nhỏ; kiểm tra thủ công luồng guest/host/admin bị ảnh hưởng.
- Lint có thể có lỗi nền; phân biệt lỗi mới và lỗi có sẵn, không tự sửa hàng loạt ngoài phạm vi. Không ghi cứng số lỗi cũ vào báo cáo mới.
- Xem thêm [README](README.md) và [quy ước kiến trúc](docs/architecture.md).
