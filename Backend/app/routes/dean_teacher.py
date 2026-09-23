from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.schemas import (
    DeanTeacherListResponse,
    DeanTeacherProfileResponse,
    TeacherStatusUpdate,
    TeacherRegistrationCreate,
    TeacherResponse,
    TeacherSectionAssignmentCreate,
)
from app.models import User, UserRole
from app.security import require_role

from app.services.dean_teacher_service import (
     get_all_teachers,
    get_teacher_profile,
    update_teacher_status,
    delete_teacher,
    register_teacher,
    get_teacher_assignments,
    assign_teacher_sections,
    remove_teacher_section_assignment,

)


router = APIRouter(
    prefix="/dean/teachers",
    tags=["Dean Teacher Management"],
)


# =========================================================
# Get All Teachers
# =========================================================

@router.get(
    "",
    response_model=DeanTeacherListResponse,
)
def teachers(
    search: str | None = None,
    department: str | None = None,
    designation: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    return get_all_teachers(
        db=db,
        search=search,
        department=department,
        designation=designation,
        status=status,
        page=page,
        limit=limit,
    )


# =========================================================
# Register Teacher
# =========================================================

@router.post(
    "",
    response_model=TeacherResponse,
    status_code=201,
)
def add_teacher(
    teacher: TeacherRegistrationCreate,
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
    db: Session = Depends(get_db),
):
    try:
        return register_teacher(
            db=db,
            teacher=teacher,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

# =========================================================
# Get Teacher Section Assignments
# =========================================================

@router.get(
    "/{teacher_id}/assignments"
)
def teacher_assignments(
    teacher_id: int,
    db: Session = Depends(get_db),
):
    return get_teacher_assignments(
        db=db,
        teacher_id=teacher_id,
    )

# =========================================================
# Assign Teacher to Multiple Sections
# =========================================================

@router.post(
    "/{teacher_id}/assignments"
)
def assign_sections(
    teacher_id: int,
    payload: TeacherSectionAssignmentCreate,
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
    db: Session = Depends(get_db),
):
    return assign_teacher_sections(
        db=db,
        teacher_id=teacher_id,
        subject_id=payload.subject_id,
        section_ids=payload.section_ids,
        academic_year=payload.academic_year,
    )

# =========================================================
# Remove Teacher Section Assignment
# =========================================================

@router.delete(
    "/{teacher_id}/assignments/{assignment_id}"
)
def remove_section_assignment(
    teacher_id: int,
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
    db: Session = Depends(get_db),
):
    return remove_teacher_section_assignment(
        db=db,
        teacher_id=teacher_id,
        assignment_id=assignment_id,
    )
# =========================================================
# Get Teacher Profile
# =========================================================

@router.get(
    "/{teacher_id}",
    response_model=DeanTeacherProfileResponse,
)
def teacher_profile(
    teacher_id: int,
    db: Session = Depends(get_db),
):
    return get_teacher_profile(
        db,
        teacher_id,
    )


# =========================================================
# Activate / Deactivate Teacher
# =========================================================

@router.patch(
    "/{teacher_id}/status"
)
def teacher_status(
    teacher_id: int,
    payload: TeacherStatusUpdate,
    db: Session = Depends(get_db),
):
    return update_teacher_status(
        db=db,
        teacher_id=teacher_id,
        is_active=payload.is_active,
    )


# =========================================================
# Delete Teacher
# =========================================================

@router.delete(
    "/{teacher_id}"
)
def remove_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
):
    return delete_teacher(
        db=db,
        teacher_id=teacher_id,
    )