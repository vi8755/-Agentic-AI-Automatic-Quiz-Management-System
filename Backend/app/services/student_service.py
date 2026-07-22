from sqlalchemy.orm import Session
from typing import List

from ..models import  Student, Section
from ..schemas import (
    StudentRegistrationCreate,
    StudentResponse,
    UserCreate,
    UserRole,
)
from fastapi import HTTPException, status
from ..services.user_service import create_user
from ..models import Student, User, Section
def register_student(
    db: Session,
    student: StudentRegistrationCreate,
) -> StudentResponse:
    """
    Register a new student by creating both User and Student
    records in a single database transaction.
    """

    # Check duplicate Roll Number
    existing_student = (
        db.query(Student)
        .filter(Student.roll_no == student.roll_no)
        .first()
    )

    if existing_student:
        raise ValueError("Roll Number already exists.")

    # Check Section exists
    section = (
        db.query(Section)
        .filter(Section.id == student.section_id)
        .first()
    )

    if not section:
        raise ValueError("Section not found.")

    try:
        # Create User
        new_user = create_user(
            db=db,
            user=UserCreate(
                name=student.name,
                email=student.email,
                password=student.password,
                role=UserRole.STUDENT,
            ),
        )

        # Create Student Profile
        new_student = Student(
            user_id=new_user.id,
            roll_no=student.roll_no,
            section_id=student.section_id,
        )

        db.add(new_student)

        # Commit both User and Student together
        db.commit()

        # Refresh Student object
        db.refresh(new_student)

        return StudentResponse(
            id=new_student.id,
            user_id=new_student.user_id,

            name=new_user.name,
            email=new_user.email,

            roll_no=new_student.roll_no,

            section_id=section.id,
            section_name=section.section_name,

            department=section.department,
            year=section.year,
            semester=section.semester,

            is_active=new_student.is_active,
        )

    except Exception:
        db.rollback()
        raise


def get_all_students(
    db: Session,
) -> List[StudentResponse]:
    """
    Return all active students with their
    User and Section information.
    """

    students = (
        db.query(Student)
        .join(User, Student.user_id == User.id)
        .join(Section, Student.section_id == Section.id)
        .filter(Student.is_active == True)
        .all()
    )

    result = []

    for student in students:
        result.append(
            StudentResponse(
                id=student.id,
                user_id=student.user.id,

                name=student.user.name,
                email=student.user.email,

                roll_no=student.roll_no,

                section_id=student.section.id,
                section_name=student.section.section_name,

                department=student.section.department,
                year=student.section.year,
                semester=student.section.semester,

                is_active=student.is_active,
            )
        )

    return result

def get_student_by_id(
    db: Session,
    student_id: int,
) -> StudentResponse:
    """
    Return a single student by ID.
    """

    student = (
        db.query(Student)
        .join(User, Student.user_id == User.id)
        .join(Section, Student.section_id == Section.id)
        .filter(
            Student.id == student_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise ValueError("Student not found.")

    return StudentResponse(
        id=student.id,
        user_id=student.user.id,

        name=student.user.name,
        email=student.user.email,

        roll_no=student.roll_no,

        section_id=student.section.id,
        section_name=student.section.section_name,

        department=student.section.department,
        year=student.section.year,
        semester=student.section.semester,

        is_active=student.is_active,
    )

def get_current_student(user_id: int, db: Session):
    student = (
        db.query(Student)
        .join(User, Student.user_id == User.id)
        .join(Section, Student.section_id == Section.id)
        .filter(Student.user_id == user_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return {
        "id": student.id,
        "user_id": student.user_id,
        "name": student.user.name,
        "email": student.user.email,
        "roll_no": student.roll_no,
        "section_id": student.section_id,
        "section_name": student.section.section_name,
        "department": student.section.department,
        "year": student.section.year,
        "semester": student.section.semester,
        "is_active": student.is_active,
    }