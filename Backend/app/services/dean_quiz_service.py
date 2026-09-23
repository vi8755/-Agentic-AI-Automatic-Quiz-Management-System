from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import (
    Quiz,
    Question,
    QuizAssignment,
    Response,
    Teacher,
    User,
    Subject,
)


# ============================================================
# GET ALL DEAN QUIZZES
# ============================================================

def get_all_dean_quizzes(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    status: str | None = None,
    teacher_id: int | None = None,
    subject_id: int | None = None,
    section_id: int | None = None,
    batch_id: int | None = None,
    year: int | None = None,
    semester: int | None = None,
):
    """
    Get quizzes for Dean management.

    Supports:

    - Search by quiz title
    - Search by teacher name
    - Status filter
    - Teacher filter
    - Subject filter
    - Section filter
    - Pagination

    Includes:

    - Teacher information
    - Subject information
    - Total questions
    - Total marks
    - Assignment count
    - Attempt count
    """

    # ========================================================
    # SUBQUERIES
    # ========================================================

    # --------------------------------------------------------
    # Question statistics
    # --------------------------------------------------------

    question_stats = (
        db.query(
            Question.quiz_id.label("quiz_id"),

            func.count(
                Question.id
            ).label("total_questions"),

            func.coalesce(
                func.sum(Question.marks),
                0
            ).label("total_marks"),
        )
        .group_by(
            Question.quiz_id
        )
        .subquery()
    )

    # --------------------------------------------------------
    # Assignment statistics
    # --------------------------------------------------------

    assignment_stats = (
        db.query(
            QuizAssignment.quiz_id.label("quiz_id"),

            func.count(
                QuizAssignment.id
            ).label("assignment_count"),
        )
        .group_by(
            QuizAssignment.quiz_id
        )
        .subquery()
    )

    # --------------------------------------------------------
    # Attempt statistics
    # --------------------------------------------------------

    attempt_stats = (
        db.query(
            Response.quiz_id.label("quiz_id"),

            func.count(
                Response.id
            ).label("attempt_count"),
        )
        .group_by(
            Response.quiz_id
        )
        .subquery()
    )

    # ========================================================
    # BASE QUERY
    # ========================================================

    query = (
        db.query(
            Quiz.id.label("id"),
            Quiz.title.label("title"),

            Quiz.teacher_id.label("teacher_id"),
            User.name.label("teacher_name"),

            Quiz.subject_id.label("subject_id"),
            Subject.subject_name.label("subject_name"),

            Quiz.status.label("status"),
            Quiz.created_at.label("created_at"),

            # Question statistics
            func.coalesce(
                question_stats.c.total_questions,
                0
            ).label("total_questions"),

            func.coalesce(
                question_stats.c.total_marks,
                0
            ).label("total_marks"),

            # Assignment statistics
            func.coalesce(
                assignment_stats.c.assignment_count,
                0
            ).label("assignment_count"),

            # Attempt statistics
            func.coalesce(
                attempt_stats.c.attempt_count,
                0
            ).label("attempt_count"),
        )

        # ----------------------------------------------------
        # Teacher
        # ----------------------------------------------------

        .outerjoin(
            Teacher,
            Teacher.id == Quiz.teacher_id,
        )

        # ----------------------------------------------------
        # Teacher User
        # ----------------------------------------------------

        .outerjoin(
            User,
            User.id == Teacher.user_id,
        )

        # ----------------------------------------------------
        # Subject
        # ----------------------------------------------------

        .outerjoin(
            Subject,
            Subject.id == Quiz.subject_id,
        )

        # ----------------------------------------------------
        # Question Statistics
        # ----------------------------------------------------

        .outerjoin(
            question_stats,
            question_stats.c.quiz_id == Quiz.id,
        )

        # ----------------------------------------------------
        # Assignment Statistics
        # ----------------------------------------------------

        .outerjoin(
            assignment_stats,
            assignment_stats.c.quiz_id == Quiz.id,
        )

        # ----------------------------------------------------
        # Attempt Statistics
        # ----------------------------------------------------

        .outerjoin(
            attempt_stats,
            attempt_stats.c.quiz_id == Quiz.id,
        )
    )

    # ========================================================
    # SEARCH FILTER
    # ========================================================

    if search:
        search_term = f"%{search}%"

        query = query.filter(
            Quiz.title.ilike(search_term)
            |
            User.name.ilike(search_term)
        )

    # ========================================================
    # STATUS FILTER
    # ========================================================

    if status:
        query = query.filter(
            Quiz.status == status
        )

    # ========================================================
    # TEACHER FILTER
    # ========================================================

    if teacher_id:
        query = query.filter(
            Quiz.teacher_id == teacher_id
        )

    # ========================================================
    # SUBJECT FILTER
    # ========================================================

    if subject_id:
        query = query.filter(
            Quiz.subject_id == subject_id
        )

    # ========================================================
    # SECTION FILTER
    # ========================================================

    if section_id:

        quiz_ids_for_section = (
            db.query(
                QuizAssignment.quiz_id
            )
            .filter(
                QuizAssignment.section_id == section_id
            )
            .subquery()
        )

        query = query.filter(
            Quiz.id.in_(
                quiz_ids_for_section
            )
        )

    # ========================================================
    # TOTAL COUNT
    # ========================================================

    total = query.count()

    # ========================================================
    # PAGINATION
    # ========================================================

    offset = (page - 1) * limit

    results = (
        query
        .order_by(
            Quiz.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    # ========================================================
    # TOTAL PAGES
    # ========================================================

    total_pages = (
        (total + limit - 1) // limit
        if limit > 0
        else 0
    )

    # ========================================================
    # FORMAT RESPONSE
    # ========================================================

    items = []

    for quiz in results:

        items.append(
            {
                "id": quiz.id,
                "title": quiz.title,

                # ------------------------------
                # Teacher
                # ------------------------------

                "teacher_id": quiz.teacher_id,
                "teacher_name": quiz.teacher_name,

                # ------------------------------
                # Subject
                # ------------------------------

                "subject_id": quiz.subject_id,
                "subject_name": quiz.subject_name,

                # ------------------------------
                # Quiz
                # ------------------------------

                "status": quiz.status,

                # ------------------------------
                # Statistics
                # ------------------------------

                "total_questions": int(
                    quiz.total_questions or 0
                ),

                "total_marks": int(
                    quiz.total_marks or 0
                ),

                "assignment_count": int(
                    quiz.assignment_count or 0
                ),

                "attempt_count": int(
                    quiz.attempt_count or 0
                ),

                # ------------------------------
                # Created At
                # ------------------------------

                "created_at": quiz.created_at,
            }
        )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# ============================================================
# GET QUIZ DETAILS
# ============================================================

def get_dean_quiz_detail(
    db: Session,
    quiz_id: int,
):
    """
    Get complete summary information for a single quiz.

    Includes:

    - Quiz information
    - Teacher information
    - Subject information
    - Total questions
    - Total marks
    - Assignment count
    - Attempt count
    """

    # ========================================================
    # QUESTION STATISTICS
    # ========================================================

    question_stats = (
        db.query(
            Question.quiz_id.label("quiz_id"),

            func.count(
                Question.id
            ).label("total_questions"),

            func.coalesce(
                func.sum(Question.marks),
                0
            ).label("total_marks"),
        )
        .filter(
            Question.quiz_id == quiz_id
        )
        .group_by(
            Question.quiz_id
        )
        .subquery()
    )

    # ========================================================
    # ASSIGNMENT STATISTICS
    # ========================================================

    assignment_stats = (
        db.query(
            QuizAssignment.quiz_id.label("quiz_id"),

            func.count(
                QuizAssignment.id
            ).label("assignment_count"),
        )
        .filter(
            QuizAssignment.quiz_id == quiz_id
        )
        .group_by(
            QuizAssignment.quiz_id
        )
        .subquery()
    )

    # ========================================================
    # ATTEMPT STATISTICS
    # ========================================================

    attempt_stats = (
        db.query(
            Response.quiz_id.label("quiz_id"),

            func.count(
                Response.id
            ).label("attempt_count"),
        )
        .filter(
            Response.quiz_id == quiz_id
        )
        .group_by(
            Response.quiz_id
        )
        .subquery()
    )

    # ========================================================
    # MAIN QUERY
    # ========================================================

    result = (
        db.query(
            Quiz.id.label("id"),
            Quiz.title.label("title"),

            # ------------------------------------------------
            # Teacher
            # ------------------------------------------------

            Quiz.teacher_id.label("teacher_id"),
            User.name.label("teacher_name"),
            User.email.label("teacher_email"),

            # ------------------------------------------------
            # Subject
            # ------------------------------------------------

            Quiz.subject_id.label("subject_id"),
            Subject.subject_name.label("subject_name"),

            # ------------------------------------------------
            # Quiz
            # ------------------------------------------------

            Quiz.status.label("status"),
            Quiz.created_at.label("created_at"),

            # ------------------------------------------------
            # Statistics
            # ------------------------------------------------

            func.coalesce(
                question_stats.c.total_questions,
                0
            ).label("total_questions"),

            func.coalesce(
                question_stats.c.total_marks,
                0
            ).label("total_marks"),

            func.coalesce(
                assignment_stats.c.assignment_count,
                0
            ).label("assignment_count"),

            func.coalesce(
                attempt_stats.c.attempt_count,
                0
            ).label("attempt_count"),
        )

        # ----------------------------------------------------
        # Teacher
        # ----------------------------------------------------

        .outerjoin(
            Teacher,
            Teacher.id == Quiz.teacher_id,
        )

        # ----------------------------------------------------
        # Teacher User
        # ----------------------------------------------------

        .outerjoin(
            User,
            User.id == Teacher.user_id,
        )

        # ----------------------------------------------------
        # Subject
        # ----------------------------------------------------

        .outerjoin(
            Subject,
            Subject.id == Quiz.subject_id,
        )

        # ----------------------------------------------------
        # Question Statistics
        # ----------------------------------------------------

        .outerjoin(
            question_stats,
            question_stats.c.quiz_id == Quiz.id,
        )

        # ----------------------------------------------------
        # Assignment Statistics
        # ----------------------------------------------------

        .outerjoin(
            assignment_stats,
            assignment_stats.c.quiz_id == Quiz.id,
        )

        # ----------------------------------------------------
        # Attempt Statistics
        # ----------------------------------------------------

        .outerjoin(
            attempt_stats,
            attempt_stats.c.quiz_id == Quiz.id,
        )

        # ----------------------------------------------------
        # Specific Quiz
        # ----------------------------------------------------

        .filter(
            Quiz.id == quiz_id
        )

        .first()
    )

    # ========================================================
    # QUIZ NOT FOUND
    # ========================================================

    if not result:
        return None

    # ========================================================
    # RETURN QUIZ DETAILS
    # ========================================================

    return {
        "id": result.id,
        "title": result.title,

        # ----------------------------------------------------
        # Teacher
        # ----------------------------------------------------

        "teacher_id": result.teacher_id,
        "teacher_name": result.teacher_name,
        "teacher_email": result.teacher_email,

        # ----------------------------------------------------
        # Subject
        # ----------------------------------------------------

        "subject_id": result.subject_id,
        "subject_name": result.subject_name,

        # ----------------------------------------------------
        # Quiz
        # ----------------------------------------------------

        "status": result.status,

        # ----------------------------------------------------
        # Statistics
        # ----------------------------------------------------

        "total_questions": int(
            result.total_questions or 0
        ),

        "total_marks": int(
            result.total_marks or 0
        ),

        "assignment_count": int(
            result.assignment_count or 0
        ),

        "attempt_count": int(
            result.attempt_count or 0
        ),

        # ----------------------------------------------------
        # Created At
        # ----------------------------------------------------

        "created_at": result.created_at,
    }