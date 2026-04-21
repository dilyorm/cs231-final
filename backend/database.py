import sqlite3
import json
import os
import uuid
from typing import Optional, List

DB_PATH = os.path.join(os.path.dirname(__file__), "exam.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            topic_number INTEGER NOT NULL,
            topic TEXT NOT NULL,
            question TEXT NOT NULL,
            followups TEXT NOT NULL,
            code_challenge TEXT,
            status TEXT NOT NULL DEFAULT 'approved',
            created_by INTEGER REFERENCES users(id),
            ai_feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS exam_sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            status TEXT NOT NULL DEFAULT 'in_progress',
            questions TEXT NOT NULL,
            answers TEXT NOT NULL DEFAULT '[]',
            current_q_index INTEGER NOT NULL DEFAULT 0,
            final_score REAL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        )
    """)
    # Migrate questions table
    for col in [
        "ALTER TABLE questions ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'",
        "ALTER TABLE questions ADD COLUMN created_by INTEGER REFERENCES users(id)",
        "ALTER TABLE questions ADD COLUMN ai_feedback TEXT",
    ]:
        try:
            conn.execute(col)
        except Exception:
            pass
    conn.commit()
    conn.close()


def _row(row) -> dict:
    d = dict(row)
    d["followups"] = json.loads(d["followups"])
    return d


# ── Users ─────────────────────────────────────────────────────────────────

def create_user(username: str, password_hash: str, role: str = "viewer") -> Optional[dict]:
    conn = get_conn()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, password_hash, role),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        return dict(row)
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_username(username: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def list_users() -> List[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT id, username, role, created_at FROM users ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_user_role(user_id: int, role: str) -> Optional[dict]:
    conn = get_conn()
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    conn.commit()
    row = conn.execute("SELECT id, username, role, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_user(user_id: int) -> bool:
    conn = get_conn()
    r = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return r.rowcount > 0


# ── Questions ─────────────────────────────────────────────────────────────

def get_all(status_filter: Optional[str] = None, created_by: Optional[int] = None) -> List[dict]:
    conn = get_conn()
    query = "SELECT * FROM questions"
    params = []
    conditions = []
    if status_filter:
        conditions.append("status = ?")
        params.append(status_filter)
    if created_by is not None:
        conditions.append("created_by = ?")
        params.append(created_by)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY topic_number, id"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [_row(r) for r in rows]


def get_one(q_id: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM questions WHERE id = ?", (q_id,)).fetchone()
    conn.close()
    return _row(row) if row else None


def create(q_id: str, data: dict, created_by: Optional[int] = None, status: str = "approved") -> dict:
    conn = get_conn()
    conn.execute(
        """INSERT INTO questions
           (id, topic_number, topic, question, followups, code_challenge, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            q_id,
            data["topic_number"],
            data["topic"],
            data["question"],
            json.dumps(data["followups"]),
            data.get("code_challenge"),
            status,
            created_by,
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM questions WHERE id = ?", (q_id,)).fetchone()
    conn.close()
    return _row(row)


def update(q_id: str, data: dict, status: Optional[str] = None) -> Optional[dict]:
    conn = get_conn()
    if status is not None:
        conn.execute(
            """UPDATE questions
               SET topic_number=?, topic=?, question=?, followups=?, code_challenge=?, status=?
               WHERE id=?""",
            (
                data["topic_number"], data["topic"], data["question"],
                json.dumps(data["followups"]), data.get("code_challenge"), status, q_id,
            ),
        )
    else:
        conn.execute(
            """UPDATE questions
               SET topic_number=?, topic=?, question=?, followups=?, code_challenge=?
               WHERE id=?""",
            (
                data["topic_number"], data["topic"], data["question"],
                json.dumps(data["followups"]), data.get("code_challenge"), q_id,
            ),
        )
    conn.commit()
    row = conn.execute("SELECT * FROM questions WHERE id = ?", (q_id,)).fetchone()
    conn.close()
    return _row(row) if row else None


def update_status(q_id: str, status: str, ai_feedback: Optional[str] = None) -> Optional[dict]:
    conn = get_conn()
    if ai_feedback is not None:
        conn.execute("UPDATE questions SET status=?, ai_feedback=? WHERE id=?", (status, ai_feedback, q_id))
    else:
        conn.execute("UPDATE questions SET status=? WHERE id=?", (status, q_id))
    conn.commit()
    row = conn.execute("SELECT * FROM questions WHERE id = ?", (q_id,)).fetchone()
    conn.close()
    return _row(row) if row else None


def delete(q_id: str) -> bool:
    conn = get_conn()
    r = conn.execute("DELETE FROM questions WHERE id = ?", (q_id,))
    conn.commit()
    conn.close()
    return r.rowcount > 0


def get_random(n: int) -> List[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM questions WHERE status = 'approved' ORDER BY RANDOM() LIMIT ?", (n,)
    ).fetchall()
    conn.close()
    return [_row(r) for r in rows]


def stats() -> dict:
    conn = get_conn()
    total = conn.execute("SELECT COUNT(*) FROM questions WHERE status = 'approved'").fetchone()[0]
    topics = conn.execute(
        """SELECT topic_number, topic, COUNT(*) as count
           FROM questions WHERE status = 'approved'
           GROUP BY topic_number ORDER BY topic_number"""
    ).fetchall()
    conn.close()
    return {"total_questions": total, "topics": [dict(t) for t in topics]}


def next_id_for_topic(topic_number: int) -> str:
    conn = get_conn()
    prefix = f"T{topic_number:02d}-"
    rows = conn.execute(
        "SELECT id FROM questions WHERE id LIKE ? ORDER BY id", (prefix + "%",)
    ).fetchall()
    conn.close()
    if not rows:
        return f"{prefix}1"
    nums = []
    for r in rows:
        try:
            nums.append(int(r["id"].split("-")[1]))
        except (IndexError, ValueError):
            pass
    return f"{prefix}{max(nums) + 1 if nums else 1}"


# ── Exam Sessions ──────────────────────────────────────────────────────────

def _session_row(row) -> dict:
    d = dict(row)
    d["questions"] = json.loads(d["questions"])
    d["answers"] = json.loads(d["answers"])
    return d


def create_session(user_id: int, questions: List[dict]) -> dict:
    conn = get_conn()
    session_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO exam_sessions (id, user_id, questions, answers, current_q_index) VALUES (?, ?, ?, '[]', 0)",
        (session_id, user_id, json.dumps(questions)),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return _session_row(row)


def get_session(session_id: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return _session_row(row) if row else None


def get_user_active_session(user_id: int) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM exam_sessions WHERE user_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
        (user_id,),
    ).fetchone()
    conn.close()
    return _session_row(row) if row else None


def save_session_answer(session_id: str, q_index: int, answer_type: str, answer: str, followup_index: Optional[int] = None) -> dict:
    """Save one answer (main or followup) into the answers array."""
    conn = get_conn()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        conn.close()
        raise ValueError("Session not found")
    session = _session_row(row)
    answers: list = session["answers"]

    # Ensure slot exists
    while len(answers) <= q_index:
        answers.append({"q_index": len(answers), "main_answer": None, "followup_answers": [], "evaluation": None, "overall_score": None})

    if answer_type == "main":
        answers[q_index]["main_answer"] = answer
    elif answer_type == "followup" and followup_index is not None:
        fa = answers[q_index]["followup_answers"]
        while len(fa) <= followup_index:
            fa.append(None)
        fa[followup_index] = answer
        answers[q_index]["followup_answers"] = fa

    conn.execute(
        "UPDATE exam_sessions SET answers = ? WHERE id = ?",
        (json.dumps(answers), session_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return _session_row(row)


def save_question_evaluation(session_id: str, q_index: int, evaluation: dict, overall_score: float, next_q_index: int) -> dict:
    conn = get_conn()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        conn.close()
        raise ValueError("Session not found")
    session = _session_row(row)
    answers = session["answers"]

    while len(answers) <= q_index:
        answers.append({"q_index": len(answers), "main_answer": None, "followup_answers": [], "evaluation": None, "overall_score": None})

    answers[q_index]["evaluation"] = evaluation
    answers[q_index]["overall_score"] = overall_score

    conn.execute(
        "UPDATE exam_sessions SET answers = ?, current_q_index = ? WHERE id = ?",
        (json.dumps(answers), next_q_index, session_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return _session_row(row)


def complete_session(session_id: str) -> dict:
    conn = get_conn()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        conn.close()
        raise ValueError("Session not found")
    session = _session_row(row)
    scores = [a["overall_score"] for a in session["answers"] if a.get("overall_score") is not None]
    final_score = sum(scores) / len(scores) if scores else 0.0
    conn.execute(
        "UPDATE exam_sessions SET status = 'completed', final_score = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
        (final_score, session_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM exam_sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return _session_row(row)


def list_user_sessions(user_id: int) -> List[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM exam_sessions WHERE user_id = ? ORDER BY started_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [_session_row(r) for r in rows]


def abandon_session(session_id: str) -> bool:
    conn = get_conn()
    r = conn.execute(
        "UPDATE exam_sessions SET status = 'abandoned' WHERE id = ?", (session_id,)
    )
    conn.commit()
    conn.close()
    return r.rowcount > 0
