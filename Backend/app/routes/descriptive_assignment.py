from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from ..database import SessionLocal

from ..models import (
    User,
    UserRole,
)

from ..security import require_role

from ..schemas import (
    DescriptiveAssignmentCreate,
    DescriptiveAssignmentResponse,
    DescriptiveAssignmentDetailResponse,
)

from ..services.descriptive_assignment_service import (
    get_teacher_id_from_user,
    create_descriptive_assignment,
    get_teacher_descriptive_assignments,
    get_teacher_descriptive_assignment,
    update_descriptive_assignment,
    publish_descriptive_assignment,
    unpublish_descriptive_assignment,
    delete_descriptive_assignment,
)


router = APIRouter(
    prefix="/teachers/descriptive-assignments",
    tags=["Teacher Descriptive Assignments"],
)


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# CREATE ASSIGNMENT
# =========================================================

@router.post(
    "",
    response_model=DescriptiveAssignmentResponse,
)
def create_assignment(
    assignment_data: DescriptiveAssignmentCreate,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        return create_descriptive_assignment(
            db=db,
            current_user=current_user,
            assignment_data=assignment_data,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )



# =========================================================
# Get Teacher Assignments
# =========================================================

@router.get(
    "",
    response_model=list[DescriptiveAssignmentResponse],
)
def get_assignments(
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        return get_teacher_descriptive_assignments(
            db=db,
            current_user=current_user,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# =========================================================
# GET ASSIGNMENT DETAIL
# =========================================================

@router.get(
    "/{assignment_id}",
    response_model=DescriptiveAssignmentDetailResponse,
)
def get_assignment(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        teacher_id = get_teacher_id_from_user(
            db=db,
            current_user=current_user,
        )

        assignment = get_teacher_descriptive_assignment(
            db=db,
            current_user=current_user,
            assignment_id=assignment_id,
        )

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Descriptive assignment not found.",
            )

        return assignment

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# =========================================================
# UPDATE ASSIGNMENT
# =========================================================

@router.put(
    "/{assignment_id}",
    response_model=DescriptiveAssignmentResponse,
)
def update_assignment(
    assignment_id: int,
    assignment_data: DescriptiveAssignmentCreate,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        teacher_id = get_teacher_id_from_user(
            db=db,
            current_user=current_user,
        )

        return update_descriptive_assignment(
            db=db,
            current_user=current_user,
            assignment_id=assignment_id,
            assignment_data=assignment_data,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# PUBLISH ASSIGNMENT
# =========================================================

@router.patch(
    "/{assignment_id}/publish",
    response_model=DescriptiveAssignmentResponse,
)
def publish_assignment(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        teacher_id = get_teacher_id_from_user(
            db=db,
            current_user=current_user,
        )

        return publish_descriptive_assignment(
            db=db,
            current_user=current_user,
            assignment_id=assignment_id,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# MOVE PUBLISHED ASSIGNMENT TO DRAFT
# =========================================================

@router.patch(
    "/{assignment_id}/draft",
    response_model=DescriptiveAssignmentResponse,
)
def move_assignment_to_draft(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        teacher_id = get_teacher_id_from_user(
            db=db,
            current_user=current_user,
        )

        return unpublish_descriptive_assignment(
            db=db,
            current_user=current_user,
            assignment_id=assignment_id,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# =========================================================
# DELETE ASSIGNMENT
# =========================================================

@router.delete(
    "/{assignment_id}",
)
def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        teacher_id = get_teacher_id_from_user(
            db=db,
            current_user=current_user,
        )

        return delete_descriptive_assignment(
            db=db,
            current_user=current_user,
            assignment_id=assignment_id,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )