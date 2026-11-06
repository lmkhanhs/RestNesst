from typing import List, Optional
from pydantic import BaseModel, Field


class SummarizeTextRequest(BaseModel):
    text: str = Field(..., description="Nội dung văn bản hoặc bình luận đánh giá cần tóm tắt")
    max_input_length: int = Field(default=512, ge=64, le=1024, description="Độ dài token đầu vào tối đa mỗi đoạn")
    max_output_length: int = Field(default=160, ge=20, le=512, description="Độ dài token đầu ra tối đa")
    ratio: float = Field(default=0.35, ge=0.1, le=0.9, description="Tỷ lệ độ dài bản tóm tắt so với văn bản gốc")
    min_summary_length: int = Field(default=10, ge=5, le=200, description="Độ dài tối thiểu của bản tóm tắt")


class SummarizeResponse(BaseModel):
    success: bool = True
    filename: Optional[str] = None
    original_text: str
    summary: str
    summary_points: List[str] = Field(default_factory=list)
    input_word_count: int = 0
    summary_word_count: int = 0


class HealthResponse(BaseModel):
    status: str
    device: str
    model_path: str
    model_loaded: bool
