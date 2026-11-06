import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router as summarization_router

app = FastAPI(
    title="RestNesst Vietnamese Review & Text Summarization API",
    description="API tóm tắt bình luận đánh giá và văn bản tiếng Việt sử dụng mô hình BARTpho",
    version="2.0.0",
)

# Cấu hình CORS cho phép Backend Spring Boot và Frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn toàn bộ router từ package app/
app.include_router(summarization_router)


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
