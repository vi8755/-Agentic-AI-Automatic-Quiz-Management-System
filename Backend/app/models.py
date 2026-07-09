from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, JSON, String

from .database import Base


class Quiz(Base):
    __tablename__ = "quiz"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    questions = Column(JSON)


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    student_email = Column(String)
    quiz_id = Column(Integer)
    answers = Column(JSON)
    score = Column(Integer, default=0)
    feedback = Column(String)

    submitted_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    department = Column(String)

    roll_no = Column(
        String,
        unique=True,
        index=True
    )


class QuizAssignment(Base):
    __tablename__ = "quiz_assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_email = Column(String, index=True)
    quiz_id = Column(Integer)
    status = Column(
        String,
        default="Assigned",
    )
    score = Column(
        Integer,
        default=0,
    )