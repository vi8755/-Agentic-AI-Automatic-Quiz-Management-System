from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import (
    User,
    UserRole,
    Student,
    Section,
)

from app.schemas import (
    StudentCreate,
    StudentUpdate,
)

from app.security import hash_password


# =====================================================
# Get All Students
# =====================================================

def get_all_students(db: Session):

    students = (
        db.query(Student)
        .join(User, Student.user_id == User.id)
        .join(Section, Student.section_id == Section.id)
        .order_by(User.name)
        .all()
    )

    return students


# =====================================================
# Create Student
# =====================================================

def create_student(
    db: Session,
    student: StudentCreate,
):

    # -------------------------------------------------
    # Check duplicate email
    # -------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == student.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists.",
        )


    # -------------------------------------------------
    # Check duplicate roll number
    # -------------------------------------------------

    existing_student = (
        db.query(Student)
        .filter(Student.roll_no == student.roll_no)
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Roll number already exists.",
        )


    # -------------------------------------------------
    # Check section
    # -------------------------------------------------

    section = (
        db.query(Section)
        .filter(Section.id == student.section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=404,
            detail="Section not found.",
        )


    # -------------------------------------------------
    # Create User Account
    # -------------------------------------------------

    new_user = User(
        name=student.name,
        email=student.email,
        password=hash_password(student.password),
        role=UserRole.STUDENT,
        is_active=True,
    )

    db.add(new_user)

    # Generate new_user.id before creating Student
    db.flush()


    # -------------------------------------------------
    # Create Student Profile
    # -------------------------------------------------

    new_student = Student(
        user_id=new_user.id,
        roll_no=student.roll_no,
        section_id=student.section_id,
        is_active=True,
    )

    db.add(new_student)

    db.commit()

    db.refresh(new_student)

    return new_student


# =====================================================
# Update Student
# =====================================================

def update_student(
    db: Session,
    student_id: int,
    student: StudentUpdate,
):

    existing_student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not existing_student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )


    # -------------------------------------------------
    # Check Section
    # -------------------------------------------------

    section = (
        db.query(Section)
        .filter(Section.id == student.section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=404,
            detail="Section not found.",
        )


    # -------------------------------------------------
    # Check Duplicate Roll Number
    # -------------------------------------------------

    duplicate_roll = (
        db.query(Student)
        .filter(
            Student.roll_no == student.roll_no,
            Student.id != student_id,
        )
        .first()
    )

    if duplicate_roll:
        raise HTTPException(
            status_code=400,
            detail="Roll number already exists.",
        )


    # -------------------------------------------------
    # Get User
    # -------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == existing_student.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Student user account not found.",
        )


    # -------------------------------------------------
    # Check Duplicate Email
    # -------------------------------------------------

    duplicate_email = (
        db.query(User)
        .filter(
            User.email == student.email,
            User.id != user.id,
        )
        .first()
    )

    if duplicate_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists.",
        )


    # -------------------------------------------------
    # Update User
    # -------------------------------------------------

    user.name = student.name
    user.email = student.email


    # -------------------------------------------------
    # Update Student
    # -------------------------------------------------

    existing_student.roll_no = student.roll_no
    existing_student.section_id = student.section_id

    db.commit()

    db.refresh(existing_student)

    return existing_student


# =====================================================
# Update Student Status
# =====================================================

def update_student_status(
    db: Session,
    student_id: int,
    is_active: bool,
):

    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )


    # Keep User account status synchronized
    user = (
        db.query(User)
        .filter(User.id == student.user_id)
        .first()
    )

    student.is_active = is_active

    if user:
        user.is_active = is_active

    db.commit()

    db.refresh(student)

    return student


# =====================================================
# Delete Student
# =====================================================

def delete_student(
    db: Session,
    student_id: int,
):

    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )


    # -------------------------------------------------
    # Get User Account
    # -------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == student.user_id)
        .first()
    )


    # -------------------------------------------------
    # Delete Student
    # -------------------------------------------------

    db.delete(student)


    # -------------------------------------------------
    # Delete User Account
    # -------------------------------------------------

    if user:
        db.delete(user)


    db.commit()

    return {
        "message": "Student deleted successfully.",
        "id": student_id,
    }