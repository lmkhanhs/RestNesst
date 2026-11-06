# Tổ chức frontend

## Nguyên tắc

- `app` chỉ lắp ghép ứng dụng: providers, routes, layout và store.
- `features` gom trang và component theo công việc người dùng thực hiện.
- `shared` chứa phần dùng chung, không import ngược từ `app` hoặc `features`.
- Page là điểm vào một màn hình; component phục vụ riêng một feature nằm cạnh page đó.
- Code liên lạc dịch vụ riêng thuộc `api` của feature; Axios client chung nằm ở `shared/api`.
- Dùng tên file PascalCase cho React component và tên camelCase cho hook/helper.
- Khi thêm feature mới, tạo đúng những thư mục đang cần; không tạo sẵn các tầng rỗng.
- Không gom tất cả component vào một file `index.js` khổng lồ. Các import trực tiếp giúp
  theo dõi dependency và tránh vòng lặp. Barrel nhỏ có sẵn của UI library được giữ lại.

## Luồng khởi tạo

`main.jsx` → `app/App.jsx` → `app/AppProviders.jsx` → `app/router.jsx`.

`AppProviders` giữ thứ tự provider trước đây: Helmet → Redux → PersistGate →
Localization → Settings → CollapseDrawer → Search → BrowserRouter → Theme →
ThemeColorPresets → RtlLayout → Notistack → MotionLazyContainer.

Các stylesheet từ thư viện được import trong `app/vendorStyles.js`. Hai stylesheet
starter `styles/app.css` và `styles/global.css` vẫn được giữ; chúng chưa được import
ở phiên bản cũ và không được tự động bật trong lần tổ chức lại này.

## Các route chính

| URL | File |
| --- | --- |
| `/` | `features/search/pages/HomePage.jsx` |
| `/login` | `features/auth/pages/LoginPage.jsx` |
| `/signup` | `features/auth/pages/SignupPage.jsx` |
| `/property/:id` | `features/listings/pages/PropertyPage.jsx` |
| `/reservation` | `features/bookings/pages/ReservationPage.jsx` |
| `/profile` | `features/profile/pages/GuestProfilePage.jsx` hoặc `StaffProfilePage.jsx` theo quyền |
| `/host` | `features/host/pages/HostPage.jsx` |
| `/admin` | `features/admin/pages/AdminPage.jsx` |

`app/layouts/main/MainLayout.jsx` là layout đang được router sử dụng.
`ChatOnlyLayout.jsx` là layout phụ có sẵn từ trước, chưa được router sử dụng.

## Đối chiếu cấu trúc cũ

| Trước đây (trong `web-ReactJs/tour-app-starter-main`) | Hiện tại (trong `frontend`) |
| --- | --- |
| `src/App.jsx`, provider trong `src/main.jsx` | `src/app/App.jsx`, `src/app/AppProviders.jsx` |
| `src/routes/index.jsx` | `src/app/router.jsx` |
| `src/layout/Main` | `src/app/layouts/main` |
| `src/layout/Main/Inputt.jsx` | `src/features/search/components/SearchBar.jsx` |
| `src/pages` | `src/features/<feature>/pages` |
| `src/section/Filter` | `src/features/search/components/filters` |
| `src/section/Search` | `src/features/search/components/results` |
| `src/section/Property` | `src/features/listings/components` và `src/features/listings/index.js` |
| `src/section/admin` | `src/features/admin/components` |
| `src/contexts/SearchContext.jsx` | `src/features/search/context/SearchContext.jsx` |
| `src/contexts/useFilter.js` | `src/features/search/hooks/useFilter.js` |
| `src/components/ProtectedRoute.jsx`, `src/utils/auth.js` | `src/features/auth/components`, `src/features/auth/utils` |
| `src/components/chat`, `src/api/chat*.js` | `src/features/chat/components`, `src/features/chat/api` |
| `src/api/sentimentAnalysis.js` | `src/features/reviews/api/sentimentAnalysis.js` |
| `src/api/axiosConfig.js`, `src/utils/axios.js` | `src/shared/api/httpClient.js`, `src/shared/api/legacyHttpClient.js` |
| `src/redux` | `src/app/store` |
| `src/config.js` | `src/shared/config/ui.js` |
| Các component, hooks, contexts còn lại, theme, utils, assets | `src/shared/<nhóm tương ứng>` |
| `src/_mock` | `src/shared/mocks` |
| `src/section/admin/pic` | `src/features/admin/assets` |
| `src/pages/a.txt` | `docs/legacy-notes.txt` |

Giữ lại dữ liệu mẫu và component starter vì có những dependency dùng gián tiếp qua
barrel, theme và UI. Redux slice `app/store/slices/auth.js` là code calendar của starter
mang tên `auth` từ trước; state key và logic được giữ để không đổi hành vi trong đợt này.

## Package và cài đặt

Chỉ còn `frontend/package.json` và `frontend/package-lock.json`. Các dependency mà
source thực sự import từ package ở thư mục cha đã chuyển vào package này.
Các dependency starter không được source sử dụng được bỏ khỏi manifest, tránh
xung đột peer dependency và nhu cầu cài npm ở hai thư mục. Các gói ngày tháng MUI
được cố định ở phiên bản `7.28.3` đang dùng thay vì nhãn `latest`.

Lockfile được tạo lại để cài được trên nhiều nền tảng; dùng `npm ci`. Không còn dùng
`yarn.lock`. Giữ nguyên React 18 và Vite 5 trong lần refactor này.

## Phạm vi kiểm chứng

- Kiểm tra import và khai báo dependency trên toàn bộ source, bao gồm file chưa được route import.
- Build production bao gồm các màn hình lazy-load.
- So sánh lint với source trước khi di chuyển; không tắt rule để làm lint thành công.
- Những file nghiệp vụ lớn như Host/Profile giữ logic hiện tại. Việc chia nhỏ hook,
  request và UI bên trong từng page là công việc tiếp theo khi chỉnh chức năng đó.

Trước refactor: ESLint có **182 lỗi và 14 cảnh báo**. Các vấn đề có sẵn gồm biến
không dùng, prop-types, hook dependencies, hook gọi có điều kiện và một hàm chưa
được khai báo trong dashboard. Đợt này tập trung tổ chức thư mục và khởi tạo ứng dụng,
không xem việc chuyển đường dẫn là đã sửa các vấn đề nghiệp vụ đó.

Sau refactor: **182 lỗi và 14 cảnh báo**, đối chiếu từng thông báo theo file sau khi
chuyển đường dẫn, không có thông báo mới. `npm ci`, `npm run check:imports` và
`npm run build` đã chạy thành công. Vite phục vụ `/login` qua HTTP thành công;
chưa kiểm tra tương tác trên trình duyệt vì browser host không khả dụng.
