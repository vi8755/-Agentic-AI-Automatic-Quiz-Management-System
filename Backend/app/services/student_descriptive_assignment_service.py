from datetime import datetime, timezone

from sqlalchemy.orm import Session
import time
from ..models import (
    User,
    Student,
    DescriptiveAssignment,
    DescriptiveAssignmentSection,
    DescriptiveSubmission,
    DescriptiveAnswer,
)


# =========================================================
# HELPER
# Get Student ID from authenticated User
# =========================================================

def get_student_id_from_user(
    db: Session,
    current_user: User,
) -> int:

    student = (
        db.query(Student)
        .filter(
            Student.user_id == current_user.id
        )
        .first()
    )

    if not student:
        raise ValueError(
            "Student profile not found for the current user."
        )

    return student.id


# =========================================================
# GET AVAILABLE DESCRIPTIVE ASSIGNMENTS
# =========================================================

def get_student_descriptive_assignments(
    db: Session,
    current_user: User,
):
    """
    Get published descriptive assignments assigned
    to the logged-in student's section.
    """

    student_id = get_student_id_from_user(
        db=db,
        current_user=current_user,
    )

    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        raise ValueError(
            "Student not found."
        )

    assignments = (
        db.query(DescriptiveAssignment)
        .join(
            DescriptiveAssignmentSection,
            DescriptiveAssignmentSection.assignment_id
            == DescriptiveAssignment.id,
        )
        .filter(
            DescriptiveAssignmentSection.section_id
            == student.section_id,

            DescriptiveAssignment.status
            == "Published",
        )
        .order_by(
            DescriptiveAssignment.created_at.desc()
        )
        .all()
    )

    return assignments


# =========================================================
# GET SINGLE DESCRIPTIVE ASSIGNMENT
# =========================================================

def get_student_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
):

    student_id = get_student_id_from_user(
        db=db,
        current_user=current_user,
    )

    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        raise ValueError(
            "Student not found."
        )

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

            DescriptiveAssignment.status
            == "Published",
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    return assignment


# =========================================================
# GET EXISTING SUBMISSION
# =========================================================

def get_existing_submission(
    db: Session,
    student_id: int,
    assignment_id: int,
):

    return (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.student_id
            == student_id,

            DescriptiveSubmission.assignment_id
            == assignment_id,
        )
        .first()
    )


# =========================================================
# START DESCRIPTIVE ASSIGNMENT
# =========================================================

from datetime import datetime, timezone


def start_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
):
    overall_start = time.perf_counter()
    # =====================================================
    # 1. FIND STUDENT
    # =====================================================
    step_start = time.perf_counter()

    student_id = get_student_id_from_user(
        db=db,
        current_user=current_user,
    )
    print(
        f"[START-DEBUG] get_student_id_from_user: "
        f"{time.perf_counter() - step_start:.3f}s"
    )

    # =====================================================
    # 2. GET ASSIGNMENT
    #
    # IMPORTANT:
    # get_student_descriptive_assignment()
    # returns a SQLAlchemy DescriptiveAssignment object.
    # =====================================================
    step_start = time.perf_counter()

    assignment = get_student_descriptive_assignment(
        db=db,
        current_user=current_user,
        assignment_id=assignment_id,
    )
    print(
        f"[START-DEBUG] get_student_descriptive_assignment: "
        f"{time.perf_counter() - step_start:.3f}s"
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    # =====================================================
    # 3. FIXED EXAM WINDOW
    #
    # Teacher defines:
    #
    # start_date_time -> exam start
    # due_date        -> exam end
    # =====================================================

    if not assignment.start_date_time:
        raise ValueError(
            "This assignment does not have a start date and time."
        )

    if not assignment.due_date:
        raise ValueError(
            "This assignment does not have an end date and time."
        )

    start_date_time = assignment.start_date_time
    due_date = assignment.due_date

    # -----------------------------------------------------
    # Normalize start time to UTC
    # -----------------------------------------------------

    if start_date_time.tzinfo is None:
        start_date_time = start_date_time.replace(
            tzinfo=timezone.utc
        )
    else:
        start_date_time = start_date_time.astimezone(
            timezone.utc
        )

    # -----------------------------------------------------
    # Normalize end time to UTC
    # -----------------------------------------------------

    if due_date.tzinfo is None:
        due_date = due_date.replace(
            tzinfo=timezone.utc
        )
    else:
        due_date = due_date.astimezone(
            timezone.utc
        )

    now = datetime.now(timezone.utc)

    # =====================================================
    # 4. TOO EARLY
    # =====================================================

    if now < start_date_time:
        raise ValueError(
            "The examination has not started yet."
        )

    # =====================================================
    # 5. TOO LATE
    # =====================================================

    if now >= due_date:
        raise ValueError(
            "The time limit for this assignment has expired."
        )

    # =====================================================
    # 6. FIND EXISTING SUBMISSION
    # =====================================================

    submission = get_existing_submission(
        db=db,
        student_id=student_id,
        assignment_id=assignment_id,
    )
    print(
    f"[START-DEBUG] get_existing_submission: "
    f"{time.perf_counter() - step_start:.3f}s"
)

    # =====================================================
    # 7. EXISTING SUBMISSION
    # =====================================================

    if submission:

        if submission.status == "Submitted":
            raise ValueError(
                "You have already submitted this assignment."
            )

        # Student is starting now.
        # This is the ACTUAL click/start time.
        if submission.started_at is None:

            submission.started_at = now

        submission.status = "In Progress"

        try:
            db.commit()
            db.refresh(submission)
            print(
    f"[START-DEBUG] commit + refresh: "
    f"{time.perf_counter() - step_start:.3f}s"
)  
            print(
    f"[START-DEBUG] TOTAL: "
    f"{time.perf_counter() - overall_start:.3f}s"
)


        except Exception:
            db.rollback()
            raise

        return submission

    # =====================================================
    # 8. CALCULATE TOTAL MARKS
    # =====================================================

    total_marks = sum(
        question.max_marks
        for question in assignment.questions
    )

    # =====================================================
    # 9. CREATE SUBMISSION
    # =====================================================

    submission = DescriptiveSubmission(
        assignment_id=assignment_id,
        student_id=student_id,
        status="In Progress",
        total_marks=total_marks,
        evaluation_status="Pending",

        # IMPORTANT:
        # Actual student start/click time.
        started_at=now,
    )

    db.add(submission)

    commit_start = time.perf_counter()

    try:

        db.commit()
        print(
    f"[START-DEBUG] ONLY db.commit(): "
    f"{time.perf_counter() - commit_start:.3f}s"
)     
        refresh_start = time.perf_counter()
        db.refresh(submission)
        print(
    f"[START-DEBUG] ONLY db.refresh(): "
    f"{time.perf_counter() - refresh_start:.3f}s"
)

    except Exception:

        db.rollback()
        raise

    return submission
# =========================================================
# GET STUDENT SUBMISSION
# =========================================================

def get_student_submission(
    db: Session,
    current_user: User,
    submission_id: int,
):

    student_id = get_student_id_from_user(
        db=db,
        current_user=current_user,
    )

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.id
            == submission_id,

            DescriptiveSubmission.student_id
            == student_id,
        )
        .first()
    )

    if not submission:
        raise ValueError(
            "Submission not found."
        )

    return submission