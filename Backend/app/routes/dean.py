from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal

from ..security import require_role
from ..schemas import (
      DeanDashboardResponse,
    SectionCreate,
    SectionResponse,
    SectionUpdate,
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    StudentCreate,
    StudentUpdate,
    StudentStatusUpdate,
    StudentResponse,
    DeanQuizResponse,
    DeanQuizListResponse,
    DeanQuizDetailResponse,
  


)
from io import BytesIO

import pandas as pd

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from fastapi.responses import StreamingResponse

from openpyxl import Workbook

from sqlalchemy.orm import Session

from ..database import SessionLocal

from ..models import (
    User,
    UserRole,
    Section,
    Subject,
    TeacherSection,
    Student,
    QuizAssignment,
     Response,
     Quiz,
Question,
Batch,
)

from ..security import (
    require_role,
    hash_password,
)
from ..services.dean_service import get_dashboard_data
from ..services.dean_subject_service import (
    get_all_subjects,
    create_subject,
    update_subject,
    update_subject_status,
    delete_subject,
)
from ..services.dean_quiz_service import (
    get_all_dean_quizzes,
    get_dean_quiz_detail,
)
from ..services.dean_attempt_service import (
    get_dean_attempt_analytics,
)
from ..services.dean_analytics_service import (
    get_dean_analytics_data,
)
from ..services.section_service import create_section
router = APIRouter(
    prefix="/dean",
    tags=["Dean"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get(
    "/dashboard",
    response_model=DeanDashboardResponse,
)
def get_dean_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    return get_dashboard_data(db)

@router.get("/sections")
def get_dean_sections(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    sections = (
        db.query(Section)
        .order_by(Section.section_name)
        .all()
    )

    return [
    {
        "id": section.id,
        "section_name": section.section_name,
        "department": section.department,

        "year": section.year,
        "semester": section.semester,

        "batch_id": section.batch_id,
        "batch_name": (
            section.batch.batch_name
            if section.batch
            else None
        ),

        "is_active": section.is_active,

        "created_at": section.created_at,
        "updated_at": section.updated_at,
    }
    for section in sections
]
    
@router.post(
    "/sections",
    response_model=SectionResponse,
)
def create_dean_section(
    section: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return create_section(db, section)
@router.patch(
    "/sections/{section_id}",
    response_model=SectionResponse,
)
def update_dean_section(
    section_id: int,
    section: SectionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    # ============================================================
    # FIND SECTION
    # ============================================================

    existing_section = (
        db.query(Section)
        .filter(Section.id == section_id)
        .first()
    )

    if not existing_section:
        raise HTTPException(
            status_code=404,
            detail="Section not found.",
        )

    # ============================================================
    # CHECK WHETHER STUDENTS ARE ASSIGNED
    #
    # If students already belong to this section, we should
    # protect its academic structure.
    # ============================================================

    has_students = (
        db.query(Student)
        .filter(
            Student.section_id == existing_section.id
        )
        .first()
        is not None
    )

    # ============================================================
    # DETERMINE FINAL VALUES
    #
    # If a field is not provided, keep the existing value.
    # ============================================================

    new_section_name = (
        section.section_name.strip()
        if section.section_name is not None
        else existing_section.section_name
    )

    new_department = (
        section.department.strip()
        if section.department is not None
        else existing_section.department
    )

    new_year = (
        section.year
        if section.year is not None
        else existing_section.year
    )

    new_semester = (
        section.semester
        if section.semester is not None
        else existing_section.semester
    )

    # ============================================================
    # PROTECT ACADEMIC STRUCTURE IF STUDENTS EXIST
    #
    # Section name can still be changed.
    # Department / Year / Semester cannot.
    # ============================================================

    if has_students:

        academic_structure_changed = (
            new_department != existing_section.department
            or new_year != existing_section.year
            or new_semester != existing_section.semester
        )

        if academic_structure_changed:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cannot change the department, year, or "
                    "semester of this section because students "
                    "are already assigned to it. Move the "
                    "students to another section first."
                ),
            )

    # ============================================================
    # YEAR + SEMESTER VALIDATION
    #
    # Year 1 → Semester 1, 2
    # Year 2 → Semester 3, 4
    # Year 3 → Semester 5, 6
    # Year 4 → Semester 7, 8
    # ============================================================

    valid_semesters = {
        1: [1, 2],
        2: [3, 4],
        3: [5, 6],
        4: [7, 8],
    }

    if new_year not in valid_semesters:
        raise HTTPException(
            status_code=400,
            detail="Year must be between 1 and 4.",
        )

    if new_semester not in valid_semesters[new_year]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Semester {new_semester} is not valid "
                f"for Year {new_year}. "
                f"Year {new_year} allows Semester "
                f"{valid_semesters[new_year][0]} and "
                f"{valid_semesters[new_year][1]}."
            ),
        )

    # ============================================================
    # FIND BATCH
    #
    # Section already has a batch_id.
    # We don't change batch_id from this endpoint yet.
    # ============================================================

    batch = (
        db.query(Batch)
        .filter(
            Batch.id == existing_section.batch_id,
            Batch.is_active == True,
        )
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found or inactive.",
        )

    # ============================================================
    # BATCH DEPARTMENT MUST MATCH SECTION DEPARTMENT
    # ============================================================

    if (
        batch.department.strip().upper()
        != new_department.strip().upper()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Section department must match "
                "the batch department."
            ),
        )

    # ============================================================
    # DUPLICATE SECTION CHECK
    # ============================================================

    duplicate_section = (
        db.query(Section)
        .filter(
            Section.id != existing_section.id,
            Section.batch_id == existing_section.batch_id,
            Section.department == new_department,
            Section.year == new_year,
            Section.semester == new_semester,
            Section.section_name == new_section_name,
        )
        .first()
    )

    if duplicate_section:
        raise HTTPException(
            status_code=400,
            detail=(
                "Another section with the same name "
                "already exists in this batch, year, "
                "and semester."
            ),
        )

    # ============================================================
    # UPDATE
    # ============================================================

    existing_section.section_name = new_section_name
    existing_section.department = new_department
    existing_section.year = new_year
    existing_section.semester = new_semester

    db.commit()
    db.refresh(existing_section)

    return existing_section
@router.get("/subjects")
def get_dean_subjects(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    subjects = (
        db.query(Subject)
        .order_by(Subject.subject_name)
        .all()
    )

    return [
        {
            "id": subject.id,
            "subject_code": subject.subject_code,
            "subject_name": subject.subject_name,
            "department": subject.department,
            "semester": subject.semester,
            "is_active": subject.is_active,
        }
        for subject in subjects
    ] 

@router.post(
    "/subjects",
    response_model=SubjectResponse,
    status_code=201,
)
def add_subject(
    subject: SubjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    try:
        return create_subject(
            db=db,
            subject=subject,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.put(
    "/subjects/{subject_id}",
    response_model=SubjectResponse,
)
def edit_subject(
    subject_id: int,
    subject: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    try:
        return update_subject(
            db=db,
            subject_id=subject_id,
            subject=subject,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.patch(
    "/subjects/{subject_id}/status",
)
def subject_status(
    subject_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    return update_subject_status(
        db=db,
        subject_id=subject_id,
        is_active=is_active,
    )


@router.delete(
    "/subjects/{subject_id}",
)
def remove_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    return delete_subject(
        db=db,
        subject_id=subject_id,
    )

@router.patch(
    "/sections/{section_id}/status",
)
def section_status(
    section_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    existing_section = (
        db.query(Section)
        .filter(Section.id == section_id)
        .first()
    )

    if not existing_section:
        raise HTTPException(
            status_code=404,
            detail="Section not found.",
        )

    existing_section.is_active = is_active

    db.commit()
    db.refresh(existing_section)

    return {
        "message": (
            "Section activated successfully."
            if is_active
            else "Section deactivated successfully."
        ),
        "id": existing_section.id,
        "is_active": existing_section.is_active,
    }
@router.delete(
    "/sections/{section_id}",
)
def delete_dean_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.DEAN)),
):
    existing_section = (
        db.query(Section)
        .filter(Section.id == section_id)
        .first()
    )

    if not existing_section:
        raise HTTPException(
            status_code=404,
            detail="Section not found.",
        )

    # Check teacher assignments
    teacher_assignment_exists = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.section_id == section_id
        )
        .first()
    )

    if teacher_assignment_exists:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete section because teachers "
                "are assigned to this section."
            ),
        )

    # Check students
    student_exists = (
        db.query(Student)
        .filter(
            Student.section_id == section_id
        )
        .first()
    )

    if student_exists:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete section because students "
                "are assigned to this section."
            ),
        )

    # Check quiz assignments
    quiz_assignment_exists = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.section_id == section_id
        )
        .first()
    )

    if quiz_assignment_exists:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete section because quiz "
                "assignments exist for this section."
            ),
        )

    db.delete(existing_section)
    db.commit()

    return {
        "message": "Section deleted successfully.",
        "id": section_id,
    }
# ============================================================
# TEACHER SECTIONS
# Used by Dean Quiz Management filters
# ============================================================

@router.get(
    "/teachers/{teacher_id}/sections"
)
def get_dean_teacher_sections(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(UserRole.DEAN)
    ),
):
    sections = (
        db.query(Section)
        .join(
            TeacherSection,
            TeacherSection.section_id == Section.id
        )
        .filter(
            TeacherSection.teacher_id == teacher_id
        )
        .order_by(
            Section.section_name
        )
        .all()
    )

    return [
        {
            "id": section.id,
            "section_name": section.section_name,
            "department": section.department,
            "year": section.year,
            "semester": section.semester,
            "is_active": section.is_active,
        }
        for section in sections
    ]
# ============================================================
# QUIZ MANAGEMENT
# ============================================================

@router.get(
    "/quizzes",
    response_model=DeanQuizListResponse,
)
def get_dean_quizzes(
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    status: str | None = None,

    teacher_id: int | None = None,
    subject_id: int | None = None,
    section_id: int | None = None,

    batch_id: int | None = None,
    year: int | None = None,
    semester: int | None = None,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(UserRole.DEAN)
    ),
):
    # --------------------------------------------------------
    # Validate pagination
    # --------------------------------------------------------

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than 0.",
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100.",
        )

    return get_all_dean_quizzes(
    db=db,
    page=page,
    limit=limit,
    search=search,
    status=status,
    teacher_id=teacher_id,
    subject_id=subject_id,
    section_id=section_id,

    batch_id=batch_id,
    year=year,
    semester=semester,

    )


# ============================================================
# QUIZ DETAILS
# ============================================================


@router.get(
    "/quizzes/{quiz_id}",
    response_model=DeanQuizDetailResponse,
)
def get_dean_quiz(
    quiz_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(UserRole.DEAN)
    ),
):
    quiz = get_dean_quiz_detail(
        db=db,
        quiz_id=quiz_id,
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    return quiz

# ============================================================
# DELETE QUIZ
# ============================================================

@router.delete(
    "/quizzes/{quiz_id}",
)
def delete_dean_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(UserRole.DEAN)
    ),
):
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    # --------------------------------------------------------
    # Delete quiz assignments
    # --------------------------------------------------------

    db.query(QuizAssignment).filter(
        QuizAssignment.quiz_id == quiz_id
    ).delete(
        synchronize_session=False
    )

    # --------------------------------------------------------
    # Delete responses / attempts
    # --------------------------------------------------------

    db.query(Response).filter(
        Response.quiz_id == quiz_id
    ).delete(
        synchronize_session=False
    )

    # --------------------------------------------------------
    # Delete questions
    # --------------------------------------------------------

    db.query(Question).filter(
        Question.quiz_id == quiz_id
    ).delete(
        synchronize_session=False
    )

    # --------------------------------------------------------
    # Delete quiz
    # --------------------------------------------------------

    db.delete(quiz)

    db.commit()

    return {
        "message": "Quiz deleted successfully.",
        "id": quiz_id,
    }
# ============================================================
# ATTEMPTS / PERFORMANCE ANALYTICS
# ============================================================

@router.get(
    "/attempts/analytics",
)
def get_dean_attempt_analytics_route(
    section_id: int | None = None,
    teacher_id: int | None = None,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(UserRole.DEAN)
    ),
):
    return get_dean_attempt_analytics(
        db=db,
        section_id=section_id,
        teacher_id=teacher_id,
    )

# ============================================================
# DEAN OVERALL ANALYTICS
# ============================================================

@router.get(
    "/analytics",
)
def get_dean_analytics(
    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(UserRole.DEAN)
    ),
):
    return get_dean_analytics_data(db)