from pydantic import BaseModel, field_serializer
from typing import Optional, List
from datetime import datetime


class QuestionBase(BaseModel):
    topic_number: int
    topic: str
    question: str
    followups: List[str]
    code_challenge: Optional[str] = None


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(QuestionBase):
    pass


class Question(QuestionBase):
    id: str
    status: str = "approved"
    created_by: Optional[int] = None
    ai_feedback: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StartExamRequest(BaseModel):
    student_name: str


class ExamSession(BaseModel):
    student_name: str
    prep_questions: List[Question]
    direct_questions: List[Question]


class TopicSummary(BaseModel):
    topic_number: int
    topic: str
    count: int


class StatsResponse(BaseModel):
    total_questions: int
    topics: List[TopicSummary]


# Auth models
class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class UpdateRoleRequest(BaseModel):
    role: str
