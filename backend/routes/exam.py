from fastapi import APIRouter, HTTPException
from models import StartExamRequest, ExamSession
import database as db

router = APIRouter(prefix="/exam", tags=["exam"])


@router.post("/start", response_model=ExamSession)
def start_exam(body: StartExamRequest):
    total = db.stats()["total_questions"]
    if total < 5:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 5 questions in database (have {total}). Run seed_data.py first.",
        )
    questions = db.get_random(5)
    return ExamSession(
        student_name=body.student_name,
        prep_questions=questions[:2],
        direct_questions=questions[2:],
    )


@router.get("/stats")
def get_stats():
    return db.stats()
