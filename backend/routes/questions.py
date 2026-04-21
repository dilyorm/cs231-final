from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import database as db
import auth as a
from models import Question, QuestionCreate, QuestionUpdate

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/", response_model=List[Question])
def list_questions(current: dict = Depends(a.get_current_user)):
    role = current["role"]
    if role == "admin":
        return db.get_all()
    elif role == "contributor":
        # Own questions (all statuses) + all approved questions
        own = db.get_all(created_by=int(current["sub"]))
        approved = db.get_all(status_filter="approved")
        seen = {q["id"] for q in own}
        return own + [q for q in approved if q["id"] not in seen]
    else:
        # Viewer: only approved
        return db.get_all(status_filter="approved")


@router.get("/{q_id}", response_model=Question)
def get_question(q_id: str, current: dict = Depends(a.get_current_user)):
    q = db.get_one(q_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    role = current["role"]
    if role == "viewer" and q.get("status") != "approved":
        raise HTTPException(status_code=403, detail="Not available")
    if role == "contributor" and q.get("status") != "approved" and q.get("created_by") != int(current["sub"]):
        raise HTTPException(status_code=403, detail="Not available")
    return q


@router.post("/", response_model=Question, status_code=201)
def create_question(body: QuestionCreate, current: dict = Depends(a.require_contributor)):
    q_id = db.next_id_for_topic(body.topic_number)
    created_by = int(current["sub"])
    # Admin questions go straight to approved; contributor questions need AI review (frontend handles pre-validation)
    status = "approved" if current["role"] == "admin" else "pending"
    return db.create(q_id, body.model_dump(), created_by=created_by, status=status)


@router.put("/{q_id}", response_model=Question)
def update_question(q_id: str, body: QuestionUpdate, current: dict = Depends(a.require_contributor)):
    q = db.get_one(q_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    role = current["role"]
    if role == "contributor" and q.get("created_by") != int(current["sub"]):
        raise HTTPException(status_code=403, detail="Can only edit your own questions")
    status = "approved" if role == "admin" else "pending"
    return db.update(q_id, body.model_dump(), status=status)


@router.patch("/{q_id}/approve", response_model=Question)
def approve_question(q_id: str, current: dict = Depends(a.require_admin)):
    q = db.get_one(q_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return db.update_status(q_id, "approved")


@router.patch("/{q_id}/reject", response_model=Question)
def reject_question(q_id: str, current: dict = Depends(a.require_admin)):
    q = db.get_one(q_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return db.update_status(q_id, "rejected")


@router.delete("/{q_id}", status_code=204)
def delete_question(q_id: str, current: dict = Depends(a.require_contributor)):
    q = db.get_one(q_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    role = current["role"]
    if role == "contributor" and q.get("created_by") != int(current["sub"]):
        raise HTTPException(status_code=403, detail="Can only delete your own questions")
    db.delete(q_id)
