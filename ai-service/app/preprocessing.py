import io
import os
import re
from typing import List, Optional
from docx import Document
import PyPDF2


def clean_text_advanced(text: str) -> str:
    """Làm sạch văn bản nâng cao, giữ nguyên dấu tiếng Việt và câu chữ tự nhiên."""
    if not text:
        return ""
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    text = re.sub(r'[""\'\'„"«»]', '"', text)
    text = re.sub(r'[–—―]', '-', text)
    text = re.sub(r'…', '...', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    text = re.sub(r'([.,!?;:])([^\s\d])', r'\1 \2', text)
    return text.strip()


def preprocess_text(text: str) -> str:
    """Làm sạch văn bản đầu vào trước khi đưa vào mô hình."""
    text = clean_text_advanced(text)
    if text and text[-1] not in '.!?':
        text += '.'
    return text


def postprocess_vietnamese(text: str) -> str:
    """Hậu xử lý văn bản tiếng Việt để câu chữ tự nhiên, đúng chính tả hơn."""
    if not text:
        return ""

    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    text = re.sub(r'([.,!?;:])([^\s])', r'\1 \2', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s*\.\s*\.', '.', text)

    sentences = re.split(r'([.!?]+)', text)
    result = []
    for i in range(0, len(sentences) - 1, 2):
        sentence = sentences[i].strip()
        punct = sentences[i + 1] if i + 1 < len(sentences) else '.'
        if sentence:
            sentence = sentence[0].upper() + sentence[1:] if len(sentence) > 1 else sentence.upper()
            result.append(sentence + punct)

    if len(sentences) % 2 == 1 and sentences[-1].strip():
        last = sentences[-1].strip()
        last = last[0].upper() + last[1:] if len(last) > 1 else last.upper()
        if last[-1] not in '.!?':
            last += '.'
        result.append(last)

    text = ' '.join(result)
    text = re.sub(r'[,;:]\s*\.', '.', text)
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text, flags=re.IGNORECASE)

    return text.strip()


def postprocess_summary(summary: str, min_words_per_sentence: int = 2) -> str:
    """Làm sạch bản tóm tắt, loại bỏ câu trùng lặp nhưng vẫn giữ được các câu bình luận ngắn."""
    summary = postprocess_vietnamese(summary)
    if not summary:
        return ""

    sentences = [s.strip() for s in re.split(r'[.!?]+', summary) if s.strip()]
    unique_sentences: List[str] = []
    seen: set = set()

    for sentence in sentences:
        if len(sentence.split()) < min_words_per_sentence:
            continue

        normalized = re.sub(r'[^\w\s]', '', sentence.lower())
        normalized = ' '.join(normalized.split())

        is_duplicate = False
        for seen_sent in seen:
            words1 = set(normalized.split())
            words2 = set(seen_sent.split())
            if len(words1) > 0 and len(words2) > 0:
                overlap = len(words1 & words2) / max(len(words1), len(words2))
                if overlap > 0.75:
                    is_duplicate = True
                    break

        if not is_duplicate and len(normalized) > 3:
            seen.add(normalized)
            if not sentence[0].isupper():
                sentence = sentence[0].upper() + sentence[1:]
            unique_sentences.append(sentence)

    if not unique_sentences:
        return summary

    result = '. '.join(unique_sentences)
    if result and result[-1] not in '.!?':
        result += '.'
    return result


def split_into_Bullet_points(text: str) -> List[str]:
    """Tách đoạn văn tóm tắt thành danh sách các ý chính (bullet points)."""
    if not text or not text.strip():
        return []
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


def smart_chunk_text_grouped(
    text: str,
    tokenizer,
    max_tokens: int = 512,
    sentences_per_chunk: int = 4,
    overlap_sentences: int = 1,
) -> List[str]:
    """Chia văn bản dài thành các đoạn theo nhóm câu để giữ ngữ cảnh cho BARTpho."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.split()) >= 2]

    if not sentences:
        return [text] if text.strip() else []

    if len(sentences) <= sentences_per_chunk:
        combined = ' '.join(sentences)
        tokens = tokenizer.encode(combined, add_special_tokens=False)
        if len(tokens) <= max_tokens - 10:
            return [combined]

    chunks: List[str] = []
    i = 0
    while i < len(sentences):
        chunk_sentences: List[str] = []
        current_tokens = 0
        j = i
        while j < len(sentences) and len(chunk_sentences) < sentences_per_chunk:
            sentence = sentences[j]
            sent_tokens = len(tokenizer.encode(sentence, add_special_tokens=False))

            if sent_tokens > max_tokens - 20:
                if chunk_sentences:
                    break
                sub_parts = re.split(r'[,;]\s+', sentence)
                sub_chunk: List[str] = []
                sub_tokens = 0
                for part in sub_parts:
                    part_tokens = len(tokenizer.encode(part, add_special_tokens=False))
                    if sub_tokens + part_tokens <= max_tokens - 20:
                        sub_chunk.append(part)
                        sub_tokens += part_tokens
                    else:
                        if sub_chunk:
                            chunks.append(', '.join(sub_chunk) + '.')
                        sub_chunk = [part]
                        sub_tokens = part_tokens
                if sub_chunk:
                    chunks.append(', '.join(sub_chunk) + '.')
                j += 1
                break

            if current_tokens + sent_tokens <= max_tokens - 10:
                chunk_sentences.append(sentence)
                current_tokens += sent_tokens
                j += 1
            else:
                break

        if chunk_sentences:
            chunks.append(' '.join(chunk_sentences))

        if j > i:
            step = max(1, j - i - overlap_sentences)
            i += step
        else:
            i += 1

    return chunks if chunks else [text]


def extract_text_from_bytes(contents: bytes, filename: str) -> Optional[str]:
    """Trích xuất văn bản từ dữ liệu file upload (.txt, .docx, .pdf)."""
    file_ext = os.path.splitext(filename)[1].lower()

    if file_ext == ".txt":
        for encoding in ("utf-8", "utf-16", "cp1252", "latin-1"):
            try:
                return contents.decode(encoding)
            except UnicodeDecodeError:
                continue
        return None

    if file_ext == ".docx":
        doc = Document(io.BytesIO(contents))
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    paragraphs.append(" | ".join(row_text))
        return "\n".join(paragraphs)

    if file_ext == ".pdf":
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text_parts = []
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(page_text)
        return "\n".join(text_parts)

    return None
