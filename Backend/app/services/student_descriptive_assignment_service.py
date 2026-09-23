from datetime import datetime, timezone

from sqlalchemy.orm import Session

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

def start_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
):

    student_id = get_student_id_from_user(
        db=db,
        current_user=current_user,
    )

    # -----------------------------------------------------
    # Verify assignment is available
    # -----------------------------------------------------

    assignment = get_student_descriptive_assignment(
        db=db,
        current_user=current_user,
        assignment_id=assignment_id,
    )

    # -----------------------------------------------------
    # Check due date
    # -----------------------------------------------------

    now = datetime.now(timezone.utc)

    if assignment.due_date:

        due_date = assignment.due_date

        if due_date.tzinfo is None:
            due_date = due_date.replace(
                tzinfo=timezone.utc
            )

        if now > due_date:
            raise ValueError(
                "This assignment is past its due date."
            )

    # -----------------------------------------------------
    # Check existing submission
    # -----------------------------------------------------

    submission = get_existing_submission(
        db=db,
        student_id=student_id,
        assignment_id=assignment_id,
    )

    if submission:

     if submission.status == "Submitted":
        raise ValueError(
            "You have already submitted this assignment."
        )

     if submission.started_at is None:
        submission.started_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(submission)

    return submission

    # -----------------------------------------------------
    # Calculate total marks
    # -----------------------------------------------------

    total_marks = sum(
        question.max_marks
        for question in assignment.questions
    )

    # -----------------------------------------------------
    # Create submission
    # -----------------------------------------------------

    submission = DescriptiveSubmission(
        assignment_id=assignment_id,
        student_id=student_id,
        status="In Progress",
        total_marks=total_marks,
        evaluation_status="Pending",
        started_at=datetime.now(timezone.utc),
    )

    db.add(submission)

    try:
        db.commit()
        db.refresh(submission)

    except Exception:
        db.rollback()
        raise

    return submission


# =========================================================
# SUBMIT DESCRIPTIVE ASSIGNMENT
# =========================================================

def submit_descriptive_assignment(
    db: Session,
    current_user: User,
    submission_data,
):

    student_id = get_student_id_from_user(
        db=db,
        current_user=current_user,
    )

    # -----------------------------------------------------
    # Get assignment
    # -----------------------------------------------------

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id
            == submission_data.assignment_id,

            DescriptiveAssignment.status
            == "Published",
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    # -----------------------------------------------------
    # Verify student belongs to assigned section
    # -----------------------------------------------------

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

    section_mapping = (
        db.query(DescriptiveAssignmentSection)
        .filter(
            DescriptiveAssignmentSection.assignment_id
            == assignment.id,

            DescriptiveAssignmentSection.section_id
            == student.section_id,
        )
        .first()
    )

    if not section_mapping:
        raise ValueError(
            "This assignment is not assigned to your section."
        )

    # -----------------------------------------------------
    # Get submission
    # -----------------------------------------------------

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.id
            == submission_data.submission_id,

            DescriptiveSubmission.student_id
            == student_id,

            DescriptiveSubmission.assignment_id
            == assignment.id,
        )
        .first()
    )

    if not submission:
        raise ValueError(
            "Submission not found."
        )

    # -----------------------------------------------------
    # Prevent duplicate submission
    # -----------------------------------------------------

    if submission.status == "Submitted":
        raise ValueError(
            "This assignment has already been submitted."
        )

    # -----------------------------------------------------
    # Check due date
    # -----------------------------------------------------

    now = datetime.now(timezone.utc)

    if assignment.due_date:

        due_date = assignment.due_date

        if due_date.tzinfo is None:
            due_date = due_date.replace(
                tzinfo=timezone.utc
            )

        if now > due_date:
            raise ValueError(
                "This assignment is past its due date."
            )

    # -----------------------------------------------------
    # Validate questions
    # -----------------------------------------------------

    assignment_question_ids = {
        question.id
        for question in assignment.questions
    }

    submitted_question_ids = {
        answer.question_id
        for answer in submission_data.answers
    }

    invalid_questions = (
        submitted_question_ids
        - assignment_question_ids
    )

    if invalid_questions:

        raise ValueError(
            "One or more submitted questions do not "
            "belong to this assignment."
        )

    # -----------------------------------------------------
    # Create answers
    # -----------------------------------------------------

    for answer_data in submission_data.answers:

        existing_answer = (
            db.query(DescriptiveAnswer)
            .filter(
                DescriptiveAnswer.submission_id
                == submission.id,

                DescriptiveAnswer.question_id
                == answer_data.question_id,
            )
            .first()
        )

        if existing_answer:

            existing_answer.answer_text = (
                answer_data.answer_text
            )

        else:

            answer = DescriptiveAnswer(
                submission_id=submission.id,
                question_id=answer_data.question_id,
                answer_text=answer_data.answer_text,
                evaluation_status="Pending",
            )

            db.add(answer)

    # -----------------------------------------------------
    # Mark submission as submitted
    # -----------------------------------------------------

    submission.status = "Submitted"
    submission.submitted_at = datetime.now(timezone.utc)
    submission.evaluation_status = "Pending"

    try:

        db.commit()
        db.refresh(submission)

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