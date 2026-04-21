"""Database layer — PostgreSQL via psycopg2."""
import json
import os
import uuid
from contextlib import contextmanager
from typing import Optional, List

import psycopg2
import psycopg2.extras
import psycopg2.pool
import psycopg2.errors
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://cs231:cs231pass@localhost:5432/cs231",
)

_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None


def _get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(1, 20, DATABASE_URL)
    return _pool


@contextmanager
def _conn():
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _cur(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def init_db():
    with _conn() as conn:
        c = _cur(conn)
        c.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        c.execute("""
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
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS exam_sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                status TEXT NOT NULL DEFAULT 'in_progress',
                questions TEXT NOT NULL,
                answers TEXT NOT NULL DEFAULT '[]',
                current_q_index INTEGER NOT NULL DEFAULT 0,
                final_score REAL,
                started_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP
            )
        """)
        # Safe column migrations
        for sql in [
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'",
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)",
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS ai_feedback TEXT",
        ]:
            try:
                c.execute(sql)
            except Exception:
                pass


def _row(row) -> dict:
    d = dict(row)
    d["followups"] = json.loads(d["followups"])
    return d


# ── Users ─────────────────────────────────────────────────────────────────

def create_user(username: str, password_hash: str, role: str = "viewer") -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        try:
            c.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)",
                (username, password_hash, role),
            )
            c.execute("SELECT * FROM users WHERE username = %s", (username,))
            return dict(c.fetchone())
        except psycopg2.errors.UniqueViolation:
            return None


def get_user_by_username(username: str) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT * FROM users WHERE username = %s", (username,))
        row = c.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = c.fetchone()
        return dict(row) if row else None


def list_users() -> List[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT id, username, role, created_at FROM users ORDER BY id")
        return [dict(r) for r in c.fetchall()]


def update_user_role(user_id: int, role: str) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))
        c.execute("SELECT id, username, role, created_at FROM users WHERE id = %s", (user_id,))
        row = c.fetchone()
        return dict(row) if row else None


def delete_user(user_id: int) -> bool:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("DELETE FROM users WHERE id = %s", (user_id,))
        return c.rowcount > 0


# ── Questions ─────────────────────────────────────────────────────────────

def get_all(status_filter: Optional[str] = None, created_by: Optional[int] = None) -> List[dict]:
    with _conn() as conn:
        c = _cur(conn)
        query = "SELECT * FROM questions"
        params: list = []
        conditions: list = []
        if status_filter:
            conditions.append("status = %s")
            params.append(status_filter)
        if created_by is not None:
            conditions.append("created_by = %s")
            params.append(created_by)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY topic_number, id"
        c.execute(query, params)
        return [_row(r) for r in c.fetchall()]


def get_one(q_id: str) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT * FROM questions WHERE id = %s", (q_id,))
        row = c.fetchone()
        return _row(row) if row else None


