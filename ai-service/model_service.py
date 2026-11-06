"""
Facade tương thích ngược cho `model_service.py`.
Mọi logic xử lý văn bản và mô hình BARTpho đã được module hóa trong package `app/`.
"""

from app.config import DEVICE as device, MODEL_PATH
from app.preprocessing import (
    clean_text_advanced,
    postprocess_summary,
    postprocess_vietnamese,
    preprocess_text,
    smart_chunk_text_grouped,
    split_into_Bullet_points,
)
from app.summarizer import summarizer_service

MODEL_DIR = str(MODEL_PATH)
tokenizer = summarizer_service.tokenizer
model = summarizer_service.model


def summarize_chunk(
    text: str,
    max_input_length: int = 512,
    max_output_length: int = 150,
    min_output_length: int = 20,
    num_beams: int = 4,
    length_penalty: float = 1.0,
    no_repeat_ngram_size: int = 3,
    repetition_penalty: float = 1.2,
    ratio: float = 0.35,
) -> str:
    return summarizer_service.summarize_chunk(
        text=text,
        max_input_length=max_input_length,
        max_output_length=max_output_length,
        min_output_length=min_output_length,
        num_beams=num_beams,
        length_penalty=length_penalty,
        no_repeat_ngram_size=no_repeat_ngram_size,
        repetition_penalty=repetition_penalty,
        ratio=ratio,
    )


def summarize_long_text(
    text: str,
    max_input_length: int = 512,
    max_output_length: int = 200,
    ratio: float = 0.35,
    sentences_per_chunk: int = 4,
    overlap_sentences: int = 1,
    num_beams: int = 4,
    length_penalty: float = 1.0,
    min_summary_length: int = 10,
    verbose: bool = False,
) -> str:
    return summarizer_service.summarize_long_text(
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


def summarize_to_bullet_points(
    text: str,
    max_input_length: int = 512,
    max_output_length: int = 200,
    ratio: float = 0.35,
    sentences_per_chunk: int = 4,
    overlap_sentences: int = 1,
    num_beams: int = 4,
    length_penalty: float = 1.0,
    min_summary_length: int = 10,
    verbose: bool = False,
):
    return summarizer_service.summarize_to_bullet_points(
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


__all__ = [
    "MODEL_DIR",
    "device",
    "tokenizer",
    "model",
    "clean_text_advanced",
    "preprocess_text",
    "postprocess_vietnamese",
    "postprocess_summary",
    "split_into_Bullet_points",
    "smart_chunk_text_grouped",
    "summarize_chunk",
    "summarize_long_text",
    "summarize_to_bullet_points",
]
