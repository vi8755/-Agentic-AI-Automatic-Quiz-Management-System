from typing import Any

from pydantic import BaseModel, EmailStr


class QuizCreate(BaseModel):
    title: str
    questions: list[Any]


class QuizSubmit(BaseModel):
    student_email: str
    quiz_id: int
    answers: dict


class StudentCreate(BaseModel):
    name: str
    roll_no: str
    email: EmailStr
    department: str


class GenerateQuizRequest(BaseModel):
    topic: str
    num_questions: int
    difficulty: str


class AssignQuizRequest(BaseModel):
    quiz_id: int
    students: list[EmailStr]

class MessageResponse(BaseModel):
    message: str


class StudentResponse(MessageResponse):
    id: int

