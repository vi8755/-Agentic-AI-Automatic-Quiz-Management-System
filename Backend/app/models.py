from datetime import datetime
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    JSON,
    String,
    ForeignKey,
    Float,
    func,
)

from .database import Base
from sqlalchemy import UniqueConstraint

class UserRole(PyEnum):
    DEAN = "DEAN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, index=True, nullable=False)

    password = Column(String, nullable=False)

    role = Column(Enum(UserRole), nullable=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # NEW
    teacher = relationship(
        "Teacher",
        back_populates="user",
        uselist=False,
    )
    student = relationship(
    "Student",
    back_populates="user",
    uselist=False,
    )

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    employee_id = Column(String, unique=True, nullable=False)

    department = Column(String, nullable=False)

    designation = Column(String, nullable=False)

    phone = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user = relationship(
        "User",
        back_populates="teacher",
    )
    teacher_sections = relationship(
    "TeacherSection",
    back_populates="teacher",
    )
    quizzes = relationship(
    "Quiz",
    back_populates="teacher",
    )
    quiz_assignments = relationship("QuizAssignment", back_populates="teacher")

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)

    section_name = Column(String, nullable=False)

    department = Column(String, nullable=False)

    year = Column(Integer, nullable=False)

    semester = Column(Integer, nullable=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    teacher_sections = relationship(
    "TeacherSection",
    back_populates="section",
    )
    students = relationship(
    "Student",
    back_populates="section",
    )
    quiz_assignments = relationship(
    "QuizAssignment",
    back_populates="section",
    )


class Quiz(Base):
    __tablename__ = "quiz"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String)

    questions = Column(JSON)

    # NEW
    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id"),
        nullable=True,   # Keep nullable so Version 1 quizzes remain valid
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    teacher = relationship(
    "Teacher",
    back_populates="quizzes",
    )
    assignments = relationship("QuizAssignment", back_populates="quiz")


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

class TeacherSection(Base):
    __tablename__ = "teacher_sections"

    __table_args__ = (
        UniqueConstraint(
            "teacher_id",
            "section_id",
            "subject_id",
            name="uq_teacher_section_subject",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id"),
        nullable=False,
    )

    section_id = Column(
        Integer,
        ForeignKey("sections.id"),
        nullable=False,
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=False,
    )

    academic_year = Column(
        String,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    teacher = relationship(
    "Teacher",
    back_populates="teacher_sections",
    )

    section = relationship(
    "Section",
    back_populates="teacher_sections",
    )

    subject = relationship(
    "Subject",
    back_populates="teacher_sections",
    )
class QuizAssignment(Base):
    __tablename__ = "quiz_assignments"

    id = Column(Integer, primary_key=True, index=True)

    quiz_id = Column(Integer, ForeignKey("quiz.id"), nullable=False)

    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)

    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)

    student_email = Column(String, nullable=True)

    status = Column(String, default="Pending")

    score = Column(Integer, nullable=True)

    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    due_date = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    quiz = relationship("Quiz", back_populates="assignments")
    teacher = relationship("Teacher", back_populates="quiz_assignments")
    student = relationship("Student", back_populates="quiz_assignments")
    section = relationship("Section", back_populates="quiz_assignments")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    subject_code = Column(
        String,
        unique=True,
        nullable=False,
    )

    subject_name = Column(
        String,
        nullable=False,
    )

    department = Column(
        String,
        nullable=False,
    )

    semester = Column(
        Integer,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    teacher_sections = relationship(
        "TeacherSection",
        back_populates="subject",
    )
    
class Student(Base):
    __tablename__ = "students"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    roll_no = Column(
        String,
        unique=True,
        nullable=False,
    )

    section_id = Column(
        Integer,
        ForeignKey("sections.id"),
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user = relationship(
        "User",
        back_populates="student",
    )

    section = relationship(
        "Section",
        back_populates="students",
    )
    quiz_assignments = relationship("QuizAssignment", back_populates="student")