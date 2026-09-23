from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Subject
from app.schemas import SubjectCreate, SubjectUpdate


def get_all_subjects(db: Session):
    subjects = (
        db.query(Subject)
        .order_by(Subject.subject_name)
        .all()
    )

    return subjects


def create_subject(
    db: Session,
    subject: SubjectCreate,
):
    # Check duplicate subject code
    existing_subject = (
        db.query(Subject)
        .filter(
            Subject.subject_code == subject.subject_code
        )
        .first()
    )

    if existing_subject:
        raise ValueError(
            "Subject code already exists."
        )

    new_subject = Subject(
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        department=subject.department,
        semester=subject.semester,
    )

    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)

    return new_subject


def update_subject(
    db: Session,
    subject_id: int,
    subject: SubjectUpdate,
):
    existing_subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id)
        .first()
    )

    if not existing_subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found."
        )

    # Check duplicate subject code
    duplicate = (
        db.query(Subject)
        .filter(
            Subject.subject_code == subject.subject_code,
            Subject.id != subject_id,
        )
        .first()
    )

    if duplicate:
        raise ValueError(
            "Subject code already exists."
        )

    existing_subject.subject_code = subject.subject_code
    existing_subject.subject_name = subject.subject_name
    existing_subject.department = subject.department
    existing_subject.semester = subject.semester

    db.commit()
    db.refresh(existing_subject)

    return existing_subject


def update_subject_status(
    db: Session,
    subject_id: int,
    is_active: bool,
):
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id)
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found."
        )

    subject.is_active = is_active

    db.commit()
    db.refresh(subject)

    return subject


def delete_subject(
    db: Session,
    subject_id: int,
):
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id)
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found."
        )

    # Don't delete if subject is being used
    if subject.teacher_sections:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete subject because "
                "teacher assignments exist."
            ),
        )

    db.delete(subject)
    db.commit()

    return {
        "message": "Subject deleted successfully."
    }