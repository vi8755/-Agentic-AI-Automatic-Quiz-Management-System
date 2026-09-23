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

    # ========================================================
    # 1. CHECK TEACHER
    # ========================================================

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

    # ========================================================
    # 2. CHECK SECTION
    # ========================================================

    section = (
        db.query(Section)
        .filter(
            Section.id == assignment.section_id,
            Section.is_active == True,
        )
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=404,
            detail="Section not found or inactive.",
        )

    # ========================================================
    # 3. CHECK BATCH
    # ========================================================

    if (
        not section.batch
        or not section.batch.is_active
    ):
        raise HTTPException(
            status_code=404,
            detail="Batch not found or inactive.",
        )

    # ========================================================
    # 4. CHECK SUBJECT
    # ========================================================

    subject = (
        db.query(Subject)
        .filter(
            Subject.id == assignment.subject_id,
            Subject.is_active == True,
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found or inactive.",
        )

    # ========================================================
    # 5. CHECK DUPLICATE ASSIGNMENT
    # ========================================================

    existing = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id
            == assignment.teacher_id,

            TeacherSection.section_id
            == assignment.section_id,

            TeacherSection.subject_id
            == assignment.subject_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Assignment already exists.",
        )

    # ========================================================
    # 6. CREATE ASSIGNMENT
    # ========================================================

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