import sqlite3
import json
import os
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
    # Migrate existing questions table if status column missing
    try:
        conn.execute("ALTER TABLE questions ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'")
    except Exception:
        pass
    try:
        conn.execute("ALTER TABLE questions ADD COLUMN created_by INTEGER REFERENCES users(id)")
    except Exception:
        pass
    try:
        conn.execute("ALTER TABLE questions ADD COLUMN ai_feedback TEXT")
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
                data["topic_number"],
                data["topic"],
                data["question"],
                json.dumps(data["followups"]),
                data.get("code_challenge"),
                status,
                q_id,
            ),
        )
    else:
        conn.execute(
            """UPDATE questions
               SET topic_number=?, topic=?, question=?, followups=?, code_challenge=?
               WHERE id=?""",
            (
                data["topic_number"],
                data["topic"],
                data["question"],
                json.dumps(data["followups"]),
                data.get("code_challenge"),
                q_id,
            ),
        )
    conn.commit()
    row = conn.execute("SELECT * FROM questions WHERE id = ?", (q_id,)).fetchone()
    conn.close()
    return _row(row) if row else None


def update_status(q_id: str, status: str, ai_feedback: Optional[str] = None) -> Optional[dict]:
    conn = get_conn()
    if ai_feedback is not None:
        conn.execute(
            "UPDATE questions SET status=?, ai_feedback=? WHERE id=?",
            (status, ai_feedback, q_id),
        )
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
           FROM questions
           WHERE status = 'approved'
           GROUP BY topic_number
           ORDER BY topic_number"""
    ).fetchall()
    conn.close()
    return {"total_questions": total, "topics": [dict(t) for t in topics]}


def next_id_for_topic(topic_number: int) -> str:
    conn = get_conn()
    prefix = f"T{topic_number:02d}-"
    rows = conn.execute(
        "SELECT id FROM questions WHERE id LIKE ? ORDER BY id",
        (prefix + "%",),
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
