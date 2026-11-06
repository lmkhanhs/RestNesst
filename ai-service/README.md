# RestNesst AI Service - Vietnamese Review & Text Summarization

Dịch vụ AI tóm tắt bình luận đánh giá phòng và văn bản tiếng Việt sử dụng mô hình **BARTpho** đã được fine-tune (`best_model_v2/`).

## Cấu trúc thư mục

```text
ai-service/
├── app/
│   ├── __init__.py
│   ├── config.py          # Cấu hình đường dẫn model, thiết bị (CUDA/CPU) và hyperparameters
│   ├── schemas.py         # Pydantic schemas cho Request/Response
│   ├── preprocessing.py   # Tiền xử lý, tách câu, hậu xử lý tiếng Việt và đọc file
│   ├── summarizer.py      # Lớp BartPhoSummarizer quản lý model và suy luận
│   └── routes.py          # Các REST & WebSocket endpoints
├── best_model_v2/         # Trọng số mô hình BARTpho đã fine-tune
├── api.py                 # Entrypoint khởi chạy FastAPI server
├── model_service.py       # Facade tương thích ngược cho các script bên ngoài
└── requirements.txt       # Danh sách thư viện Python
```

## Khởi chạy dịch vụ

```bash
cd ai-service
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

## Danh sách API chính

- **`POST /api/summarize-text`**: Tóm tắt văn bản hoặc bình luận đánh giá trực tiếp qua JSON (được Backend `airbnb_service` gọi).
  - Request:
    ```json
    {
      "text": "Phòng rất sạch sẽ, view biển đẹp, chủ nhà nhiệt tình hỗ trợ nhận phòng sớm...",
      "max_input_length": 512,
      "max_output_length": 160,
      "ratio": 0.35,
      "min_summary_length": 10
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "filename": null,
      "original_text": "...",
      "summary": "...",
      "summary_points": ["..."],
      "input_word_count": 42,
      "summary_word_count": 16
    }
    ```
- **`POST /api/summarize`**: Tóm tắt tài liệu upload (`.txt`, `.docx`, `.pdf`).
- **`GET /health`**: Kiểm tra trạng thái hoạt động của model và thiết bị chạy.
