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
    for start_char, end_char in [("[", "]"), ("{", "}")]:
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
}

Scoring guide:
- 90-100: Complete, precise, with depth and examples
- 70-89: Mostly correct, minor gaps
- 50-69: Core idea present but significant gaps
- 30-49: Partial understanding, major errors
- 0-29: Fundamentally wrong or very minimal"""

DYNAMIC_FOLLOWUPS_SYSTEM = """You are a Computer Architecture oral examiner.
The student just answered a question. Generate exactly 3 targeted follow-up questions based on their specific answer.

Rules:
- If answer was good: probe deeper, ask for edge cases or implementation details
- If answer had gaps: target exactly those gaps
- If answer was wrong: guide toward correct concepts
- Make questions progressively harder
- Each question must be a complete sentence ending with ?

Return ONLY a JSON array of 3 strings, no other text:
["question 1?", "question 2?", "question 3?"]"""

HINT_SYSTEM = """You are a Computer Architecture tutor giving a Socratic hint.
Give 1-2 sentences that guide the student toward the answer without revealing it.
Think about what concept they might be missing and nudge them.
Return only the hint text, no preamble."""

GENERATE_SYSTEM = """You are a Computer Architecture professor creating challenging exam questions.
Generate a new exam question for the given topic.
Respond ONLY in this exact JSON (no text before or after):
{
  "question": "<challenging exam question — specific, not vague>",
  "followups": ["<followup 1>", "<followup 2>", "<followup 3>"],
  "code_challenge": "<optional NASM/C/pseudocode task as a string, or null>"
}"""

VALIDATE_SYSTEM = """You are a strict quality reviewer for a CS231 Computer Architecture exam question bank.

Evaluate whether the submitted question meets ALL of these criteria:
1. RELEVANT: Directly related to Computer Architecture topics (binary, assembly, memory, processors, etc.)
2. ACCURATE: Contains no factually incorrect information or misleading statements
3. CLEAR: Question is unambiguous and well-formed
4. EDUCATIONAL: Tests genuine understanding, not trivia

Respond ONLY in this exact JSON (no text before or after):
{
  "approved": <true or false>,
  "reason": "<1-2 sentences explaining the decision>",
  "issues": "<specific problems found, or 'None' if approved>",
  "suggestions": "<how to improve the question, or 'None' if approved>"
}"""


def evaluate_answer(question: str, answer: str, topic: str) -> dict:
    prompt = f"Topic: {topic}\n\nQuestion asked: {question}\n\nStudent's answer: {answer}"
    raw = chat(EVAL_SYSTEM, prompt, max_tokens=600)
    result = _extract_json(raw)
    result["score"] = max(0, min(100, int(result.get("score", 0))))
    return result


def generate_dynamic_followups(question: str, answer: str, topic: str) -> list[str]:
    prompt = (
        f"Topic: {topic}\n"
        f"Original question: {question}\n"
        f"Student's answer: {answer}\n\n"
        "Generate 3 targeted follow-up questions."
    )
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
    followups_text = "\n".join(f"  - {f}" for f in followups) if followups else "  (none)"
    prompt = (
        f"Topic: {topic}\n\n"
        f"Question: {question}\n\n"
        f"Follow-up questions:\n{followups_text}\n\n"
        f"Code challenge: {code_challenge or 'None'}"
    )
    raw = chat(VALIDATE_SYSTEM, prompt, max_tokens=400)
    return _extract_json(raw)