def create(q_id: str, data: dict, created_by: Optional[int] = None, status: str = "approved") -> dict:
    with _conn() as conn:
        c = _cur(conn)
        c.execute(
            """INSERT INTO questions
               (id, topic_number, topic, question, followups, code_challenge, status, created_by)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
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
        c.execute("SELECT * FROM questions WHERE id = %s", (q_id,))
        return _row(c.fetchone())


def update(q_id: str, data: dict, status: Optional[str] = None) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        if status is not None:
            c.execute(
                """UPDATE questions
                   SET topic_number=%s, topic=%s, question=%s, followups=%s, code_challenge=%s, status=%s
                   WHERE id=%s""",
                (
                    data["topic_number"], data["topic"], data["question"],
                    json.dumps(data["followups"]), data.get("code_challenge"), status, q_id,
                ),
            )
        else:
            c.execute(
                """UPDATE questions
                   SET topic_number=%s, topic=%s, question=%s, followups=%s, code_challenge=%s
                   WHERE id=%s""",
                (
                    data["topic_number"], data["topic"], data["question"],
                    json.dumps(data["followups"]), data.get("code_challenge"), q_id,
                ),
            )
        c.execute("SELECT * FROM questions WHERE id = %s", (q_id,))
        row = c.fetchone()
        return _row(row) if row else None


def update_status(q_id: str, status: str, ai_feedback: Optional[str] = None) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        if ai_feedback is not None:
            c.execute("UPDATE questions SET status=%s, ai_feedback=%s WHERE id=%s", (status, ai_feedback, q_id))
        else:
            c.execute("UPDATE questions SET status=%s WHERE id=%s", (status, q_id))
        c.execute("SELECT * FROM questions WHERE id = %s", (q_id,))
        row = c.fetchone()
        return _row(row) if row else None


def delete(q_id: str) -> bool:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("DELETE FROM questions WHERE id = %s", (q_id,))
        return c.rowcount > 0


def get_random(n: int) -> List[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute(
            "SELECT * FROM questions WHERE status = 'approved' ORDER BY RANDOM() LIMIT %s", (n,)
        )
        return [_row(r) for r in c.fetchall()]


def stats() -> dict:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved'")
        total = c.fetchone()["cnt"]
        c.execute(
            """SELECT topic_number, topic, COUNT(*) as count
               FROM questions WHERE status = 'approved'
               GROUP BY topic_number, topic ORDER BY topic_number"""
        )
        topics = [dict(t) for t in c.fetchall()]
        return {"total_questions": total, "topics": topics}


def next_id_for_topic(topic_number: int) -> str:
    with _conn() as conn:
        c = _cur(conn)
        prefix = f"T{topic_number:02d}-"
        c.execute("SELECT id FROM questions WHERE id LIKE %s ORDER BY id", (prefix + "%",))
        rows = c.fetchall()
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
    session_id = str(uuid.uuid4())
    with _conn() as conn:
        c = _cur(conn)
        c.execute(
            "INSERT INTO exam_sessions (id, user_id, questions, answers, current_q_index) VALUES (%s, %s, %s, '[]', 0)",
            (session_id, user_id, json.dumps(questions)),
        )
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        return _session_row(c.fetchone())


def get_session(session_id: str) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        row = c.fetchone()
        return _session_row(row) if row else None


def get_user_active_session(user_id: int) -> Optional[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute(
            "SELECT * FROM exam_sessions WHERE user_id = %s AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
            (user_id,),
        )
        row = c.fetchone()
        return _session_row(row) if row else None


def save_session_answer(session_id: str, q_index: int, answer_type: str, answer: str, followup_index: Optional[int] = None) -> dict:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        row = c.fetchone()
        if not row:
            raise ValueError("Session not found")
        session = _session_row(row)
        answers: list = session["answers"]

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

        c.execute(
            "UPDATE exam_sessions SET answers = %s WHERE id = %s",
            (json.dumps(answers), session_id),
        )
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        return _session_row(c.fetchone())


def save_question_evaluation(session_id: str, q_index: int, evaluation: dict, overall_score: float, next_q_index: int) -> dict:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        row = c.fetchone()
        if not row:
            raise ValueError("Session not found")
        session = _session_row(row)
        answers = session["answers"]

        while len(answers) <= q_index:
            answers.append({"q_index": len(answers), "main_answer": None, "followup_answers": [], "evaluation": None, "overall_score": None})

        answers[q_index]["evaluation"] = evaluation
        answers[q_index]["overall_score"] = overall_score

        c.execute(
            "UPDATE exam_sessions SET answers = %s, current_q_index = %s WHERE id = %s",
            (json.dumps(answers), next_q_index, session_id),
        )
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        return _session_row(c.fetchone())


def complete_session(session_id: str) -> dict:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        row = c.fetchone()
        if not row:
            raise ValueError("Session not found")
        session = _session_row(row)
        scores = [a["overall_score"] for a in session["answers"] if a.get("overall_score") is not None]
        final_score = sum(scores) / len(scores) if scores else 0.0
        c.execute(
            "UPDATE exam_sessions SET status = 'completed', final_score = %s, completed_at = NOW() WHERE id = %s",
            (final_score, session_id),
        )
        c.execute("SELECT * FROM exam_sessions WHERE id = %s", (session_id,))
        return _session_row(c.fetchone())


def list_user_sessions(user_id: int) -> List[dict]:
    with _conn() as conn:
        c = _cur(conn)
        c.execute(
            "SELECT * FROM exam_sessions WHERE user_id = %s ORDER BY started_at DESC",
            (user_id,),
        )
        return [_session_row(r) for r in c.fetchall()]


def abandon_session(session_id: str) -> bool:
    with _conn() as conn:
        c = _cur(conn)
        c.execute("UPDATE exam_sessions SET status = 'abandoned' WHERE id = %s", (session_id,))
        return c.rowcount > 0
