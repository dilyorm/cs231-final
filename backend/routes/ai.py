import base64
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
from services import nvidia
import auth as a

router = APIRouter(prefix="/ai", tags=["ai"])

# Use Gemini if key is configured, else fall back to NVIDIA
def _use_gemini() -> bool:
    return bool(os.getenv("GEMINI_API_KEY", "").strip())

def _ai():
    if _use_gemini():
        from services import gemini
        return gemini
    return nvidia


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    topic: str


class DynamicFollowupsRequest(BaseModel):
    question: str
    answer: str
    topic: str


class HintRequest(BaseModel):
    question: str
    topic: str


class GenerateRequest(BaseModel):
    topic_number: int
    topic: str


class ValidateQuestionRequest(BaseModel):
    topic: str
    question: str
    followups: List[str]
    code_challenge: Optional[str] = None


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "Kore"


@router.post("/evaluate")
def evaluate(body: EvaluateRequest):
    if not body.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")
    try:
        return _ai().evaluate_answer(body.question, body.answer, body.topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dynamic-followups")
def dynamic_followups(body: DynamicFollowupsRequest):
    if not body.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")
    try:
        followups = _ai().generate_dynamic_followups(body.question, body.answer, body.topic)
        return {"followups": followups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hint")
def hint(body: HintRequest):
    try:
        return {"hint": _ai().get_hint(body.question, body.topic)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-question")
def generate_question(body: GenerateRequest, current: dict = Depends(a.require_contributor)):
    try:
        return _ai().generate_question(body.topic_number, body.topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate-question")
def validate_question(body: ValidateQuestionRequest, current: dict = Depends(a.require_contributor)):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        return _ai().validate_question(body.topic, body.question, body.followups, body.code_challenge)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts")
def text_to_speech(body: TTSRequest):
    """Generate speech audio using Gemini TTS. Returns base64-encoded WAV."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if not _use_gemini():
        raise HTTPException(status_code=503, detail="Gemini not configured — set GEMINI_API_KEY in .env")
    try:
        from services import gemini
        wav_bytes = gemini.tts(body.text.strip(), body.voice or "Kore")
        return {
            "audio_base64": base64.b64encode(wav_bytes).decode(),
            "mime_type": "audio/wav",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Transcribe audio using Gemini multimodal STT."""
    if not _use_gemini():
        raise HTTPException(status_code=503, detail="Gemini not configured — set GEMINI_API_KEY in .env")
    try:
        from services import gemini
        audio_bytes = await audio.read()
        mime_type = audio.content_type or "audio/webm"
        transcript = gemini.transcribe(audio_bytes, mime_type)
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
def ai_config():
    """Returns which AI backend is active."""
    return {
        "provider": "gemini" if _use_gemini() else "nvidia",
        "tts_available": _use_gemini(),
    }
