from sqlalchemy.orm import Session
from ..tools.email_tools import send_quiz_email
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
    UpdateQuizRequest,
    UpdateQuestionRequest,
    GenerateQuestionRequest,
    AssignQuizSectionRequest,
    DescriptiveAssignmentCreate,

    
)
import secrets
from ..services.auth_service import send_email_verification
from app.security import verify_password, hash_password
from fastapi import HTTPException
import secrets
from datetime import datetime, timedelta
from app.models import Question
from app.agents.regenerate_question.graph import (
    regenerate_question_graph,
)
from sqlalchemy import and_, func
from collections import Counter
from ..models import (
    Teacher,
    Subject,
    Quiz,
    QuizAssignment,
    Question,
    Student,
    User,
    Section,
    Response,
    TeacherSection,
    DescriptiveAssignment,
    DescriptiveAssignmentQuestion,
    DescriptiveAssignmentSection,
    DescriptiveSubmission,
    DescriptiveAnswer,
    DescriptiveAnswerAttachment,    
)
from app.ai.mcq_generator import generate_single_mcq
from app.ai.question_validator import validate_generated_question
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
    Register a new teacher and assign them
    to a section and subject.

    The Dean does not provide a password.
    A temporary password is generated by the backend
    and sent to the teacher through email verification.
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
        # 4. Generate Temporary Password
        # ---------------------------------

        temporary_password = secrets.token_urlsafe(10)

        # ---------------------------------
        # 5. Create User
        # ---------------------------------

        new_user = create_user(
            db=db,
            user=UserCreate(
                name=teacher.name,
                email=teacher.email,
                password=temporary_password,
                role=UserRole.TEACHER,
            ),
        )

        # Teacher must verify email first
        new_user.email_verified = False

        # ---------------------------------
        # 6. Create Teacher Profile
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
        # 7. Create Teacher-Section-
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
        # 8. Save User + Teacher +
        #    Assignment
        # ---------------------------------

        db.commit()

        # ---------------------------------
        # 9. Refresh Teacher
        # ---------------------------------

        db.refresh(new_teacher)

        # ---------------------------------
        # 10. Send Verification Email
        # ---------------------------------

        send_email_verification(
            db,
            new_user,
            temporary_password=temporary_password,
        )

        # ---------------------------------
        # 11. Return Response
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
    section_id: int | None = None,
):

    # =========================================================
    # TOTAL QUIZZES
    # =========================================================

    if section_id is None:

        total_quizzes = (
            db.query(Quiz)
            .filter(
                Quiz.teacher_id == teacher_id
            )
            .count()
        )

    else:

        total_quizzes = (
            db.query(QuizAssignment.quiz_id)
            .filter(
                QuizAssignment.teacher_id == teacher_id,
                QuizAssignment.section_id == section_id,
            )
            .distinct()
            .count()
        )


    # =========================================================
    # ASSIGNMENTS
    # =========================================================

    assignment_query = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.teacher_id == teacher_id
        )
    )


    if section_id is not None:

        assignment_query = assignment_query.filter(
            QuizAssignment.section_id == section_id
        )


    total_assignments = assignment_query.count()


    # =========================================================
    # COMPLETED ATTEMPTS
    # =========================================================

    completed_query = assignment_query.filter(
        QuizAssignment.status == "Completed"
    )

    completed_assignments = (
        completed_query.count()
    )


    # =========================================================
    # UNIQUE STUDENTS
    # =========================================================

    student_query = (
        db.query(
            func.count(
                func.distinct(
                    QuizAssignment.student_id
                )
            )
        )
        .filter(
            QuizAssignment.teacher_id == teacher_id
        )
    )


    if section_id is not None:

        student_query = student_query.filter(
            QuizAssignment.section_id == section_id
        )


    total_students = (
        student_query.scalar()
        or 0
    )


    # =========================================================
    # SCORE STATISTICS
    # =========================================================

    score_query = (
        db.query(
            func.avg(
                QuizAssignment.score
            ),
            func.max(
                QuizAssignment.score
            ),
            func.min(
                QuizAssignment.score
            ),
        )
        .filter(
            QuizAssignment.teacher_id == teacher_id,
            QuizAssignment.status == "Completed",
            QuizAssignment.score.isnot(None),
        )
    )


    if section_id is not None:

        score_query = score_query.filter(
            QuizAssignment.section_id == section_id
        )


    score_stats = score_query.first()


    average_score = (
        round(score_stats[0], 2)
        if score_stats[0] is not None
        else 0
    )

    highest_score = (
        score_stats[1]
        if score_stats[1] is not None
        else 0
    )

    lowest_score = (
        score_stats[2]
        if score_stats[2] is not None
        else 0
    )


    # =========================================================
    # COMPLETION %
    # =========================================================

    completion_percentage = (
        round(
            (
                completed_assignments
                / total_assignments
            ) * 100,
            2,
        )
        if total_assignments
        else 0
    )


    # =========================================================
    # RESPONSE
    # =========================================================

    return {

        "average_score":
            average_score,

        "highest_score":
            highest_score,

        "lowest_score":
            lowest_score,

        "completion_percentage":
            completion_percentage,

        "total_quizzes":
            total_quizzes,

        "total_students":
            total_students,

        "total_attempts":
            completed_assignments,
    }
