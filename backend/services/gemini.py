"""Gemini AI service — text generation + TTS via Google Generative AI API."""
import json
import os
import struct
import base64
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Shared prompts (same as nvidia.py) ──────────────────────────────────────

EVAL_SYSTEM = """You are a strict but fair Computer Architecture oral exam evaluator at a university.
Score the student's answer out of 100. Be honest and precise.

Respond ONLY in this exact JSON (no text before or after):
{
  "score": <integer 0-100>,
  "grade": "<A+ (95-100) | A (85-94) | B (70-84) | C (55-69) | D (40-54) | F (below 40)>",
  "strengths": "<specific correct concepts the student demonstrated>",
  "gaps": "<specific concepts missing, shallow, or incorrect — or 'None' if perfect>",
  "model_answer": "<3-4 sentence comprehensive ideal answer covering all key points>",
  "improvement_tips": "<2-3 concrete, actionable tips the student should do to give a better answer next time>"
}"""

FULL_EVAL_SYSTEM = """You are a strict Computer Architecture oral exam evaluator.
The student answered a main question AND its follow-up questions. Evaluate the COMPLETE performance.

Respond ONLY in this exact JSON (no text before or after):
{
  "overall_score": <integer 0-100>,
  "grade": "<A+ | A | B | C | D | F>",
  "items": [
    {"label": "<Main Question | Follow-up 1 | Follow-up 2 | ...>", "score": <0-100>, "feedback": "<1 sentence specific feedback>"}
  ],
  "strengths": "<key correct concepts demonstrated across all answers>",
  "gaps": "<key concepts missing or wrong across all answers, or 'None'>",
  "model_answer": "<ideal comprehensive answer to the main question in 3-4 sentences>",
  "improvement_tips": "<2-3 actionable tips for improvement>"
}

Scoring: overall_score = weighted average (main question = 40%, each followup = split remaining 60%)."""

DYNAMIC_FOLLOWUPS_SYSTEM = """You are a Computer Architecture oral examiner.
Generate exactly 3 targeted follow-up questions based on the student's answer.
Return ONLY a JSON array of 3 strings:
["question 1?", "question 2?", "question 3?"]"""

HINT_SYSTEM = """You are a Computer Architecture tutor giving a Socratic hint.
Give 1-2 sentences that guide the student toward the answer without revealing it.
Return only the hint text, no preamble."""

GENERATE_SYSTEM = """You are a Computer Architecture professor creating challenging exam questions.
Respond ONLY in this exact JSON:
{
  "question": "<challenging exam question>",
  "followups": ["<followup 1>", "<followup 2>", "<followup 3>"],
  "code_challenge": "<NASM/C task or null>"
}"""

VALIDATE_SYSTEM = """You are a quality reviewer for a CS231 Computer Architecture exam question bank.
Evaluate whether the question is: relevant to Computer Architecture, factually accurate, clear, and educational.

Respond ONLY in this exact JSON:
{
  "approved": <true or false>,
  "reason": "<1-2 sentences>",
  "issues": "<specific problems or 'None'>",
  "suggestions": "<how to improve or 'None'>"
}"""

# ── Gemini text client ───────────────────────────────────────────────────────

def _gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not set in .env")
    return key


def _extract_json(raw: str) -> dict | list:
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        s = raw.find(start_char)
        e = raw.rfind(end_char) + 1
        if s != -1 and e > 0:
            try:
                return json.loads(raw[s:e])
            except json.JSONDecodeError:
                continue
    raise ValueError(f"No valid JSON found in: {raw[:200]}")


def chat(system: str, user: str, max_tokens: int = 700) -> str:
    """Call Gemini 2.5 Flash for text generation."""
    api_key = _gemini_api_key()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.6,
        },
    }

    with httpx.Client(timeout=60) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


# ── TTS ──────────────────────────────────────────────────────────────────────

VOICES = ["Kore", "Aoede", "Charon", "Fenrir", "Puck"]


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, bits: int = 16) -> bytes:
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + len(pcm_data),
        b"WAVE", b"fmt ", 16,
        1, channels, sample_rate,
        sample_rate * channels * bits // 8,
        channels * bits // 8, bits,
        b"data", len(pcm_data),
    )
    return header + pcm_data


def tts(text: str, voice: str = "Kore") -> bytes:
    """Generate speech audio. Returns WAV bytes."""
    api_key = _gemini_api_key()
    tts_model = os.getenv("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{tts_model}:generateContent?key={api_key}"

    if voice not in VOICES:
        voice = "Kore"

    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice}
                }
            },
        },
    }

    with httpx.Client(timeout=60) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    inline = data["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm_bytes = base64.b64decode(inline["data"])
    return _pcm_to_wav(pcm_bytes)


# ── AI functions ─────────────────────────────────────────────────────────────

def evaluate_answer(question: str, answer: str, topic: str) -> dict:
    prompt = f"Topic: {topic}\n\nQuestion: {question}\n\nStudent's answer: {answer}"
    raw = chat(EVAL_SYSTEM, prompt, max_tokens=600)
    result = _extract_json(raw)
    result["score"] = max(0, min(100, int(result.get("score", 0))))
    return result


def evaluate_question_full(
    topic: str,
    main_question: str,
    main_answer: str,
    followups: list[str],
    followup_answers: list[str],
) -> dict:
    lines = [f"Topic: {topic}", "", f"Main Question: {main_question}", f"Main Answer: {main_answer}"]
    for i, (fq, fa) in enumerate(zip(followups, followup_answers)):
        lines.append(f"\nFollow-up {i+1}: {fq}")
        lines.append(f"Answer: {fa if fa else '(no answer given)'}")
    raw = chat(FULL_EVAL_SYSTEM, "\n".join(lines), max_tokens=800)
    result = _extract_json(raw)
    result["overall_score"] = max(0, min(100, int(result.get("overall_score", 0))))
    for item in result.get("items", []):
        item["score"] = max(0, min(100, int(item.get("score", 0))))
    return result


def generate_dynamic_followups(question: str, answer: str, topic: str) -> list[str]:
    prompt = f"Topic: {topic}\nOriginal question: {question}\nStudent's answer: {answer}\nGenerate 3 follow-up questions."
    raw = chat(DYNAMIC_FOLLOWUPS_SYSTEM, prompt, max_tokens=300)
    result = _extract_json(raw)
    if isinstance(result, list):
        return [str(q) for q in result[:3]]
    return []


def get_hint(question: str, topic: str) -> str:
    return chat(HINT_SYSTEM, f"Topic: {topic}\nQuestion: {question}", max_tokens=180)


def generate_question(topic_number: int, topic: str) -> dict:
    raw = chat(GENERATE_SYSTEM, f"Topic number: {topic_number}\nTopic: {topic}\nGenerate a challenging exam question.", max_tokens=500)
    return _extract_json(raw)


def validate_question(topic: str, question: str, followups: list[str], code_challenge: str | None) -> dict:
    followups_text = "\n".join(f"  - {f}" for f in followups)
    prompt = f"Topic: {topic}\n\nQuestion: {question}\n\nFollow-ups:\n{followups_text}\n\nCode challenge: {code_challenge or 'None'}"
    raw = chat(VALIDATE_SYSTEM, prompt, max_tokens=400)
    return _extract_json(raw)
