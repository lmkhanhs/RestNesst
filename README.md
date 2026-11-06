# RestNesst

Ứng dụng tìm kiếm, đặt chỗ ở và quản lý dành cho guest, host và admin.

- **Frontend:** React 18 + Vite, thư mục `frontend/`.
- **Backend:** Java 17 + Spring Boot 3.3, thư mục `airbnb_service/`.
- **MySQL:** lưu user, yêu cầu làm host, chỗ ở, booking và dữ liệu nghiệp vụ.
- **Redis:** lưu blacklist token với TTL; project hiện **không cần MongoDB**.

## Hiện tại chạy được chưa?

Frontend và backend đã được khởi chạy cùng MySQL/Redis local để kiểm tra các trang
công khai bằng Chrome DevTools MCP. Source frontend build thành công; 21 unit test backend
liên quan đến authentication, blacklist và yêu cầu làm host đã đạt ở lần kiểm tra
trước. Các luồng sau đăng nhập và đặt phòng/thanh toán chưa được xác nhận trong lần kiểm tra này.

Để chạy local, cần hoàn tất ba việc:

1. Chạy MySQL và Redis bằng Docker.
2. Sửa tài khoản MySQL trong `application.yml` cho khớp container.
3. Kiểm tra `frontend/.env` đặt `VITE_BACKEND_URL=http://localhost:8080`.

Các lệnh dưới đây giả định backend và frontend chạy trực tiếp trên **cùng máy với
Docker Desktop**, chỉ MySQL và Redis chạy trong container. Mở terminal tại thư mục
gốc `RestNesst` trước khi bắt đầu. Lệnh Docker một dòng dùng được trong PowerShell
và Bash.

## 1. Chuẩn bị môi trường

Cần Docker Desktop đang chạy, JDK 17, Maven và Node.js/npm. Frontend đã được kiểm tra
bằng Node.js 22.23.2 và npm 10.9.8. Maven phải dùng JDK 17 phù hợp với cấu hình project.

```bash
docker version
docker compose version
java -version
mvn -v
node -v
npm -v
```

Dùng Maven đã cài trên máy. Maven wrapper trong repo thiếu cấu hình `.mvn` nên không
sử dụng `./mvnw` hoặc `mvnw.cmd` cho hướng dẫn này.

## 2. Tải image và chạy MySQL

### Lần đầu, khi chưa có container MySQL của project

```bash
docker pull mysql:8.4.10
docker run -d --name restnesst-mysql -p 127.0.0.1:3306:3306 -e MYSQL_ROOT_PASSWORD=MatKhauCuaBan -e MYSQL_DATABASE=johunter11 -v restnesst_mysql_data:/var/lib/mysql --restart unless-stopped mysql:8.4.10
```

Thay `MatKhauCuaBan` bằng mật khẩu bạn chọn, rồi dùng cùng mật khẩu ở bước 4.
Nếu mật khẩu có ký tự đặc biệt của shell, đặt toàn bộ đối số trong dấu nháy,
ví dụ `-e 'MYSQL_ROOT_PASSWORD=YourPassword'`.

- Tên container: `restnesst-mysql`.
- Cổng trên máy: `3306`.
- Database tự tạo: `johunter11`.
- Volume lưu dữ liệu: `restnesst_mysql_data`.

### Nếu đã tạo container trước đó

Không chạy lại `docker run` với cùng tên. Chạy:

```bash
docker start restnesst-mysql
```

Nếu container của bạn dùng tên khác, xem bằng `docker ps -a` rồi dùng đúng tên.
Container phải publish cổng MySQL ra máy để backend kết nối được.

Xem log khởi động:

```bash
docker logs -f restnesst-mysql
```

Đợi thông báo `ready for connections`. Nhấn `Ctrl+C` để thoát xem log; MySQL vẫn chạy.

Kiểm tra đăng nhập trực tiếp, nhập mật khẩu khi được hỏi:

```bash
docker exec -it restnesst-mysql mysql -uroot -p
```

Trong MySQL:

```sql
SHOW DATABASES;
USE johunter11;
EXIT;
```

`MYSQL_DATABASE` và `MYSQL_ROOT_PASSWORD` chỉ khởi tạo dữ liệu khi volume mới.
Nếu tái sử dụng volume, dùng database và mật khẩu đã có. Nếu thiếu database, tạo
trong MySQL bằng:

```sql
CREATE DATABASE IF NOT EXISTS johunter11 CHARACTER SET utf8mb4;
```

## 3. Tải image và chạy Redis

Từ thư mục gốc `RestNesst`:

```bash
docker pull redis:7.4-alpine
docker compose -f compose.redis.yaml up -d
docker compose -f compose.redis.yaml exec redis redis-cli ping
```

Kết quả mong đợi:

```text
PONG
```

File `compose.redis.yaml` đã cấu hình cổng `127.0.0.1:6379`, volume dữ liệu,
persistence AOF và tự khởi động lại container. Redis trong cấu hình local này
**không đặt mật khẩu**.

Kiểm tra cả hai dịch vụ:

```bash
docker ps
docker compose -f compose.redis.yaml ps
```

## 4. Cấu hình backend

Mở [`airbnb_service/src/main/resources/application.yml`](airbnb_service/src/main/resources/application.yml).
Sửa các mục tương ứng trong nhóm `spring` đang có, giữ nguyên các cấu hình khác:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/johunter11
    username: root
    password: "MatKhauCuaBan"

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      connect-timeout: 2s
      timeout: 2s
      repositories:
        enabled: false

  jpa:
    hibernate:
      ddl-auto: update
```

**Không tạo thêm nhóm `spring:` thứ hai hoặc thay toàn bộ file bằng đoạn minh họa.**

- Mật khẩu MySQL phải khớp với dữ liệu của container đang dùng.
- Với Redis local ở bước 3, giữ `REDIS_PASSWORD` chưa đặt hoặc rỗng. Các biến môi
  trường `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` nếu đã đặt sẽ ghi đè giá trị mặc định.
- `ddl-auto: update` tạo/cập nhật bảng và cột `users.host_application_pending` khi
  backend kết nối MySQL thành công; nó không tự tạo database `johunter11`.
- Giữ các mục `security.secret`, `security.duration_access`, `security.duration_refresh`,
  `cloudinary`, `spring.mail`, `upload` và `vnpay` đang có. Điền thông tin tích hợp của
  bạn khi kiểm tra chức năng liên quan; không đưa mật khẩu thật vào README.
- Chạy Maven từ `airbnb_service/` để đường dẫn upload tương đối hoạt động đúng.

Nếu bạn publish MySQL ra cổng khác, ví dụ `3307:3306`, sửa JDBC URL thành
`jdbc:mysql://localhost:3307/johunter11`.

Nếu backend cũng chạy trong Docker, `localhost` bên trong container là chính
container đó. Khi ấy cần cấu hình Docker network và dùng tên service/container
cho MySQL/Redis; hướng dẫn này đang dùng backend chạy trực tiếp trên máy.

## 5. Cấu hình frontend trỏ về backend local

Các request REST, URL ảnh upload và WebSocket của backend Spring Boot đã được gom
về một địa chỉ chung. Trong `frontend/.env` (hoặc `.env.local`), đặt:

```dotenv
VITE_BACKEND_URL=http://localhost:8080
```

Có thể sao chép `frontend/.env.example` nếu chưa có file `.env`.

| File | Vai trò |
| --- | --- |
| `frontend/src/shared/config/environment.js` | Đọc và chuẩn hóa `VITE_BACKEND_URL` |
| `frontend/src/shared/api/httpClient.js` | Axios client chính dùng địa chỉ chung |
| `frontend/src/shared/config/ui.js` | `HOST_API` lấy từ địa chỉ chung |
| `frontend/vite.config.js` | Proxy `/api` và `/auth` lấy cùng biến môi trường |

Chatbot và phân tích cảm xúc là các dịch vụ riêng, không bị chuyển sang cổng 8080.

Khởi động lại Vite sau khi sửa cấu hình hoặc `.env`.

## 6. Chạy backend và frontend

Giữ hai terminal chạy song song. Mỗi terminal bắt đầu từ thư mục gốc `RestNesst`.

### Terminal 1 — Backend

```bash
cd airbnb_service
mvn clean spring-boot:run
```

Đợi log `Started AirbnbServiceApplication`. Backend mặc định dùng cổng `8080`.
Nếu Maven dừng với lỗi, xem lỗi đầu tiên liên quan đến database/cấu hình trước khi
chạy frontend để kiểm tra nghiệp vụ.

### Terminal 2 — Frontend

Lần đầu hoặc sau khi `package-lock.json` thay đổi:

```bash
cd frontend
npm ci
npm run dev
```

Những lần sau, nếu dependency đã cài:

```bash
cd frontend
npm run dev
```

Mở **http://localhost:5173** hoặc địa chỉ Vite in ra terminal nếu cổng này đã bận.
Frontend hiện chỉ cần cài npm trong `frontend/`, không còn dùng `web-ReactJs/`.

## 7. Đăng nhập và kiểm tra kết nối

Khi khởi động với database chưa có các username này, backend tạo tài khoản mẫu:

| Username | Mật khẩu mẫu | Quyền |
| --- | --- | --- |
| `admin` | `12345678` | Các quyền có sẵn, gồm ADMIN |
| `host` | `12345678` | HOST và GUEST |

Đây là tài khoản phục vụ phát triển local. Với database đã có user, backend không
đặt lại mật khẩu. Database mới được tạo danh mục/tiện nghi cơ bản; không đảm bảo
đã có chỗ ở hoặc booking mẫu để hiển thị.

Kiểm tra theo thứ tự:

1. MySQL ở trạng thái chạy, Redis trả `PONG`.
2. Backend báo khởi động thành công.
3. Mở `/login`, đăng nhập tài khoản mẫu tương ứng với database.
4. Trong DevTools → Network, xác nhận request backend đi tới `localhost:8080`,
   không còn IP server cũ.
5. Kiểm tra trang chủ, hồ sơ và trang quản lý phù hợp với quyền.

## 8. Các tích hợp cần cấu hình riêng

| Chức năng | Yêu cầu |
| --- | --- |
| Upload ảnh | Thông tin Cloudinary hợp lệ trong backend |
| Gửi email/chào mừng/quên mật khẩu | SMTP hợp lệ trong `spring.mail` |
| Thanh toán VNPay | Thông tin sandbox và callback phù hợp |
| Bản đồ | Khóa API và kết nối dịch vụ bản đồ |
| Chatbot | Dịch vụ riêng tại `http://localhost:3000/api/chat` |
| Phân tích cảm xúc đánh giá | Dịch vụ Python tại `http://localhost:5000` |
| Tóm tắt đánh giá/văn bản | FastAPI/BARTpho trong `ai-service/`, mặc định `http://localhost:8000` |

Dịch vụ tóm tắt BARTpho có source trong `ai-service/`; xem [cách chạy AI](docs/development.md#4-chạy-ai-khi-cần-tóm-tắt).
Dịch vụ này có hợp đồng riêng với chatbot cổng `3000` và phân tích cảm xúc cổng `5000`;
không dùng thay thế trực tiếp các dịch vụ đó. Chat giữa các user dùng WebSocket của backend Spring Boot.

Nếu kiểm tra VNPay trên local, sửa trong `application.yml`:

```yaml
vnpay:
  returnUrl: http://localhost:8080/api/payment/vnpay-return
```

Sửa giá trị trong nhóm `vnpay` hiện có, đồng thời kiểm tra điều kiện callback của
môi trường VNPay bạn sử dụng.

## 9. Lệnh kiểm tra và build

### Backend

Chạy từ `airbnb_service/`:

```bash
mvn -Dtest=InvalidTokenRepositoryTest,AuthenticationServiceTest,UserServiceHostApplicationTest test
mvn clean package
```

Nhóm unit test đầu không cần MySQL/Redis đang chạy. `mvn clean package` chạy cả test
context, nên cần môi trường database/cấu hình đầy đủ. Chưa có hướng dẫn build cả
hệ thống bằng Docker Compose; file Compose hiện tại chỉ chạy Redis.

### Frontend

Chạy từ `frontend/`:

```bash
npm run check:imports
npm run build
npm run preview
npm run lint
```

`preview` phục vụ bản build, thường tại `http://localhost:4173`; dùng địa chỉ terminal
in ra. Ở lần kiểm tra sau refactor, import/build đã đạt. ESLint còn các lỗi/cảnh báo có sẵn, nên `npm run lint` hiện chưa đạt; đây không phải điều kiện
bắt buộc của lệnh `npm run dev`.

## 10. Dừng và chạy lại

- Backend/frontend: nhấn `Ctrl+C` trong terminal tương ứng.
- Dừng MySQL và Redis, giữ lại dữ liệu:

```bash
docker stop restnesst-mysql
docker compose -f compose.redis.yaml stop
```

Lần sau, từ thư mục gốc:

```bash
docker start restnesst-mysql
docker compose -f compose.redis.yaml up -d
```

Sau đó chạy lại backend/frontend như bước 6. Volume giữ dữ liệu MySQL và blacklist
Redis; không dùng `down -v` hoặc xóa volume nếu muốn giữ dữ liệu này.

## 11. Lỗi thường gặp

| Thông báo/triệu chứng | Cách kiểm tra |
| --- | --- |
| Docker daemon không kết nối được | Mở Docker Desktop và đợi engine sẵn sàng |
| `Database is uninitialized and password option is not specified` | Container MySQL mới thiếu `MYSQL_ROOT_PASSWORD`; tạo lại cấu hình container với biến này |
| `container name ... is already in use` | Container đã tồn tại; dùng `docker start`, không chạy lại `docker run` cùng tên |
| `port is already allocated` | Cổng 3306/6379 đang bị dùng; dừng dịch vụ trùng hoặc đổi cổng publish và cập nhật cấu hình tương ứng |
| `Access denied for user` | Sai username/password MySQL; nhớ volume cũ giữ mật khẩu cũ |
| `Unknown database 'johunter11'` | Tạo database như bước 2 hoặc chỉnh JDBC URL đúng database hiện có |
| `Communications link failure` | MySQL chưa sẵn sàng, chưa publish cổng hoặc sai host/port |
| `Unable to connect to Redis` / `Connection refused` | Kiểm tra container Redis, lệnh `ping`, `REDIS_HOST` và `REDIS_PORT` |
| Redis lỗi xác thực | Compose local không đặt mật khẩu; kiểm tra biến `REDIS_PASSWORD` còn sót trong môi trường |
| Backend khởi động nhưng tìm kiếm/ảnh/chat lỗi | Kiểm tra URL server cũ trong frontend theo bước 5 |
| `/` trên backend trả 401/404 | Địa chỉ giao diện là cổng Vite 5173; backend không cung cấp trang React tại cổng 8080 |
| Login sai dù dùng tài khoản mẫu | User đã có trong database sẽ không được đặt lại mật khẩu khi backend khởi động |
| API báo 401 sau khi chuyển database | Xóa phiên đăng nhập cũ trong trình duyệt rồi đăng nhập lại |

## Cấu trúc và tài liệu

- [Kiến trúc toàn hệ thống](docs/architecture.md)
- [Database, quan hệ dữ liệu và seed](docs/database.md)
- [Môi trường và quy trình phát triển](docs/development.md)

```text
RestNesst/
├── airbnb_service/       # Backend Java/Spring Boot
├── frontend/             # Frontend React/Vite
├── ai-service/           # FastAPI/BARTpho tóm tắt tiếng Việt
├── tools/database-toolbox/ # MCP MySQL dev
├── docs/                 # Kiến trúc, database, phát triển
├── compose.redis.yaml    # Redis cho local
└── README.md             # Hướng dẫn chạy toàn hệ thống
```

- [Chi tiết backend, Redis và chuyển dữ liệu MongoDB cũ](airbnb_service/README.md)
- [Hướng dẫn frontend](frontend/README.md)
- [Kiến trúc và đối chiếu cấu trúc frontend](frontend/docs/architecture.md)

Nếu nâng cấp từ bản cũ đang có dữ liệu MongoDB, đọc phần chuyển blacklist và yêu cầu
làm host trong tài liệu backend trước khi bỏ dữ liệu cũ.
