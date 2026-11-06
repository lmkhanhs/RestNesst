# Dịch vụ AI FastAPI/BARTpho

Áp dụng trong `ai-service/`; kế thừa [hướng dẫn gốc](../AGENTS.md).

## Cấu trúc và tương thích

- `api.py` ghép FastAPI app; `app/routes.py` xử lý REST/WebSocket; `app/schemas.py` định nghĩa request/response.
- `app/preprocessing.py` xử lý văn bản/file; `app/summarizer.py` quản lý model và inference; `app/config.py` giữ đường dẫn và tham số mặc định.
- `model_service.py` là facade tương thích ngược. Giữ các hàm/export hiện có khi chuyển code vào package `app/`.
- Giữ hợp đồng `/api/summarize-text`, `/api/summarize`, `/health`, `/ws/summarize-text`, `/ws/summarize`, các kiểu message và HTTP status nếu không được yêu cầu đổi.
- Kiểm tra caller Spring Boot/frontend trước khi đổi endpoint, schema hoặc tham số tóm tắt. Dùng Python thụt 4 dấu cách, type hint và Pydantic theo cách sẵn có.

## Model, dữ liệu và tài nguyên

- `AI_MODEL_PATH` có thể chỉ định model; mặc định là `best_model_v2/`. Kiểm tra file thực tế trước khi báo model sẵn sàng.
- Hỗ trợ CPU/CUDA theo cấu hình hiện tại. Không mặc định máy có GPU hoặc tự tải model lớn chỉ để kiểm tra cú pháp.
- Không sửa/xóa dataset, checkpoint, notebook, training log hoặc trọng số để giải quyết lỗi API. Huấn luyện và thay model phải nằm trong yêu cầu cụ thể.
- Không ghi nội dung đánh giá, tài liệu upload hoặc dữ liệu cá nhân vào log/tài liệu mẫu. Phân biệt tóm tắt và phân tích cảm xúc; không tự đổi vai trò dịch vụ.

## Chạy và kiểm tra

Từ `ai-service/`, dùng môi trường Python riêng của module:

```bash
python3 -m pip install -r requirements.txt
python3 -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

- Chỉ cài dependency khi cần chạy dịch vụ, không tự nâng toàn bộ phiên bản.
- Với sửa Python, có thể kiểm tra cú pháp bằng `python3 -m compileall -q api.py model_service.py app` mà không chạy inference.
- Kiểm tra `/health` và request nhỏ khi model/dependency đã có; báo rõ thiếu model, tài nguyên hoặc khả năng kiểm thử. `/health` thành công không tự chứng minh chất lượng tóm tắt.
- Chưa có test command chuẩn được khai báo; không đoán `pytest` hoặc thêm framework ngoài phạm vi. Xem [README](README.md) để chạy luồng thực tế.
