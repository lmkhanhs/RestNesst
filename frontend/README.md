# RestNesst frontend

Ứng dụng React 18 + Vite. Frontend có một thư mục chạy duy nhất, một `package.json`
và một `package-lock.json`.

## Chạy ứng dụng

Đã kiểm tra bằng Node.js 22.23.2 và npm 10.9.8. Từ thư mục gốc repository:

```bash
cd frontend
npm ci
npm run dev
```

Mở địa chỉ Vite in ra terminal, thường là `http://localhost:5173`.
Backend Spring Boot chạy riêng trong `airbnb_service/`.

```bash
npm run check:imports  # Kiểm tra mọi import, alias và dependency khai báo
npm run build          # Build production vào dist/
npm run preview        # Xem bản build
npm run lint           # ESLint cho source
```

## Tìm code ở đâu?

```text
frontend/
├── src/
│   ├── main.jsx                # Điểm khởi động React
│   ├── app/                    # Ghép ứng dụng: providers, router, layout, Redux
│   ├── features/               # Code theo chức năng
│   │   ├── auth/               # Đăng nhập, đăng ký, bảo vệ route, kiểm tra quyền
│   │   ├── search/             # Trang chủ, tìm kiếm, bộ lọc, bản đồ kết quả
│   │   ├── listings/           # Chi tiết chỗ ở, tiện nghi, thông tin host
│   │   ├── bookings/           # Trang đặt phòng và thanh toán
│   │   ├── profile/            # Hồ sơ guest và hồ sơ host/admin
│   │   ├── host/               # Trang quản lý chỗ ở của host
│   │   ├── admin/              # Trang quản trị và các tab quản lý
│   │   ├── chat/               # Chatbot và các API chat
│   │   └── reviews/            # API phân tích cảm xúc đánh giá
│   ├── shared/                 # UI, hooks, theme, config, API client, assets dùng chung
│   └── styles/                 # Các stylesheet có sẵn của starter
├── public/                     # Asset truy cập trực tiếp qua URL
├── scripts/check-imports.mjs    # Kiểm tra cả file không đi qua production build
└── docs/architecture.md         # Quy ước tổ chức và bảng đối chiếu cấu trúc cũ
```

Trong mỗi feature, chỉ tạo `pages/`, `components/`, `api/`, `hooks/`, `context/`
hoặc `utils/` khi thực sự có code tương ứng. Dùng `@/` cho import giữa các thư mục,
và `./` cho file cùng thư mục. Vite và editor cùng dùng alias này.

## Kết nối dịch vụ

- `src/shared/api/httpClient.js`: Axios client chính, gắn access token.
- `src/shared/api/legacyHttpClient.js`: client của Redux starter, giữ kiểu xử lý lỗi cũ.
- `src/shared/config/ui.js`: cấu hình layout/theme và các hằng số có sẵn.
- `vite.config.js`: proxy Vite hiện có cho `/api` và `/auth`.
- `src/features/chat/api/`: các client của dịch vụ chatbot riêng.
- `src/features/reviews/api/`: dịch vụ Python phân tích cảm xúc.

Đợt tổ chức thư mục này giữ nguyên URL API và hành vi nghiệp vụ hiện có. Các URL
trực tiếp trong page/component vẫn còn; `.env` chưa điều khiển toàn bộ các request.
Không coi việc frontend build thành công là xác nhận backend hoặc dịch vụ ngoài đã chạy.

## Kiểm tra sau thay đổi

`npm run check:imports` kiểm tra toàn bộ source, kể cả các component starter chưa được route
sử dụng. Build kiểm tra các route lazy-load và tạo asset production. ESLint giữ nguyên
các rule hiện tại; các vấn đề lint có sẵn được ghi nhận riêng trong tài liệu kiến trúc.
