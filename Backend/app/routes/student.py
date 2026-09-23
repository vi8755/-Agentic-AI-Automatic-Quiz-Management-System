from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    File,
    UploadFile,
)
import os
import uuid
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import SessionLocal

from ..models import (
    User,
    UserRole,
    Student,
    DescriptiveAssignment,
    DescriptiveSubmission,
)
import fitz
from ..security import (
    get_current_user,
    require_role,
)

from ..schemas import (
    StudentRegistrationCreate,
    StudentResponse,
    StudentDashboardResponse,
    StudentQuizResponse,
    StudentHistoryResponse,
    StudentPerformanceResponse,

    # =====================================================
    # DESCRIPTIVE ASSIGNMENT
    # =====================================================
    DescriptiveSubmissionCreate,
    StudentDescriptiveAssignmentResponse,
    DescriptiveSubmissionResponse,
)
from ..services.descriptive_evaluation_service import (
    evaluate_descriptive_submission,
    evaluate_descriptive_pdf_submission,
)
from ..services.student_service import (
    register_student,
    get_all_students,
    get_student_by_id,
    get_current_student,
    get_student_dashboard,
    get_student_quizzes,
    get_student_history,
    get_student_performance,


    # =====================================================
    # DESCRIPTIVE ASSIGNMENT SERVICES
    # =====================================================
     get_student_descriptive_assignments,
    get_student_descriptive_assignment,
    submit_student_descriptive_assignment,
    get_student_descriptive_submission,
      get_student_quiz_performance,
      get_student_descriptive_assignment_performance,
      get_student_descriptive_performance,
    
)
from ..services.student_descriptive_assignment_service import (
    start_descriptive_assignment,
)

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# STUDENT REGISTRATION
# =========================================================

@router.post(
    "/register",
    response_model=StudentResponse,
)
def register_student_api(
    student: StudentRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    try:
        return register_student(
            db,
            student,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# GET ALL STUDENTS
# =========================================================

@router.get(
    "/",
    response_model=list[StudentResponse],
)
def get_students_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return get_all_students(db)


# =========================================================
# GET CURRENT STUDENT PROFILE
# =========================================================

@router.get(
    "/me",
    response_model=StudentResponse,
    dependencies=[
        Depends(require_role(UserRole.STUDENT))
    ],
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_current_student(
        current_user.id,
        db,
    )


# =========================================================
# STUDENT DASHBOARD
# =========================================================

@router.get(
    "/dashboard",
    response_model=StudentDashboardResponse,
)
def get_student_dashboard_api(
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_dashboard(
        current_user.id,
        db,
    )


# =========================================================
# STUDENT QUIZZES
# =========================================================

@router.get(
    "/quizzes",
    response_model=list[StudentQuizResponse],
)
def get_student_quizzes_api(
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_quizzes(
        current_user.id,
        db,
    )


# =========================================================
# STUDENT QUIZ HISTORY
# =========================================================

@router.get(
    "/history",
    response_model=StudentHistoryResponse,
)
def get_student_history_api(
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_history(
        current_user.id,
        db,
    )


# =========================================================
# STUDENT PERFORMANCE
# =========================================================

@router.get(
    "/performance",
    response_model=StudentPerformanceResponse,
)
def get_student_performance_api(
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_performance(
        current_user.id,
        db,
    )

@router.get("/descriptive-performance")
def get_student_descriptive_performance_api(
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_descriptive_performance(
        user_id=current_user.id,
        db=db,
    )

# =========================================================
# DESCRIPTIVE ASSIGNMENT
# =========================================================


# ---------------------------------------------------------
# GET DESCRIPTIVE ASSIGNMENT
# ---------------------------------------------------------
#
# Student opens an assignment.
#
# Example:
# GET
# /students/descriptive-assignments/5
#
# The service verifies that assignment 5 is assigned
# to the logged-in student's section.
# ---------------------------------------------------------
# =========================================================
# STUDENT DESCRIPTIVE ASSIGNMENTS
# =========================================================

@router.get(
    "/descriptive-assignments",
)
def get_student_descriptive_assignments_api(
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_descriptive_assignments(
        user_id=current_user.id,
        db=db,
    )
@router.get(
    "/descriptive-assignments/{assignment_id}",
    response_model=StudentDescriptiveAssignmentResponse,
)
def get_student_descriptive_assignment_api(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_descriptive_assignment(
        user_id=current_user.id,
        assignment_id=assignment_id,
        db=db,
    )


# ---------------------------------------------------------
# SUBMIT DESCRIPTIVE ASSIGNMENT
# ---------------------------------------------------------
#
# Student submits all answers.
#
# Example:
# POST
# /students/descriptive-assignments/submit
#
# Body:
# {
#     "assignment_id": 5,
#     "answers": [
#         {
#             "question_id": 10,
#             "answer_text": "My answer..."
#         }
#     ]
# }
# ---------------------------------------------------------

@router.post(
    "/descriptive-assignments/submit",
    response_model=DescriptiveSubmissionResponse,
)
def submit_student_descriptive_assignment_api(
    submission_data: DescriptiveSubmissionCreate,
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return submit_student_descriptive_assignment(
        user_id=current_user.id,
        submission_data=submission_data,
        db=db,
    )


# ---------------------------------------------------------
# GET STUDENT SUBMISSION
# ---------------------------------------------------------
#
# Student can view their submitted answers.
#
# Example:
# GET
# /students/descriptive-assignments/5/submission
# ---------------------------------------------------------

@router.get(
    "/descriptive-assignments/{assignment_id}/submission",
    response_model=DescriptiveSubmissionResponse,
)
def get_student_descriptive_submission_api(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_descriptive_submission(
        user_id=current_user.id,
        assignment_id=assignment_id,
        db=db,
    )


# =========================================================
# GET STUDENT BY ID
# =========================================================
#
# IMPORTANT:
# Keep this route AFTER the more specific routes above.
#
# Example:
# GET /students/5
# =========================================================

@router.get(
    "/{student_id}",
    response_model=StudentResponse,
)
def get_student_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    try:
        return get_student_by_id(
            db,
            student_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

@router.get(
    "/descriptive-assignments/token/{token}"
)
def get_descriptive_assignment_by_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # =====================================================
    # FIND STUDENT
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == current_user.id,
            Student.is_active == True,
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # =====================================================
    # FIND SUBMISSION USING SECURE TOKEN
    # =====================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.token == token,
            DescriptiveSubmission.student_id == student.id,
        )
        .first()
    )

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Invalid assignment link or assignment not assigned to you.",
        )

    # =====================================================
    # FIND ASSIGNMENT
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id
            == submission.assignment_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found.",
        )

    # =====================================================
    # CHECK ASSIGNMENT STATUS
    # =====================================================

    if assignment.status != "Published":
        raise HTTPException(
            status_code=400,
            detail="This assignment is not currently available.",
        )

    # =====================================================
    # CHECK DUE DATE
    # =====================================================

    if (
        assignment.due_date
        and datetime.utcnow() > assignment.due_date.replace(tzinfo=None)
    ):
        raise HTTPException(
            status_code=400,
            detail="The due date for this assignment has passed.",
        )

 
 

    # =====================================================
# CHECK SUBMISSION STATUS
# =====================================================

    if submission.status == "Submitted":
     raise HTTPException(
        status_code=400,
        detail="This assignment has already been submitted.",
    )

    # =====================================================
# CALCULATE EXAM EXPIRY
# =====================================================

    from datetime import timedelta, timezone

    expires_at = None

    if assignment.duration_minutes:

     started_at = submission.started_at

    if started_at:

        if started_at.tzinfo is None:
            started_at_utc = started_at.replace(
                tzinfo=timezone.utc
            )
        else:
            started_at_utc = started_at.astimezone(
                timezone.utc
            )

        expires_at = (
            started_at_utc
            + timedelta(
                minutes=assignment.duration_minutes
            )
        )
    

    # =====================================================
    # PREPARE QUESTIONS
    # =====================================================

    questions = []

    for question in assignment.questions:

        questions.append(
            {
                "question_id": question.id,
                "question_order": question.question_order,
                "question_text": question.question_text,
                "max_marks": question.max_marks,
            }
        )

    # =====================================================
    # RETURN ASSIGNMENT
    # =====================================================

    return {
    "submission_id": submission.id,
    "assignment_id": assignment.id,

    "title": assignment.title,

    "instructions": assignment.instructions,

    "due_date": assignment.due_date,

    # =====================================================
    # PDF QUESTION PAPER
    # =====================================================

    "question_pdf_url": assignment.question_pdf_url,
    "question_pdf_name": assignment.question_pdf_name,

    "status": submission.status,

    "evaluation_status": submission.evaluation_status,

    "started_at": submission.started_at,
    "duration_minutes": assignment.duration_minutes,

    "expires_at": expires_at,

    "questions": questions,
}
# =========================================================
# START DESCRIPTIVE ASSIGNMENT
# =========================================================

@router.post(
    "/descriptive-assignments/{assignment_id}/start"
)
def start_student_descriptive_assignment(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    try:

        submission = start_descriptive_assignment(
            db=db,
            current_user=current_user,
            assignment_id=assignment_id,
        )

        return {
            "submission_id": submission.id,
            "assignment_id": submission.assignment_id,
            "status": submission.status,
            "started_at": submission.started_at,
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
# =========================================================
# SUBMIT DESCRIPTIVE ASSIGNMENT ANSWER PDF
# =========================================================
@router.post(
    "/descriptive-assignments/{assignment_id}/submit-pdf",
    response_model=DescriptiveSubmissionResponse,
)
async def submit_student_descriptive_assignment_pdf(
    assignment_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):

    # =====================================================
    # FIND STUDENT
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == current_user.id,
            Student.is_active == True,
        )
        .first()
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # =====================================================
    # VALIDATE FILE
    # =====================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )
    # =====================================================
    # READ + VALIDATE ANSWER PDF
    # =====================================================

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    file_content = await file.read()

    # -----------------------------------------------------
    # Check empty file
    # -----------------------------------------------------

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded PDF is empty.",
        )

    # -----------------------------------------------------
    # Check file size
    # -----------------------------------------------------

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                "Answer PDF is too large. "
                "Maximum allowed size is 10 MB."
            ),
        )

    # -----------------------------------------------------
    # Validate actual PDF content
    # -----------------------------------------------------

    try:
        pdf_document = fitz.open(
            stream=file_content,
            filetype="pdf",
        )

        if pdf_document.page_count == 0:
            pdf_document.close()
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF contains no pages.",
            )

        pdf_document.close()

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        )

    # =====================================================
    # FIND ASSIGNMENT
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id
            == assignment_id
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=404,
            detail="Assignment not found.",
        )

    # =====================================================
    # CHECK PUBLISHED
    # =====================================================

    if assignment.status != "Published":

        raise HTTPException(
            status_code=400,
            detail=(
                "This assignment is not currently available."
            ),
        )

    # =====================================================
    # CHECK DUE DATE
    # =====================================================

    if (
        assignment.due_date
        and datetime.utcnow()
        > assignment.due_date.replace(
            tzinfo=None
        )
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "The due date for this assignment "
                "has passed."
            ),
        )

    # =====================================================
    # FIND SUBMISSION
    # =====================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.assignment_id
            == assignment.id,

            DescriptiveSubmission.student_id
            == student.id,
        )
        .first()
    )

    if not submission:

        raise HTTPException(
            status_code=403,
            detail=(
                "This assignment is not assigned to you."
            ),
        )

    # =====================================================
    # PREVENT DUPLICATE SUBMISSION
    # =====================================================

    if submission.status == "Submitted":
        raise HTTPException(
            status_code=400,
            detail=(
                "This assignment has already been submitted."
            ),
        )

    # =====================================================
    # CREATE UPLOAD DIRECTORY
    # =====================================================

    upload_dir = (
        "uploads/descriptive_answers"
    )

    os.makedirs(
        upload_dir,
        exist_ok=True,
    )

    # =====================================================
    # UNIQUE FILE NAME
    # =====================================================

    unique_file_name = (
        f"{uuid.uuid4().hex}.pdf"
    )

    file_path = os.path.join(
        upload_dir,
        unique_file_name,
    )

    # =====================================================
    # SAVE PDF
    # =====================================================

    try:

        with open(
            file_path,
            "wb",
        ) as buffer:

            buffer.write(
                file_content
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save answer PDF: "
                f"{str(e)}"
            ),
        )

    # =====================================================
    # CREATE URL
    # =====================================================

    answer_pdf_url = (
        f"/uploads/descriptive_answers/"
        f"{unique_file_name}"
    )

    # =====================================================
    # UPDATE SUBMISSION
    # =====================================================

    submission.answer_pdf_url = (
        answer_pdf_url
    )

    submission.answer_pdf_name = (
        file.filename
    )

    submission.status = "Submitted"

    submission.evaluation_status = (
        "Pending"
    )

    submission.submitted_at = (
        datetime.utcnow()
    )

    if submission.started_at is None:

        submission.started_at = (
            datetime.utcnow()
        )

    db.commit()

    db.refresh(submission)

    # =====================================================
    # ⭐ PDF AI EVALUATION
    # =====================================================

    try:

        print(
            "\n=========================================="
        )

        print(
            "STARTING PDF DESCRIPTIVE EVALUATION"
        )

        print(
            f"Submission ID: {submission.id}"
        )

        print(
            f"Assignment ID: {assignment.id}"
        )

        print(
            "==========================================\n"
        )

        evaluate_descriptive_pdf_submission(
            submission_id=submission.id,
            db=db,
        )

    except Exception as e:

        print(
            "\n=========================================="
        )

        print(
            "PDF DESCRIPTIVE EVALUATION FAILED"
        )

        print(
            f"Submission ID: {submission.id}"
        )

        print(
            f"Error: {e}"
        )

        print(
            "==========================================\n"
        )

        submission.evaluation_status = (
            "Failed"
        )

        db.commit()

    # =====================================================
    # REFRESH AFTER EVALUATION
    # =====================================================

    db.refresh(submission)

    # =====================================================
    # RETURN
    # =====================================================

    return {
        "id": submission.id,

        "assignment_id": (
            submission.assignment_id
        ),

        "student_id": (
            submission.student_id
        ),

        "status": submission.status,

        "total_marks": (
            submission.total_marks
        ),

        "obtained_marks": (
            submission.obtained_marks
        ),

        "percentage": (
            submission.percentage
        ),

        "evaluation_status": (
            submission.evaluation_status
        ),

        "answer_pdf_url": (
            submission.answer_pdf_url
        ),

        "answer_pdf_name": (
            submission.answer_pdf_name
        ),

        "submitted_at": (
            submission.submitted_at
        ),

        "message": (
            "Answer PDF submitted and "
            "processed successfully."
        ),
    }

@router.get(
    "/quizzes/{quiz_id}/performance"
)
def get_student_quiz_performance_api(
    quiz_id: int,
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_quiz_performance(
        user_id=current_user.id,
        quiz_id=quiz_id,
        db=db,
    )

# ============================================================
# STUDENT DESCRIPTIVE ASSIGNMENT PERFORMANCE
# ============================================================

@router.get(
    "/descriptive-assignments/{assignment_id}/performance"
)
def get_student_descriptive_assignment_performance_api(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.STUDENT)
    ),
    db: Session = Depends(get_db),
):
    return get_student_descriptive_assignment_performance(
        user_id=current_user.id,
        assignment_id=assignment_id,
        db=db,
    )
 