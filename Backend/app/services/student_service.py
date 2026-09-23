from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from fastapi import HTTPException
from typing import List
from sqlalchemy import func, desc
from ..models import (
    Student,
    Section,
    User,
    QuizAssignment,
    Quiz,
    Teacher,
    Response,

    DescriptiveAssignment,
    DescriptiveAssignmentQuestion,
    DescriptiveAssignmentSection,
    DescriptiveSubmission,
    DescriptiveAnswer,
    DescriptiveAnswerAttachment,


)
from ..services.descriptive_evaluation_service import (
    evaluate_descriptive_submission,
)
from ..schemas import (
      StudentRegistrationCreate,
    StudentResponse,
    UserCreate,
    UserRole,

    StudentDashboardResponse,
    StudentDashboardStudent,
    StudentDashboardStats,
    StudentUpcomingQuiz,
    StudentRecentActivity,
    StudentPerformanceSummary,
    StudentHistoryItem,
    StudentHistoryResponse,
    StudentPerformanceResponse,
    StudentPerformanceTrend,

    StudentDescriptiveAssignmentListItem,
    StudentDescriptiveAssignmentResponse,

    DescriptiveSubmissionCreate,
    DescriptiveSubmissionResponse,
    DescriptiveAnswerResponse,
)
from fastapi import HTTPException, status
from ..services.user_service import create_user
from ..models import Student, User, Section
import os

SUBMISSION_GRACE_SECONDS = int(
    os.getenv(
        "SUBMISSION_GRACE_SECONDS",
        "15"
    )
)
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
        "created_at": student.created_at,
"updated_at": student.updated_at,
    }

def get_student_dashboard(
    user_id: int,
    db: Session,
) -> StudentDashboardResponse:

    # =====================================================
    # 1. Get authenticated student's profile
    # =====================================================

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
            detail="Student not found.",
        )

    # =====================================================
    # 2. Get student's quiz assignments
    # =====================================================

    assignments = (
    db.query(QuizAssignment)
    .join(
        Quiz,
        QuizAssignment.quiz_id == Quiz.id,
    )
    .filter(
        QuizAssignment.student_id == student.id
    )
    .order_by(
        QuizAssignment.assigned_at.desc()
    )
    .all()
)

    # =====================================================
    # 3. Separate completed and pending quizzes
    # =====================================================

    completed_assignments = [
        assignment
        for assignment in assignments
        if assignment.status == "Completed"
    ]

    pending_assignments = [
        assignment
        for assignment in assignments
        if assignment.status in ["Assigned", "Started"]
    ]

    total_quizzes = len(assignments)

    pending_quizzes = len(pending_assignments)

    completed_quizzes = len(completed_assignments)

    # =====================================================
    # 4. Calculate dashboard scores
    # =====================================================

    scores = []
    percentage_scores = []
    highest_score = 0

    for assignment in completed_assignments:

        if assignment.score is None:
            continue

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.id == assignment.quiz_id
            )
            .first()
        )

        if not quiz:
            continue

        total_marks = 0

        # Version 2 — Question table
        if quiz.questions_relation:

            total_marks = sum(
                (question.marks or 1)
                for question in quiz.questions_relation
            )

        # Version 1 — JSON questions
        elif quiz.questions:

            total_marks = sum(
                question.get("marks", 1)
                for question in quiz.questions
            )

        score = assignment.score

        scores.append(score)

        if total_marks > 0:

            percentage = (
                score / total_marks
            ) * 100

            percentage_scores.append(
                percentage
            )

        highest_score = max(
            highest_score,
            score,
        )

    if scores:

        average_score = round(
            sum(scores) / len(scores),
            2,
        )

    else:

        average_score = 0.0

    if percentage_scores:

        average_percentage = round(
            sum(percentage_scores)
            / len(percentage_scores),
            2,
        )

    else:

        average_percentage = 0.0

    # =====================================================
    # 5. Find upcoming quiz
    # =====================================================

    upcoming_quiz = None

    upcoming_assignments = [
        assignment
        for assignment in pending_assignments
        if assignment.due_date is not None
    ]

    upcoming_assignments.sort(
        key=lambda assignment: assignment.due_date
    )

    if upcoming_assignments:

        assignment = upcoming_assignments[0]

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.id == assignment.quiz_id
            )
            .first()
        )

        if quiz:

            teacher_name = "Unknown"

            if assignment.teacher_id:

                teacher = (
                    db.query(Teacher)
                    .join(
                        User,
                        Teacher.user_id == User.id,
                    )
                    .filter(
                        Teacher.id == assignment.teacher_id
                    )
                    .first()
                )

                if teacher:
                    teacher_name = teacher.user.name

            upcoming_quiz = StudentUpcomingQuiz(
                assignment_id=assignment.id,
                quiz_id=quiz.id,
                title=quiz.title,
                teacher_name=teacher_name,
                due_date=assignment.due_date,
                duration_minutes=quiz.duration_minutes,
                status=assignment.status,
                token=assignment.token,
            )

    # =====================================================
    # 6. Recent activity
    # =====================================================

    # Use the already correctly filtered assignments
    # instead of querying only student_id assignments.
    recent_assignments = assignments[:5]

    recent_activity = []

    for assignment in recent_assignments:

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.id == assignment.quiz_id
            )
            .first()
        )

        if not quiz:
            continue

        total_marks = sum(
            (question.marks or 1)
            for question in quiz.questions_relation
        )

        if assignment.status == "Completed":

            activity_type = "quiz_completed"
            activity_title = f"{quiz.title} completed"

        else:

            activity_type = "quiz_assigned"
            activity_title = f"{quiz.title} assigned"

        percentage = None

        if (
            assignment.score is not None
            and total_marks > 0
        ):

            percentage = round(
                (assignment.score / total_marks) * 100,
                2,
            )

        recent_activity.append(
            StudentRecentActivity(
                type=activity_type,
                title=activity_title,
                quiz_id=quiz.id,
                score=assignment.score,
                total_marks=total_marks,
                percentage=percentage,
                created_at=(
                    assignment.completed_at
                    if assignment.status == "Completed"
                    and assignment.completed_at
                    else assignment.assigned_at
                ),
            )
        )

    # =====================================================
    # 7. Performance summary
    # =====================================================

    student_responses = (
        db.query(Response)
        .filter(
            Response.student_email == student.user.email
        )
        .all()
    )

    response_scores = [
        response.score
        for response in student_responses
        if response.score is not None
    ]

    if response_scores:

        response_average = round(
            sum(response_scores)
            / len(response_scores),
            2,
        )

        response_highest = max(response_scores)
        response_lowest = min(response_scores)

    else:

        response_average = 0.0
        response_highest = 0
        response_lowest = 0

    time_values = [
        response.time_taken_seconds
        for response in student_responses
        if response.time_taken_seconds is not None
    ]

    if time_values:

        average_time_taken = round(
            sum(time_values)
            / len(time_values),
            2,
        )

    else:

        average_time_taken = None

    performance = StudentPerformanceSummary(
        total_attempts=len(student_responses),
        average_score=response_average,
        highest_score=response_highest,
        lowest_score=response_lowest,
        average_time_taken_seconds=average_time_taken,
    )

    # =====================================================
    # 8. Return dashboard
    # =====================================================

    return StudentDashboardResponse(

        student=StudentDashboardStudent(
            name=student.user.name,
            email=student.user.email,
            roll_no=student.roll_no,
            section_name=student.section.section_name,
            department=student.section.department,
            year=student.section.year,
            semester=student.section.semester,
        ),

        stats=StudentDashboardStats(
            total_quizzes=total_quizzes,
            pending_quizzes=pending_quizzes,
            completed_quizzes=completed_quizzes,
            average_score=average_score,
            average_percentage=average_percentage,
            highest_score=highest_score,
        ),

        upcoming_quiz=upcoming_quiz,

        recent_activity=recent_activity,

        performance=performance,
    )
def get_student_quizzes(
    user_id: int,
    db: Session,
):
    # -------------------------------------------------
    # 1. Find logged-in student's profile
    # -------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # -------------------------------------------------
    # 2. Get quizzes assigned directly to this student
    # -------------------------------------------------

    assignments = (
        db.query(QuizAssignment)
        .join(
            Quiz,
            QuizAssignment.quiz_id == Quiz.id,
        )
        .filter(
            QuizAssignment.student_id == student.id
        )
        .order_by(
            QuizAssignment.assigned_at.desc()
        )
        .all()
    )

    result = []

    # -------------------------------------------------
    # 3. Build response
    # -------------------------------------------------

    for assignment in assignments:

        quiz = assignment.quiz

        if not quiz:
            continue

        # -------------------------------------------------
        # Determine teacher name
        # -------------------------------------------------

        teacher_name = "Unknown Teacher"

        if assignment.teacher and assignment.teacher.user:

            teacher_name = assignment.teacher.user.name

        elif quiz.teacher and quiz.teacher.user:

            teacher_name = quiz.teacher.user.name

        # -------------------------------------------------
        # Calculate total marks
        # -------------------------------------------------

        total_marks = 0

        # Version 2 — Question table
        if quiz.questions_relation:

            total_marks = sum(
                (question.marks or 1)
                for question in quiz.questions_relation
            )

        # Version 1 — JSON questions
        elif quiz.questions:

            total_marks = sum(
                question.get("marks", 1)
                for question in quiz.questions
            )

        # -------------------------------------------------
        # Calculate percentage
        # -------------------------------------------------

        percentage = None

        if (
            assignment.score is not None
            and total_marks > 0
        ):

            percentage = round(
                (assignment.score / total_marks) * 100,
                2,
            )

        # -------------------------------------------------
        # Find student's Response
        # -------------------------------------------------

        response_id = None

        if assignment.status == "Completed":

            response = (
                db.query(Response)
                .filter(
                    Response.quiz_id == assignment.quiz_id,
                    Response.student_email == assignment.student_email,
                )
                .order_by(
                    Response.id.desc()
                )
                .first()
            )

            if response:

                response_id = response.id

        # -------------------------------------------------
        # Build quiz response
        # -------------------------------------------------

        result.append(
            {
                "assignment_id": assignment.id,

                "quiz_id": assignment.quiz_id,

                "title": quiz.title,

                "teacher_name": teacher_name,

                "duration_minutes": quiz.duration_minutes,

                "status": assignment.status,

                "score": assignment.score,

                "total_marks": total_marks,

                "percentage": percentage,

                "response_id": response_id,

                "assigned_at": assignment.assigned_at,

                "due_date": assignment.due_date,

                "started_at": assignment.started_at,

                "completed_at": assignment.completed_at,

                "expires_at": assignment.expires_at,

                "token": assignment.token,
            }
        )

    return result

def get_student_performance(
    user_id: int,
    db: Session,
) -> StudentPerformanceResponse:

    # =====================================================
    # 1. Find logged-in student
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # =====================================================
    # 2. Get student's completed quiz assignments
    # =====================================================

    assignments = (
        db.query(QuizAssignment)
        .join(
            Quiz,
            QuizAssignment.quiz_id == Quiz.id,
        )
        .filter(
            QuizAssignment.student_id == student.id,
            QuizAssignment.status == "Completed",
        )
        .order_by(
            QuizAssignment.completed_at.asc()
        )
        .all()
    )

    # =====================================================
    # 3. Prepare student's own performance data
    # =====================================================

    trend = []

    percentages = []

    for assignment in assignments:

        quiz = assignment.quiz

        if not quiz:
            continue

        # -------------------------------------------------
        # Calculate total marks
        # -------------------------------------------------

        total_marks = 0

        # Version 2 — Question table
        if quiz.questions_relation:

            total_marks = sum(
                (question.marks or 1)
                for question in quiz.questions_relation
            )

        # Version 1 — JSON questions
        elif quiz.questions:

            total_marks = sum(
                question.get("marks", 1)
                for question in quiz.questions
            )

        # -------------------------------------------------
        # Skip invalid quizzes
        # -------------------------------------------------

        if total_marks <= 0:
            continue

        if assignment.score is None:
            continue

        # -------------------------------------------------
        # Find student's response
        # -------------------------------------------------

        response = (
            db.query(Response)
            .filter(
                Response.quiz_id == assignment.quiz_id,
                Response.student_email == assignment.student_email,
            )
            .order_by(
                Response.id.desc()
            )
            .first()
        )

        if not response:
            continue

        # -------------------------------------------------
        # Calculate percentage
        # -------------------------------------------------

        percentage = round(
            (assignment.score / total_marks) * 100,
            2,
        )

        percentages.append(percentage)

        # -------------------------------------------------
        # Attempted date
        # -------------------------------------------------

        attempted_at = (
            assignment.completed_at
            or assignment.started_at
            or assignment.assigned_at
        )

        # -------------------------------------------------
        # Add trend item
        # -------------------------------------------------

        trend.append(
            StudentPerformanceTrend(
                response_id=response.id,
                quiz_id=quiz.id,
                title=quiz.title,
                score=assignment.score,
                total_marks=total_marks,
                percentage=percentage,
                attempted_at=attempted_at,
            )
        )

    # =====================================================
    # 4. Calculate student's own overall performance
    # =====================================================

    total_attempts = len(trend)

    if percentages:

        average_percentage = round(
            sum(percentages) / len(percentages),
            2,
        )

        highest_percentage = max(percentages)

        lowest_percentage = min(percentages)

    else:

        average_percentage = 0.0
        highest_percentage = 0.0
        lowest_percentage = 0.0

    # =====================================================
    # 5. Get all active students from same section
    # =====================================================

    section_students = (
        db.query(Student)
        .join(
            User,
            Student.user_id == User.id,
        )
        .filter(
            Student.section_id == student.section_id,
            Student.is_active.is_(True),
        )
        .order_by(
            User.name.asc()
        )
        .all()
    )

    # =====================================================
    # 6. Prepare student ranking map
    # =====================================================

    student_map = {
        item.id: {
            "student_id": item.id,
            "student_name": (
                item.user.name
                if item.user
                else "Unknown"
            ),
            "roll_no": item.roll_no,
            "attempts": 0,
            "score_total": 0.0,
            "percentage_total": 0.0,
        }
        for item in section_students
    }

    # =====================================================
    # 7. Get all completed quizzes of section students
    # =====================================================

    section_student_ids = list(
        student_map.keys()
    )

    if section_student_ids:

        section_assignments = (
            db.query(QuizAssignment)
            .join(
                Quiz,
                QuizAssignment.quiz_id == Quiz.id,
            )
            .filter(
                QuizAssignment.section_id == student.section_id,
                QuizAssignment.status == "Completed",
                QuizAssignment.score.isnot(None),
                QuizAssignment.student_id.in_(
                    section_student_ids
                ),
            )
            .all()
        )

    else:

        section_assignments = []

    # =====================================================
    # 8. Calculate every student's performance
    # =====================================================

    for assignment in section_assignments:

        row = student_map.get(
            assignment.student_id
        )

        if not row:
            continue

        quiz = assignment.quiz

        if not quiz:
            continue

        # -------------------------------------------------
        # Calculate quiz total marks
        # -------------------------------------------------

        total_marks = 0

        # Version 2 — Question table
        if quiz.questions_relation:

            total_marks = sum(
                (question.marks or 1)
                for question in quiz.questions_relation
            )

        # Version 1 — JSON questions
        elif quiz.questions:

            total_marks = sum(
                question.get("marks", 1)
                for question in quiz.questions
            )

        # -------------------------------------------------
        # Skip invalid quiz
        # -------------------------------------------------

        if total_marks <= 0:
            continue

        # -------------------------------------------------
        # Calculate percentage
        # -------------------------------------------------

        percentage = (
            float(assignment.score)
            / total_marks
        ) * 100

        # -------------------------------------------------
        # Add student's performance
        # -------------------------------------------------

        row["attempts"] += 1

        row["score_total"] += float(
            assignment.score
        )

        row["percentage_total"] += percentage

    # =====================================================
    # 9. Build student performance rows
    # =====================================================

    rows = []

    for row in student_map.values():

        attempts = row["attempts"]

        average_score = (
            row["score_total"] / attempts
            if attempts
            else 0
        )

        average_percentage = (
            row["percentage_total"] / attempts
            if attempts
            else 0
        )

        rows.append(
            {
                "student_id": row["student_id"],
                "student_name": row["student_name"],
                "roll_no": row["roll_no"],
                "attempts": attempts,
                "average_score": round(
                    average_score,
                    2,
                ),
                "average_percentage": round(
                    average_percentage,
                    2,
                ),
                "rank": None,
            }
        )

    # =====================================================
    # 10. Rank students
    # =====================================================

    ranked_students = [
        row
        for row in rows
        if row["attempts"] > 0
    ]

    ranked_students.sort(
        key=lambda row: (
            row["average_percentage"],
            row["average_score"],
            row["attempts"],
        ),
        reverse=True,
    )

    # =====================================================
    # 11. Assign ranks
    # =====================================================

    for index, row in enumerate(
        ranked_students,
        start=1,
    ):
        row["rank"] = index

    # Create quick rank lookup
    rank_map = {
        row["student_id"]: row["rank"]
        for row in ranked_students
    }

    # Add rank to all students
    for row in rows:

        row["rank"] = rank_map.get(
            row["student_id"]
        )

    # =====================================================
    # 12. Sort students for frontend
    # =====================================================

    rows.sort(
        key=lambda row: (
            row["attempts"] > 0,
            row["average_percentage"],
            row["student_name"].lower(),
        ),
        reverse=True,
    )

    # =====================================================
    # 13. Find logged-in student's ranking data
    # =====================================================

    my_row = next(
        (
            row
            for row in rows
            if row["student_id"] == student.id
        ),
        None,
    )

    # =====================================================
    # 14. Calculate section average
    # =====================================================

    class_average_percentage = (
        round(
            sum(
                row["average_percentage"]
                for row in ranked_students
            )
            / len(ranked_students),
            2,
        )
        if ranked_students
        else 0.0
    )

    # =====================================================
    # 15. Find topper
    # =====================================================

    topper = (
        ranked_students[0]
        if ranked_students
        else None
    )

    # =====================================================
    # 16. Return complete performance
    # =====================================================

    return StudentPerformanceResponse(

        # -------------------------------------------------
        # Existing fields
        # -------------------------------------------------

        total_attempts=total_attempts,

        average_percentage=average_percentage,

        highest_percentage=highest_percentage,

        lowest_percentage=lowest_percentage,

        trend=trend,

        # -------------------------------------------------
        # New overall ranking fields
        # -------------------------------------------------

        my_rank=(
            my_row["rank"]
            if my_row
            else None
        ),

        my_average_percentage=(
            my_row["average_percentage"]
            if my_row
            else 0.0
        ),

        class_average_percentage=(
            class_average_percentage
        ),

        topper=topper,

        top_students=(
            ranked_students[:5]
        ),

        students=rows,
    )
