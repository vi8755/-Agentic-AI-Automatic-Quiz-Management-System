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

)

from .database import Base
from sqlalchemy import ForeignKey, UniqueConstraint

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

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    subject_code = Column(String, unique=True, nullable=False)

    subject_name = Column(String, nullable=False)

    department = Column(String, nullable=False)

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
    back_populates="subject",
    )

 
