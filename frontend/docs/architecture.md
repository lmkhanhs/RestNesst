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

## Chi tiết chỗ ở và danh sách yêu thích

- `features/listings/components/PropertyHero.jsx` hiển thị icon từ `categories[].thumnailUrl`; đường dẫn local/cloud qua `shared/utils/mediaUrl.js`, ảnh thiếu hoặc lỗi dùng icon dự phòng.
- `AboutThisPlace.jsx` giữ nội dung giới thiệu của chủ nhà, chia đoạn trong dialog có cuộn; fullscreen trên điện thoại, hỗ trợ bàn phím và `prefers-reduced-motion`.
- Nút đặt phòng dùng `primary.main`/`primary.dark` của MUI. `CssBaseline` cung cấp alias cho các biến `--rn-brand-*`, `--rn-surface-card` và các tên cũ trên màn hình listing để cùng theo theme sáng/tối.
- `DateRangeSelector.jsx` dùng hai `DatePicker` Community trong `@mui/x-date-pickers` cho ngày nhận/trả phòng; không dùng `DateRangePicker` Pro. Giữ giới hạn lịch trống và chọn nhanh tuần đầu/cuối, reset ngày trả nếu ngày nhận mới muộn hơn ngày trả cũ. Provider dùng adapter Dayjs và nhãn tiếng Việt. Ngày gửi API được format `YYYY-MM-DD` theo ngày chọn, tránh đổi ngày khi chuyển sang UTC.
- `features/favorites/api/favorites.js` giữ hợp đồng `/api/users/favorites`: GET đọc `result.favorites`, POST chấp nhận response `204`, DELETE gửi `{ listingId }` trong body. Giữ tên trường ảnh `primaryThumnail` của backend.
- `features/favorites/hooks/useFavorites.js` chia sẻ việc tải/cập nhật yêu thích giữa trang chi tiết, thẻ kết quả tìm kiếm và trang cá nhân. Chỉ cập nhật trạng thái sau khi request thành công, chặn thao tác lặp khi đang gửi và thông báo các hook khác tải lại sau thay đổi.
- `features/profile/components/FavoriteRooms.jsx` dùng cho guest và host/admin; tải danh sách khi mở tab, hỗ trợ ảnh local/cloud, mở phòng, bỏ lưu, loading, empty, báo lỗi và thử lại. Dữ liệu yêu thích được đọc từ backend; không lưu bản thay thế trong `localStorage`.

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

## Trang cá nhân: yêu thích và phòng đã đặt

- `profile/components/FavoriteRooms.jsx` dùng chung cho guest và staff/admin, hiển thị ngày lưu, điểm trung bình thực tế, tổng review và các nhóm bình luận từ `GET /api/users/favorites`. Khi thiếu thống kê từ backend cũ hoặc chưa có review, hiển thị trạng thái chưa cập nhật/chưa có dữ liệu; không tự tạo rating hay nhãn AI từ số sao.
- `profile/components/BookedRooms.jsx` dùng chung phần trình bày booking: bảng desktop, thẻ mobile/tablet, ngày theo `DD/MM/YYYY`, giá theo locale Việt Nam và trạng thái tiếng Việt. Màu nền/chữ/viền dùng theme token. Callback xác nhận trả phòng và mở đánh giá vẫn do page xử lý; không thay API hoặc điều kiện trạng thái được phép thao tác.
- `profile/utils/formatters.js` định dạng ngày và giá; ảnh dùng `shared/utils/mediaUrl.js`. Các component dùng MUI và các breakpoint hiện tại, giữ nguyên route `/profile` và `/property/:id`.

## Xác nhận đặt phòng

`BookingCard` gửi ngày đã chọn và chuyển response tạo booking vào `location.state.roomData` của `/reservation`. `bookings/utils/reservationData.js` chuẩn hóa số, ngày ISO, ảnh và tổng review trước khi render; các trường bắt buộc là mã booking, tên, giá, tổng tiền và ngày lưu trú hợp lệ. Thiếu dữ liệu bắt buộc thì hiển thị hướng dẫn kiểm tra phòng đã đặt, không định dạng giá trị null hoặc gửi thanh toán. Thiếu ảnh dùng placeholder; ảnh local/cloud dùng `getMediaUrl`.

Mã listing không được dùng thay mã booking khi gửi thanh toán. Hai nút tạo booking và thanh toán chặn request đồng thời; lỗi thanh toán hiển thị ngay trên trang. Tải lại một history entry còn `roomData` tiếp tục hiển thị booking đó, không gửi POST tạo booking lại. Mở trực tiếp `/reservation` không có state hiển thị hướng dẫn quay về chọn phòng. Không thêm cơ chế lưu booking vào localStorage hoặc tự khôi phục từ dữ liệu cũ.

## Quản lý chỗ ở của Host

`host/pages/HostPage.jsx` giữ các request và form thêm/sửa chỗ ở. Tab Tài sản dùng `host/components/HostProperties.jsx` để trình bày thẻ phòng, tìm theo tên/địa chỉ/thành phố, lọc trạng thái và sắp xếp. Các thao tác tìm/lọc/sắp xếp thực hiện trên danh sách đã tải; không thay route hoặc API.

`host/utils/propertyDisplay.js` chuẩn hóa DTO có `name` hoặc `title`, trạng thái và các mảng ảnh/tiện nghi/danh mục; định dạng ngày, giá theo locale Việt Nam. Giao diện hỗ trợ `ACTIVE`, `INACTIVE`, `OCCUPIED`, `AVAILABLE`; màu dùng MUI theme, ảnh dùng `getMediaUrl`. Thống kê đầu trang phản ánh tổng chỗ ở, số đang hoạt động, giá trung bình mỗi đêm và điểm trung bình chỗ ở; không coi tổng giá niêm yết là doanh thu booking.

Danh sách có trạng thái tải, lỗi kèm thử lại, chưa có phòng và không có kết quả lọc. Nút Chỉnh sửa vẫn mở form hiện có, Xem phòng đi tới `/property/:id`. Tạo/cập nhật thành công hỗ trợ response 200/201 và chuẩn hóa tên phòng trước khi cập nhật danh sách hiển thị.
