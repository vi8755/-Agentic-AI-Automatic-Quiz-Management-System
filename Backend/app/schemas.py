from typing import Any
from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from .models import UserRole 
from typing import List

class QuizCreate(BaseModel):
    title: str
    questions: list[Any]
    subject_id: Optional[int] = None 


class QuizSubmit(BaseModel):
    assignment_id: Optional[int] = None
    student_email: str
    quiz_id: int
    answers: dict
    auto_submit: bool = False

class GenerateQuizRequest(BaseModel):
    topic: str
    num_questions: int
    difficulty: str
# Version 2 — new Topic-Based generator
class GenerateTopicQuizRequest(BaseModel):
    topic: str
    question_count: int
    difficulty: str
    bloom_level: str
    time_limit: int
class TeacherQuizReport(BaseModel):

    response_id: int

    student_name: Optional[str] = None

    student_email: str

    score: int

    total_questions: int

    percentage: float

    time_taken_seconds: Optional[int] = None

    submitted_at: Optional[datetime] = None

    status: str


class TeacherQuizReportList(BaseModel):

    reports: list[TeacherQuizReport]
    
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
    batch_id: int

class SectionUpdate(BaseModel):
    section_name: str | None = None
    department: str | None = None
    year: int | None = None
    semester: int | None = None

class SectionStatusUpdate(BaseModel):
    is_active: bool

class SectionResponse(BaseModel):
    id: int
    section_name: str
    department: str
    year: int
    semester: int
    batch_id: int
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

class SubjectUpdate(BaseModel):
    subject_code: str
    subject_name: str
    department: str
    semester: int

    
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
    

    section_id: int
    subject_id: int
    academic_year: str


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

    # Section
    section_id: int
    section_name: str | None = None

    # Batch
    batch_id: int | None = None
    batch_name: str | None = None

    # Academic information
    department: str | None = None
    year: int | None = None
    semester: int | None = None

    is_active: bool

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
class AssignQuizSectionRequest(BaseModel):

    section_id: int

    start_time: Optional[datetime] = None

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
    status: str
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
 
class QuestionCreate(BaseModel):
    question_text: str

    option_a: str
    option_b: str
    option_c: str
    option_d: str

    correct_answer: str

    explanation: Optional[str] = None

    marks: int = 1

    question_order: int



class QuestionResponse(BaseModel):
    id: int

    quiz_id: int

    question_text: str

    option_a: str
    option_b: str
    option_c: str
    option_d: str

    correct_answer: str

    explanation: Optional[str]

    marks: int

    question_order: int

    created_at: datetime

    class Config:
        from_attributes = True

class QuestionUpdate(BaseModel):
    id: Optional[int] = None

    question_text: str

    option_a: str
    option_b: str
    option_c: str
    option_d: str

    correct_answer: str

    explanation: Optional[str] = None

    marks: int = 1

    question_order: int


class UpdateQuizRequest(BaseModel):
    title: str

    questions: List[QuestionUpdate]

    deleted_question_ids: List[int] = []

class QuizWithQuestionsResponse(BaseModel):
    id: int
    title: str
    teacher_id: Optional[int]
    subject_id: Optional[int] = None
    status: str
    created_at: datetime
    questions: list[QuestionResponse]

    class Config:
        from_attributes = True
 