def get_student_history(
    user_id: int,
    db: Session,
) -> StudentHistoryResponse:

    # =====================================================
    # 1. Find logged-in student
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # =====================================================
    # 2. Get student's email
    # =====================================================

    student_email = student.user.email

    # =====================================================
    # 3. Get completed assignments
    # =====================================================

    assignments = (
        db.query(QuizAssignment)
        .join(
            Quiz,
            QuizAssignment.quiz_id == Quiz.id,
        )
        .filter(
            QuizAssignment.student_id == student.id,
            QuizAssignment.status == "Completed",
        )
        .order_by(
            QuizAssignment.completed_at.desc()
        )
        .all()
    )

    history = []

    # =====================================================
    # 4. Build history
    # =====================================================

    for assignment in assignments:

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.id == assignment.quiz_id
            )
            .first()
        )

        if not quiz:
            continue

        # -------------------------------------------------
        # Find student's response
        # -------------------------------------------------

        response = (
            db.query(Response)
            .filter(
                Response.quiz_id == assignment.quiz_id,
                Response.student_email == student_email,
            )
            .order_by(
                Response.id.desc()
            )
            .first()
        )

        if not response:
            continue

        # -------------------------------------------------
        # Calculate total marks
        # -------------------------------------------------

        total_marks = 0

        # Version 2 — Question table
        if quiz.questions_relation:

            total_marks = sum(
                (question.marks or 1)
                for question in quiz.questions_relation
            )

        # Version 1 — JSON questions
        elif quiz.questions:

            total_marks = sum(
                question.get("marks", 1)
                for question in quiz.questions
            )

        # -------------------------------------------------
        # Calculate percentage
        # -------------------------------------------------

        percentage = 0.0

        if (
            response.score is not None
            and total_marks > 0
        ):
            percentage = round(
                (
                    response.score
                    / total_marks
                ) * 100,
                2,
            )

        # -------------------------------------------------
        # Teacher name
        # -------------------------------------------------

        teacher_name = "Unknown Teacher"

        if assignment.teacher and assignment.teacher.user:

            teacher_name = assignment.teacher.user.name

        elif quiz.teacher and quiz.teacher.user:

            teacher_name = quiz.teacher.user.name

        # -------------------------------------------------
        # Attempted time
        # -------------------------------------------------

        attempted_at = assignment.completed_at

        if attempted_at is None:
            continue

        # -------------------------------------------------
        # Add history item
        # -------------------------------------------------

        history.append(
            StudentHistoryItem(
                response_id=response.id,
                quiz_id=quiz.id,

                title=quiz.title,
                teacher_name=teacher_name,

                score=response.score or 0,
                total_marks=total_marks,
                percentage=percentage,

                attempted_at=attempted_at,
                time_taken_seconds=(
                    response.time_taken_seconds
                ),
            )
        )

    # =====================================================
    # 5. Return history
    # =====================================================

    return StudentHistoryResponse(
        items=history,
        total=len(history),
    )

    # =====================================================
    # 5. Return history
    # =====================================================

    return StudentHistoryResponse(
        items=history,
        total=len(history),
    )
def get_student_descriptive_assignments(
    user_id: int,
    db: Session,
):
    """
    Return descriptive assignments assigned to the
    authenticated student's section.
    """

    # =====================================================
    # 1. Find logged-in student
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # =====================================================
    # 2. Find assignments assigned to student's section
    # =====================================================

    assignments = (
        db.query(DescriptiveAssignment)
        .join(
            DescriptiveAssignmentSection,
            DescriptiveAssignment.id
            == DescriptiveAssignmentSection.assignment_id,
        )
        .filter(
            DescriptiveAssignmentSection.section_id
            == student.section_id
        )
        .order_by(
            DescriptiveAssignment.created_at.desc()
        )
        .all()
    )

    result = []

    # =====================================================
    # 3. Build response
    # =====================================================

    for assignment in assignments:

        subject_name = (
            assignment.subject.subject_name
            if assignment.subject
            else "Unknown Subject"
        )

        teacher_name = "Unknown Teacher"

        if (
            assignment.teacher
            and assignment.teacher.user
        ):
            teacher_name = assignment.teacher.user.name

        questions = assignment.questions or []

        total_marks = sum(
            question.max_marks or 0
            for question in questions
        )

        # -------------------------------------------------
        # Find student's submission
        # -------------------------------------------------

        submission = (
            db.query(DescriptiveSubmission)
            .filter(
                DescriptiveSubmission.assignment_id
                == assignment.id,
                DescriptiveSubmission.student_id
                == student.id,
            )
            .order_by(
                DescriptiveSubmission.id.desc()
            )
            .first()
        )

        submission_status = None
        submitted_at = None
        obtained_marks = None

        if submission:

            submission_status = submission.status
            submitted_at = submission.submitted_at
            obtained_marks = submission.obtained_marks

        result.append(
            StudentDescriptiveAssignmentListItem(
                assignment_id=assignment.id,

                title=assignment.title,

                instructions=assignment.instructions,

                subject_id=assignment.subject_id,

                subject_name=subject_name,

                teacher_name=teacher_name,

                due_date=assignment.due_date,

                status=assignment.status,

                question_count=len(questions),

                submission_status=submission_status,

                submitted_at=submitted_at,

                obtained_marks=obtained_marks,

                total_marks=total_marks,
            )
        )

    return result
def get_student_descriptive_assignment(
    user_id: int,
    assignment_id: int,
    db: Session,
):
    """
    Return a descriptive assignment only if it is
    assigned to the student's section.

    Also starts the student's exam timer when the
    assignment is opened for the first time.
    """

    from datetime import datetime, timedelta, timezone

    # =====================================================
    # 1. FIND STUDENT
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # =====================================================
    # 2. FIND ASSIGNMENT THROUGH SECTION MAPPING
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .join(
            DescriptiveAssignmentSection,
            DescriptiveAssignment.id
            == DescriptiveAssignmentSection.assignment_id,
        )
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignmentSection.section_id
            == student.section_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail=(
                "Assignment not found or not assigned "
                "to your section."
            ),
        )

    # =====================================================
    # 3. CHECK ASSIGNMENT STATUS
    # =====================================================

    if assignment.status != "Published":
        raise HTTPException(
            status_code=400,
            detail="This assignment is not available.",
        )

    # =====================================================
    # 4. FIND STUDENT SUBMISSION
    # =====================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.assignment_id
            == assignment.id,
            DescriptiveSubmission.student_id
            == student.id,
        )
        .order_by(
            DescriptiveSubmission.id.desc()
        )
        .first()
    )

    # =====================================================
    # 5. CREATE SUBMISSION / START TIMER
    # =====================================================

    if not submission:

        submission = DescriptiveSubmission(
            assignment_id=assignment.id,
            student_id=student.id,
            status="In Progress",
            evaluation_status="Pending",
            started_at=datetime.utcnow(),
        )

        db.add(submission)
        db.commit()
        db.refresh(submission)

    # =====================================================
    # 6. PREVENT OPENING AFTER SUBMISSION
    # =====================================================

    if submission.status == "Submitted":

        raise HTTPException(
            status_code=400,
            detail=(
                "This assignment has already been submitted."
            ),
        )

    # =====================================================
    # 7. CALCULATE EXPIRY TIME
    # =====================================================

    expires_at = None

    if assignment.duration_minutes:

        started_at = submission.started_at

        if started_at:

            # Handle timezone-naive DB datetime safely
            if started_at.tzinfo is None:

                started_at_utc = started_at.replace(
                    tzinfo=timezone.utc
                )

            else:

                started_at_utc = started_at.astimezone(
                    timezone.utc
                )

            expires_at = (
                started_at_utc
                + timedelta(
                    minutes=assignment.duration_minutes
                )
            )
            current_time = datetime.now(timezone.utc)
            if current_time > expires_at:
              raise HTTPException(
              status_code=400,
            detail="The time limit for this assignment has expired.",
    )

    # =====================================================
    # 8. TEACHER
    # =====================================================

    teacher_name = "Unknown Teacher"

    if (
        assignment.teacher
        and assignment.teacher.user
    ):
        teacher_name = assignment.teacher.user.name

    # =====================================================
    # 9. SUBJECT
    # =====================================================

    subject_name = (
        assignment.subject.subject_name
        if assignment.subject
        else "Unknown Subject"
    )

    # =====================================================
    # 10. RETURN ASSIGNMENT
    # =====================================================

    return {
        "assignment_id": assignment.id,

        "title": assignment.title,

        "instructions": assignment.instructions,

        "subject_id": assignment.subject_id,

        "subject_name": subject_name,

        "teacher_name": teacher_name,

        "due_date": assignment.due_date,

        "status": assignment.status,

        "duration_minutes": assignment.duration_minutes,

        "started_at": submission.started_at,

        "expires_at": expires_at,

        "submission_status": submission.status,

        "questions": assignment.questions,
    }
def submit_student_descriptive_assignment(
    user_id: int,
    submission_data: DescriptiveSubmissionCreate,
    db: Session,
):
    """
    Submit student's descriptive assignment answers.

    Supports:
    - Text answers
    - Drawing/figure answers
    - Updating an existing in-progress submission
    - AI evaluation after submission
    - Server-side duration enforcement
    """

    # =====================================================
    # 1. FIND STUDENT
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # =====================================================
    # 2. FIND ASSIGNMENT ASSIGNED TO STUDENT'S SECTION
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .join(
            DescriptiveAssignmentSection,
            DescriptiveAssignment.id
            == DescriptiveAssignmentSection.assignment_id,
        )
        .filter(
            DescriptiveAssignment.id
            == submission_data.assignment_id,
            DescriptiveAssignmentSection.section_id
            == student.section_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail=(
                "Assignment not found or not assigned "
                "to your section."
            ),
        )

    # =====================================================
    # 3. CHECK ASSIGNMENT STATUS
    # =====================================================

    if assignment.status != "Published":
        raise HTTPException(
            status_code=400,
            detail=(
                "This assignment is not available "
                "for submission."
            ),
        )

    # =====================================================
    # 4. CHECK ASSIGNMENT DUE DATE
    # =====================================================

    from datetime import datetime, timezone, timedelta

    if assignment.due_date:

        due_date = assignment.due_date

        if due_date.tzinfo is None:
            now = datetime.utcnow()

            if now > due_date:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "The submission deadline "
                        "has passed."
                    ),
                )

        else:
            now = datetime.now(timezone.utc)

            if now > due_date:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "The submission deadline "
                        "has passed."
                    ),
                )

    # =====================================================
    # 5. FIND EXISTING SUBMISSION
    # =====================================================

    existing_submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.assignment_id
            == assignment.id,
            DescriptiveSubmission.student_id
            == student.id,
        )
        .first()
    )

    # =====================================================
    # 6. CREATE / LOAD SUBMISSION
    # =====================================================

    if existing_submission:

        # -------------------------------------------------
        # Prevent duplicate submission
        # -------------------------------------------------

        if existing_submission.status == "Submitted":
            raise HTTPException(
                status_code=400,
                detail=(
                    "You have already submitted "
                    "this assignment."
                ),
            )

        submission = existing_submission

    else:

        submission = DescriptiveSubmission(
            assignment_id=assignment.id,
            student_id=student.id,
            status="In Progress",
            evaluation_status="Pending",
            started_at=datetime.utcnow(),
        )

        db.add(submission)
        db.flush()

    # =====================================================
    # 7. SERVER-SIDE DURATION ENFORCEMENT
    # =====================================================

    if assignment.duration_minutes:

        if not submission.started_at:

            # Safety fallback
            submission.started_at = datetime.utcnow()
            db.flush()

        started_at = submission.started_at

        # -------------------------------------------------
        # Convert started_at to UTC
        # -------------------------------------------------

        if started_at.tzinfo is None:

            started_at_utc = started_at.replace(
                tzinfo=timezone.utc
            )

        else:

            started_at_utc = started_at.astimezone(
                timezone.utc
            )

        # -------------------------------------------------
        # Calculate exam expiry
        # -------------------------------------------------

        expires_at = (
            started_at_utc
            + timedelta(
                minutes=assignment.duration_minutes
            )
        )

        # -------------------------------------------------
        # Current UTC time
        # -------------------------------------------------

        current_time = datetime.now(
            timezone.utc
        )
        print(
           "EXAM TIME DEBUG:",
           "started_at =", started_at_utc,
           "expires_at =", expires_at,
           "current_time =", current_time,
           "grace_seconds =", SUBMISSION_GRACE_SECONDS,
        )


        # -------------------------------------------------
        # BLOCK LATE SUBMISSION
        # -------------------------------------------------
        # -------------------------------------------------
# BLOCK LATE SUBMISSION
#
# Allow a very small grace period for the final
# auto-submit request to travel from browser to server.
# -------------------------------------------------
      
         
        grace_period = timedelta(seconds=SUBMISSION_GRACE_SECONDS)

        if current_time > (expires_at + grace_period):

         raise HTTPException(


        status_code=400,
        detail=(
            "The time limit for this "
            "assignment has expired."
        ),
    )
 

    # =====================================================
    # 8. VALIDATE QUESTIONS
    # =====================================================

    question_map = {
        question.id: question
        for question in assignment.questions
    }

    submitted_question_ids = set()

    # =====================================================
    # 9. SAVE ANSWERS + DRAWINGS
    # =====================================================

    for submitted_answer in submission_data.answers:

        question_id = submitted_answer.question_id

        # -------------------------------------------------
        # Prevent duplicate questions
        # -------------------------------------------------

        if question_id in submitted_question_ids:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Duplicate answer for "
                    f"question {question_id}."
                ),
            )

        submitted_question_ids.add(question_id)

        # -------------------------------------------------
        # Check question belongs to assignment
        # -------------------------------------------------

        question = question_map.get(
            question_id
        )

        if not question:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Question {question_id} does not "
                    f"belong to this assignment."
                ),
            )

        # -------------------------------------------------
        # Find existing answer
        # -------------------------------------------------

        existing_answer = (
            db.query(DescriptiveAnswer)
            .filter(
                DescriptiveAnswer.submission_id
                == submission.id,
                DescriptiveAnswer.question_id
                == question_id,
            )
            .first()
        )

        # =================================================
        # EXISTING ANSWER
        # =================================================

        if existing_answer:

            existing_answer.answer_text = (
                submitted_answer.answer_text
            )

            # -------------------------------------------------
            # DRAWING
            # -------------------------------------------------

            drawing = getattr(
                submitted_answer,
                "drawing_data",
                None,
            )

            if drawing:

                # Remove previous drawing

                db.query(
                    DescriptiveAnswerAttachment
                ).filter(
                    DescriptiveAnswerAttachment.answer_id
                    == existing_answer.id,
                    DescriptiveAnswerAttachment.file_type
                    == "drawing",
                ).delete(
                    synchronize_session=False
                )

                # Save new drawing

                drawing_attachment = (
                    DescriptiveAnswerAttachment(
                        answer_id=existing_answer.id,
                        file_name=(
                            f"drawing_{question_id}.png"
                        ),
                        file_url=drawing,
                        mime_type="image/png",
                        file_type="drawing",
                    )
                )

                db.add(
                    drawing_attachment
                )

        # =================================================
        # NEW ANSWER
        # =================================================

        else:

            answer = DescriptiveAnswer(
                submission_id=submission.id,
                question_id=question_id,
                answer_text=(
                    submitted_answer.answer_text
                ),
                evaluation_status="Pending",
            )

            db.add(answer)

            # Generate answer.id

            db.flush()

            # -------------------------------------------------
            # SAVE DRAWING
            # -------------------------------------------------

            drawing = getattr(
                submitted_answer,
                "drawing_data",
                None,
            )

            if drawing:

                drawing_attachment = (
                    DescriptiveAnswerAttachment(
                        answer_id=answer.id,
                        file_name=(
                            f"drawing_{question_id}.png"
                        ),
                        file_url=drawing,
                        mime_type="image/png",
                        file_type="drawing",
                    )
                )

                db.add(
                    drawing_attachment
                )

    # =====================================================
    # 10. CALCULATE TOTAL MARKS
    # =====================================================

    total_marks = sum(
        question.max_marks or 0
        for question in assignment.questions
    )

    submission.total_marks = total_marks

    # =====================================================
    # 11. MARK SUBMISSION AS SUBMITTED
    # =====================================================

    submission.status = "Submitted"

    submission.evaluation_status = "Pending"

    submission.submitted_at = (
        datetime.utcnow()
    )

    # =====================================================
    # 12. SAVE TO DATABASE
    # =====================================================

    db.commit()

    db.refresh(submission)

    # =====================================================
    # 13. AI EVALUATION
    # =====================================================

    evaluate_descriptive_submission(
        submission_id=submission.id,
        db=db,
    )

    db.refresh(submission)

    return submission
def get_student_descriptive_submission(
    user_id: int,
    assignment_id: int,
    db: Session,
):
    # =====================================================
    # 1. Find logged-in student
    # =====================================================

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # =====================================================
    # 2. Verify assignment belongs to student's section
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .join(
            DescriptiveAssignmentSection,
            DescriptiveAssignment.id
            == DescriptiveAssignmentSection.assignment_id,
        )
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignmentSection.section_id
            == student.section_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found.",
        )

    # =====================================================
    # 3. Find student's submission
    # =====================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.assignment_id == assignment.id,
            DescriptiveSubmission.student_id == student.id,
        )
        .order_by(
            DescriptiveSubmission.id.desc()
        )
        .first()
    )

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="You have not submitted this assignment yet.",
        )

    # =====================================================
    # 4. Build answer response
    # =====================================================

    answers = []

    for answer in submission.answers:

        answers.append(
            {
                "id": answer.id,
                "question_id": answer.question_id,
                "answer_text": answer.answer_text,

                "ai_marks": answer.ai_marks,
                "ai_feedback": answer.ai_feedback,

                "teacher_marks": answer.teacher_marks,
                "teacher_feedback": answer.teacher_feedback,

                "final_marks": answer.final_marks,

                "evaluation_status": answer.evaluation_status,
            }
        )

    # =====================================================
    # 5. Return complete student result
    # =====================================================

    return {
    "id": submission.id,

    "assignment_id": submission.assignment_id,

    "student_id": submission.student_id,

    "status": submission.status,

    "evaluation_status": submission.evaluation_status,

    "total_marks": submission.total_marks,

    "obtained_marks": submission.obtained_marks,

    "percentage": submission.percentage,

    "ai_feedback": submission.ai_feedback,

    "answer_pdf_url": submission.answer_pdf_url,

    "answer_pdf_name": submission.answer_pdf_name,

    "started_at": submission.started_at,

    "submitted_at": submission.submitted_at,

    "evaluated_at": submission.evaluated_at,

    "answers": answers,
}
# ============================================================
# STUDENT - PARTICULAR QUIZ PERFORMANCE
# ============================================================

def get_student_quiz_performance(
    user_id: int,
    quiz_id: int,
    db: Session,
):
    """
    Return performance for one quiz for the logged-in student's
    own section.

    Security:
    - The quiz must be assigned to the logged-in student.
    - Students only see students from their own section.
    - Completed attempts are ranked by percentage.
    """

    # ---------------------------------------------------------
    # 1. Find logged-in student
    # ---------------------------------------------------------
    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    # ---------------------------------------------------------
    # 2. Verify this quiz was assigned to this student
    # ---------------------------------------------------------
    my_assignment = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.quiz_id == quiz_id,
            QuizAssignment.student_id == student.id,
        )
        .first()
    )

    if not my_assignment:
        raise HTTPException(
            status_code=403,
            detail="This quiz is not assigned to you.",
        )

    # ---------------------------------------------------------
    # 3. Load quiz
    # ---------------------------------------------------------
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    # ---------------------------------------------------------
    # 4. Calculate total marks
    # ---------------------------------------------------------
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
    else:
        total_marks = 0

    # ---------------------------------------------------------
    # 5. Get active students from the logged-in student's
    #    section only.
    # ---------------------------------------------------------
    section_students = (
        db.query(Student)
        .join(User, Student.user_id == User.id)
        .filter(
            Student.section_id == student.section_id,
            Student.is_active.is_(True),
        )
        .order_by(User.name.asc())
        .all()
    )

    student_map = {
        item.id: {
            "student_id": item.id,
            "student_name": (
                item.user.name
                if item.user
                else "Unknown"
            ),
            "roll_no": item.roll_no,
            "score": None,
            "percentage": None,
            "attempted": False,
        }
        for item in section_students
    }

    # ---------------------------------------------------------
    # 6. Get completed attempts for THIS quiz + THIS section
    # ---------------------------------------------------------
    assignments = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.quiz_id == quiz_id,
            QuizAssignment.section_id == student.section_id,
            QuizAssignment.student_id.in_(
                list(student_map.keys())
            ),
            QuizAssignment.status == "Completed",
            QuizAssignment.score.isnot(None),
        )
        .all()
    )

    # ---------------------------------------------------------
    # 7. Calculate each student's percentage
    # ---------------------------------------------------------
    for assignment in assignments:
        item = student_map.get(
            assignment.student_id
        )

        if not item:
            continue

        score = float(
            assignment.score or 0
        )

        percentage = (
            round(
                (score / total_marks) * 100,
                2,
            )
            if total_marks > 0
            else 0
        )

        item["score"] = score
        item["percentage"] = percentage
        item["attempted"] = True

    # ---------------------------------------------------------
    # 8. Rank only completed students
    # ---------------------------------------------------------
    ranked = sorted(
        [
            item
            for item in student_map.values()
            if item["attempted"]
        ],
        key=lambda item: (
            item["percentage"],
            item["score"],
            item["student_name"].lower(),
        ),
        reverse=True,
    )

    for index, item in enumerate(
        ranked,
        start=1,
    ):
        item["rank"] = index

    # Add rank back to all-student rows.
    rank_map = {
        item["student_id"]: item["rank"]
        for item in ranked
    }

    for item in student_map.values():
        item["rank"] = rank_map.get(
            item["student_id"]
        )

    # ---------------------------------------------------------
    # 9. Logged-in student's own result
    # ---------------------------------------------------------
    my_row = student_map.get(student.id)

    my_score = (
        my_row["score"]
        if my_row and my_row["attempted"]
        else None
    )

    my_percentage = (
        my_row["percentage"]
        if my_row and my_row["attempted"]
        else None
    )

    my_rank = (
        my_row["rank"]
        if my_row and my_row["attempted"]
        else None
    )

    # ---------------------------------------------------------
    # 10. Class average
    # ---------------------------------------------------------
    completed_percentages = [
        item["percentage"]
        for item in ranked
        if item["percentage"] is not None
    ]

    class_average = (
        round(
            sum(completed_percentages)
            / len(completed_percentages),
            2,
        )
        if completed_percentages
        else 0
    )

    # ---------------------------------------------------------
    # 11. Return
    # ---------------------------------------------------------
    return {
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "section_id": student.section_id,
        "section_name": (
            student.section.section_name
            if student.section
            else None
        ),
        "total_marks": total_marks,
        "my_score": my_score,
        "my_percentage": my_percentage,
        "my_rank": my_rank,
        "completed_students": len(ranked),
        "class_average_percentage": class_average,
        "topper": ranked[0] if ranked else None,
        "top_students": ranked[:5],
        "students": sorted(
            student_map.values(),
            key=lambda item: (
                item["attempted"],
                item["percentage"] or -1,
            ),
            reverse=True,
        ),
    }
# ============================================================
# STUDENT DESCRIPTIVE ASSIGNMENT PERFORMANCE
# ============================================================

def get_student_descriptive_assignment_performance(
    user_id: int,
    assignment_id: int,
    db: Session,
):
    # ---------------------------------------------------------
    # 1. Logged-in student
    # ---------------------------------------------------------
    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    if not student.section_id:
        raise HTTPException(
            status_code=400,
            detail="Student is not assigned to a section.",
        )

    # ---------------------------------------------------------
    # 2. Assignment must be assigned to student's section
    # ---------------------------------------------------------
    assignment = (
        db.query(DescriptiveAssignment)
        .join(
            DescriptiveAssignmentSection,
            DescriptiveAssignmentSection.assignment_id
            == DescriptiveAssignment.id,
        )
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignmentSection.section_id
            == student.section_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="This assignment is not assigned to your section.",
        )

    # ---------------------------------------------------------
    # 3. Total marks
    # ---------------------------------------------------------
    total_marks = sum(
        float(question.max_marks or 0)
        for question in assignment.questions
    )

    # ---------------------------------------------------------
    # 4. All active students in student's section
    # ---------------------------------------------------------
    section_students = (
        db.query(Student)
        .filter(
            Student.section_id == student.section_id,
            Student.is_active.is_(True),
        )
        .order_by(Student.id.asc())
        .all()
    )

    student_map = {}

    for section_student in section_students:
        student_map[section_student.id] = {
            "student_id": section_student.id,
            "student_name": (
                section_student.user.name
                if section_student.user
                else "Unknown"
            ),
            "roll_no": section_student.roll_no,
            "score": None,
            "percentage": None,
            "attempted": False,
            "rank": None,
        }

    # ---------------------------------------------------------
    # 5. Get submissions for this assignment + section
    # ---------------------------------------------------------
    submissions = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.assignment_id
            == assignment.id,
            DescriptiveSubmission.student_id.in_(
                list(student_map.keys())
            ),
        )
        .all()
    )

    # ---------------------------------------------------------
    # 6. Only evaluated submissions participate in ranking
    # ---------------------------------------------------------
    for submission in submissions:
        row = student_map.get(
            submission.student_id
        )

        if not row:
            continue

        # A percentage is the authoritative final score because
        # teacher review can overwrite AI marks.
        if submission.percentage is None:
            continue

        row["score"] = (
            float(submission.obtained_marks)
            if submission.obtained_marks is not None
            else 0
        )

        row["percentage"] = float(
            submission.percentage
        )

        row["attempted"] = True

    # ---------------------------------------------------------
    # 7. Rank evaluated students
    # ---------------------------------------------------------
    ranked_students = sorted(
        [
            row
            for row in student_map.values()
            if row["attempted"]
        ],
        key=lambda row: (
            row["percentage"],
            row["score"],
            row["student_name"].lower(),
        ),
        reverse=True,
    )

    for index, row in enumerate(
        ranked_students,
        start=1,
    ):
        row["rank"] = index

    # ---------------------------------------------------------
    # 8. Current student's data
    # ---------------------------------------------------------
    my_row = student_map.get(student.id)

    my_score = (
        my_row["score"]
        if my_row
        else None
    )

    my_percentage = (
        my_row["percentage"]
        if my_row
        else None
    )

    my_rank = (
        my_row["rank"]
        if my_row
        else None
    )

    # ---------------------------------------------------------
    # 9. Average percentage
    # ---------------------------------------------------------
    percentages = [
        row["percentage"]
        for row in ranked_students
        if row["percentage"] is not None
    ]

    class_average = (
        round(
            sum(percentages) / len(percentages),
            2,
        )
        if percentages
        else 0
    )

    # ---------------------------------------------------------
    # 10. Return all section students
    # ---------------------------------------------------------
    all_students = sorted(
        student_map.values(),
        key=lambda row: (
            row["attempted"],
            row["percentage"]
            if row["percentage"] is not None
            else -1,
        ),
        reverse=True,
    )

    return {
        "assignment_id": assignment.id,
        "assignment_title": assignment.title,
        "section_id": student.section_id,
        "section_name": (
            student.section.section_name
            if student.section
            else None
        ),
        "total_marks": total_marks,
        "my_score": my_score,
        "my_percentage": my_percentage,
        "my_rank": my_rank,
        "evaluated_students": len(ranked_students),
        "class_average_percentage": class_average,
        "topper": (
            ranked_students[0]
            if ranked_students
            else None
        ),
        "top_students": ranked_students[:5],
        "students": all_students,
    }


def get_student_descriptive_performance(
    user_id: int,
    db: Session,
):
    """Overall descriptive performance for the student's current section."""

    student = (
        db.query(Student)
        .filter(
            Student.user_id == user_id,
            Student.is_active.is_(True),
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )

    if not student.section_id:
        raise HTTPException(
            status_code=400,
            detail="Student is not assigned to a section.",
        )

    assignments = (
        db.query(DescriptiveAssignment)
        .join(
            DescriptiveAssignmentSection,
            DescriptiveAssignment.id
            == DescriptiveAssignmentSection.assignment_id,
        )
        .filter(
            DescriptiveAssignmentSection.section_id == student.section_id,
            DescriptiveAssignment.status == "Published",
        )
        .order_by(DescriptiveAssignment.created_at.desc())
        .all()
    )

    section_students = (
        db.query(Student)
        .join(User, Student.user_id == User.id)
        .filter(
            Student.section_id == student.section_id,
            Student.is_active.is_(True),
        )
        .order_by(User.name.asc())
        .all()
    )

    student_ids = [s.id for s in section_students]
    assignment_ids = [a.id for a in assignments]

    student_map = {
        s.id: {
            "student_id": s.id,
            "student_name": s.user.name if s.user else "Unknown",
            "roll_no": s.roll_no,
            "attempts": 0,
            "percentage_total": 0.0,
        }
        for s in section_students
    }

    submissions = []

    if student_ids and assignment_ids:
        submissions = (
            db.query(DescriptiveSubmission)
            .filter(
                DescriptiveSubmission.student_id.in_(student_ids),
                DescriptiveSubmission.assignment_id.in_(assignment_ids),
            )
            .order_by(DescriptiveSubmission.id.desc())
            .all()
        )

    # Latest submission for each student/assignment.
    latest = {}

    for submission in submissions:
        key = (
            submission.student_id,
            submission.assignment_id,
        )
        if key not in latest:
            latest[key] = submission

    for submission in latest.values():
        if submission.percentage is None:
            continue

        row = student_map.get(submission.student_id)

        if not row:
            continue

        row["attempts"] += 1
        row["percentage_total"] += float(
            submission.percentage
        )

    rows = []

    for row in student_map.values():
        attempts = row["attempts"]

        rows.append({
            "student_id": row["student_id"],
            "student_name": row["student_name"],
            "roll_no": row["roll_no"],
            "attempts": attempts,
            "average_percentage": round(
                row["percentage_total"] / attempts,
                2,
            ) if attempts else 0.0,
            "rank": None,
        })

    ranked = [
        row for row in rows
        if row["attempts"] > 0
    ]

    ranked.sort(
        key=lambda row: (
            row["average_percentage"],
            row["attempts"],
        ),
        reverse=True,
    )

    for index, row in enumerate(ranked, start=1):
        row["rank"] = index

    rank_map = {
        row["student_id"]: row["rank"]
        for row in ranked
    }

    for row in rows:
        row["rank"] = rank_map.get(row["student_id"])

    rows.sort(
        key=lambda row: (
            row["attempts"] > 0,
            row["average_percentage"],
        ),
        reverse=True,
    )

    my_row = next(
        (
            row for row in rows
            if row["student_id"] == student.id
        ),
        None,
    )

    section_average = (
        round(
            sum(
                row["average_percentage"]
                for row in ranked
            ) / len(ranked),
            2,
        )
        if ranked else 0.0
    )

    assignment_lookup = {
        a.id: a for a in assignments
    }

    my_assignments = []

    for (student_id, assignment_id), submission in latest.items():
        if student_id != student.id:
            continue

        if submission.percentage is None:
            continue

        assignment = assignment_lookup.get(assignment_id)

        if not assignment:
            continue

        total_marks = sum(
            float(q.max_marks or 0)
            for q in (assignment.questions or [])
        )

        my_assignments.append({
            "assignment_id": assignment.id,
            "title": assignment.title,
            "score": float(submission.obtained_marks or 0),
            "total_marks": total_marks,
            "percentage": float(submission.percentage),
            "submitted_at": submission.submitted_at,
        })

    my_assignments.sort(
        key=lambda item: str(item["submitted_at"] or ""),
        reverse=True,
    )

    return {
        "section_id": student.section_id,
        "section_name": (
            student.section.section_name
            if student.section else None
        ),
        "my_attempts": my_row["attempts"] if my_row else 0,
        "my_average_percentage": (
            my_row["average_percentage"] if my_row else 0.0
        ),
        "my_rank": my_row["rank"] if my_row else None,
        "section_average_percentage": section_average,
        "evaluated_students": len(ranked),
        "topper": ranked[0] if ranked else None,
        "top_students": ranked[:5],
        "students": rows,
        "assignments": my_assignments,
    }
