from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
import json
import csv
import io
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


class ImportResult:
    def __init__(self):
        self.added = 0
        self.skipped = 0
        self.errors: List[str] = []


def _import_question(item: dict, created_by: int) -> tuple[bool, str]:
    """Validate and insert one question dict. Returns (success, error_msg)."""
    try:
        topic_number = int(item.get("topic_number", 0))
        topic = str(item.get("topic", "")).strip()
        question = str(item.get("question", "")).strip()
        followups = item.get("followups", [])
        code_challenge = item.get("code_challenge") or None

        if not topic_number or not topic or not question:
            return False, f"Missing required fields in: {str(item)[:80]}"
        if not isinstance(followups, list) or len(followups) == 0:
            return False, f"followups must be non-empty list in: {question[:60]}"

        # Use provided id or auto-generate
        q_id = str(item.get("id", "")).strip() or db.next_id_for_topic(topic_number)
        if db.get_one(q_id):
            q_id = db.next_id_for_topic(topic_number)

        db.create(q_id, {
            "topic_number": topic_number,
            "topic": topic,
            "question": question,
            "followups": [str(f) for f in followups],
            "code_challenge": str(code_challenge) if code_challenge else None,
        }, created_by=created_by, status="approved")
        return True, ""
    except Exception as e:
        return False, str(e)


@router.post("/import", status_code=200)
async def import_questions(
    file: UploadFile = File(...),
    current: dict = Depends(a.require_admin),
):
    """
    Import questions from JSON or CSV file (admin only).

    JSON format: array of question objects, each with:
      topic_number, topic, question, followups (array), code_challenge (optional), id (optional)

    CSV format: columns: topic_number, topic, question, followups (pipe-separated), code_challenge
    """
    content = await file.read()
    filename = (file.filename or "").lower()
    created_by = int(current["sub"])
    added = 0
    skipped = 0
    errors: List[str] = []

    if filename.endswith(".json"):
        try:
            data = json.loads(content.decode("utf-8"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")
        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="JSON must be an array of question objects")
        for i, item in enumerate(data):
            ok, err = _import_question(item, created_by)
            if ok:
                added += 1
            else:
                skipped += 1
                errors.append(f"Row {i+1}: {err}")

    elif filename.endswith(".csv"):
        try:
            text = content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(text))
            for i, row in enumerate(reader):
                followups_raw = row.get("followups", "")
                followups = [f.strip() for f in followups_raw.split("|") if f.strip()]
                item = {
                    "id": row.get("id", "").strip(),
                    "topic_number": row.get("topic_number", ""),
                    "topic": row.get("topic", ""),
                    "question": row.get("question", ""),
                    "followups": followups,
                    "code_challenge": row.get("code_challenge", "") or None,
                }
                ok, err = _import_question(item, created_by)
                if ok:
                    added += 1
                else:
                    skipped += 1
                    errors.append(f"Row {i+2}: {err}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")
    else:
        raise HTTPException(status_code=400, detail="Only .json and .csv files supported")

    return {"added": added, "skipped": skipped, "errors": errors}