def get_student_performance(
    db: Session,
    teacher_id: int,
    section_id: int | None = None,
):
    """
    Return student-level quiz performance for the logged-in teacher.

    Overall mode:
        Students from all active sections assigned to this teacher.

    Section mode:
        Only students/attempts belonging to the selected section.

    Topper and Top 5 are based on average percentage across
    completed quiz attempts.

    Students with no completed attempts remain in the full table.
    """

    # -----------------------------------------------------
    # 1. Get sections assigned to this teacher
    # -----------------------------------------------------
    teacher_section_query = (
        db.query(TeacherSection.section_id)
        .filter(
            TeacherSection.teacher_id == teacher_id,
            TeacherSection.is_active == True,
        )
    )

    if section_id is not None:
        teacher_section_query = teacher_section_query.filter(
            TeacherSection.section_id == section_id
        )

    teacher_section_ids = [
        row.section_id
        for row in teacher_section_query.all()
    ]

    if not teacher_section_ids:
        return {
            "topper": None,
            "top_students": [],
            "students": [],
        }

    # -----------------------------------------------------
    # 2. Get active students in those sections
    # -----------------------------------------------------
    students = (
        db.query(Student)
        .join(User, Student.user_id == User.id)
        .join(Section, Student.section_id == Section.id)
        .filter(
            Student.section_id.in_(teacher_section_ids),
            Student.is_active == True,
        )
        .order_by(User.name.asc())
        .all()
    )

    student_map = {
        student.id: {
            "student_id": student.id,
            "student_name": (
                student.user.name
                if student.user
                else "Unknown"
            ),
            "roll_no": student.roll_no,
            "section_id": student.section_id,
            "section_name": (
                student.section.section_name
                if student.section
                else "Unknown"
            ),
            "attempts": 0,
            "score_total": 0.0,
            "percentage_total": 0.0,
        }
        for student in students
    }

    if not student_map:
        return {
            "topper": None,
            "top_students": [],
            "students": [],
        }

    # -----------------------------------------------------
    # 3. Get completed quiz assignments
    # -----------------------------------------------------
    assignments_query = (
        db.query(QuizAssignment)
        .join(Quiz, QuizAssignment.quiz_id == Quiz.id)
        .filter(
            QuizAssignment.teacher_id == teacher_id,
            QuizAssignment.student_id.in_(student_map.keys()),
            QuizAssignment.status == "Completed",
            QuizAssignment.score.isnot(None),
        )
    )

    if section_id is not None:
        assignments_query = assignments_query.filter(
            QuizAssignment.section_id == section_id
        )

    assignments = assignments_query.all()

    # -----------------------------------------------------
    # 4. Calculate each completed attempt's percentage
    # -----------------------------------------------------
    for assignment in assignments:
        student_data = student_map.get(assignment.student_id)

        if not student_data:
            continue

        quiz = assignment.quiz

        if not quiz:
            continue

        # Version 2: normalized Question table
        if quiz.questions_relation:
            total_marks = sum(
                (question.marks or 1)
                for question in quiz.questions_relation
            )

        # Version 1 fallback: JSON questions
        elif quiz.questions:
            total_marks = sum(
                question.get("marks", 1)
                for question in quiz.questions
            )

        else:
            total_marks = 0

        score = float(assignment.score or 0)

        percentage = (
            (score / total_marks) * 100
            if total_marks > 0
            else 0
        )

        student_data["attempts"] += 1
        student_data["score_total"] += score
        student_data["percentage_total"] += percentage

    # -----------------------------------------------------
    # 5. Build student rows
    # -----------------------------------------------------
    rows = []

    for student_data in student_map.values():
        attempts = student_data["attempts"]

        average_score = (
            student_data["score_total"] / attempts
            if attempts
            else 0
        )

        average_percentage = (
            student_data["percentage_total"] / attempts
            if attempts
            else 0
        )

        rows.append({
            "student_id": student_data["student_id"],
            "student_name": student_data["student_name"],
            "roll_no": student_data["roll_no"],
            "section_id": student_data["section_id"],
            "section_name": student_data["section_name"],
            "attempts": attempts,
            "average_score": round(average_score, 2),
            "average_percentage": round(average_percentage, 2),
        })

    # Students with completed attempts first.
    rows.sort(
        key=lambda item: (
            item["attempts"] > 0,
            item["average_percentage"],
            item["student_name"].lower(),
        ),
        reverse=True,
    )

    # -----------------------------------------------------
    # 6. Topper + Top 5
    # -----------------------------------------------------
    ranked_students = [
        row
        for row in rows
        if row["attempts"] > 0
    ]

    ranked_students.sort(
        key=lambda item: (
            item["average_percentage"],
            item["average_score"],
            item["attempts"],
        ),
        reverse=True,
    )

    topper = (
        ranked_students[0]
        if ranked_students
        else None
    )

    return {
        "topper": topper,
        "top_students": ranked_students[:5],
        "students": ranked_students + [
            row
            for row in rows
            if row["attempts"] == 0
        ],
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
def export_quiz_assignments(
    db: Session,
    current_user: User,
    quiz_id: int,
):
    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise ValueError(
            "Teacher not found."
        )

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise ValueError(
            "Quiz not found or access denied."
        )

    assignments = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.quiz_id == quiz.id
        )
        .all()
    )

    # -----------------------------------------
    # Calculate total marks
    # -----------------------------------------

    total_marks = 0

    if quiz.questions_relation:

        total_marks = sum(
            question.marks or 1
            for question in quiz.questions_relation
        )

    elif quiz.questions:

        total_marks = sum(
            question.get("marks", 1)
            for question in quiz.questions
        )

    # -----------------------------------------
    # Build export rows
    # -----------------------------------------

    rows = []

    for assignment in assignments:

        student = assignment.student

        student_name = (
            student.user.name
            if student and student.user
            else assignment.student_email
        )

        roll_no = (
            student.roll_no
            if student
            else ""
        )

        email = (
            student.user.email
            if student and student.user
            else assignment.student_email
        )

        score = assignment.score

        percentage = None

        if (
            score is not None
            and total_marks > 0
        ):
            percentage = round(
                (score / total_marks) * 100,
                2,
            )

        rows.append(
            {
                "Student Name": student_name,
                "Roll No": roll_no,
                "Email": email,
               "Assigned Date": (
                assignment.assigned_at.replace(tzinfo=None)
                if assignment.assigned_at
                else None
               ),

               "Due Date": (
                assignment.due_date.replace(tzinfo=None)
                if assignment.due_date
                else None
               ),
                "Status": assignment.status,
                "Score": score,
                "Total Marks": total_marks,
                "Percentage": percentage,
            }
        )

    return {
        "quiz_title": quiz.title,
        "rows": rows,
    }
