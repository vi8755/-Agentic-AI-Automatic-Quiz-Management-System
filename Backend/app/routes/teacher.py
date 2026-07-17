from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..schemas import TeacherCreate, TeacherResponse
from ..services.teacher_service import create_teacher
from ..services.teacher_service import (
    create_teacher,
    get_teacher_assignments,
)
from ..schemas import (
    TeacherCreate,
    TeacherResponse,
    TeacherAssignmentsResponse,
)

router = APIRouter(
    prefix="/teachers",
    tags=["Teachers"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=TeacherResponse,
)
def create_teacher_api(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_teacher(db, teacher)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

@router.get(
    "/{teacher_id}/assignments",
    response_model=TeacherAssignmentsResponse,
)
def get_teacher_assignments_api(
    teacher_id: int,
    db: Session = Depends(get_db),
):
    try:
        return get_teacher_assignments(db, teacher_id)

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )