from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import (
    Teacher,
    Section,
    Subject,
    TeacherSection,
)
from ..schemas import TeacherSectionCreate


def create_teacher_section(
    db: Session,
    assignment: TeacherSectionCreate,
):

    # 1. Check Teacher
    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.id == assignment.teacher_id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found.",
        )

    # 2. Check Section
    section = (
        db.query(Section)
        .filter(
            Section.id == assignment.section_id
        )
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=404,
            detail="Section not found.",
        )

    # 3. Check Subject
    subject = (
        db.query(Subject)
        .filter(
            Subject.id == assignment.subject_id
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found.",
        )

    # 4. Check Duplicate Assignment
    existing = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id == assignment.teacher_id,
            TeacherSection.section_id == assignment.section_id,
            TeacherSection.subject_id == assignment.subject_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Assignment already exists.",
        )

    # 5. Create Assignment
    new_assignment = TeacherSection(
        teacher_id=assignment.teacher_id,
        section_id=assignment.section_id,
        subject_id=assignment.subject_id,
        academic_year=assignment.academic_year,
    )

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment