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

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password = Column(String, nullable=False)

    role = Column(
        Enum(UserRole),
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    # Email verification status
    email_verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

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

    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    email_verification_tokens = relationship(
        "EmailVerificationToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    token_hash = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    used_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="password_reset_tokens",
    )

class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    token_hash = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    used_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="email_verification_tokens",
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
    descriptive_assignments = relationship(
    "DescriptiveAssignment",
    back_populates="teacher",
)
class Batch(Base):
    __tablename__ = "batches"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    batch_name = Column(
        String,
        nullable=False,
    )

    department = Column(
        String,
        nullable=False,
    )

    start_year = Column(
        Integer,
        nullable=False,
    )

    end_year = Column(
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

    sections = relationship(
        "Section",
        back_populates="batch",
    )

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)

    section_name = Column(String, nullable=False)

    department = Column(String, nullable=False)

    year = Column(Integer, nullable=False)

    semester = Column(Integer, nullable=False)

    batch_id = Column(
        Integer,
        ForeignKey("batches.id"),
        nullable=False,
    )
    

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

    # Batch relationship
    batch = relationship(
        "Batch",
        back_populates="sections",
    )

    # Existing relationships
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

    descriptive_assignments = relationship(
        "DescriptiveAssignmentSection",
        back_populates="section",
        cascade="all, delete-orphan",
    )

class Quiz(Base):
    __tablename__ = "quiz"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String)

    questions = Column(JSON)

    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id"),
        nullable=True,
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=True,
    )

    status = Column(
        String,
        default="Draft",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    duration_minutes = Column(
        Integer,
        nullable=False,
        default=30,
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

    subject = relationship(
        "Subject",
    )

    questions_relation = relationship(
        "Question",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="Question.question_order",
    )

    assignments = relationship(
        "QuizAssignment",
        back_populates="quiz",
    )
class Question(Base):
    __tablename__ = "questions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    quiz_id = Column(
        Integer,
        ForeignKey("quiz.id"),
        nullable=False,
    )

    question_text = Column(
        String,
        nullable=False,
    )

    option_a = Column(
        String,
        nullable=False,
    )

    option_b = Column(
        String,
        nullable=False,
    )

    option_c = Column(
        String,
        nullable=False,
    )

    option_d = Column(
        String,
        nullable=False,
    )

    correct_answer = Column(
        String,
        nullable=False,
    )

    explanation = Column(
        String,
        nullable=True,
    )

    marks = Column(
        Integer,
        default=1,
    )

    question_order = Column(
        Integer,
        nullable=False,
    )
    topic = Column(
    String,
    nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


    quiz = relationship(
        "Quiz",
        back_populates="questions_relation",
    )
class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)

    student_email = Column(String)

    quiz_id = Column(Integer)

    answers = Column(JSON)

    score = Column(Integer, default=0)

    feedback = Column(String)

    # =====================================================
    # AI Performance Analysis
    # =====================================================

    ai_analysis = Column(
        JSON,
        nullable=True,
    )

    time_taken_seconds = Column(
        Integer,
        nullable=True,
    )

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
    token = Column(String, unique=True, index=True, nullable=True)

    started_at = Column(DateTime(timezone=True), nullable=True)

    completed_at = Column(DateTime(timezone=True), nullable=True)

    expires_at = Column(DateTime(timezone=True), nullable=True)
    randomization_data = Column(JSON, nullable=True)
    start_time = Column(
    DateTime(timezone=True),
    nullable=True
    )

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
    descriptive_assignments = relationship(
    "DescriptiveAssignment",
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
    descriptive_submissions = relationship(
    "DescriptiveSubmission",
    back_populates="student",
    cascade="all, delete-orphan",
)

# =========================================================
# Descriptive Assignment
# =========================================================

class DescriptiveAssignment(Base):
    __tablename__ = "descriptive_assignments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id"),
        nullable=False,
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=False,
    )

    title = Column(
        String,
        nullable=False,
    )

    instructions = Column(
        String,
        nullable=True,
    )

    status = Column(
        String,
        default="Draft",
        nullable=False,
    )

    due_date = Column(
        DateTime(timezone=True),
        nullable=True,
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

    # Relationships

    teacher = relationship(
        "Teacher",
        back_populates="descriptive_assignments",
    )

    subject = relationship(
        "Subject",
        back_populates="descriptive_assignments",
    )

    questions = relationship(
        "DescriptiveAssignmentQuestion",
        back_populates="assignment",
        cascade="all, delete-orphan",
        order_by="DescriptiveAssignmentQuestion.question_order",
    )

    sections = relationship(
        "DescriptiveAssignmentSection",
        back_populates="assignment",
        cascade="all, delete-orphan",
    )

    submissions = relationship(
        "DescriptiveSubmission",
        back_populates="assignment",
        cascade="all, delete-orphan",
    )
    assignment_type = Column(
    String,
    default="MANUAL",
    nullable=False,
    )

    question_pdf_url = Column(
    String,
    nullable=True,
    )

    question_pdf_name = Column(
    String,
    nullable=True,
    )
    duration_minutes = Column(
    Integer,
    nullable=True,
)


# =========================================================
# Descriptive Assignment Questions
# =========================================================

class DescriptiveAssignmentQuestion(Base):
    __tablename__ = "descriptive_assignment_questions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    assignment_id = Column(
        Integer,
        ForeignKey("descriptive_assignments.id"),
        nullable=False,
    )

    question_text = Column(
        String,
        nullable=False,
    )

    max_marks = Column(
        Integer,
        nullable=False,
        default=1,
    )

    expected_answer = Column(
        String,
        nullable=True,
    )

    evaluation_rubric = Column(
        String,
        nullable=True,
    )

    question_order = Column(
        Integer,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    assignment = relationship(
        "DescriptiveAssignment",
        back_populates="questions",
    )

    answers = relationship(
        "DescriptiveAnswer",
        back_populates="question",
    )


# =========================================================
# Assignment → Section Mapping
# =========================================================

class DescriptiveAssignmentSection(Base):
    __tablename__ = "descriptive_assignment_sections"

    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "section_id",
            name="uq_descriptive_assignment_section",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    assignment_id = Column(
        Integer,
        ForeignKey("descriptive_assignments.id"),
        nullable=False,
    )

    section_id = Column(
        Integer,
        ForeignKey("sections.id"),
        nullable=False,
    )

    assigned_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    assignment = relationship(
        "DescriptiveAssignment",
        back_populates="sections",
    )

    section = relationship(
        "Section",
        back_populates="descriptive_assignments",
    )


# =========================================================
# Student Assignment Submission
# =========================================================

class DescriptiveSubmission(Base):
    __tablename__ = "descriptive_submissions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    assignment_id = Column(
        Integer,
        ForeignKey("descriptive_assignments.id"),
        nullable=False,
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False,
    )

    status = Column(
        String,
        default="In Progress",
        nullable=False,
    )

    total_marks = Column(
        Integer,
        nullable=True,
    )

    obtained_marks = Column(
        Float,
        nullable=True,
    )

    percentage = Column(
        Float,
        nullable=True,
    )

    ai_feedback = Column(
        String,
        nullable=True,
    )

    evaluation_status = Column(
        String,
        default="Pending",
        nullable=False,
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    submitted_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    evaluated_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    assignment = relationship(
        "DescriptiveAssignment",
        back_populates="submissions",
    )

    student = relationship(
        "Student",
        back_populates="descriptive_submissions",
    )

    answers = relationship(
        "DescriptiveAnswer",
        back_populates="submission",
        cascade="all, delete-orphan",
    )
    token = Column(
    String,
    unique=True,
    index=True,
    nullable=True,
    )
    answer_pdf_url = Column(
    String,
    nullable=True,
    )

    answer_pdf_name = Column(
    String,
    nullable=True,
    )


# =========================================================
# Student Answer
# =========================================================

class DescriptiveAnswer(Base):
    __tablename__ = "descriptive_answers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    submission_id = Column(
        Integer,
        ForeignKey("descriptive_submissions.id"),
        nullable=False,
    )

    question_id = Column(
        Integer,
        ForeignKey("descriptive_assignment_questions.id"),
        nullable=False,
    )

    answer_text = Column(
        String,
        nullable=True,
    )

    ai_marks = Column(
    Float,
    nullable=True,
    )

    teacher_marks = Column(
    Float,
    nullable=True,
    )

    final_marks = Column(
    Float,
    nullable=True,
    )

    ai_feedback = Column(
    String,
    nullable=True,
    )

    teacher_feedback = Column(
    String,
    nullable=True,
    )

    evaluation_status = Column(
        String,
        default="Pending",
        nullable=False,
    )

    evaluated_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    submission = relationship(
        "DescriptiveSubmission",
        back_populates="answers",
    )

    question = relationship(
        "DescriptiveAssignmentQuestion",
        back_populates="answers",
    )

    attachments = relationship(
        "DescriptiveAnswerAttachment",
        back_populates="answer",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "submission_id",
            "question_id",
            name="uq_descriptive_submission_question",
        ),
    )


# =========================================================
# Answer Attachments
# =========================================================

class DescriptiveAnswerAttachment(Base):
    __tablename__ = "descriptive_answer_attachments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    answer_id = Column(
        Integer,
        ForeignKey("descriptive_answers.id"),
        nullable=False,
    )

    file_name = Column(
        String,
        nullable=False,
    )

    file_url = Column(
        String,
        nullable=False,
    )

    mime_type = Column(
        String,
        nullable=True,
    )

    file_type = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    answer = relationship(
        "DescriptiveAnswer",
        back_populates="attachments",
    )
