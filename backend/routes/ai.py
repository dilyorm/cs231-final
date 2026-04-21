from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from services import nvidia
import auth as a

router = APIRouter(prefix="/ai", tags=["ai"])


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


@router.post("/evaluate")
def evaluate(body: EvaluateRequest):
    if not body.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")
    try:
        return nvidia.evaluate_answer(body.question, body.answer, body.topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dynamic-followups")
def dynamic_followups(body: DynamicFollowupsRequest):
    if not body.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")
    try:
        followups = nvidia.generate_dynamic_followups(body.question, body.answer, body.topic)
        return {"followups": followups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hint")
def hint(body: HintRequest):
    try:
        return {"hint": nvidia.get_hint(body.question, body.topic)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-question")
def generate_question(body: GenerateRequest, current: dict = Depends(a.require_contributor)):
    try:
        return nvidia.generate_question(body.topic_number, body.topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate-question")
def validate_question(body: ValidateQuestionRequest, current: dict = Depends(a.require_contributor)):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        return nvidia.validate_question(body.topic, body.question, body.followups, body.code_challenge)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
