import base64
import json
import os
from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from app.config import ALLOWED_UPLOAD_EXTENSIONS, DEVICE, MODEL_PATH
from app.preprocessing import extract_text_from_bytes
from app.schemas import HealthResponse, SummarizeResponse, SummarizeTextRequest
from app.summarizer import summarizer_service

router = APIRouter()


@router.get("/")
async def root():
    return {
        "message": "RestNesst Vietnamese Review & Text Summarization API",
        "version": "2.0.0",
        "endpoints": {
            "POST /api/summarize-text": "Tóm tắt văn bản / bình luận đánh giá trực tiếp qua JSON",
            "POST /api/summarize": "Tóm tắt văn bản từ file (.txt, .docx, .pdf)",
            "WS /ws/summarize-text": "WebSocket tóm tắt văn bản trực tiếp",
            "WS /ws/summarize": "WebSocket tóm tắt văn bản từ file",
            "GET /health": "Kiểm tra trạng thái dịch vụ AI",
        },
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        device=str(DEVICE),
        model_path=str(MODEL_PATH),
        model_loaded=summarizer_service.is_ready(),
    )


@router.post("/api/summarize-text", response_model=SummarizeResponse)
async def summarize_text_endpoint(payload: SummarizeTextRequest):
    """
    Endpoint REST nhận JSON văn bản/bình luận đánh giá và trả về bản tóm tắt tiếng Việt.
    Được gọi từ Spring Boot Backend (airbnb_service) khi người dùng nhấn nút 'Tóm tắt'.
    """
    raw_text = (payload.text or "").strip()
    if not raw_text:
        raise HTTPException(
            status_code=400,
            detail="Nội dung bình luận hoặc văn bản cần tóm tắt không được để trống.",
        )

    try:
        summary_text, summary_points = summarizer_service.summarize_with_details(
            text=raw_text,
            max_input_length=payload.max_input_length,
            max_output_length=payload.max_output_length,
            ratio=payload.ratio,
            min_summary_length=payload.min_summary_length,
        )

        return SummarizeResponse(
            success=True,
            filename=None,
            original_text=raw_text,
            summary=summary_text,
            summary_points=summary_points,
            input_word_count=len(raw_text.split()),
            summary_word_count=len(summary_text.split()),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi trong quá trình tóm tắt văn bản: {str(exc)}",
        ) from exc


@router.post("/api/summarize", response_model=SummarizeResponse)
async def summarize_file_endpoint(file: UploadFile = File(...)):
    """Endpoint tóm tắt văn bản từ file tài liệu (.txt, .docx, .pdf)."""
    filename = file.filename or "uploaded_file.txt"
    file_ext = os.path.splitext(filename)[1].lower()

    if file_ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ định dạng file .txt, .docx và .pdf",
        )

    contents = await file.read()
    text = extract_text_from_bytes(contents, filename)
    if text is None:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể đọc nội dung từ file {filename}",
        )

    cleaned_input = text.strip()
    if not cleaned_input:
        raise HTTPException(
            status_code=400,
            detail="File trống hoặc không có nội dung văn bản",
        )

    try:
        summary_text, summary_points = summarizer_service.summarize_with_details(cleaned_input)
        return SummarizeResponse(
            success=True,
            filename=filename,
            original_text=cleaned_input,
            summary=summary_text,
            summary_points=summary_points,
            input_word_count=len(cleaned_input.split()),
            summary_word_count=len(summary_text.split()),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi tóm tắt file: {str(exc)}",
        ) from exc


@router.websocket("/ws/summarize")
async def websocket_summarize(websocket: WebSocket):
    """WebSocket endpoint để nhận file và gửi kết quả tóm tắt theo thời gian thực."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "file":
                filename = message.get("filename", "unknown.txt")
                file_content_b64 = message.get("content", "")
                file_ext = os.path.splitext(filename)[1].lower()

                if file_ext not in ALLOWED_UPLOAD_EXTENSIONS:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Chỉ hỗ trợ file .txt, .docx và .pdf",
                    })
                    continue

                await websocket.send_json({
                    "type": "status",
                    "message": "Đang đọc file...",
                    "progress": 20,
                })

                try:
                    file_bytes = base64.b64decode(file_content_b64)
                    text = extract_text_from_bytes(file_bytes, filename)
                except Exception as exc:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Lỗi giải mã file: {str(exc)}",
                    })
                    continue

                if not text or not text.strip():
                    await websocket.send_json({
                        "type": "error",
                        "message": "File trống hoặc không thể đọc nội dung",
                    })
                    continue

                await websocket.send_json({
                    "type": "original",
                    "filename": filename,
                    "original_text": text,
                    "progress": 50,
                })

                await websocket.send_json({
                    "type": "status",
                    "message": "Đang tóm tắt văn bản...",
                    "progress": 70,
                })

                summary_text, summary_points = summarizer_service.summarize_with_details(text)

                await websocket.send_json({
                    "type": "result",
                    "success": True,
                    "filename": filename,
                    "original_text": text,
                    "summary": summary_text,
                    "summary_points": summary_points,
                    "progress": 100,
                })

            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": f"Lỗi server: {str(exc)}"})
        except Exception:
            pass


@router.websocket("/ws/summarize-text")
async def websocket_summarize_text(websocket: WebSocket):
    """WebSocket endpoint để tóm tắt văn bản trực tiếp (không cần upload file)."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "summarize":
                text = (message.get("text") or "").strip()
                if not text:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Văn bản trống",
                    })
                    continue

                await websocket.send_json({
                    "type": "status",
                    "message": "Đang tóm tắt văn bản...",
                    "progress": 50,
                })

                summary_text, summary_points = summarizer_service.summarize_with_details(text)

                await websocket.send_json({
                    "type": "result",
                    "success": True,
                    "original_text": text,
                    "summary": summary_text,
                    "summary_points": summary_points,
                    "progress": 100,
                })

            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": f"Lỗi server: {str(exc)}"})
        except Exception:
            pass
