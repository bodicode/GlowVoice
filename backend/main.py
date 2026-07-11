# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
import os
import uuid
import asyncio

# pyrefly: ignore [missing-import]
import edge_tts
# pyrefly: ignore [missing-import]
from gtts import gTTS

app = FastAPI(title="GlowVoice TTS API", version="2.0.0")

# Allow CORS for frontend
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")
allowed_origins = [FRONTEND_URL] if FRONTEND_URL != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thư mục lưu file audio tạm
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "audio_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Danh sách giọng đọc tiếng Việt có sẵn
VOICES = {
    "vi-female": {
        "id": "vi-VN-HoaiMyNeural",
        "name": "Hoài My (Nữ)",
        "language": "vi-VN",
        "gender": "Female"
    },
    "vi-male": {
        "id": "vi-VN-NamMinhNeural",
        "name": "Nam Minh (Nam)",
        "language": "vi-VN",
        "gender": "Male"
    },
    "vi-google": {
        "id": "vi-google",
        "name": "Chị Google (Hài hước)",
        "language": "vi-VN",
        "gender": "Female"
    }
}

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "vi-female"
    rate: str = "+0%"      # Tốc độ đọc: -50% đến +100%
    volume: str = "+0%"    # Âm lượng: -50% đến +100%
    pitch: str = "+0Hz"    # Độ cao giọng (Méo giọng): -50Hz đến +50Hz

@app.get("/")
def root():
    return {"message": "GlowVoice API v2.0 - Powered by Edge-TTS. Engine ready."}

@app.get("/api/voices")
def list_voices():
    """Trả về danh sách giọng đọc có sẵn"""
    return {"voices": VOICES}

@app.post("/api/generate-audio")
async def generate_audio(request: TTSRequest):
    """
    Tổng hợp giọng nói từ văn bản sử dụng Edge-TTS.
    Trả về URL để tải file audio.
    """
    # Lấy thông tin giọng đọc
    voice_info = VOICES.get(request.voice_id, VOICES["vi-female"])
    voice_name = voice_info["id"]

    # Tạo tên file duy nhất
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        if request.voice_id == "vi-google":
            # Sử dụng gTTS (Chị Google)
            tts = gTTS(text=request.text, lang='vi', slow=False)
            tts.save(filepath)
        else:
            # Sử dụng Edge-TTS
            communicate = edge_tts.Communicate(
                text=request.text,
                voice=voice_name,
                rate=request.rate,
                volume=request.volume,
                pitch=request.pitch
            )
            await communicate.save(filepath)

        return {
            "status": "success",
            "audio_url": f"/api/audio/{filename}",
            "text_processed": request.text,
            "voice_used": voice_info["name"],
            "char_count": len(request.text)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Lỗi tổng hợp giọng nói: {str(e)}"
        }

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    """Phục vụ file audio đã tổng hợp"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        return {"status": "error", "message": "File not found"}
    return FileResponse(
        filepath,
        media_type="audio/mpeg",
        filename=f"glowvoice_{filename}"
    )

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
