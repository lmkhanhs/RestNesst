# Phát triển và chạy local

[Kiến trúc](architecture.md) · [Database](database.md) · [README toàn hệ thống](../README.md)

## Môi trường cần có

- Docker Desktop/Engine và Docker Compose cho MySQL, Redis.
- JDK 17 và Maven đã cài. Wrapper trong repo đang thiếu `.mvn`, dùng `mvn`.
- Node.js/npm tương thích Vite 5; README ghi nhận môi trường Node.js 22/npm 10 đã dùng trước đây.
- Python và môi trường ảo riêng nếu chạy AI. PyTorch/model cần dung lượng ổ đĩa và RAM phù hợp; không mặc định máy có GPU.

Từ repo gốc:

```bash
docker version
docker compose version
java -version
mvn -v
node -v
npm -v
```

Đối chiếu cả JDK mà `mvn -v` sử dụng. Các lệnh bên dưới dành cho Bash/Linux; mỗi terminal bắt đầu từ thư mục gốc repo trừ khi ghi khác.

## 1. Chạy database

Kiểm tra trước khi tạo container mới:

```bash
docker ps -a
```

Nếu đã có container MySQL của dự án:

```bash
docker start restnesst-mysql
docker logs --tail 80 restnesst-mysql
```

Đợi `ready for connections`. Nếu chưa có container, xem [hướng dẫn cài MySQL lần đầu](../README.md#2-tải-image-và-chạy-mysql). Giữ đúng volume/bind mount đã chứa dữ liệu; không tạo database trống thay thế khi container cũ lỗi. Không đặt mật khẩu thật trong file được Git theo dõi hoặc đối số lệnh lưu vào lịch sử shell; cấp secret qua môi trường/cấu hình local được bảo vệ.

Redis dùng Compose tại repo gốc:

```bash
docker compose -f compose.redis.yaml up -d
docker compose -f compose.redis.yaml exec redis redis-cli ping
```

Kết quả mong đợi là `PONG`. Compose hiện publish `127.0.0.1:6379`, không đặt mật khẩu, lưu AOF trong named volume. Container Redis từng tạo thủ công có thể khác cấu hình Compose; kiểm tra xung đột cổng trước khi chạy thêm.

## 2. Cấu hình local

| Thành phần | Cấu hình | Giá trị local / lưu ý |
| --- | --- | --- |
| Backend MySQL | `spring.datasource.url` | `jdbc:mysql://localhost:3306/johunter11` |
| Backend MySQL | `spring.datasource.username`, `spring.datasource.password` | Phải khớp MySQL; cấp qua môi trường local, không commit bí mật |
| Backend Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Mặc định `localhost`, `6379`, rỗng |
| Frontend | `VITE_BACKEND_URL` | `http://localhost:8080` |
| Backend gọi AI | `ai.service.url` | Mặc định `http://localhost:8000`; có thể override qua `AI_SERVICE_URL` |
| AI | `AI_MODEL_PATH` | Mặc định thư mục `ai-service/best_model_v2/` |

Spring Boot cho phép override datasource qua `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`. Không cần thêm khóa trùng vào [application.yml](../airbnb_service/src/main/resources/application.yml). Spring Boot không tự đọc `.env` như Vite; các biến backend phải có trong môi trường của tiến trình Maven/Java hoặc cấu hình launch local.

Ví dụ cấp mật khẩu backend cho terminal Bash mà không hiển thị hoặc ghi vào lịch sử:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/johunter11
read -r -p 'MySQL user: ' SPRING_DATASOURCE_USERNAME
export SPRING_DATASOURCE_USERNAME
read -r -s -p 'MySQL password: ' SPRING_DATASOURCE_PASSWORD
export SPRING_DATASOURCE_PASSWORD
printf '\n'
```

Dùng tài khoản runtime có quyền phù hợp với schema; không dùng `codex_dev` cho Hibernate `ddl-auto=update`. Các biến trên chỉ áp dụng cho terminal hiện tại và tiến trình con.

Với frontend, tạo `frontend/.env.local` bị Git bỏ qua:

```dotenv
VITE_BACKEND_URL=http://localhost:8080
```

Biến `VITE_*` được đưa vào mã chạy trên trình duyệt; chỉ đặt cấu hình công khai, không đặt mật khẩu hoặc khóa bí mật. Khởi động lại Vite sau khi sửa env.

Nếu backend cũng chạy trong container thì `localhost` là container đó; cần network và hostname dịch vụ phù hợp. Các lệnh dưới đây dùng backend chạy trên máy host.

## 3. Chạy backend và frontend

Terminal backend:

```bash
cd airbnb_service
mvn spring-boot:run
```

Đợi `Started AirbnbServiceApplication`; backend mặc định cổng 8080. Chạy từ module để đường dẫn upload tương đối đúng. Backend khởi động có thể cập nhật schema và tạo dữ liệu nền: xem [database.md](database.md) trước khi dùng database khác.

Terminal frontend, lần đầu hoặc sau khi lockfile thay đổi:

```bash
cd frontend
npm ci
npm run dev
```

Những lần sau chỉ cần `npm run dev` từ `frontend/` nếu dependency đã cài. Mở `http://localhost:5173`, hoặc địa chỉ Vite in ra nếu cổng đã bận. Source frontend nằm trong `frontend/`, không dùng tên cũ `web-ReactJs/`.

## 4. Chạy AI khi cần tóm tắt

Từ terminal riêng:

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

Chỉ tạo môi trường/cài dependency khi chưa có hoặc requirements thay đổi. Cần trọng số và tokenizer tương thích trong `best_model_v2/`, hoặc đặt `AI_MODEL_PATH` tới model đã có. Không tự tải model lớn hay chạy notebook huấn luyện chỉ để khởi động API.

Kiểm tra sau khi service khởi động:

```bash
curl --fail http://127.0.0.1:8000/health
```

Backend gọi AI qua `AiSummarizeService`. `/health` phản ánh khả năng tải model/dịch vụ; cần request thực tế để đánh giá kết quả tóm tắt. Xem [AI README](../ai-service/README.md) cho request/response.

## 5. Kiểm tra theo phạm vi thay đổi

| Phần sửa | Thư mục chạy | Lệnh / cách kiểm tra |
| --- | --- | --- |
| Backend unit test auth/host | `airbnb_service/` | `mvn -Dtest=InvalidTokenRepositoryTest,AuthenticationServiceTest,UserServiceHostApplicationTest test` |
| Backend cấu trúc package | `airbnb_service/` | `mvn -Dtest=BackendPackageDiscoveryTest test` — kiểm tra discovery của component, MapStruct, JPA và custom repository, không kết nối DB |
| Backend đầy đủ | `airbnb_service/` | `mvn clean package` — gồm test, context test cần dịch vụ/cấu hình |
| Backend khi được yêu cầu bỏ test | `airbnb_service/` | `mvn -DskipTests clean package` — không thực thi test, vẫn có thể biên dịch test |
| Frontend | `frontend/` | `npm run check:imports`, `npm run build`, `npm run lint` |
| Xem frontend production | `frontend/` | `npm run preview` sau build; mở địa chỉ terminal thông báo |
| Python, kiểm tra cú pháp | `ai-service/` | `python3 -m compileall -q api.py model_service.py app` |
| Tài liệu | Repo gốc | Kiểm tra đường dẫn/lệnh và `git diff --check` |

Frontend chưa có script test chuẩn; lint có thể có lỗi nền, cần báo riêng lỗi mới và lỗi có sẵn. AI cũng chưa khai báo test command chuẩn. Không coi compile/build là xác nhận đã chạy luồng tích hợp.

Với UI, kiểm tra phần bị ảnh hưởng ở mobile/tablet/desktop, console/network, ảnh, bàn phím và trạng thái loading/error. Với booking, payment hoặc auth, kiểm tra thêm phân quyền, trạng thái và nhánh lỗi. Nếu yêu cầu bỏ test, giữ nguyên file test và không chạy test trong lượt đó.

## 6. Làm việc với dữ liệu và Codex

Đọc [AGENTS.md gốc](../AGENTS.md) và hướng dẫn module trước khi sửa code. Khi `.codegraph/` tồn tại, dùng CodeGraph để hiểu source/đường gọi; không tự khởi tạo index nếu chưa có.

Kiểm tra MySQL dev chỉ đọc, từ repo gốc:

```bash
python3 tools/database-toolbox/check_connection.py
```

MCP Toolbox dùng tài khoản riêng `codex_dev`; cài đặt/credential local theo [Toolbox README](../tools/database-toolbox/README.md). Không dùng tài khoản root/backend thay thế khi công cụ kết nối lỗi.

Seed phải preview rồi chờ xác nhận trước apply. Xem [danh sách seed và quy tắc dữ liệu](database.md). Không dùng thao tác ghi hoặc khởi động Spring như một phép kiểm tra chỉ đọc.

## 7. Dừng và xử lý lỗi

Dừng backend/frontend/AI bằng `Ctrl+C` tại từng terminal. Dừng database và giữ dữ liệu:

```bash
docker stop restnesst-mysql
docker compose -f compose.redis.yaml stop
```

| Triệu chứng | Kiểm tra |
| --- | --- |
| Docker không kết nối | Docker Desktop/Engine, Docker context đang dùng |
| MySQL `Access denied` | Credential runtime phải khớp database cũ; env khởi tạo container không reset mật khẩu volume cũ |
| `Unknown database` | Kiểm tra `johunter11` tồn tại và JDBC URL; không tự tạo database thay thế khi đang tìm dữ liệu cũ |
| MySQL restart liên tục | Đọc log, kiểm tra mount/quyền; giữ nguyên dữ liệu, không xóa volume hoặc chạy sửa quyền hàng loạt |
| Redis `Connection refused` | Container, cổng publish, `REDIS_HOST`/`REDIS_PORT`; thử `ping` |
| Redis lỗi xác thực | Compose local không có password; kiểm tra `REDIS_PASSWORD` trong môi trường |
| Frontend lỗi request/ảnh/chat | Kiểm tra `VITE_BACKEND_URL`, địa chỉ request thực tế và khởi động lại Vite |
| AI không khởi động | Dependency, đường dẫn model/tokenizer, CPU/CUDA và bộ nhớ |
| Tóm tắt trả 503 | FastAPI cổng 8000, model sẵn sàng, `ai.service.url` và log backend |
| Email/upload/VNPay lỗi | Cấu hình SMTP/Cloudinary/VNPay hợp lệ và callback đúng môi trường |

Không dùng `down -v`, xóa database, xóa blacklist hoặc trọng số model để giải quyết lỗi môi trường. Trạng thái chạy, số bản ghi và kết quả build cần được kiểm tra lại mỗi lần; tài liệu này mô tả quy trình, không xác nhận hệ thống đang hoạt động.
