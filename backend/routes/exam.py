from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import database as db
import auth as a
from services import nvidia

router = APIRouter(prefix="/exam", tags=["exam"])


class StartExamRequest(BaseModel):
    question_count: int = 5  # total questions (2 prep + rest direct)


class SaveAnswerRequest(BaseModel):
    q_index: int
    answer_type: str   # "main" or "followup"
    answer: str
    followup_index: Optional[int] = None


class EvaluateQuestionRequest(BaseModel):
    q_index: int


@router.post("/start")
def start_exam(body: StartExamRequest, current: dict = Depends(a.get_current_user)):
    user_id = int(current["sub"])

    # Abandon any active session
    active = db.get_user_active_session(user_id)
    if active:
        db.abandon_session(active["id"])

    total = db.stats()["total_questions"]
    if total < body.question_count:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {body.question_count} approved questions (have {total}).",
        )

    questions = db.get_random(body.question_count)
    session = db.create_session(user_id, questions)

    prep_count = min(2, body.question_count)
    return {
        "session_id": session["id"],
        "questions": questions,
        "prep_count": prep_count,
        "current_q_index": 0,
        "answers": [],
        "status": "in_progress",
    }


@router.get("/sessions")
def list_sessions(current: dict = Depends(a.get_current_user)):
    sessions = db.list_user_sessions(int(current["sub"]))
    return [
        {
            "id": s["id"],
            "status": s["status"],
            "final_score": s["final_score"],
            "question_count": len(s["questions"]),
            "answers_count": len(s["answers"]),
            "started_at": s["started_at"],
            "completed_at": s.get("completed_at"),
        }
        for s in sessions
    ]


@router.get("/sessions/active")
def get_active_session(current: dict = Depends(a.get_current_user)):
    session = db.get_user_active_session(int(current["sub"]))
    if not session:
        return None
    prep_count = min(2, len(session["questions"]))
    return {
        "session_id": session["id"],
        "questions": session["questions"],
        "prep_count": prep_count,
        "current_q_index": session["current_q_index"],
        "answers": session["answers"],
        "status": session["status"],
    }


@router.get("/sessions/{session_id}")
def get_session(session_id: str, current: dict = Depends(a.get_current_user)):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != int(current["sub"]) and current["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not your session")
    prep_count = min(2, len(session["questions"]))
    return {
        "session_id": session["id"],
        "questions": session["questions"],
        "prep_count": prep_count,
        "current_q_index": session["current_q_index"],
        "answers": session["answers"],
        "status": session["status"],
        "final_score": session.get("final_score"),
        "started_at": session["started_at"],
        "completed_at": session.get("completed_at"),
    }


@router.post("/sessions/{session_id}/save-answer")
def save_answer(session_id: str, body: SaveAnswerRequest, current: dict = Depends(a.get_current_user)):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != int(current["sub"]):
        raise HTTPException(status_code=403, detail="Not your session")
    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Session not in progress")
    if body.answer_type not in ("main", "followup"):
        raise HTTPException(status_code=400, detail="answer_type must be 'main' or 'followup'")

    updated = db.save_session_answer(
        session_id, body.q_index, body.answer_type, body.answer, body.followup_index
    )
    return {"ok": True, "current_q_index": updated["current_q_index"]}


@router.post("/sessions/{session_id}/evaluate")
def evaluate_question(session_id: str, body: EvaluateQuestionRequest, current: dict = Depends(a.get_current_user)):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != int(current["sub"]):
        raise HTTPException(status_code=403, detail="Not your session")
    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Session not in progress")

    q_index = body.q_index
    questions = session["questions"]
    answers = session["answers"]

    if q_index >= len(questions):
        raise HTTPException(status_code=400, detail="Invalid question index")

    q = questions[q_index]
    ans_slot = answers[q_index] if q_index < len(answers) else {}
    main_answer = ans_slot.get("main_answer") or ""
    followup_answers = ans_slot.get("followup_answers") or []
    followups = q.get("followups", [])

    if not main_answer.strip():
        raise HTTPException(status_code=400, detail="Main answer is required before evaluating")

    try:
        evaluation = nvidia.evaluate_question_full(
            topic=q["topic"],
            main_question=q["question"],
            main_answer=main_answer,
            followups=followups,
            followup_answers=followup_answers,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    overall_score = evaluation["overall_score"]
    next_q_index = q_index + 1
    updated = db.save_question_evaluation(session_id, q_index, evaluation, overall_score, next_q_index)

    return {
        "evaluation": evaluation,
        "overall_score": overall_score,
        "current_q_index": updated["current_q_index"],
        "session_done": next_q_index >= len(questions),
    }


@router.post("/sessions/{session_id}/complete")
def complete_session(session_id: str, current: dict = Depends(a.get_current_user)):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != int(current["sub"]):
        raise HTTPException(status_code=403, detail="Not your session")

    completed = db.complete_session(session_id)
    scores = [a["overall_score"] for a in completed["answers"] if a.get("overall_score") is not None]
    avg = sum(scores) / len(scores) if scores else 0

    return {
        "final_score": completed["final_score"],
        "avg_score": avg,
        "question_scores": [
            {"q_index": a["q_index"], "score": a.get("overall_score"), "topic": completed["questions"][a["q_index"]]["topic"]}
            for a in completed["answers"]
        ],
    }


@router.get("/stats")
def get_stats():
    return db.stats()
