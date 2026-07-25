from sqlalchemy.orm import Session

from ..models import User, Teacher, TeacherSection
from sqlalchemy import func
from ..schemas import (
    TeacherCreate,
    TeacherRegistrationCreate,
    TeacherResponse,
    TeacherAssignmentsResponse,
    TeacherAssignmentItem,
    TeacherMySectionResponse,
    UserRole,
    UpdateQuizRequest
    
)
from app.models import Question
from app.agents.regenerate_question.graph import (
    regenerate_question_graph,
)
from sqlalchemy import and_, func

from ..models import (
    Teacher,
    Quiz,
    QuizAssignment,
    Question,
    Student,
    User,
    Section,
)
from ..models import Teacher, Quiz, User
from app.models import Quiz, Question, Teacher
from copy import deepcopy
from ..security import hash_password
from ..services.user_service import create_user
from ..schemas import UserCreate
from ..models import Quiz, Teacher, Question
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
                "total_questions": len(quiz.questions_relation),
                "status": quiz.status,
                "created_at": quiz.created_at,
            }
        )

    return result

def get_teacher_quiz_by_id(
    db: Session,
    current_user: User,
    quiz_id: int,
):
    """
    Returns a single quiz created by the logged-in teacher.
    """

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
        raise ValueError("Quiz not found.")

    return {
        "id": quiz.id,
        "title": quiz.title,
        "teacher_id": quiz.teacher_id,
        "status": quiz.status,
        "created_at": quiz.created_at,
        "questions": quiz.questions_relation,
    }
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

def get_recent_quiz_activity(
    db: Session,
    teacher_id: int,
):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.teacher_id == teacher_id)
        .order_by(Quiz.created_at.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "id": quiz.id,
            "title": quiz.title,
            "created_at": quiz.created_at,
            "questions": len(quiz.questions_relation),
        }
        for quiz in quizzes
    ]

def update_teacher_quiz(
    db: Session,
    current_user: User,
    quiz_id: int,
    quiz_data: UpdateQuizRequest,
):
    # Find logged-in teacher
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise ValueError("Teacher not found.")

    # Find quiz
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise ValueError("Quiz not found.")

    # Update quiz title
    quiz.title = quiz_data.title

    # Existing questions dictionary
    existing_questions = {
        q.id: q
        for q in quiz.questions_relation
    }

    # -----------------------------
    # Delete removed questions
    # -----------------------------
    for question_id in quiz_data.deleted_question_ids:
        question = existing_questions.get(question_id)

        if question:
            db.delete(question)

    # -----------------------------
    # Update existing / Add new
    # -----------------------------
    for question_data in quiz_data.questions:

        # Existing question
        if question_data.id:

            question = existing_questions.get(question_data.id)

            if not question:
                continue

            question.question_text = question_data.question_text
            question.option_a = question_data.option_a
            question.option_b = question_data.option_b
            question.option_c = question_data.option_c
            question.option_d = question_data.option_d
            question.correct_answer = question_data.correct_answer
            question.explanation = question_data.explanation
            question.marks = question_data.marks
            question.question_order = question_data.question_order

        # New question
        else:

            new_question = Question(
                quiz_id=quiz.id,
                question_text=question_data.question_text,
                option_a=question_data.option_a,
                option_b=question_data.option_b,
                option_c=question_data.option_c,
                option_d=question_data.option_d,
                correct_answer=question_data.correct_answer,
                explanation=question_data.explanation,
                marks=question_data.marks,
                question_order=question_data.question_order,
            )

            db.add(new_question)

    # Flush pending changes
    db.flush()

    # -----------------------------
    # Normalize question order
    # -----------------------------
    questions = (
        db.query(Question)
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.question_order)
        .all()
    )

    for index, question in enumerate(questions, start=1):
        question.question_order = index

    db.commit()
    db.refresh(quiz)

    return {
        "message": "Quiz updated successfully",
        "quiz": quiz,
    }
def delete_teacher_quiz(
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
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise ValueError("Quiz not found.")

    if quiz.teacher_id != teacher.id:
        raise PermissionError(
            "You are not allowed to delete this quiz."
        )

    # Delete all assignments first
    (
        db.query(QuizAssignment)
        .filter(QuizAssignment.quiz_id == quiz.id)
        .delete(synchronize_session=False)
    )

    # Delete the quiz
    db.delete(quiz)

    db.commit()

    return {
        "message": "Quiz deleted successfully"
    }

def duplicate_teacher_quiz(
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
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise ValueError("Quiz not found.")

    if quiz.teacher_id != teacher.id:
        raise PermissionError(
            "You are not allowed to duplicate this quiz."
        )

    # Create new quiz
    new_quiz = Quiz(
        title=f"{quiz.title} (Copy)",
        teacher_id=teacher.id,
        status="Draft",
    )

    db.add(new_quiz)

    # Generate new quiz ID
    db.flush()

    # Copy all questions
    for question in quiz.questions_relation:

        new_question = Question(
            quiz_id=new_quiz.id,

            question_text=question.question_text,

            option_a=question.option_a,
            option_b=question.option_b,
            option_c=question.option_c,
            option_d=question.option_d,

            correct_answer=question.correct_answer,

            explanation=question.explanation,

            marks=question.marks,

            question_order=question.question_order,
        )

        db.add(new_question)

    db.commit()
    db.refresh(new_quiz)

    return {
        "message": "Quiz duplicated successfully",
        "quiz": {
            "id": new_quiz.id,
            "title": new_quiz.title,
        },
    }
def get_quiz_performance(
    db: Session,
    teacher_id: int,
):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.teacher_id == teacher_id)
        .all()
    )

    result = []

    for quiz in quizzes:
        assignments = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id == quiz.id,
                QuizAssignment.status == "Completed",
            )
            .all()
        )

        scores = [
            a.score
            for a in assignments
            if a.score is not None
        ]

        result.append(
            {
                "quiz_id": quiz.id,
                "title": quiz.title,
                "attempts": len(assignments),
                "average_score": round(sum(scores) / len(scores), 2)
                if scores
                else 0,
            }
        )

    return result
def publish_teacher_quiz(
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
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise ValueError("Quiz not found.")

    if quiz.teacher_id != teacher.id:
        raise PermissionError(
            "You are not allowed to publish this quiz."
        )

    quiz.status = "Published"

    db.commit()
    db.refresh(quiz)

    return {
        "message": "Quiz published successfully",
        "quiz": {
            "id": quiz.id,
            "status": quiz.status,
        },
    }
def move_quiz_to_draft(
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
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise ValueError("Quiz not found.")

    if quiz.teacher_id != teacher.id:
        raise PermissionError(
            "You are not allowed to modify this quiz."
        )

    if quiz.status == "Draft":
        return {
            "message": "Quiz is already in Draft.",
            "quiz": {
                "id": quiz.id,
                "status": quiz.status,
            },
        }

    quiz.status = "Draft"

    db.commit()
    db.refresh(quiz)

    return {
        "message": "Quiz moved to Draft successfully",
        "quiz": {
            "id": quiz.id,
            "status": quiz.status,
        },
    }

def regenerate_teacher_question(
    db: Session,
    current_user: User,
    quiz_id: int,
    question_id: int,
):
    teacher = (
    db.query(Teacher)
    .filter(
        Teacher.user_id == current_user.id
    )
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
     raise ValueError("Quiz not found.")
    question = (
    db.query(Question)
    .filter(
        Question.id == question_id,
        Question.quiz_id == quiz.id,
    )
    .first()
)

    if not question:
     raise ValueError("Question not found.")
    question_data = {
    "question_text": question.question_text,
    "option_a": question.option_a,
    "option_b": question.option_b,
    "option_c": question.option_c,
    "option_d": question.option_d,
    "correct_answer": question.correct_answer,
    "explanation": question.explanation,

    
}
    result = regenerate_question_graph.invoke(
    {
        "question": question_data,
        "quiz_title": quiz.title,
        "existing_questions": ...
    }
)
    new_question = result["validated_question"]
    question.question_text = new_question["question"]

    question.option_a = new_question["options"][0]

    question.option_b = new_question["options"][1]

    question.option_c = new_question["options"][2]

    question.option_d = new_question["options"][3]

    question.correct_answer = new_question["correct_answer"]

    question.explanation = new_question["explanation"]
    db.commit()

    db.refresh(question)
    return {
    "message": "Question regenerated successfully.",
    "question": question,
}