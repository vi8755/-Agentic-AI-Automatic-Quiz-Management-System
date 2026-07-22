from typing import Any
from enum import Enum
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import UserRole 
class QuizCreate(BaseModel):
    title: str
    questions: list[Any]


class QuizSubmit(BaseModel):
    student_email: str
    quiz_id: int
    answers: dict


class GenerateQuizRequest(BaseModel):
    topic: str
    num_questions: int
    difficulty: str


class AssignQuizRequest(BaseModel):
    quiz_id: int
    students: list[EmailStr]

class MessageResponse(BaseModel):
    message: str

class TeacherResponse(BaseModel):
    id: int
    user_id: int

    name: str
    email: EmailStr

    employee_id: str
    department: str
    designation: str
    phone: Optional[str]

    is_active: bool

    class Config:
        from_attributes = True

class SectionCreate(BaseModel):
    section_name: str
    department: str
    year: int
    semester: int


class SectionResponse(BaseModel):
    id: int
    section_name: str
    department: str
    year: int
    semester: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    subject_code: str
    subject_name: str
    department: str
    semester: int


class SubjectResponse(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    department: str
    semester: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeacherSectionCreate(BaseModel):
    teacher_id: int
    section_id: int
    subject_id: int
    academic_year: str


class TeacherSectionResponse(BaseModel):
    id: int
    teacher_id: int
    section_id: int
    subject_id: int
    academic_year: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TeacherAssignmentItem(BaseModel):
    section_name: str
    subject_name: str
    academic_year: str


class TeacherAssignmentsResponse(BaseModel):
    teacher_id: int
    teacher_name: str
    employee_id: str
    assignments: list[TeacherAssignmentItem]


class SectionAssignmentItem(BaseModel):
    teacher_name: str
    employee_id: str
    subject_name: str
    academic_year: str


class SectionAssignmentsResponse(BaseModel):
    section_id: int
    section_name: str
    department: str
    year: int
    semester: int
    assignments: list[SectionAssignmentItem]


class SubjectAssignmentItem(BaseModel):
    teacher_name: str
    employee_id: str
    section_name: str
    academic_year: str


class SubjectAssignmentsResponse(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    department: str
    semester: int
    assignments: list[SubjectAssignmentItem]


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class TeacherMySectionResponse(BaseModel):
    teacher_section_id: int

    section_id: int
    section_name: str
    department: str
    year: int
    semester: int

    subject_id: int
    subject_name: str

    academic_year: str

    class Config:
        from_attributes = True


class TeacherBase(BaseModel):
    employee_id: str
    department: str
    designation: str
    phone: Optional[str] = None

class TeacherCreate(TeacherBase):
    user_id: int

class TeacherRegistrationCreate(TeacherBase):
    name: str
    email: EmailStr
    password: str


class StudentRegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    roll_no: str
    section_id: int

class StudentResponse(BaseModel):
    id: int
    user_id: int

    name: str
    email: EmailStr

    roll_no: str

    section_id: int
    section_name: str

    department: str
    year: int
    semester: int

    is_active: bool

    class Config:
        from_attributes = True

class AssignQuizSectionRequest(BaseModel):
    quiz_id: int
    section_id: int
    due_date: Optional[datetime] = None

class TeacherDashboardResponse(BaseModel):
    total_quizzes: int
    total_assignments: int
    completed_assignments: int
    pending_assignments: int

    class Config:
        from_attributes = True

class TeacherQuizResponse(BaseModel):
    id: int
    title: str
    total_questions: int
    created_at: datetime

    class Config:
        from_attributes = True

class TeacherQuizAssignmentResponse(BaseModel):
    assignment_id: int
    student_id: int | None
    student_name: str
    roll_no: str | None
    email: str
    status: str
    score: int | None
    assigned_at: datetime
    due_date: datetime | None

    class Config:
        from_attributes = True
