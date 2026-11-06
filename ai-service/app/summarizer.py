from typing import Dict, List, Optional, Tuple
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from app.config import (
    DEFAULT_MAX_INPUT_LENGTH,
    DEFAULT_MAX_OUTPUT_LENGTH,
    DEFAULT_MIN_SUMMARY_LENGTH,
    DEFAULT_SUMMARY_RATIO,
    DEVICE,
    MODEL_PATH,
    SHORT_COMMENT_WORD_THRESHOLD,
)
from app.preprocessing import (
    postprocess_summary,
    postprocess_vietnamese,
    preprocess_text,
    smart_chunk_text_grouped,
    split_into_Bullet_points,
)


class BartPhoSummarizer:
    """Quản lý mô hình BARTpho và cung cấp các phương thức tóm tắt văn bản/bình luận tiếng Việt."""

    def __init__(self, model_path: str = str(MODEL_PATH), device: torch.device = DEVICE):
        self.model_path = str(model_path)
        self.device = device
        self.tokenizer = None
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        print(f"Đang tải mô hình BARTpho từ {self.model_path} trên thiết bị {self.device}...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_path)
        self.model.to(self.device)
        self.model.eval()
        print("Tải mô hình BARTpho hoàn tất!")

    def is_ready(self) -> bool:
        return self.model is not None and self.tokenizer is not None

    def summarize_chunk(
        self,
        text: str,
        max_input_length: int = DEFAULT_MAX_INPUT_LENGTH,
        max_output_length: int = DEFAULT_MAX_OUTPUT_LENGTH,
        min_output_length: int = 12,
        num_beams: int = 4,
        length_penalty: float = 1.0,
        no_repeat_ngram_size: int = 3,
        repetition_penalty: float = 1.2,
        ratio: float = DEFAULT_SUMMARY_RATIO,
    ) -> str:
        """Tóm tắt một đoạn văn bản đơn lẻ bằng BARTpho."""
        text = preprocess_text(text)
        words = text.split()
        if not words:
            return ""

        # Nếu bình luận rất ngắn, chỉ chuẩn hóa câu chữ để giữ trọn vẹn ý nghĩa
        if len(words) < SHORT_COMMENT_WORD_THRESHOLD:
            return postprocess_vietnamese(text)

        inputs = self.tokenizer(
            text,
            max_length=max_input_length,
            truncation=True,
            padding="max_length",
            return_tensors="pt",
        )
        input_ids = inputs["input_ids"].to(self.device)
        attention_mask = inputs["attention_mask"].to(self.device)

        actual_input_len = int((input_ids != self.tokenizer.pad_token_id).sum().item())
        dynamic_max_len = min(max_output_length, max(min_output_length + 12, int(actual_input_len * ratio)))
        dynamic_min_len = min(min_output_length, max(6, int(dynamic_max_len * 0.4)))

        if dynamic_max_len <= dynamic_min_len:
            dynamic_max_len = dynamic_min_len + 15

        with torch.no_grad():
            summary_ids = self.model.generate(
                input_ids=input_ids,
                attention_mask=attention_mask,
                max_length=dynamic_max_len,
                min_length=dynamic_min_len,
                num_beams=num_beams,
                length_penalty=length_penalty,
                no_repeat_ngram_size=no_repeat_ngram_size,
                repetition_penalty=repetition_penalty,
                early_stopping=True,
                do_sample=False,
            )

        summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        cleaned = postprocess_vietnamese(summary)
        return cleaned if cleaned else postprocess_vietnamese(text)

    def summarize_long_text(
        self,
        text: str,
        max_input_length: int = DEFAULT_MAX_INPUT_LENGTH,
        max_output_length: int = DEFAULT_MAX_OUTPUT_LENGTH,
        ratio: float = DEFAULT_SUMMARY_RATIO,
        sentences_per_chunk: int = 4,
        overlap_sentences: int = 1,
        num_beams: int = 4,
        length_penalty: float = 1.0,
        min_summary_length: int = DEFAULT_MIN_SUMMARY_LENGTH,
        verbose: bool = False,
    ) -> str:
        """Tóm tắt văn bản hoặc bình luận đánh giá có độ dài bất kỳ."""
        text = preprocess_text(text)
        words = text.split()
        if not words:
            return ""

        if len(words) < SHORT_COMMENT_WORD_THRESHOLD:
            return postprocess_vietnamese(text)

        input_tokens = self.tokenizer.encode(text, add_special_tokens=False)

        if len(input_tokens) <= max_input_length - 10:
            raw_summary = self.summarize_chunk(
                text,
                max_input_length=max_input_length,
                max_output_length=max_output_length,
                min_output_length=min_summary_length,
                num_beams=num_beams,
                length_penalty=length_penalty,
                ratio=ratio,
            )
            return postprocess_summary(raw_summary)

        chunks = smart_chunk_text_grouped(
            text,
            self.tokenizer,
            max_tokens=max_input_length,
            sentences_per_chunk=sentences_per_chunk,
            overlap_sentences=overlap_sentences,
        )

        chunk_summaries: List[str] = []
        for idx, chunk in enumerate(chunks):
            if len(chunk.split()) < 8:
                continue
            chunk_max_out = max(25, min(100, int(len(chunk.split()) * ratio * 1.3)))
            chunk_min_out = max(10, int(chunk_max_out * 0.4))
            chunk_summary = self.summarize_chunk(
                chunk,
                max_input_length=max_input_length,
                max_output_length=chunk_max_out,
                min_output_length=chunk_min_out,
                num_beams=num_beams,
                length_penalty=length_penalty,
                ratio=ratio,
            )
            if chunk_summary and len(chunk_summary.split()) >= 3:
                chunk_summaries.append(chunk_summary)
                if verbose:
                    print(f"Chunk {idx + 1}/{len(chunks)}: {chunk_summary}")

        combined_summary = " ".join(chunk_summaries)
        combined_tokens = self.tokenizer.encode(combined_summary, add_special_tokens=False)

        if len(combined_tokens) > max_output_length * 1.8 and len(chunk_summaries) > 2:
            combined_summary = self.summarize_chunk(
                combined_summary,
                max_input_length=max_input_length,
                max_output_length=max_output_length,
                min_output_length=min_summary_length,
                num_beams=num_beams + 1,
                length_penalty=length_penalty,
                ratio=0.5,
            )

        final_summary = postprocess_summary(combined_summary)
        return final_summary if final_summary else postprocess_vietnamese(text)

    def summarize_to_bullet_points(
        self,
        text: str,
        max_input_length: int = DEFAULT_MAX_INPUT_LENGTH,
        max_output_length: int = DEFAULT_MAX_OUTPUT_LENGTH,
        ratio: float = DEFAULT_SUMMARY_RATIO,
        sentences_per_chunk: int = 4,
        overlap_sentences: int = 1,
        num_beams: int = 4,
        length_penalty: float = 1.0,
        min_summary_length: int = DEFAULT_MIN_SUMMARY_LENGTH,
        verbose: bool = False,
    ) -> List[str]:
        """Tóm tắt văn bản và trả về danh sách các ý chính."""
        summary_text = self.summarize_long_text(
            text=text,
            max_input_length=max_input_length,
            max_output_length=max_output_length,
            ratio=ratio,
            sentences_per_chunk=sentences_per_chunk,
            overlap_sentences=overlap_sentences,
            num_beams=num_beams,
            length_penalty=length_penalty,
            min_summary_length=min_summary_length,
            verbose=verbose,
        )
        return split_into_Bullet_points(summary_text)

    def summarize_with_details(
        self,
        text: str,
        max_input_length: int = DEFAULT_MAX_INPUT_LENGTH,
        max_output_length: int = DEFAULT_MAX_OUTPUT_LENGTH,
        ratio: float = DEFAULT_SUMMARY_RATIO,
        min_summary_length: int = DEFAULT_MIN_SUMMARY_LENGTH,
    ) -> Tuple[str, List[str]]:
        """Trả về đồng thời đoạn văn tóm tắt và danh sách ý chính trong 1 lần chạy model."""
        summary_text = self.summarize_long_text(
            text=text,
            max_input_length=max_input_length,
            max_output_length=max_output_length,
            ratio=ratio,
            min_summary_length=min_summary_length,
        )
        summary_points = split_into_Bullet_points(summary_text)
        return summary_text, summary_points


# Khởi tạo singleton instance cho toàn bộ ứng dụng
summarizer_service = BartPhoSummarizer()
