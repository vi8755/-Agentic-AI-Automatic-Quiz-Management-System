from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Section,Batch
from ..schemas import (
    SectionCreate,
    SectionAssignmentItem,
    SectionAssignmentsResponse,
)

def create_section(
    db: Session,
    section: SectionCreate,
):

    # ========================================================
    # FIND BATCH
    # ========================================================

    batch = (
        db.query(Batch)
        .filter(
            Batch.id == section.batch_id,
            Batch.is_active == True,
        )
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found or inactive.",
        )

    # ========================================================
    # BATCH DEPARTMENT MUST MATCH SECTION DEPARTMENT
    # ========================================================

    if (
        batch.department.strip().upper()
        != section.department.strip().upper()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Section department must match "
                "the batch department."
            ),
        )

    # ========================================================
    # YEAR + SEMESTER VALIDATION
    # ========================================================

    valid_semesters = {
        1: [1, 2],
        2: [3, 4],
        3: [5, 6],
        4: [7, 8],
    }

    if section.year not in valid_semesters:
        raise HTTPException(
            status_code=400,
            detail="Year must be between 1 and 4.",
        )

    if section.semester not in valid_semesters[section.year]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Semester {section.semester} "
                f"is not valid for Year {section.year}. "
                f"Year {section.year} allows "
                f"Semester "
                f"{valid_semesters[section.year][0]} "
                f"and "
                f"{valid_semesters[section.year][1]}."
            ),
        )

    # ========================================================
    # DUPLICATE SECTION
    # ========================================================

    existing_section = (
        db.query(Section)
        .filter(
            Section.batch_id == section.batch_id,
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
            detail="Section already exists in this batch.",
        )

    # ========================================================
    # CREATE SECTION
    # ========================================================

    new_section = Section(
        section_name=section.section_name,
        department=section.department,
        year=section.year,
        semester=section.semester,
        batch_id=section.batch_id,
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
