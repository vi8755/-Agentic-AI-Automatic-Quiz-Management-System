from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..schemas import (
    TeacherSectionCreate,
    TeacherSectionResponse,
)
from ..services.teacher_section_service import (
    create_teacher_section,
)

router = APIRouter(
    prefix="/teacher-sections",
    tags=["Teacher Sections"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=TeacherSectionResponse,
)
def assign_teacher(
    assignment: TeacherSectionCreate,
    db: Session = Depends(get_db),
):
    return create_teacher_section(
        db,
        assignment,
    )