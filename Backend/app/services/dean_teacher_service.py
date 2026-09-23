from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import (
    Teacher,
    User,
    UserRole,
    TeacherSection,
    Section,
    Subject,
)
from ..services.auth_service import send_email_verification
from fastapi import HTTPException
from app.schemas import (
    TeacherRegistrationCreate,
    TeacherResponse,
    UserCreate,
)
from app.services.user_service import create_user
import secrets
def get_all_teachers(
    db: Session,
    search=None,
    department=None,
    designation=None,
    status=None,
    page=1,
    limit=10,
):

    query = db.query(Teacher)


    if search:

     query = (
        query
        .join(User)
        .filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                Teacher.employee_id.ilike(f"%{search}%")
            )
        )
    )

# -------------------------
# Department Filter
# -------------------------
    if department:
     query = query.filter(
        Teacher.department.ilike(f"%{department}%")
    )

# -------------------------
# Designation Filter
# -------------------------
    if designation:
     query = query.filter(
        Teacher.designation.ilike(f"%{designation}%")
    )

# -------------------------
# Status Filter
# -------------------------
    if status:

     is_active = status.lower() == "active"

     query = query.filter(
        Teacher.is_active == is_active
    )

    total = query.count()

    teachers = (
    query
    .offset((page - 1) * limit)
    .limit(limit)
    .all()
    )


    result = []


    for teacher in teachers:

        sections = []
        subjects = []


        for assignment in teacher.teacher_sections:

            if assignment.section:
                sections.append(
                    assignment.section.section_name
                )


            if assignment.subject:
                subjects.append(
                    assignment.subject.subject_name
                )


        result.append({

            "id": teacher.id,

            "name": teacher.user.name,

            "email": teacher.user.email,

            "employee_id": teacher.employee_id,

            "department": teacher.department,

            "designation": teacher.designation,

            "phone": teacher.phone,

            "status":
                "Active"
                if teacher.is_active
                else "Inactive",

            "sections": list(set(sections)),

            "subjects": list(set(subjects)),

            "created_at": teacher.created_at
        })


    return {

    "items": result,

    "total": total,

    "page": page,

    "limit": limit,

    "total_pages": (
        total + limit - 1
    ) // limit

}

def get_teacher_profile(
    db: Session,
    teacher_id: int,
):

    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    sections = []
    subjects = []

    for assignment in teacher.teacher_sections:

        if assignment.section:
            sections.append(
                assignment.section.section_name
            )

        if assignment.subject:
            subjects.append(
                assignment.subject.subject_name
            )

    return {

        "id": teacher.id,

        "name": teacher.user.name,

        "email": teacher.user.email,

        "employee_id": teacher.employee_id,

        "department": teacher.department,

        "designation": teacher.designation,

        "phone": teacher.phone,

        "status": (
            "Active"
            if teacher.is_active
            else "Inactive"
        ),

        "sections": list(set(sections)),

        "subjects": list(set(subjects)),

        "quiz_count": len(teacher.quizzes),

        "created_at": teacher.created_at,
    }

def update_teacher_status(
    db: Session,
    teacher_id: int,
    is_active: bool,
):

    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    teacher.is_active = is_active

    db.commit()
    db.refresh(teacher)

    return {
        "message": (
            "Teacher activated successfully."
            if is_active
            else "Teacher deactivated successfully."
        )
    }

def can_delete_teacher(teacher: Teacher):

    if teacher.teacher_sections:
        return (
            False,
            "Cannot delete teacher because sections are assigned."
        )

    if teacher.quiz_assignments:
        return (
            False,
            "Cannot delete teacher because quiz assignments exist."
        )

    if teacher.quizzes:
        return (
            False,
            "Cannot delete teacher because quizzes are associated with this account."
        )

    return True, None


def delete_teacher(
    db: Session,
    teacher_id: int,
):

    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    can_delete, reason = can_delete_teacher(teacher)

    if not can_delete:
        raise HTTPException(
            status_code=400,
            detail=reason,
        )

    db.delete(teacher)
    db.commit()

    return {
        "message": "Teacher deleted successfully."
    }

def register_teacher(
    db: Session,
    teacher: TeacherRegistrationCreate,
) -> TeacherResponse:
    """
    Register a new teacher and assign them
    to a section and subject.
    """

    # ---------------------------------
    # 1. Check duplicate Employee ID
    # ---------------------------------

    existing_employee = (
        db.query(Teacher)
        .filter(
            Teacher.employee_id == teacher.employee_id
        )
        .first()
    )

    if existing_employee:
        raise ValueError(
            "Employee ID already exists."
        )

    # ---------------------------------
    # 2. Validate Section
    # ---------------------------------

    section = (
        db.query(Section)
        .filter(
            Section.id == teacher.section_id,
            Section.is_active == True,
        )
        .first()
    )

    if not section:
        raise ValueError(
            "Selected section does not exist or is inactive."
        )

    # ---------------------------------
    # 3. Validate Subject
    # ---------------------------------

    subject = (
        db.query(Subject)
        .filter(
            Subject.id == teacher.subject_id,
            Subject.is_active == True,
        )
        .first()
    )

    if not subject:
        raise ValueError(
            "Selected subject does not exist or is inactive."
        )

    try:

        # ---------------------------------
        # 4. Create User
        # ---------------------------------

        temporary_password = secrets.token_urlsafe(10)

        new_user = create_user(
          db=db,
          user=UserCreate(
            name=teacher.name,
            email=teacher.email,
            password=temporary_password,
            role=UserRole.TEACHER,
    ),
)

        new_user.email_verified = False
        # ---------------------------------
        # 5. Create Teacher Profile
        # ---------------------------------

        new_teacher = Teacher(
            user_id=new_user.id,
            employee_id=teacher.employee_id,
            department=teacher.department,
            designation=teacher.designation,
            phone=teacher.phone,
        )

        db.add(new_teacher)

        # Generate teacher.id
        db.flush()

        # ---------------------------------
        # 6. Create Teacher-Section-
        #    Subject Assignment
        # ---------------------------------

        assignment = TeacherSection(
            teacher_id=new_teacher.id,
            section_id=teacher.section_id,
            subject_id=teacher.subject_id,
            academic_year=teacher.academic_year,
            is_active=True,
        )

        db.add(assignment)

        # ---------------------------------
        # 7. Commit everything together
        # ---------------------------------

        db.commit()

        # ---------------------------------
        # 8. Refresh Teacher
        # ---------------------------------

        db.refresh(new_teacher)
        send_email_verification(
          db,
         new_user,
        temporary_password=temporary_password,
        )

        # ---------------------------------
        # 9. Return Response
        # ---------------------------------

        return TeacherResponse(
            id=new_teacher.id,
            user_id=new_teacher.user_id,
            name=new_user.name,
            email=new_user.email,
            employee_id=new_teacher.employee_id,
            department=new_teacher.department,
            designation=new_teacher.designation,
            phone=new_teacher.phone,
            is_active=new_teacher.is_active,
        )

    except Exception:
        db.rollback()
        raise

def get_teacher_assignments(
    db: Session,
    teacher_id: int,
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    assignments = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id == teacher_id,
            TeacherSection.is_active == True,
        )
        .all()
    )

    return [
        {
            "id": assignment.id,
            "teacher_id": assignment.teacher_id,
            "section_id": assignment.section_id,
            "section_name": assignment.section.section_name,
            "subject_id": assignment.subject_id,
            "subject_name": assignment.subject.subject_name,
            "academic_year": assignment.academic_year,
            "is_active": assignment.is_active,
        }
        for assignment in assignments
    ]


def assign_teacher_sections(
    db: Session,
    teacher_id: int,
    subject_id: int,
    section_ids: list[int],
    academic_year: str,
):
    # ---------------------------------
    # 1. Validate teacher
    # ---------------------------------

    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    # ---------------------------------
    # 2. Validate subject
    # ---------------------------------

    subject = (
        db.query(Subject)
        .filter(
            Subject.id == subject_id,
            Subject.is_active == True,
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="Selected subject does not exist or is inactive."
        )

    # ---------------------------------
    # 3. Remove duplicate section IDs
    # ---------------------------------

    section_ids = list(set(section_ids))

    # ---------------------------------
    # 4. Validate sections
    # ---------------------------------

    sections = (
    db.query(Section)
    .filter(
        Section.id.in_(section_ids),
        Section.is_active == True,
    )
    .all()
)

# ------------------------------------------------
# Validate Batch for every selected section
# ------------------------------------------------

    inactive_batch_sections = [
     section.id
     for section in sections
     if (
        not section.batch
        or not section.batch.is_active
    )
    ]
 
    if inactive_batch_sections:
     raise HTTPException(
        status_code=400,
        detail=(
            "Batch not found or inactive for "
            f"section IDs: {inactive_batch_sections}"
        ),
    )

    found_section_ids = {
        section.id
        for section in sections
    }

    invalid_sections = [
        section_id
        for section_id in section_ids
        if section_id not in found_section_ids
    ]

    if invalid_sections:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid or inactive section IDs: "
                f"{invalid_sections}"
            ),
        )

    created_assignments = []

    try:

        # ---------------------------------
        # 5. Create assignments
        # ---------------------------------

        for section_id in section_ids:

            existing_assignment = (
                db.query(TeacherSection)
                .filter(
                    TeacherSection.teacher_id == teacher_id,
                    TeacherSection.section_id == section_id,
                    TeacherSection.subject_id == subject_id,
                )
                .first()
            )

            # Already assigned
            if existing_assignment:

                # If it was previously inactive,
                # reactivate it.
                if not existing_assignment.is_active:
                    existing_assignment.is_active = True
                    existing_assignment.academic_year = academic_year

                continue

            assignment = TeacherSection(
                teacher_id=teacher_id,
                section_id=section_id,
                subject_id=subject_id,
                academic_year=academic_year,
                is_active=True,
            )

            db.add(assignment)
            created_assignments.append(assignment)

        db.commit()

        # Refresh newly created objects
        for assignment in created_assignments:
            db.refresh(assignment)

        return {
            "message": "Teacher sections assigned successfully.",
            "created_count": len(created_assignments),
        }

    except Exception:
        db.rollback()
        raise


def remove_teacher_section_assignment(
    db: Session,
    teacher_id: int,
    assignment_id: int,
):
    assignment = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.id == assignment_id,
            TeacherSection.teacher_id == teacher_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Teacher section assignment not found."
        )

    assignment.is_active = False

    db.commit()

    return {
        "message": "Teacher section assignment removed successfully."
    }