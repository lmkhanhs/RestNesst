import os
from pathlib import Path
import torch

# Đường dẫn thư mục gốc của ai-service
BASE_DIR = Path(__file__).resolve().parent.parent

# Đường dẫn model BARTpho đã fine-tune
DEFAULT_MODEL_PATH = BASE_DIR / "best_model_v2"
MODEL_PATH = Path(os.getenv("AI_MODEL_PATH", str(DEFAULT_MODEL_PATH)))

# Thiết bị chạy inference (CUDA hoặc CPU)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Tham số mặc định khi tóm tắt bình luận / văn bản
DEFAULT_MAX_INPUT_LENGTH = 512
DEFAULT_MAX_OUTPUT_LENGTH = 160
DEFAULT_SUMMARY_RATIO = 0.35
DEFAULT_MIN_SUMMARY_LENGTH = 10

# Ngưỡng số từ tối thiểu để gọi mô hình seq2seq (nếu ngắn hơn sẽ chuẩn hóa trực tiếp)
SHORT_COMMENT_WORD_THRESHOLD = 12

# Định dạng file hỗ trợ khi upload tài liệu
ALLOWED_UPLOAD_EXTENSIONS = {".txt", ".docx", ".pdf"}
