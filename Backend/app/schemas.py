from typing import Any
from enum import Enum
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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

class TeacherCreate(BaseModel):
    user_id: int
    employee_id: str
    department: str
    designation: str
    phone: Optional[str] = None

class TeacherResponse(BaseModel):
    id: int
    user_id: int
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

class UserRole(str, Enum):
    DEAN = "DEAN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


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