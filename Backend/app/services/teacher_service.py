from sqlalchemy.orm import Session

from ..models import User, Teacher, TeacherSection

from ..schemas import (
    TeacherCreate,
    TeacherRegistrationCreate,
    TeacherResponse,
    TeacherAssignmentsResponse,
    TeacherAssignmentItem,
    TeacherMySectionResponse,
    UserRole
)
from sqlalchemy import and_, func

from ..models import (
    Teacher,
    Quiz,
    QuizAssignment,
    Student,
    User,
    Section,
)
from ..models import Teacher, Quiz, User

from ..security import hash_password
from ..services.user_service import create_user
from ..schemas import UserCreate
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

def register_teacher(
    db: Session,
    teacher: TeacherRegistrationCreate,
) -> TeacherResponse:
    """
    Register a new teacher by creating both User and Teacher
    records in a single database transaction.
    """

    # Check duplicate Employee ID
    existing_employee = (
        db.query(Teacher)
        .filter(Teacher.employee_id == teacher.employee_id)
        .first()
    )

    if existing_employee:
        raise ValueError("Employee ID already exists.")

    try:
        # Create User
        new_user = create_user(
            db=db,
            user=UserCreate(
                name=teacher.name,
                email=teacher.email,
                password=teacher.password,
                role=UserRole.TEACHER,
            ),
        )

        # Create Teacher Profile
        new_teacher = Teacher(
            user_id=new_user.id,
            employee_id=teacher.employee_id,
            department=teacher.department,
            designation=teacher.designation,
            phone=teacher.phone,
        )

        db.add(new_teacher)

        # Commit both User and Teacher together
        db.commit()

        # Refresh Teacher object
        db.refresh(new_teacher)

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

def get_teacher_dashboard(
    db: Session,
    current_user: User,
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise ValueError("Teacher not found.")

    total_quizzes = (
        db.query(Quiz)
        .filter(Quiz.teacher_id == teacher.id)
        .count()
    )

    total_assignments = (
        db.query(QuizAssignment)
        .filter(QuizAssignment.teacher_id == teacher.id)
        .count()
    )

    completed_assignments = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.teacher_id == teacher.id,
            QuizAssignment.status == "Completed",
        )
        .count()
    )

    pending_assignments = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.teacher_id == teacher.id,
            QuizAssignment.status != "Completed",
        )
        .count()
    )

    return {
        "total_quizzes": total_quizzes,
        "total_assignments": total_assignments,
        "completed_assignments": completed_assignments,
        "pending_assignments": pending_assignments,
    }

def get_teacher_quizzes(
    db: Session,
    current_user: User,
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise ValueError("Teacher not found.")

    quizzes = (
        db.query(Quiz)
        .filter(Quiz.teacher_id == teacher.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )

    result = []

    for quiz in quizzes:
        result.append(
            {
                "id": quiz.id,
                "title": quiz.title,
                "total_questions": len(quiz.questions or []),
                "created_at": quiz.created_at,
            }
        )

    return result

def get_quiz_assignments(
    db: Session,
    current_user: User,
    quiz_id: int,
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise ValueError("Teacher not found.")

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise ValueError("Quiz not found or access denied.")

    assignments = (
        db.query(QuizAssignment)
        .filter(QuizAssignment.quiz_id == quiz.id)
        .all()
    )

    result = []

    for assignment in assignments:

        student = assignment.student

        result.append(
            {
                "assignment_id": assignment.id,
                "student_id": student.id if student else None,
                "student_name": (
                    student.user.name
                    if student and student.user
                    else assignment.student_email
                ),
                "roll_no": (
                    student.roll_no
                    if student
                    else None
                ),
                "email": (
                    student.user.email
                    if student and student.user
                    else assignment.student_email
                ),
                "status": assignment.status,
                "score": assignment.score,
                "assigned_at": assignment.assigned_at,
                "due_date": assignment.due_date,
            }
        )

    return result


def get_teacher_analytics(
    db: Session,
    teacher_id: int,
):
    # Total quizzes created by teacher
    total_quizzes = (
        db.query(Quiz)
        .filter(Quiz.teacher_id == teacher_id)
        .count()
    )

    # Total assignments
    total_assignments = (
        db.query(QuizAssignment)
        .filter(QuizAssignment.teacher_id == teacher_id)
        .count()
    )

    # Completed assignments
    completed_assignments = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.teacher_id == teacher_id,
            QuizAssignment.status == "Completed",
        )
        .count()
    )

    # Total unique students
    total_students = (
        db.query(func.count(func.distinct(QuizAssignment.student_id)))
        .filter(
            QuizAssignment.teacher_id == teacher_id
        )
        .scalar()
        or 0
    )

    # Score statistics
    score_stats = (
        db.query(
            func.avg(QuizAssignment.score),
            func.max(QuizAssignment.score),
            func.min(QuizAssignment.score),
        )
        .filter(
            QuizAssignment.teacher_id == teacher_id,
            QuizAssignment.status == "Completed",
            QuizAssignment.score.isnot(None),
        )
        .first()
    )

    average_score = round(score_stats[0], 2) if score_stats[0] else 0
    highest_score = score_stats[1] or 0
    lowest_score = score_stats[2] or 0

    completion_percentage = (
        round(
            (completed_assignments / total_assignments) * 100,
            2,
        )
        if total_assignments
        else 0
    )

    return {
        "average_score": average_score,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "completion_percentage": completion_percentage,
        "total_quizzes": total_quizzes,
        "total_students": total_students,
        "total_attempts": completed_assignments,
    }


def get_quiz_performance(
    db: Session,
    teacher_id: int,
):
    """
    Returns quiz-wise analytics for the logged-in teacher.
    Includes quizzes with zero completed attempts.
    """

    results = (
        db.query(
            Quiz.id.label("quiz_id"),
            Quiz.title.label("quiz_title"),
            func.avg(QuizAssignment.score).label("average_score"),
            func.count(QuizAssignment.id).label("attempts"),
        )
        .outerjoin(
            QuizAssignment,
            and_(
                Quiz.id == QuizAssignment.quiz_id,
                QuizAssignment.status == "Completed",
            ),
        )
        .filter(
            Quiz.teacher_id == teacher_id,
        )
        .group_by(
            Quiz.id,
            Quiz.title,
        )
        .order_by(
            Quiz.id.desc(),
        )
        .all()
    )

    return [
        {
            "quiz_id": row.quiz_id,
            "quiz_title": row.quiz_title,
            "average_score": (
                round(float(row.average_score), 2)
                if row.average_score is not None
                else 0
            ),
            "attempts": row.attempts,
        }
        for row in results
    ]



def get_section_performance(
    db: Session,
    teacher_id: int,
):
    """
    Returns section-wise analytics for the logged-in teacher.
    Includes sections with zero completed attempts.
    """

    results = (
        db.query(
            Section.id.label("section_id"),
            Section.section_name.label("section_name"),
            func.avg(QuizAssignment.score).label("average_score"),
            func.count(QuizAssignment.id).label("attempts"),
            func.count(
                func.distinct(QuizAssignment.student_id)
            ).label("students"),
        )
        .outerjoin(
            QuizAssignment,
            and_(
                Section.id == QuizAssignment.section_id,
                QuizAssignment.teacher_id == teacher_id,
                QuizAssignment.status == "Completed",
            ),
        )
        .group_by(
            Section.id,
            Section.section_name,
        )
        .order_by(
            Section.section_name,
        )
        .all()
    )

    return [
        {
            "section_id": row.section_id,
            "section_name": row.section_name,
            "average_score": (
                round(float(row.average_score), 2)
                if row.average_score is not None
                else 0
            ),
            "attempts": row.attempts,
            "students": row.students,
        }
        for row in results
    ]