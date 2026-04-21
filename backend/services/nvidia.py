"""NVIDIA NIM client — OpenAI-compatible API."""
import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        key = os.getenv("NVIDIA_API_KEY")
        base = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
        if not key:
            raise RuntimeError("NVIDIA_API_KEY not set in .env")
        _client = OpenAI(api_key=key, base_url=base)
    return _client


def MODEL() -> str:
    return os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")


def chat(system: str, user: str, max_tokens: int = 700) -> str:
    client = get_client()
    resp = client.chat.completions.create(
        model=MODEL(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        temperature=0.6,
    )
    return resp.choices[0].message.content.strip()


def _extract_json(raw: str) -> dict | list:
    # Try object first (most responses are objects), then array
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        s = raw.find(start_char)
        e = raw.rfind(end_char) + 1
        if s != -1 and e > 0:
            try:
                return json.loads(raw[s:e])
            except json.JSONDecodeError:
                continue
    raise ValueError(f"No valid JSON found in: {raw[:200]}")


# ── Prompts ──────────────────────────────────────────────────────────────────

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
    """Evaluate all answers for one question block and return single score."""
    lines = [f"Topic: {topic}", "", f"Main Question: {main_question}", f"Main Answer: {main_answer}"]
    for i, (fq, fa) in enumerate(zip(followups, followup_answers)):
        lines.append(f"\nFollow-up {i+1}: {fq}")
        lines.append(f"Answer: {fa if fa else '(no answer given)'}")
    prompt = "\n".join(lines)
    raw = chat(FULL_EVAL_SYSTEM, prompt, max_tokens=800)
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
    prompt = f"Topic: {topic}\nQuestion: {question}"
    return chat(HINT_SYSTEM, prompt, max_tokens=180)


def generate_question(topic_number: int, topic: str) -> dict:
    prompt = f"Topic number: {topic_number}\nTopic: {topic}\nGenerate a challenging exam question."
    raw = chat(GENERATE_SYSTEM, prompt, max_tokens=500)
    return _extract_json(raw)


def validate_question(topic: str, question: str, followups: list[str], code_challenge: str | None) -> dict:
    followups_text = "\n".join(f"  - {f}" for f in followups)
    prompt = f"Topic: {topic}\n\nQuestion: {question}\n\nFollow-ups:\n{followups_text}\n\nCode challenge: {code_challenge or 'None'}"
    raw = chat(VALIDATE_SYSTEM, prompt, max_tokens=400)
    return _extract_json(raw)