def assign_quiz_to_section(
    db: Session,
    current_user: User,
    quiz_id: int,
    request: AssignQuizSectionRequest,
):
    # ========================================================
    # 1. VERIFY TEACHER
    # ========================================================

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise ValueError(
            "Teacher not found."
        )

    # ========================================================
    # 2. VERIFY QUIZ
    # ========================================================

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise ValueError(
            "Quiz not found or access denied."
        )

    # ========================================================
    # 3. VERIFY SECTION
    # ========================================================

    section = (
        db.query(Section)
        .filter(
            Section.id == request.section_id,
            Section.is_active == True,
        )
        .first()
    )

    if not section:
        raise ValueError(
            "Section not found or inactive."
        )

    # ========================================================
    # 4. VERIFY BATCH
    # ========================================================

    if (
        not section.batch
        or not section.batch.is_active
    ):
        raise ValueError(
            "Batch not found or inactive."
        )

    # ========================================================
    # 5. VERIFY TEACHER IS ASSIGNED TO THIS SECTION
    # ========================================================

    teacher_section = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id == teacher.id,
            TeacherSection.section_id == section.id,
            TeacherSection.is_active == True,
        )
        .first()
    )

    if not teacher_section:
        raise ValueError(
            "You are not assigned to this section."
        )

    # ========================================================
    # 6. GET ACTIVE STUDENTS
    # ========================================================

    students = (
        db.query(Student)
        .filter(
            Student.section_id == section.id,
            Student.is_active == True,
        )
        .all()
    )

    if not students:
        raise ValueError(
            "No active students found in this section."
        )

    assigned_count = 0

    newly_assigned_students = []

    # ========================================================
    # 7. ASSIGN QUIZ TO EACH STUDENT
    # ========================================================

    for student in students:

        # ----------------------------------------------------
        # Check existing assignment
        # ----------------------------------------------------

        existing = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id == quiz.id,
                QuizAssignment.student_id == student.id,
            )
            .first()
        )

        if existing:
            continue

        # ----------------------------------------------------
        # Generate secure token
        # ----------------------------------------------------

        token = secrets.token_urlsafe(32)

        # ----------------------------------------------------
        # Token expiry
        # ----------------------------------------------------

        expires_at = (
            datetime.utcnow()
            + timedelta(days=7)
        )

        # ----------------------------------------------------
        # Create assignment
        # ----------------------------------------------------

        assignment = QuizAssignment(
          quiz_id=quiz.id,
          teacher_id=teacher.id,
          student_id=student.id,
          section_id=section.id,
          student_email=student.user.email,
          due_date=request.due_date,
          start_time=request.start_time,   # ✅ NEW
          status="Assigned",
          token=token,
          expires_at=expires_at,
        )
 

        db.add(assignment)

        newly_assigned_students.append(
            {
                "student": student,
                "token": token,
            }
        )

        assigned_count += 1

    # ========================================================
    # 8. SAVE ASSIGNMENTS
    # ========================================================

    db.commit()

    # ========================================================
    # 9. SEND PERSONALIZED EMAIL
    # ========================================================

    for item in newly_assigned_students:

        student = item["student"]

        token = item["token"]

        quiz_link = (
            f"http://localhost:5173/quiz/start/{token}"
        )

        try:

            send_quiz_email.invoke(
                {
                    "receiver_email":
                        student.user.email,

                    "subject":
                        f"New Quiz Assigned: {quiz.title}",

                    "body":
                        f"""
Hello,

A new quiz has been assigned to you.

Quiz:
{quiz.title}
Start Time:
{request.start_time}

Batch:
{section.batch.batch_name}

Section:
{section.section_name}

Year:
{section.year}

Semester:
{section.semester}

Due Date:
{request.due_date}

Attempt your quiz here:

{quiz_link}

Best of luck!

AI Quiz Management System
""",
                }
            )

        except Exception as e:

            print(
                f"Failed to send email to "
                f"{student.user.email}: {e}"
            )

    # ========================================================
    # 10. ALL STUDENTS ALREADY ASSIGNED
    # ========================================================

    if assigned_count == 0:

        return {
            "message":
                "All students in this section are already assigned this quiz.",

            "assigned_students": 0,
        }

    # ========================================================
    # 11. SUCCESS
    # ========================================================

    return {
        "message":
            "Quiz assigned successfully.",

        "assigned_students":
            assigned_count,
    }

     
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
    section_id: int | None = None,
):

    quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.teacher_id == teacher_id
        )
        .all()
    )

    performance = []


    for quiz in quizzes:

        assignment_query = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id == quiz.id,
                QuizAssignment.teacher_id == teacher_id,
            )
        )


        # -----------------------------------------------------
        # SECTION FILTER
        # -----------------------------------------------------

        if section_id is not None:

            assignment_query = assignment_query.filter(
                QuizAssignment.section_id == section_id
            )


        # -----------------------------------------------------
        # Check whether quiz is assigned to this section
        # -----------------------------------------------------

        all_assignments = (
            assignment_query.all()
        )


        if (
            section_id is not None
            and not all_assignments
        ):
            continue


        # -----------------------------------------------------
        # Completed attempts
        # -----------------------------------------------------

        completed_assignments = [
            assignment
            for assignment in all_assignments
            if assignment.status == "Completed"
        ]


        scores = [
            assignment.score
            for assignment in completed_assignments
            if assignment.score is not None
        ]


        performance.append(
            {
                "quiz_id":
                    quiz.id,

                "quiz_title":
                    quiz.title,

                "attempts":
                    len(completed_assignments),

                "average_score":
                    (
                        round(
                            sum(scores)
                            / len(scores),
                            2,
                        )
                        if scores
                        else 0
                    ),
            }
        )


    return performance
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
def update_teacher_question(
    db: Session,
    current_user: User,
    question_id: int,
    question_data: UpdateQuestionRequest,
):
    # Find logged-in teacher
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise ValueError("Teacher not found.")

    # Find question
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if not question:
        raise ValueError("Question not found.")

    # Verify ownership
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == question.quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise PermissionError(
            "You are not allowed to edit this question."
        )

    # Update fields
    question.question_text = question_data.question_text
    question.option_a = question_data.option_a
    question.option_b = question_data.option_b
    question.option_c = question_data.option_c
    question.option_d = question_data.option_d
    question.correct_answer = question_data.correct_answer
    question.explanation = question_data.explanation
    question.marks = question_data.marks

    db.commit()
    db.refresh(question)

    return {
        "message": "Question updated successfully.",
        "question": question,
    }
def generate_teacher_question(
    db: Session,
    current_user: User,
    quiz_id: int,
    request: GenerateQuestionRequest,
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
    existing_questions = (
    db.query(Question)
    .filter(Question.quiz_id == quiz.id)
    .order_by(Question.question_order)
    .all()
    )
    existing_questions_text = "\n".join(
    f"{q.question_order}. {q.question_text}"
    for q in existing_questions
   )

    # Find last question
    last_question = (
        db.query(Question)
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.question_order.desc())
        .first()
    )

    next_order = 1

    if last_question:
        next_order = last_question.question_order + 1

    generated = generate_single_mcq(
        topic=request.topic,
        difficulty=request.difficulty,
        existing_questions=existing_questions_text,
    )

    validated = validate_generated_question(
        generated
    )
    new_question = Question(
    quiz_id=quiz.id,
    question_text=validated["question"],
    option_a=validated["options"][0],
    option_b=validated["options"][1],
    option_c=validated["options"][2],
    option_d=validated["options"][3],
    correct_answer=validated["correct_answer"],
    explanation=validated["explanation"],
    marks=1,
    question_order=next_order,
)

    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return {
    "message": "Question generated successfully.",
    "question": new_question,
}
def get_teacher_quiz_reports(
    db: Session,
    current_user: User,
    quiz_id: int,
):
    # =====================================================
    # Verify Teacher
    # =====================================================
    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    # =====================================================
    # Verify Quiz Ownership
    # =====================================================
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    # =====================================================
    # Calculate Total Questions
    # =====================================================
    total_questions = len(quiz.questions_relation)

    if total_questions == 0 and quiz.questions:
        total_questions = len(quiz.questions)

    # =====================================================
    # Fetch Responses + Student Name
    # =====================================================
    responses = (
        db.query(
            Response,
            User.name.label("student_name"),
        )
        .join(
            User,
            User.email == Response.student_email,
        )
        .filter(
            Response.quiz_id == quiz_id,
        )
        .order_by(
            Response.submitted_at.desc(),
        )
        .all()
    )

    reports = []

    # =====================================================
    # Build Report
    # =====================================================
    for response, student_name in responses:

        percentage = 0

        if total_questions > 0:
            percentage = round(
                (response.score / total_questions) * 100,
                2,
            )

        reports.append(
            {
                "response_id": response.id,
                "student_name": student_name,
                "student_email": response.student_email,
                "score": response.score,
                "total_questions": total_questions,
                "percentage": percentage,
                "time_taken_seconds": response.time_taken_seconds,
                "submitted_at": response.submitted_at,
                "status": "Completed",
            }
        )

    return {
        "reports": reports
    }

def get_student_report(
    db: Session,
    current_user: User,
    response_id: int,
):
    # =====================================================
    # Verify Teacher
    # =====================================================
    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    # =====================================================
    # Load Response
    # =====================================================
    response = (
        db.query(Response)
        .filter(
            Response.id == response_id
        )
        .first()
    )

    if not response:
        raise HTTPException(
            status_code=404,
            detail="Response not found."
        )

    # =====================================================
    # Load Quiz
    # =====================================================
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == response.quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    # =====================================================
    # Student Name
    # =====================================================
    user = (
        db.query(User)
        .filter(
            User.email == response.student_email
        )
        .first()
    )

    student_name = user.name if user else "Unknown"

    # =====================================================
    # Questions
    # =====================================================
    questions = (
        db.query(Question)
        .filter(
            Question.quiz_id == quiz.id
        )
        .order_by(
            Question.question_order
        )
        .all()
    )

    total_questions = len(questions)

    percentage = 0

    if total_questions:
        percentage = round(
            (response.score / total_questions) * 100,
            2,
        )

    question_reports = []

    # =====================================================
    # Build Question Report
    # =====================================================
    for index, q in enumerate(questions):

        student_answer = response.answers.get(
            str(index),
            "",
        )

        if q.correct_answer == q.option_a:
            correct_letter = "A"

        elif q.correct_answer == q.option_b:
            correct_letter = "B"

        elif q.correct_answer == q.option_c:
            correct_letter = "C"

        elif q.correct_answer == q.option_d:
            correct_letter = "D"

        else:
            correct_letter = q.correct_answer

        question_reports.append(
            {
                "question_no": index + 1,
                "question": q.question_text,
                "options": [
                    q.option_a,
                    q.option_b,
                    q.option_c,
                    q.option_d,
                ],
                "student_answer": student_answer,
                "correct_answer": correct_letter,
                "is_correct": (
                    student_answer == correct_letter
                ),
                "explanation": q.explanation,
            }
        )

    return {
        "response_id": response.id,
        "student_name": student_name,
        "student_email": response.student_email,
        "quiz_title": quiz.title,
        "score": response.score,
        "total_questions": total_questions,
        "percentage": percentage,
        "time_taken_seconds": response.time_taken_seconds,
        "feedback": response.feedback,
        "submitted_at": response.submitted_at,
        "questions": question_reports,
    }

def get_teacher_profile(
    db: Session,
    current_user: User,
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    return {
        "name": current_user.name,
        "email": current_user.email,
        "employee_id": teacher.employee_id,
        "department": teacher.department,
        "designation": teacher.designation,
        "phone": teacher.phone,
    }
def update_teacher_profile(
    db: Session,
    current_user: User,
    profile,
):
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    # Update User table
    current_user.name = profile.name

    # Update Teacher table
    teacher.phone = profile.phone
    teacher.department = profile.department
    teacher.designation = profile.designation

    db.commit()

    # Refresh only the teacher object
    db.refresh(teacher)

    return {
        "message": "Profile updated successfully."
    }
def change_teacher_password(
    db: Session,
    current_user: User,
    password_data,
):
    # =====================================================
    # 1. Get the same user inside THIS database session
    # =====================================================

    user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # =====================================================
    # 2. Verify current password
    # =====================================================

    if not verify_password(
        password_data.current_password,
        user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect."
        )

    # =====================================================
    # 3. Check new password is different
    # =====================================================

    if verify_password(
        password_data.new_password,
        user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password."
        )

    # =====================================================
    # 4. Validate new password
    # =====================================================

    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters long."
        )

    # =====================================================
    # 5. Hash and update password
    # =====================================================

    user.password = hash_password(
        password_data.new_password
    )

    # =====================================================
    # 6. Save changes
    # =====================================================

    db.commit()
    db.refresh(user)

    return {
        "message": "Password changed successfully."
    }
def get_teacher_descriptive_assignment_submissions(
    db: Session,
    current_user: User,
    assignment_id: int,
):
    # =====================================================
    # Verify Teacher
    # =====================================================

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    # =====================================================
    # Verify Assignment Ownership
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignment.teacher_id == teacher.id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Descriptive assignment not found."
        )

    # =====================================================
    # Fetch submissions
    # =====================================================

    submissions = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.assignment_id == assignment.id
        )
        .order_by(
            DescriptiveSubmission.submitted_at.desc()
        )
        .all()
    )

    result = []

    for submission in submissions:

        student = submission.student

        result.append(
            {
                "submission_id": submission.id,
                "student_id": submission.student_id,

                "student_name": (
                    student.user.name
                    if student
                    and student.user
                    else "Unknown"
                ),

                "student_email": (
                    student.user.email
                    if student
                    and student.user
                    else None
                ),

                "roll_no": (
                    student.roll_no
                    if student
                    else None
                ),

                "status": submission.status,

                "evaluation_status": (
                    submission.evaluation_status
                ),

                "total_marks": submission.total_marks,

                "obtained_marks": (
                    submission.obtained_marks
                ),

                "percentage": (
                    submission.percentage
                ),

                "submitted_at": (
                    submission.submitted_at
                ),

                "evaluated_at": (
                    submission.evaluated_at
                ),
            }
        )

    return {
        "assignment_id": assignment.id,
        "assignment_title": assignment.title,
        "total_questions": len(assignment.questions),
        "submissions": result,
    }

def get_teacher_descriptive_submission(
    db: Session,
    current_user: User,
    submission_id: int,
):
    # =====================================================
    # Verify Teacher
    # =====================================================

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    # =====================================================
    # Load Submission
    # =====================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.id == submission_id
        )
        .first()
    )

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Descriptive submission not found."
        )

    # =====================================================
    # Verify Assignment Ownership
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == submission.assignment_id,
            DescriptiveAssignment.teacher_id == teacher.id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to review this submission."
        )

    # =====================================================
    # Student
    # =====================================================

    student = submission.student

    student_name = (
        student.user.name
        if student
        and student.user
        else "Unknown"
    )

    student_email = (
        student.user.email
        if student
        and student.user
        else None
    )

    # =====================================================
    # Build Answer Details
    # =====================================================

    answers = []

    for answer in submission.answers:

        question = answer.question

        answers.append(
            {
                "id": answer.id,

                "question_id": question.id,

                "question_order": (
                    question.question_order
                ),

                "question_text": (
                    question.question_text
                ),

                "max_marks": (
                    question.max_marks
                ),

                "answer_text": (
                    answer.answer_text
                ),

                "ai_marks": (
                    answer.ai_marks
                ),

                "teacher_marks": (
                    answer.teacher_marks
                ),

                "final_marks": (
                    answer.final_marks
                ),

                "ai_feedback": (
                    answer.ai_feedback
                ),

                "teacher_feedback": (
                    answer.teacher_feedback
                ),

                "evaluation_status": (
                    answer.evaluation_status
                ),

                "evaluated_at": (
                    answer.evaluated_at
                ),

                "attachments": [
                    {
                        "id": attachment.id,
                        "file_name": attachment.file_name,
                        "file_url": attachment.file_url,
                        "mime_type": attachment.mime_type,
                        "file_type": attachment.file_type,
                    }
                    for attachment in answer.attachments
                ],
            }
        )

    answers.sort(
        key=lambda x: x["question_order"]
    )

    return {
        "submission_id": submission.id,

        "assignment_id": assignment.id,

        "assignment_title": assignment.title,

        "instructions": assignment.instructions,

        "student_id": submission.student_id,

        "student_name": student_name,

        "student_email": student_email,

        "status": submission.status,

        "evaluation_status": (
            submission.evaluation_status
        ),

        "total_marks": submission.total_marks,

        "obtained_marks": submission.obtained_marks,

        "percentage": submission.percentage,

        "ai_feedback": submission.ai_feedback,

        "started_at": submission.started_at,

        "submitted_at": submission.submitted_at,

        "evaluated_at": submission.evaluated_at,

        "answers": answers,
    }
def review_teacher_descriptive_submission(
    db: Session,
    current_user: User,
    submission_id: int,
    evaluation_data,
):
    # =====================================================
    # Verify Teacher
    # =====================================================

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found."
        )

    # =====================================================
    # Load Submission
    # =====================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.id == submission_id
        )
        .first()
    )

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Descriptive submission not found."
        )

    # =====================================================
    # Verify Assignment Ownership
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == submission.assignment_id,
            DescriptiveAssignment.teacher_id == teacher.id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to review this submission."
        )

    # =====================================================
    # Review Each Answer
    # =====================================================

    for evaluation in evaluation_data.answers:

        answer = (
            db.query(DescriptiveAnswer)
            .filter(
                DescriptiveAnswer.submission_id == submission.id,
                DescriptiveAnswer.question_id == evaluation.question_id,
            )
            .first()
        )

        if not answer:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Answer not found for question "
                    f"{evaluation.question_id}."
                )
            )

        question = answer.question

        # =================================================
        # Validate Teacher Marks
        # =================================================

        teacher_marks = float(
            evaluation.teacher_marks
        )

        if teacher_marks < 0:
            raise HTTPException(
                status_code=400,
                detail="Teacher marks cannot be negative."
            )

        if teacher_marks > float(question.max_marks):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Marks for question "
                    f"{question.question_order} cannot exceed "
                    f"{question.max_marks}."
                )
            )

        # =================================================
        # Save Teacher Evaluation
        # =================================================

        answer.teacher_marks = teacher_marks

        answer.final_marks = teacher_marks

        answer.teacher_feedback = (
            evaluation.teacher_feedback
        )

        answer.evaluation_status = "Teacher Reviewed"

        answer.evaluated_at = datetime.utcnow()

    # =====================================================
    # Recalculate Submission Total
    # =====================================================

    total_marks = sum(
        float(question.max_marks)
        for question in assignment.questions
    )

    obtained_marks = 0.0

    for answer in submission.answers:

        # Teacher reviewed answer
        if answer.teacher_marks is not None:
            obtained_marks += float(
                answer.teacher_marks
            )

        # Otherwise use AI marks
        elif answer.ai_marks is not None:
            obtained_marks += float(
                answer.ai_marks
            )

    # =====================================================
    # Calculate Percentage
    # =====================================================

    percentage = (
        round(
            (obtained_marks / total_marks) * 100,
            2,
        )
        if total_marks > 0
        else 0
    )

    # =====================================================
    # Update Submission
    # =====================================================

    submission.total_marks = int(
        total_marks
    )

    submission.obtained_marks = round(
        obtained_marks,
        2,
    )

    submission.percentage = percentage

    submission.status = "Evaluated"

    submission.evaluation_status = "Teacher Reviewed"

    submission.evaluated_at = datetime.utcnow()

    db.commit()

    db.refresh(submission)

    return {
        "message": "Submission reviewed successfully.",

        "submission_id": submission.id,

        "total_marks": submission.total_marks,

        "obtained_marks": submission.obtained_marks,

        "percentage": submission.percentage,

        "evaluation_status": (
            submission.evaluation_status
        ),
    }

def create_teacher_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_data: DescriptiveAssignmentCreate,
):
    # =========================================================
    # 1. Find logged-in teacher
    # =========================================================

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise ValueError("Teacher not found.")

    # =========================================================
    # 2. Verify Subject
    # =========================================================

    subject = (
        db.query(Subject)
        .filter(
            Subject.id == assignment_data.subject_id
        )
        .first()
    )

    if not subject:
        raise ValueError("Subject not found.")

    # =========================================================
    # 3. Verify Teacher has access to selected
    #    sections + subject
    # =========================================================

    teacher_sections = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id == teacher.id,
            TeacherSection.subject_id == assignment_data.subject_id,
            TeacherSection.section_id.in_(
                assignment_data.section_ids
            ),
            TeacherSection.academic_year
            == assignment_data.academic_year,
        )
        .all()
    )

    # Create a set of sections actually assigned
    allowed_section_ids = {
        ts.section_id
        for ts in teacher_sections
    }

    # =========================================================
    # 4. Make sure every requested section belongs
    #    to this teacher for this subject/year
    # =========================================================

    requested_section_ids = set(
        assignment_data.section_ids
    )

    invalid_section_ids = (
        requested_section_ids
        - allowed_section_ids
    )

    if invalid_section_ids:
        raise ValueError(
            "You are not assigned to one or more "
            "selected sections for this subject "
            "and academic year."
        )

    # =========================================================
    # 5. Validate questions
    # =========================================================

    if not assignment_data.questions:
        raise ValueError(
            "At least one question is required."
        )

    # Check duplicate question orders
    question_orders = [
        question.question_order
        for question in assignment_data.questions
    ]

    if len(question_orders) != len(
        set(question_orders)
    ):
        raise ValueError(
            "Question order must be unique."
        )

    # =========================================================
    # 6. Create Assignment
    # =========================================================

    try:

        assignment = DescriptiveAssignment(
            teacher_id=teacher.id,
            subject_id=assignment_data.subject_id,
            title=assignment_data.title.strip(),
            instructions=assignment_data.instructions,
            status="Draft",
            due_date=assignment_data.due_date,
            duration_minutes=assignment_data.duration_minutes,
        )

        db.add(assignment)

        # Generate assignment ID
        db.flush()

        # =====================================================
        # 7. Create Questions
        # =====================================================

        for question_data in assignment_data.questions:

            question = DescriptiveAssignmentQuestion(
                assignment_id=assignment.id,
                question_text=question_data.question_text.strip(),
                max_marks=question_data.max_marks,
                expected_answer=question_data.expected_answer,
                evaluation_rubric=question_data.evaluation_rubric,
                question_order=question_data.question_order,
            )

            db.add(question)

        # =====================================================
        # 8. Create Assignment → Section mappings
        # =====================================================

        for section_id in assignment_data.section_ids:

            assignment_section = (
                DescriptiveAssignmentSection(
                    assignment_id=assignment.id,
                    section_id=section_id,
                )
            )

            db.add(assignment_section)

        # =====================================================
        # 9. Commit everything
        # =====================================================

        db.commit()

        db.refresh(assignment)

        return assignment

    except Exception:
        db.rollback()
        raise



def get_teacher_quiz_performance(
    db: Session,
    current_user: User,
    quiz_id: int,
):
    """
    Return complete performance analytics for one quiz.

    Includes:
    - Quiz statistics
    - Topper
    - Top 5 students
    - All students
    - Class performance distribution
    - Topic-wise performance
    - Question-wise performance
    - Students needing attention
    - AI class insights
    - Teaching recommendations
    """

    # =========================================================
    # FIND TEACHER
    # =========================================================

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise ValueError(
            "Teacher not found."
        )

    # =========================================================
    # FIND QUIZ + VERIFY OWNERSHIP
    # =========================================================

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.teacher_id == teacher.id,
        )
        .first()
    )

    if not quiz:
        raise ValueError(
            "Quiz not found or access denied."
        )

    # =========================================================
    # QUESTIONS
    # =========================================================

    questions = list(
        quiz.questions_relation
    )

    questions.sort(
        key=lambda q: (
            q.question_order
            if q.question_order is not None
            else q.id
        )
    )

    total_marks = sum(
        float(question.marks or 1)
        for question in questions
    )

    if total_marks <= 0:
        total_marks = 1

    # =========================================================
    # COMPLETED ASSIGNMENTS
    # =========================================================

    assignments = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.quiz_id == quiz.id,
            QuizAssignment.teacher_id == teacher.id,
            QuizAssignment.status == "Completed",
            QuizAssignment.score.isnot(None),
        )
        .all()
    )

    # =========================================================
    # BUILD STUDENT PERFORMANCE
    # =========================================================

    students = []

    for assignment in assignments:

        student = assignment.student

        if not student:
            continue

        user = student.user

        student_name = (
            user.name
            if user
            else assignment.student_email
        )

        email = (
            user.email
            if user
            else assignment.student_email
        )

        percentage = round(
            (
                float(assignment.score)
                / total_marks
            )
            * 100,
            2,
        )

        students.append(
            {
                "assignment_id": assignment.id,
                "student_id": student.id,
                "student_name": student_name,
                "roll_no": student.roll_no,
                "email": email,
                "section": (
                    student.section.section_name
                    if student.section
                    else "N/A"
                ),
                "score": float(
                    assignment.score
                ),
                "total_marks": total_marks,
                "percentage": percentage,
                "status": assignment.status,
                "submitted_at": (
                    assignment.completed_at
                    if hasattr(
                        assignment,
                        "completed_at",
                    )
                    else None
                ),
            }
        )

    # =========================================================
    # SORT + RANK
    # =========================================================

    students.sort(
        key=lambda item: item["percentage"],
        reverse=True,
    )

    for index, student in enumerate(
        students,
        start=1,
    ):
        student["rank"] = index

    # =========================================================
    # TOP 5 / TOPPER
    # =========================================================

    top_5 = students[:5]

    topper = (
        students[0]
        if students
        else None
    )

    # =========================================================
    # BASIC STATISTICS
    # =========================================================

    percentages = [
        student["percentage"]
        for student in students
    ]

    scores = [
        student["score"]
        for student in students
    ]

    average_percentage = (
        round(
            sum(percentages)
            / len(percentages),
            2,
        )
        if percentages
        else 0
    )

    average_score = (
        round(
            sum(scores)
            / len(scores),
            2,
        )
        if scores
        else 0
    )

    highest_percentage = (
        max(percentages)
        if percentages
        else 0
    )

    lowest_percentage = (
        min(percentages)
        if percentages
        else 0
    )

    # =========================================================
    # CLASS PERFORMANCE DISTRIBUTION
    # =========================================================

    performance_distribution = {
        "90_100": 0,
        "80_89": 0,
        "70_79": 0,
        "60_69": 0,
        "below_60": 0,
    }

    for percentage in percentages:

        if percentage >= 90:
            performance_distribution["90_100"] += 1

        elif percentage >= 80:
            performance_distribution["80_89"] += 1

        elif percentage >= 70:
            performance_distribution["70_79"] += 1

        elif percentage >= 60:
            performance_distribution["60_69"] += 1

        else:
            performance_distribution["below_60"] += 1

    # =========================================================
    # RESPONSE DATA
    # =========================================================

    responses = (
        db.query(Response)
        .filter(
            Response.quiz_id == quiz.id,
        )
        .all()
    )

    response_by_email = {}

    for response in responses:

        email = (
            response.student_email
            or ""
        ).strip().lower()

        if not email:
            continue

        # Keep latest response if duplicate exists
        previous = response_by_email.get(
            email
        )

        if (
            previous is None
            or (
                response.submitted_at
                and (
                    not previous.submitted_at
                    or response.submitted_at
                    > previous.submitted_at
                )
            )
        ):
            response_by_email[email] = response

    # =========================================================
    # QUESTION-WISE ANALYSIS
    # =========================================================

    question_stats = []

    for index, question in enumerate(
        questions
    ):

        question_number = index + 1

        correct_count = 0
        attempted_count = 0

        for response in responses:

            answers = (
                response.answers
                if isinstance(
                    response.answers,
                    dict,
                )
                else {}
            )

            student_answer = (
                answers.get(
                    str(index)
                )
            )

            if student_answer is None:
                student_answer = answers.get(
                    str(question.id)
                )

            if student_answer is None:
                continue

            attempted_count += 1

            if (
                str(student_answer).upper()
                == str(
                    question.correct_answer
                ).upper()
            ):
                correct_count += 1

        accuracy = (
            round(
                (
                    correct_count
                    / attempted_count
                )
                * 100,
                2,
            )
            if attempted_count
            else 0
        )

        question_stats.append(
            {
                "question_number": question_number,
                "question_id": question.id,
                "question": question.question_text,
                "topic": (
                    question.topic
                    or "General"
                ),
                "marks": float(
                    question.marks or 1
                ),
                "correct_count": correct_count,
                "incorrect_count": (
                    attempted_count
                    - correct_count
                ),
                "attempted_count": attempted_count,
                "accuracy": accuracy,
            }
        )

    # =========================================================
    # MOST MISSED QUESTIONS
    # =========================================================

    most_missed_questions = sorted(
        question_stats,
        key=lambda item: (
            item["accuracy"],
            -item["incorrect_count"],
        ),
    )[:5]

    # =========================================================
    # TOPIC-WISE PERFORMANCE
    # =========================================================

    topic_stats = {}

    for question in question_stats:

        topic = (
            question["topic"]
            or "General"
        )

        if topic not in topic_stats:

            topic_stats[topic] = {
                "topic": topic,
                "questions": 0,
                "correct": 0,
                "attempted": 0,
            }

        topic_stats[topic]["questions"] += 1

        topic_stats[topic]["correct"] += (
            question["correct_count"]
        )

        topic_stats[topic]["attempted"] += (
            question["attempted_count"]
        )

    topic_performance = []

    for topic_data in topic_stats.values():

        accuracy = (
            round(
                (
                    topic_data["correct"]
                    / topic_data["attempted"]
                )
                * 100,
                2,
            )
            if topic_data["attempted"]
            else 0
        )

        topic_performance.append(
            {
                "topic": topic_data["topic"],
                "questions": topic_data["questions"],
                "accuracy": accuracy,
            }
        )

    topic_performance.sort(
        key=lambda item: item["accuracy"]
    )

    # =========================================================
    # STUDENTS NEEDING ATTENTION
    # =========================================================

    students_needing_attention = [
        {
            "student_id": student["student_id"],
            "student_name": student["student_name"],
            "roll_no": student["roll_no"],
            "percentage": student["percentage"],
            "section": student["section"],
        }
        for student in students
        if student["percentage"] < 50
    ]

    # =========================================================
    # AI CLASS INSIGHTS
    #
    # Uses the AI analysis already generated for
    # individual student attempts.
    # =========================================================

    strength_counter = Counter()
    weak_topic_counter = Counter()
    mistake_counter = Counter()
    recommendation_counter = Counter()

    for response in responses:

        analysis = response.ai_analysis

        if not isinstance(
            analysis,
            dict,
        ):
            continue

        # -----------------------------
        # Strengths
        # -----------------------------

        strengths = analysis.get(
            "strengths",
            [],
        )

        if isinstance(
            strengths,
            list,
        ):

            for strength in strengths:

                if isinstance(
                    strength,
                    str,
                ):
                    strength_counter[
                        strength.strip()
                    ] += 1

        # -----------------------------
        # Weak Areas
        # -----------------------------

        weak_areas = analysis.get(
            "weak_areas",
            [],
        )

        if isinstance(
            weak_areas,
            list,
        ):

            for area in weak_areas:

                if not isinstance(
                    area,
                    dict,
                ):
                    continue

                topic = (
                    area.get("topic")
                    or "General"
                )

                mistake = (
                    area.get(
                        "mistake_pattern"
                    )
                    or ""
                )

                weak_topic_counter[
                    topic
                ] += 1

                if mistake:
                    mistake_counter[
                        mistake.strip()
                    ] += 1

        # -----------------------------
        # Recommendations
        # -----------------------------

        recommendations = analysis.get(
            "recommendations",
            [],
        )

        if isinstance(
            recommendations,
            list,
        ):

            for recommendation in recommendations:

                if not isinstance(
                    recommendation,
                    dict,
                ):
                    continue

                resource = (
                    recommendation.get(
                        "resource"
                    )
                    or ""
                )

                focus = (
                    recommendation.get(
                        "focus"
                    )
                    or ""
                )

                combined = (
                    f"{resource}: {focus}"
                    if resource
                    else focus
                )

                if combined:
                    recommendation_counter[
                        combined.strip()
                    ] += 1

    # =========================================================
    # COMMON STRENGTHS
    # =========================================================

    common_strengths = [
        {
            "strength": item,
            "students": count,
        }
        for item, count in (
            strength_counter
            .most_common(5)
        )
    ]

    # =========================================================
    # COMMON WEAK TOPICS
    # =========================================================

    common_weak_topics = [
        {
            "topic": item,
            "students": count,
        }
        for item, count in (
            weak_topic_counter
            .most_common(5)
        )
    ]

    # =========================================================
    # COMMON MISTAKE PATTERNS
    # =========================================================

    common_mistakes = [
        {
            "pattern": item,
            "students": count,
        }
        for item, count in (
            mistake_counter
            .most_common(5)
        )
    ]

    # =========================================================
    # AI CLASS SUMMARY
    # =========================================================

    if not students:

        class_summary = (
            "No completed student attempts "
            "are available for this quiz yet."
        )

    elif average_percentage >= 80:

        class_summary = (
            f"The class performed strongly overall "
            f"with an average score of "
            f"{average_percentage}%. "
            f"Most students demonstrated good "
            f"understanding of the quiz concepts."
        )

    elif average_percentage >= 60:

        class_summary = (
            f"The class demonstrated a moderate "
            f"understanding of the quiz concepts, "
            f"with an average score of "
            f"{average_percentage}%. "
            f"Some topics may require additional "
            f"revision and practice."
        )

    else:

        class_summary = (
            f"The class showed significant learning "
            f"gaps in this quiz, with an average "
            f"score of "
            f"{average_percentage}%. "
            f"The teacher should focus revision "
            f"on the weakest topics and most-missed "
            f"questions."
        )

    # =========================================================
    # TEACHING RECOMMENDATIONS
    # =========================================================

    teaching_recommendations = []

    weak_topic_names = [
        item["topic"]
        for item in topic_performance
        if item["accuracy"] < 60
    ]

    for topic in weak_topic_names[:5]:

        teaching_recommendations.append(
            f"Revise {topic} with additional "
            f"examples and targeted practice questions."
        )

    for question in most_missed_questions[:3]:

        if question["attempted_count"] > 0:

            teaching_recommendations.append(
                f"Review Question "
                f"{question['question_number']} "
                f"because its class accuracy was "
                f"{question['accuracy']}%."
            )

    if students_needing_attention:

        teaching_recommendations.append(
            f"Provide additional support to "
            f"{len(students_needing_attention)} "
            f"student(s) who scored below 50%."
        )

    if not teaching_recommendations:

        teaching_recommendations.append(
            "Continue with the current teaching "
            "approach and provide additional "
            "practice to reinforce the concepts."
        )

    # =========================================================
    # SECTION
    #
    # No comparison here because a quiz normally
    # belongs to one assigned section.
    # =========================================================

    sections = sorted(
        {
            student["section"]
            for student in students
            if student["section"]
            and student["section"] != "N/A"
        }
    )

    quiz_section = (
        sections[0]
        if len(sections) == 1
        else (
            ", ".join(sections)
            if sections
            else "N/A"
        )
    )

    # =========================================================
    # FINAL RESPONSE
    # =========================================================

    return {

        # -----------------------------------------------------
        # EXISTING DATA — DO NOT BREAK FRONTEND
        # -----------------------------------------------------

        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "status": quiz.status,
            "created_at": quiz.created_at,
            "total_questions": len(
                questions
            ),
            "total_marks": total_marks,
            "section": quiz_section,
        },

        "statistics": {
            "total_students": len(
                students
            ),
            "attempts": len(
                students
            ),
            "average_score": average_score,
            "average_percentage": average_percentage,
            "highest_percentage": highest_percentage,
            "lowest_percentage": lowest_percentage,
        },

        "topper": topper,

        "top_5": top_5,

        "students": students,

        # -----------------------------------------------------
        # NEW ANALYTICS
        # -----------------------------------------------------

        "class_performance": {
            "average_percentage": average_percentage,
            "highest_percentage": highest_percentage,
            "lowest_percentage": lowest_percentage,
            "distribution": performance_distribution,
        },

        "topic_performance": topic_performance,

        "question_performance": question_stats,

        "most_missed_questions": (
            most_missed_questions
        ),

        "students_needing_attention": (
            students_needing_attention
        ),

        "ai_class_analysis": {
            "summary": class_summary,
            "common_strengths": common_strengths,
            "common_weak_topics": (
                common_weak_topics
            ),
            "common_mistakes": common_mistakes,
        },

        "teaching_recommendations": (
            teaching_recommendations
        ),
    }