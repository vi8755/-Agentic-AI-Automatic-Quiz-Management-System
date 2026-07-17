from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Subject
from ..schemas import (
    SubjectCreate,
    SubjectAssignmentItem,
    SubjectAssignmentsResponse,
)


def create_subject(db: Session, subject: SubjectCreate):

    # Check duplicate subject code
    existing_subject = (
        db.query(Subject)
        .filter(
            Subject.subject_code == subject.subject_code
        )
        .first()
    )

    if existing_subject:
        raise HTTPException(
            status_code=400,
            detail="Subject code already exists.",
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


def get_subject_assignments(
    db: Session,
    subject_id: int,
):
    subject = (
        db.query(Subject)
        .filter(Subject.id == subject_id)
        .first()
    )

    if not subject:
        raise ValueError("Subject not found.")

    assignments = []

    for assignment in subject.teacher_sections:
        assignments.append(
            SubjectAssignmentItem(
                teacher_name=assignment.teacher.user.name,
                employee_id=assignment.teacher.employee_id,
                section_name=assignment.section.section_name,
                academic_year=assignment.academic_year,
            )
        )

    return SubjectAssignmentsResponse(
        subject_id=subject.id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        department=subject.department,
        semester=subject.semester,
        assignments=assignments,
    )