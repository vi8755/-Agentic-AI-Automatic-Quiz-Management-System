from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
   Teacher,
    Student,
    Section,
    Subject,
    Quiz,
    Response,
)


def get_dashboard_data(db: Session):
    """
    Returns dashboard data for the Dean.
    """

    # ============================================================
    # OVERALL STATISTICS
    # ============================================================

    total_teachers = (
        db.query(func.count(Teacher.id)).scalar()
        or 0
    )

    total_students = (
        db.query(func.count(Student.id)).scalar()
        or 0
    )

    total_sections = (
        db.query(func.count(Section.id)).scalar()
        or 0
    )

    total_subjects = (
        db.query(func.count(Subject.id)).scalar()
        or 0
    )

    total_quizzes = (
        db.query(func.count(Quiz.id)).scalar()
        or 0
    )

    total_attempts = (
        db.query(func.count(Response.id)).scalar()
        or 0
    )

    # ============================================================
    # RECENT ACTIVITY
    # ============================================================

    recent_quizzes = (
        db.query(Quiz)
        .order_by(
            Quiz.created_at.desc()
        )
        .limit(10)
        .all()
    )

    recent_activity = []

    for quiz in recent_quizzes:

        teacher_name = "Unknown"

        if quiz.teacher:
            if (
                hasattr(quiz.teacher, "user")
                and quiz.teacher.user
            ):
                teacher_name = getattr(
                    quiz.teacher.user,
                    "full_name",
                    getattr(
                        quiz.teacher.user,
                        "name",
                        "Unknown",
                    ),
                )

        recent_activity.append(
            {
                "type": "quiz_created",
                "title": quiz.title,
                "teacher": teacher_name,
                "created_at": quiz.created_at,
            }
        )

    # ============================================================
    # QUICK ACTIONS
    # ============================================================

    quick_actions = {
        "create_teacher": True,
        "create_section": True,
        "create_subject": True,
        "view_reports": True,
    }

    # ============================================================
    # FINAL RESPONSE
    # ============================================================

    return {
        "overall_stats": {
            "total_teachers": total_teachers,
            "total_students": total_students,
            "total_sections": total_sections,
            "total_subjects": total_subjects,
            "total_quizzes": total_quizzes,
            "total_attempts": total_attempts,
        },

        "recent_activity": recent_activity,

        "quick_actions": quick_actions,
    }