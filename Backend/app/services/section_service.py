from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Section
from ..schemas import (
    SectionCreate,
    SectionAssignmentItem,
    SectionAssignmentsResponse,
)


def create_section(db: Session, section: SectionCreate):

    # Check duplicate section
    existing_section = (
        db.query(Section)
        .filter(
            Section.department == section.department,
            Section.year == section.year,
            Section.semester == section.semester,
            Section.section_name == section.section_name,
        )
        .first()
    )

    if existing_section:
        raise HTTPException(
            status_code=400,
            detail="Section already exists.",
        )

    new_section = Section(
        section_name=section.section_name,
        department=section.department,
        year=section.year,
        semester=section.semester,
    )

    db.add(new_section)
    db.commit()
    db.refresh(new_section)

    return new_section


def get_section_assignments(
    db: Session,
    section_id: int,
):

    section = (
        db.query(Section)
        .filter(Section.id == section_id)
        .first()
    )

    if not section:
        raise ValueError("Section not found.")

    assignments = []

    for assignment in section.teacher_sections:

        assignments.append(
            SectionAssignmentItem(
                teacher_name=assignment.teacher.user.name,
                employee_id=assignment.teacher.employee_id,
                subject_name=assignment.subject.subject_name,
                academic_year=assignment.academic_year,
            )
        )

    return SectionAssignmentsResponse(
        section_id=section.id,
        section_name=section.section_name,
        department=section.department,
        year=section.year,
        semester=section.semester,
        assignments=assignments,
    )