class UpdateQuestionRequest(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str | None = None
    marks: int
 

class GenerateQuestionRequest(BaseModel):
    topic: str
    difficulty: str

class GeneratePDFQuizRequest(BaseModel):
    selected_topics: list[str]
    question_count: int
    difficulty: str
    bloom_level: str
    time_limit: int

class QuestionReport(BaseModel):

    question_no: int

    question: str

    options: list[str]

    student_answer: str

    correct_answer: str

    is_correct: bool

    explanation: str | None = None


class TeacherStudentReport(BaseModel):

    response_id: int

    student_name: str

    student_email: str

    quiz_title: str

    score: int

    total_questions: int

    percentage: float

    time_taken_seconds: int | None = None

    feedback: str | None = None

    submitted_at: datetime

    questions: list[QuestionReport]


class TeacherProfileResponse(BaseModel):
    name: str
    email: EmailStr
    employee_id: str
    department: str
    designation: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class TeacherProfileUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    department: str
    designation: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class OverallStatsResponse(BaseModel):
    total_teachers: int
    total_students: int
    total_sections: int
    total_subjects: int
    total_quizzes: int
    total_attempts: int


class RecentActivityResponse(BaseModel):
    type: str
    title: str
    teacher: str
    created_at: datetime


class QuickActionsResponse(BaseModel):
    create_teacher: bool
    create_section: bool
    create_subject: bool
    view_reports: bool


class DeanDashboardResponse(BaseModel):
    overall_stats: OverallStatsResponse
    recent_activity: List[RecentActivityResponse]
    quick_actions: QuickActionsResponse

 

class DeanTeacherResponse(BaseModel):

    id: int

    name: str
    email: str

    employee_id: str

    department: str
    designation: str

    phone: str | None

    status: str

    sections: list[str]
    subjects: list[str]

    created_at: datetime

    class Config:
        from_attributes = True

class DeanTeacherListResponse(BaseModel):

    items: list[DeanTeacherResponse]

    total: int

    page: int

    limit: int

    total_pages: int

class DeanTeacherProfileResponse(BaseModel):

    id: int

    name: str

    email: str

    employee_id: str

    department: str

    designation: str

    phone: str | None

    status: str

    sections: list[str]

    subjects: list[str]

    quiz_count: int

    created_at: datetime

    class Config:
        from_attributes = True

class TeacherStatusUpdate(BaseModel):
    is_active: bool

class StudentDashboardStudent(BaseModel):
    name: str
    email: EmailStr
    roll_no: str
    section_name: str
    department: str
    year: int
    semester: int


class StudentDashboardStats(BaseModel):
    total_quizzes: int
    pending_quizzes: int
    completed_quizzes: int
    average_score: float
    average_percentage: float
    highest_score: int
  


class StudentUpcomingQuiz(BaseModel):
    assignment_id: int
    quiz_id: int
    title: str
    teacher_name: str
    due_date: Optional[datetime] = None
    duration_minutes: int
    status: str
    token: Optional[str] = None

class StudentRecentActivity(BaseModel):
    type: str
    title: str
    quiz_id: int
    score: Optional[int] = None
    total_marks: Optional[int] = None
    percentage: Optional[float] = None
    created_at: datetime 


class StudentPerformanceSummary(BaseModel):
    total_attempts: int
    average_score: float
    highest_score: int
    lowest_score: int
    average_time_taken_seconds: Optional[float] = None


class StudentDashboardResponse(BaseModel):
    student: StudentDashboardStudent
    stats: StudentDashboardStats
    upcoming_quiz: Optional[StudentUpcomingQuiz] = None
    recent_activity: List[StudentRecentActivity]
    performance: StudentPerformanceSummary


class StudentQuizResponse(BaseModel):
    assignment_id: int
    quiz_id: int

    title: str
    teacher_name: str

    duration_minutes: int

    status: str

    score: Optional[int] = None
    total_marks: int = 0
    percentage: Optional[float] = None
    response_id: Optional[int] = None

    assigned_at: datetime
    due_date: Optional[datetime] = None

    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    token: Optional[str] = None

class StudentHistoryItem(BaseModel):
    response_id: int
    quiz_id: int

    title: str
    teacher_name: str

    score: int
    total_marks: int
    percentage: float

    attempted_at: datetime
    time_taken_seconds: Optional[int] = None


class StudentHistoryResponse(BaseModel):
    items: List[StudentHistoryItem]
    total: int
class StudentPerformanceTrend(BaseModel):
    response_id: int
    quiz_id: int
    title: str
    score: int
    total_marks: int
    percentage: float
    attempted_at: datetime


class StudentPerformanceResponse(BaseModel):
    total_attempts: int
    average_percentage: float
    highest_percentage: float
    lowest_percentage: float
    trend: List[StudentPerformanceTrend]

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    roll_no: str
    section_id: int


class StudentUpdate(BaseModel):
    name: str
    email: EmailStr
    roll_no: str
    section_id: int


class StudentStatusUpdate(BaseModel):
    is_active: bool


class StudentResponse(BaseModel):
    id: int
    user_id: int

    name: str
    email: EmailStr
    roll_no: str

    # Section
    section_id: int
    section_name: str | None = None

    # Batch
    batch_id: int | None = None
    batch_name: str | None = None

    # Academic information
    department: str | None = None
    year: int | None = None
    semester: int | None = None

    # Email verification
    email_verified: bool

    # Student account status
    is_active: bool

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
# ============================================================
# DEAN QUIZ MANAGEMENT
# ============================================================

class DeanQuizResponse(BaseModel):
    id: int
    title: str

    teacher_id: int | None = None
    teacher_name: str | None = None

    subject_id: int | None = None
    subject_name: str | None = None

    status: str

    total_questions: int
    total_marks: int

    assignment_count: int
    attempt_count: int

    created_at: datetime

    class Config:
        from_attributes = True


class DeanQuizListResponse(BaseModel):
    items: list[DeanQuizResponse]

    total: int
    page: int
    limit: int
    total_pages: int


class DeanQuizDetailResponse(BaseModel):
    id: int
    title: str

    teacher_id: int | None = None
    teacher_name: str | None = None
    teacher_email: str | None = None

    subject_id: int | None = None
    subject_name: str | None = None

    status: str

    total_questions: int
    total_marks: int

    assignment_count: int
    attempt_count: int

    created_at: datetime

class TeacherSectionAssignmentCreate(BaseModel):
    subject_id: int
    section_ids: list[int] = Field(min_length=1)
    academic_year: str


class TeacherSectionAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    section_id: int
    section_name: str
    subject_id: int
    subject_name: str
    academic_year: str
    is_active: bool

# ============================================================
# DESCRIPTIVE ASSIGNMENT
# ============================================================

class DescriptiveAssignmentQuestionCreate(BaseModel):
    question_text: str
    max_marks: int = Field(default=1, ge=1)
    expected_answer: Optional[str] = None
    evaluation_rubric: Optional[str] = None
    question_order: int


class DescriptiveAssignmentQuestionResponse(BaseModel):
    id: int
    assignment_id: int
    question_text: str
    max_marks: int
    expected_answer: Optional[str] = None
    evaluation_rubric: Optional[str] = None
    question_order: int
    created_at: datetime

    class Config:
        from_attributes = True

class DescriptiveAssignmentCreate(BaseModel):
    title: str
    instructions: Optional[str] = None

    subject_id: int

    section_ids: List[int] = Field(
        min_length=1
    )

    academic_year: str

    assignment_type: str = "MANUAL"

    questions: List[
        DescriptiveAssignmentQuestionCreate
    ] = Field(
        default_factory=list
    )

    question_pdf_url: Optional[str] = None
    question_pdf_name: Optional[str] = None

    due_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None

class DescriptiveAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    subject_id: int

    title: str
    instructions: Optional[str] = None

    status: str

    assignment_type: str = "MANUAL"

    question_pdf_url: Optional[str] = None
    question_pdf_name: Optional[str] = None

    due_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DescriptiveAssignmentDetailResponse(BaseModel):
    id: int

    teacher_id: int
    subject_id: int

    title: str
    instructions: Optional[str] = None

    status: str

    assignment_type: str = "MANUAL"

    question_pdf_url: Optional[str] = None
    question_pdf_name: Optional[str] = None

    due_date: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    questions: List[
        DescriptiveAssignmentQuestionResponse
    ]

    class Config:
        from_attributes = True


class DescriptiveAssignmentSectionResponse(BaseModel):
    id: int
    assignment_id: int
    section_id: int
    section_name: str
    assigned_at: datetime

    class Config:
        from_attributes = True

class DescriptiveAnswerAttachmentResponse(BaseModel):
    id: int
    answer_id: int
    file_name: str
    file_url: str
    mime_type: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DescriptiveAnswerCreate(BaseModel):
    question_id: int
    answer_text: Optional[str] = None
    drawing_data: Optional[str] = None

class DescriptiveSubmissionCreate(BaseModel):
    assignment_id: int

    answers: List[DescriptiveAnswerCreate] = Field(
        min_length=1
    )

class StudentDescriptiveAssignmentResponse(BaseModel):
    assignment_id: int

    title: str
    instructions: Optional[str] = None

    subject_id: int
    subject_name: str

    teacher_name: str

    assignment_type: str = "MANUAL"

    question_pdf_url: Optional[str] = None
    question_pdf_name: Optional[str] = None

    due_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    submission_status: Optional[str] = None

    status: str

    questions: List[
        DescriptiveAssignmentQuestionResponse
    ] = Field(default_factory=list)

class DescriptiveAnswerResponse(BaseModel):
    id: int

    question_id: int

    answer_text: Optional[str] = None

    ai_marks: Optional[float] = None
    teacher_marks: Optional[float] = None
    final_marks: Optional[float] = None

    ai_feedback: Optional[str] = None
    teacher_feedback: Optional[str] = None

    evaluation_status: str

    evaluated_at: Optional[datetime] = None

    attachments: List[
        DescriptiveAnswerAttachmentResponse
    ] =  Field(default_factory=list)

    class Config:
        from_attributes = True

class DescriptiveSubmissionResponse(BaseModel):
    id: int

    assignment_id: int
    student_id: int

    status: str

    total_marks: Optional[int] = None
    obtained_marks: Optional[float] = None
    percentage: Optional[float] = None

    ai_feedback: Optional[str] = None

    evaluation_status: str

    answer_pdf_url: Optional[str] = None
    answer_pdf_name: Optional[str] = None

    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    evaluated_at: Optional[datetime] = None

    answers: List[
        DescriptiveAnswerResponse
    ] = Field(default_factory=list)

    class Config:
        from_attributes = True

 

class DescriptiveAnswerEvaluationUpdate(BaseModel):
    question_id: int

    teacher_marks: float = Field(
        ge=0
    )

    teacher_feedback: Optional[str] = None


class DescriptiveSubmissionEvaluationUpdate(BaseModel):
    answers: List[
        DescriptiveAnswerEvaluationUpdate
    ]

class StudentDescriptiveAssignmentListItem(BaseModel):
    assignment_id: int

    title: str
    instructions: Optional[str] = None

    subject_id: int
    subject_name: str

    teacher_name: str

    due_date: Optional[datetime] = None

    status: str

    question_count: int

    submission_status: Optional[str] = None

    submitted_at: Optional[datetime] = None

    obtained_marks: Optional[float] = None
    total_marks: Optional[int] = None

    class Config:
        from_attributes = True

class TeacherDescriptiveAnswerResponse(BaseModel):
    id: int

    question_id: int
    question_order: int

    question_text: str
    max_marks: int

    answer_text: Optional[str] = None

    ai_marks: Optional[float] = None
    teacher_marks: Optional[float] = None
    final_marks: Optional[float] = None

    ai_feedback: Optional[str] = None
    teacher_feedback: Optional[str] = None

    evaluation_status: str

    evaluated_at: Optional[datetime] = None

    attachments: List[
        DescriptiveAnswerAttachmentResponse
    ] = Field(default_factory=list)

class TeacherDescriptiveSubmissionResponse(BaseModel):
    submission_id: int

    assignment_id: int

    assignment_title: str
    instructions: Optional[str] = None

    student_id: int
    student_name: str
    student_email: Optional[str] = None

    status: str
    evaluation_status: str

    total_marks: Optional[int] = None
    obtained_marks: Optional[float] = None
    percentage: Optional[float] = None

    ai_feedback: Optional[str] = None

    answer_pdf_url: Optional[str] = None
    answer_pdf_name: Optional[str] = None

    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    evaluated_at: Optional[datetime] = None

    answers: List[
        TeacherDescriptiveAnswerResponse
    ] = Field(default_factory=list)

    
class DescriptiveAssignmentSectionAssign(BaseModel):
    section_ids: List[int]

# ============================================================
# BATCH MANAGEMENT
# ============================================================

class BatchCreate(BaseModel):
    batch_name: str
    department: str
    start_year: int
    end_year: int


class BatchUpdate(BaseModel):
    batch_name: Optional[str] = None
    department: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class BatchStatusUpdate(BaseModel):
    is_active: bool


class BatchResponse(BaseModel):
    id: int
    batch_name: str
    department: str
    start_year: int
    end_year: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



# ============================================================
# StudentPerformanceResponse
# ============================================================
#
# Keep your existing fields and ADD these fields.
# ============================================================

class StudentPerformanceResponse(BaseModel):
    total_attempts: int
    average_percentage: float
    highest_percentage: float
    lowest_percentage: float
    trend: List[StudentPerformanceTrend]

    average_percentage: float
    highest_percentage: float
    lowest_percentage: float
    trend: List[StudentPerformanceTrend]

    # NEW
    my_rank: Optional[int] = None
    my_average_percentage: float = 0.0
    class_average_percentage: float = 0.0

    topper: Optional[dict] = None
    top_students: List[dict] = []
    students: List[dict] = []
