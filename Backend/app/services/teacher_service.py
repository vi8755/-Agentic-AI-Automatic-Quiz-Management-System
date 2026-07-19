from sqlalchemy.orm import Session
from ..schemas import TeacherCreate
from ..models import Teacher, User
from ..schemas import TeacherCreate, TeacherAssignmentsResponse, TeacherAssignmentItem


from ..models import (
    Teacher,
    TeacherSection,
    User,
)
from ..schemas import TeacherMySectionResponse

def create_teacher(db: Session, teacher: TeacherCreate):
    """
    Create a new teacher profile.
    """

    # Check whether the user exists
    user = db.query(User).filter(User.id == teacher.user_id).first()

    if not user:
        raise ValueError("User not found.")

    # Check if the user already has a teacher profile
    existing_teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == teacher.user_id)
        .first()
    )
    

    if existing_teacher:
        raise ValueError("Teacher profile already exists.")

    # Check duplicate employee ID
    existing_employee = (
        db.query(Teacher)
        .filter(Teacher.employee_id == teacher.employee_id)
        .first()
    )

    if existing_employee:
        raise ValueError("Employee ID already exists.")

    new_teacher = Teacher(
        user_id=teacher.user_id,
        employee_id=teacher.employee_id,
        department=teacher.department,
        designation=teacher.designation,
        phone=teacher.phone,
    )

    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)

    return new_teacher


def get_teacher_assignments(db: Session, teacher_id: int):

    teacher = (
        db.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )

    if not teacher:
        raise ValueError("Teacher not found.")

    assignments = []

    for assignment in teacher.teacher_sections:
        assignments.append(
            TeacherAssignmentItem(
                section_name=assignment.section.section_name,
                subject_name=assignment.subject.subject_name,
                academic_year=assignment.academic_year,
            )
        )

    return TeacherAssignmentsResponse(
        teacher_id=teacher.id,
        teacher_name=teacher.user.name,
        employee_id=teacher.employee_id,
        assignments=assignments,
    )

def get_my_sections(
    db: Session,
    current_user: User,
):
    """
    Get all sections assigned to the logged-in teacher.
    """

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )
    print("Current User ID:", current_user.id)
    print("Teacher Found:", teacher)

    if teacher is None:
        raise ValueError(
            "Teacher profile not found."
        )
    
    teacher_sections = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id == teacher.id,
            TeacherSection.is_active == True,
        )
        .all()
    )

    response = []

    for assignment in teacher_sections:
        response.append(
            TeacherMySectionResponse(
                teacher_section_id=assignment.id,

                section_id=assignment.section.id,
                section_name=assignment.section.section_name,
                department=assignment.section.department,
                year=assignment.section.year,
                semester=assignment.section.semester,

                subject_id=assignment.subject.id,
                subject_name=assignment.subject.subject_name,

                academic_year=assignment.academic_year,
            )
        )

    return response