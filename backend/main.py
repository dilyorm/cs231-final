from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database as db
from routes import questions, exam, ai, auth, users

app = FastAPI(title="CS231 Mock Exam API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(questions.router)
app.include_router(exam.router)
app.include_router(ai.router)


@app.on_event("startup")
def startup():
    db.init_db()


@app.get("/")
def root():
    return {"status": "ok", "app": "CS231 Mock Exam API", "version": "2.0.0"}
