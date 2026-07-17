from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..schemas import (
    SubjectCreate,
    SubjectResponse,
    SubjectAssignmentsResponse,
)
from ..services.subject_service import (
    create_subject,
    get_subject_assignments,
)

router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=SubjectResponse,
)
def add_subject(
    subject: SubjectCreate,
    db: Session = Depends(get_db),
):
    return create_subject(db, subject)

@router.get(
    "/{subject_id}/assignments",
    response_model=SubjectAssignmentsResponse,
)
def get_subject_assignments_api(
    subject_id: int,
    db: Session = Depends(get_db),
):
    try:
        return get_subject_assignments(
            db,
            subject_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )