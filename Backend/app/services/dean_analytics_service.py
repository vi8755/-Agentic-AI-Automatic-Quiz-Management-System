from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import (
    User,
    UserRole,
    Teacher,
    Student,
    Section,
    Subject,
    Quiz,
    QuizAssignment,
    Response,
)


def get_dean_analytics_data(db: Session):
    """
    ============================================================
    Dean Overall Analytics
    ============================================================

    Provides institution-level analytics for the Dean dashboard.

    Includes:

    - Student statistics
    - Teacher statistics
    - Section statistics
    - Subject statistics
    - Quiz statistics
    - Attempt statistics
    - Section-wise overview
    - Teacher-wise quiz activity
    - Subject-wise quiz activity
    """

    # ============================================================
    # BASIC COUNTS
    # ============================================================

    # ------------------------------------------------------------
    # Students
    # ------------------------------------------------------------

    total_students = (
        db.query(Student)
        .count()
    )

    active_students = (
        db.query(Student)
        .filter(
            Student.is_active.is_(True)
        )
        .count()
    )

    inactive_students = (
        db.query(Student)
        .filter(
            Student.is_active.is_(False)
        )
        .count()
    )

    # ------------------------------------------------------------
    # Teachers
    # ------------------------------------------------------------

    total_teachers = (
        db.query(Teacher)
        .count()
    )

    active_teachers = (
        db.query(Teacher)
        .join(
            User,
            Teacher.user_id == User.id,
        )
        .filter(
            User.is_active.is_(True)
        )
        .count()
    )

    inactive_teachers = (
        db.query(Teacher)
        .join(
            User,
            Teacher.user_id == User.id,
        )
        .filter(
            User.is_active.is_(False)
        )
        .count()
    )

    # ------------------------------------------------------------
    # Sections
    # ------------------------------------------------------------

    total_sections = (
        db.query(Section)
        .count()
    )

    active_sections = (
        db.query(Section)
        .filter(
            Section.is_active.is_(True)
        )
        .count()
    )

    inactive_sections = (
        db.query(Section)
        .filter(
            Section.is_active.is_(False)
        )
        .count()
    )

    # ------------------------------------------------------------
    # Subjects
    # ------------------------------------------------------------

    total_subjects = (
        db.query(Subject)
        .count()
    )

    active_subjects = (
        db.query(Subject)
        .filter(
            Subject.is_active.is_(True)
        )
        .count()
    )

    inactive_subjects = (
        db.query(Subject)
        .filter(
            Subject.is_active.is_(False)
        )
        .count()
    )

    # ------------------------------------------------------------
    # Quizzes
    # ------------------------------------------------------------

    total_quizzes = (
        db.query(Quiz)
        .count()
    )

    # ============================================================
    # ATTEMPT STATISTICS
    # ============================================================

    total_assignments = (
        db.query(QuizAssignment)
        .count()
    )

    total_attempts = (
        db.query(Response)
        .count()
    )

    # ------------------------------------------------------------
    # Attempt Rate
    # ------------------------------------------------------------

    attempt_rate = (
        round(
            (
                total_attempts
                / total_assignments
            )
            * 100,
            2,
        )
        if total_assignments
        else 0
    )

    # ------------------------------------------------------------
    # Average Score
    # ------------------------------------------------------------

    average_score_result = (
        db.query(
            func.avg(Response.score)
        )
        .scalar()
    )

    average_score = (
        round(
            float(average_score_result),
            2,
        )
        if average_score_result is not None
        else 0
    )

    # ------------------------------------------------------------
    # Highest Score
    # ------------------------------------------------------------

    highest_score_result = (
        db.query(
            func.max(Response.score)
        )
        .scalar()
    )

    highest_score = (
        float(highest_score_result)
        if highest_score_result is not None
        else 0
    )

    # ============================================================
    # SECTION ANALYTICS
    # ============================================================

    sections = (
        db.query(Section)
        .order_by(
            Section.section_name
        )
        .all()
    )

    section_analytics = []

    for section in sections:

        # --------------------------------------------------------
        # Students
        # --------------------------------------------------------

        section_total_students = (
            db.query(Student)
            .filter(
                Student.section_id
                == section.id
            )
            .count()
        )

        section_active_students = (
            db.query(Student)
            .filter(
                Student.section_id
                == section.id,
                Student.is_active.is_(True),
            )
            .count()
        )

        # --------------------------------------------------------
        # Assignments
        # --------------------------------------------------------

        section_assignments = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.section_id
                == section.id
            )
            .count()
        )

        # --------------------------------------------------------
        # Attempts
        #
        # IMPORTANT:
        #
        # We must match Response to the exact assignment using:
        #
        #   Response.quiz_id
        #   +
        #   Response.student_email
        #
        # This prevents a response from another section from
        # being counted when the same quiz is assigned to
        # multiple sections.
        # --------------------------------------------------------

        section_response_data = (
            db.query(Response)
            .join(
                QuizAssignment,
                (
                    Response.quiz_id
                    == QuizAssignment.quiz_id
                )
                & (
                    Response.student_email
                    == QuizAssignment.student_email
                ),
            )
            .filter(
                QuizAssignment.section_id
                == section.id
            )
            .all()
        )

        section_attempts = len(
            section_response_data
        )

        section_average_score = 0
        section_highest_score = 0

        scores = [
            response.score
            for response in section_response_data
            if response.score is not None
        ]

        if scores:

            section_average_score = round(
                sum(scores)
                / len(scores),
                2,
            )

            section_highest_score = max(
                scores
            )

        # --------------------------------------------------------
        # Attempt Rate
        # --------------------------------------------------------

        section_attempt_rate = (
            round(
                (
                    section_attempts
                    / section_assignments
                )
                * 100,
                2,
            )
            if section_assignments
            else 0
        )

        # --------------------------------------------------------
        # Result
        # --------------------------------------------------------

        section_analytics.append(
            {
                "section_id": section.id,

                "section_name":
                    section.section_name,

                "department":
                    section.department,

                "year":
                    section.year,

                "semester":
                    section.semester,

                "is_active":
                    section.is_active,

                "total_students":
                    section_total_students,

                "active_students":
                    section_active_students,

                "total_assignments":
                    section_assignments,

                "total_attempts":
                    section_attempts,

                "attempt_rate":
                    section_attempt_rate,

                "average_score":
                    section_average_score,

                "highest_score":
                    section_highest_score,
            }
        )

    # ============================================================
    # TEACHER ANALYTICS
    # ============================================================

    teachers = (
        db.query(Teacher)
        .join(
            User,
            Teacher.user_id == User.id,
        )
        .order_by(
            User.name
        )
        .all()
    )

    teacher_analytics = []

    for teacher in teachers:

        teacher_name = (
            teacher.user.name
            if teacher.user
            else "Unknown"
        )

        teacher_quizzes = (
            db.query(Quiz)
            .filter(
                Quiz.teacher_id
                == teacher.id
            )
            .all()
        )

        teacher_quiz_ids = [
            quiz.id
            for quiz in teacher_quizzes
        ]

        teacher_assignments = 0
        teacher_attempts = 0
        teacher_average_score = 0
        teacher_highest_score = 0

        if teacher_quiz_ids:

            teacher_assignments = (
                db.query(QuizAssignment)
                .filter(
                    QuizAssignment.quiz_id.in_(
                        teacher_quiz_ids
                    )
                )
                .count()
            )

            responses = (
                db.query(Response)
                .filter(
                    Response.quiz_id.in_(
                        teacher_quiz_ids
                    )
                )
                .all()
            )

            if responses:

                scores = [
                    response.score
                    for response in responses
                    if response.score is not None
                ]

                teacher_attempts = len(
                    responses
                )

                if scores:

                    teacher_average_score = round(
                        sum(scores)
                        / len(scores),
                        2,
                    )

                    teacher_highest_score = max(
                        scores
                    )

        teacher_attempt_rate = (
            round(
                (
                    teacher_attempts
                    / teacher_assignments
                )
                * 100,
                2,
            )
            if teacher_assignments
            else 0
        )

        teacher_analytics.append(
            {
                "teacher_id":
                    teacher.id,

                "teacher_name":
                    teacher_name,

                "email":
                    teacher.user.email
                    if teacher.user
                    else None,

                "is_active":
                    teacher.user.is_active
                    if teacher.user
                    else False,

                "total_quizzes":
                    len(teacher_quizzes),

                "total_assignments":
                    teacher_assignments,

                "total_attempts":
                    teacher_attempts,

                "attempt_rate":
                    teacher_attempt_rate,

                "average_score":
                    teacher_average_score,

                "highest_score":
                    teacher_highest_score,
            }
        )

    # ============================================================
    # SUBJECT ANALYTICS
    # ============================================================

    subjects = (
        db.query(Subject)
        .order_by(
            Subject.subject_name
        )
        .all()
    )

    subject_analytics = []

    for subject in subjects:

        subject_quizzes = (
            db.query(Quiz)
            .filter(
                Quiz.subject_id
                == subject.id
            )
            .all()
        )

        subject_quiz_ids = [
            quiz.id
            for quiz in subject_quizzes
        ]

        subject_assignments = 0
        subject_attempts = 0
        subject_average_score = 0

        if subject_quiz_ids:

            subject_assignments = (
                db.query(QuizAssignment)
                .filter(
                    QuizAssignment.quiz_id.in_(
                        subject_quiz_ids
                    )
                )
                .count()
            )

            responses = (
                db.query(Response)
                .filter(
                    Response.quiz_id.in_(
                        subject_quiz_ids
                    )
                )
                .all()
            )

            if responses:

                scores = [
                    response.score
                    for response in responses
                    if response.score is not None
                ]

                subject_attempts = len(
                    responses
                )

                if scores:

                    subject_average_score = round(
                        sum(scores)
                        / len(scores),
                        2,
                    )

        subject_analytics.append(
            {
                "subject_id":
                    subject.id,

                "subject_code":
                    subject.subject_code,

                "subject_name":
                    subject.subject_name,

                "department":
                    subject.department,

                "semester":
                    subject.semester,

                "is_active":
                    subject.is_active,

                "total_quizzes":
                    len(subject_quizzes),

                "total_assignments":
                    subject_assignments,

                "total_attempts":
                    subject_attempts,

                "average_score":
                    subject_average_score,
            }
        )

    # ============================================================
    # QUIZ ACTIVITY
    # ============================================================

    quizzes = (
        db.query(Quiz)
        .order_by(
            Quiz.id.desc()
        )
        .limit(10)
        .all()
    )

    quiz_activity = []

    for quiz in quizzes:

        assignments_count = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id
                == quiz.id
            )
            .count()
        )

        responses = (
            db.query(Response)
            .filter(
                Response.quiz_id
                == quiz.id
            )
            .all()
        )

        scores = [
            response.score
            for response in responses
            if response.score is not None
        ]

        average_quiz_score = (
            round(
                sum(scores)
                / len(scores),
                2,
            )
            if scores
            else 0
        )

        highest_quiz_score = (
            max(scores)
            if scores
            else 0
        )

        quiz_attempt_rate = (
            round(
                (
                    len(responses)
                    / assignments_count
                )
                * 100,
                2,
            )
            if assignments_count
            else 0
        )

        teacher_name = (
            quiz.teacher.user.name
            if quiz.teacher
            and quiz.teacher.user
            else None
        )

        quiz_activity.append(
            {
                "quiz_id":
                    quiz.id,

                "title":
                    quiz.title,

                "teacher_id":
                    quiz.teacher_id,

                "teacher_name":
                    teacher_name,

                "subject_id":
                    quiz.subject_id,

                "total_assignments":
                    assignments_count,

                "total_attempts":
                    len(responses),

                "attempt_rate":
                    quiz_attempt_rate,

                "average_score":
                    average_quiz_score,

                "highest_score":
                    highest_quiz_score,
            }
        )

    # ============================================================
    # FINAL RESPONSE
    # ============================================================

    return {
        "summary": {
            "total_students":
                total_students,

            "active_students":
                active_students,

            "inactive_students":
                inactive_students,

            "total_teachers":
                total_teachers,

            "active_teachers":
                active_teachers,

            "inactive_teachers":
                inactive_teachers,

            "total_sections":
                total_sections,

            "active_sections":
                active_sections,

            "inactive_sections":
                inactive_sections,

            "total_subjects":
                total_subjects,

            "active_subjects":
                active_subjects,

            "inactive_subjects":
                inactive_subjects,

            "total_quizzes":
                total_quizzes,

            "total_assignments":
                total_assignments,

            "total_attempts":
                total_attempts,

            "attempt_rate":
                attempt_rate,

            "average_score":
                average_score,

            "highest_score":
                highest_score,
        },

        "sections":
            section_analytics,

        "teachers":
            teacher_analytics,

        "subjects":
            subject_analytics,

        "quiz_activity":
            quiz_activity,
    }