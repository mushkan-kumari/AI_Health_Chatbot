# speech_module.py
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
import whisper
from gtts import gTTS
from langdetect import detect

# Router for mounting inside FastAPI
router = APIRouter(prefix="/speech", tags=["Speech"])

# Load Whisper model once
WHISPER_MODEL = whisper.load_model("base")

# Directory for saving audio responses
OUTPUT_DIR = Path("data/audio_outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# 🎤 SPEECH TO TEXT
@router.post("/stt")
async def speech_to_text(file: UploadFile):
    """Converts speech to text using Whisper"""
    temp_path = OUTPUT_DIR / file.filename
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    try:
        result = WHISPER_MODEL.transcribe(str(temp_path))
        text = result["text"].strip()
        lang = result.get("language", "unknown")
        return {"text": text, "language": lang}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        temp_path.unlink(missing_ok=True)


# 🔊 TEXT TO SPEECH
@router.post("/tts")
async def text_to_speech(text: str = Form(...), lang: str = Form("en")):
    """Converts text to speech using gTTS"""
    try:
        # Auto-detect language if not provided
        if not lang or lang == "auto":
            lang = detect(text)
        tts = gTTS(text=text, lang=lang)
        output_file = OUTPUT_DIR / "response.mp3"
        tts.save(output_file)
        return FileResponse(output_file, media_type="audio/mpeg", filename="response.mp3")
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
