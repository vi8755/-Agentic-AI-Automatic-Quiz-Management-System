from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..schemas import (
    SectionCreate,
    SectionResponse,
    SectionAssignmentsResponse,
)
from ..services.section_service import (
    create_section,
    get_section_assignments,
)
from ..models import User, UserRole
from ..security import require_role

router = APIRouter(
    prefix="/sections",
    tags=["Sections"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=SectionResponse,
)
def add_section(
    section: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),

):
    return create_section(db, section)

@router.get(
    "/{section_id}/assignments",
    response_model=SectionAssignmentsResponse,
)
def get_section_assignments_api(
    section_id: int,
    db: Session = Depends(get_db),
):
    try:
        return get_section_assignments(
            db,
            section_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )