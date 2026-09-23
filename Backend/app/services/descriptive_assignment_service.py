from sqlalchemy.orm import Session

from ..models import (
    User,
    Teacher,
    TeacherSection,
    DescriptiveAssignment,
    DescriptiveAssignmentQuestion,
    DescriptiveAssignmentSection,
)


# =========================================================
# HELPER
# Get Teacher ID from authenticated User
# =========================================================

def get_teacher_id_from_user(
    db: Session,
    current_user: User,
) -> int:
    """
    Get the Teacher record associated with the authenticated User.
    """

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise ValueError(
            "Teacher profile not found for the current user."
        )

    return teacher.id


# =========================================================
# CREATE DESCRIPTIVE ASSIGNMENT
# =========================================================

def create_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_data,
):
    """
    Create a descriptive assignment for the logged-in teacher.
    """

    # -----------------------------------------------------
    # Get Teacher
    # -----------------------------------------------------

    teacher_id = get_teacher_id_from_user(
        db=db,
        current_user=current_user,
    )

    # -----------------------------------------------------
    # Extract request data
    # -----------------------------------------------------

    subject_id = assignment_data.subject_id
    section_ids = list(set(assignment_data.section_ids))
    academic_year = assignment_data.academic_year

    # -----------------------------------------------------
    # Validate teacher-section-subject assignment
    # -----------------------------------------------------

    teacher_sections = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id == teacher_id,
            TeacherSection.subject_id == subject_id,
            TeacherSection.academic_year == academic_year,
            TeacherSection.section_id.in_(section_ids),
            TeacherSection.is_active.is_(True),
        )
        .all()
    )

    assigned_section_ids = {
        teacher_section.section_id
        for teacher_section in teacher_sections
    }

    invalid_sections = [
        section_id
        for section_id in section_ids
        if section_id not in assigned_section_ids
    ]

    if invalid_sections:
        raise ValueError(
            "You are not assigned to one or more selected "
            "sections for this subject and academic year."
        )

    # -----------------------------------------------------
    # Create Assignment
    # -----------------------------------------------------

    assignment = DescriptiveAssignment(
        teacher_id=teacher_id,
        subject_id=subject_id,
        title=assignment_data.title,
        instructions=assignment_data.instructions,
        status="Draft",
        due_date=assignment_data.due_date,
    )

    db.add(assignment)
    db.flush()

    # -----------------------------------------------------
    # Create Questions
    # -----------------------------------------------------

    for question_data in assignment_data.questions:

        question = DescriptiveAssignmentQuestion(
            assignment_id=assignment.id,
            question_text=question_data.question_text,
            max_marks=question_data.max_marks,
            expected_answer=question_data.expected_answer,
            evaluation_rubric=question_data.evaluation_rubric,
            question_order=question_data.question_order,
        )

        db.add(question)

    # -----------------------------------------------------
    # Assign Sections
    # -----------------------------------------------------

    for section_id in section_ids:

        assignment_section = DescriptiveAssignmentSection(
            assignment_id=assignment.id,
            section_id=section_id,
        )

        db.add(assignment_section)

    # -----------------------------------------------------
    # Commit
    # -----------------------------------------------------

    try:
        db.commit()
        db.refresh(assignment)

    except Exception:
        db.rollback()
        raise

    return assignment


# =========================================================
# GET ALL TEACHER ASSIGNMENTS
# =========================================================

def get_teacher_descriptive_assignments(
    db: Session,
    current_user: User,
):
    """
    Get all descriptive assignments created by
    the logged-in teacher.
    """

    teacher_id = get_teacher_id_from_user(
        db=db,
        current_user=current_user,
    )

    return (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.teacher_id == teacher_id
        )
        .order_by(
            DescriptiveAssignment.created_at.desc()
        )
        .all()
    )


# =========================================================
# GET SINGLE TEACHER ASSIGNMENT
# =========================================================

def get_teacher_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
):
    """
    Get one descriptive assignment belonging to
    the currently authenticated teacher.
    """

    teacher_id = get_teacher_id_from_user(
        db=db,
        current_user=current_user,
    )

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignment.teacher_id == teacher_id,
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    return assignment


# =========================================================
# UPDATE DESCRIPTIVE ASSIGNMENT
# =========================================================

def update_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
    assignment_data,
):
    """
    Update a Draft descriptive assignment.

    Existing questions and section mappings are replaced
    with the submitted values.
    """

    teacher_id = get_teacher_id_from_user(
        db=db,
        current_user=current_user,
    )

    # -----------------------------------------------------
    # Get assignment
    # -----------------------------------------------------

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignment.teacher_id == teacher_id,
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    # -----------------------------------------------------
    # Only Draft assignments can be edited
    # -----------------------------------------------------

    if assignment.status != "Draft":
        raise ValueError(
            "Only draft assignments can be edited."
        )

    # -----------------------------------------------------
    # Validate selected sections
    # -----------------------------------------------------

    section_ids = list(
        set(assignment_data.section_ids)
    )

    teacher_sections = (
        db.query(TeacherSection)
        .filter(
            TeacherSection.teacher_id == teacher_id,
            TeacherSection.subject_id == assignment.subject_id,
            TeacherSection.academic_year
            == assignment_data.academic_year,
            TeacherSection.section_id.in_(section_ids),
            TeacherSection.is_active.is_(True),
        )
        .all()
    )

    assigned_section_ids = {
        teacher_section.section_id
        for teacher_section in teacher_sections
    }

    invalid_sections = [
        section_id
        for section_id in section_ids
        if section_id not in assigned_section_ids
    ]

    if invalid_sections:
        raise ValueError(
            "You are not assigned to one or more selected "
            "sections for this subject and academic year."
        )

    # -----------------------------------------------------
    # Update assignment
    # -----------------------------------------------------

    assignment.title = assignment_data.title
    assignment.instructions = assignment_data.instructions
    assignment.due_date = assignment_data.due_date
    assignment.duration_minutes = assignment_data.duration_minutes

    # -----------------------------------------------------
    # Remove old questions
    # -----------------------------------------------------

    db.query(
        DescriptiveAssignmentQuestion
    ).filter(
        DescriptiveAssignmentQuestion.assignment_id
        == assignment.id
    ).delete(
        synchronize_session=False
    )

    # -----------------------------------------------------
    # Create new questions
    # -----------------------------------------------------

    for question_data in assignment_data.questions:

        question = DescriptiveAssignmentQuestion(
            assignment_id=assignment.id,
            question_text=question_data.question_text,
            max_marks=question_data.max_marks,
            expected_answer=question_data.expected_answer,
            evaluation_rubric=question_data.evaluation_rubric,
            question_order=question_data.question_order,
        )

        db.add(question)

    # -----------------------------------------------------
    # Remove old section mappings
    # -----------------------------------------------------

    db.query(
        DescriptiveAssignmentSection
    ).filter(
        DescriptiveAssignmentSection.assignment_id
        == assignment.id
    ).delete(
        synchronize_session=False
    )

    # -----------------------------------------------------
    # Create new section mappings
    # -----------------------------------------------------

    for section_id in section_ids:

        assignment_section = DescriptiveAssignmentSection(
            assignment_id=assignment.id,
            section_id=section_id,
        )

        db.add(assignment_section)

    # -----------------------------------------------------
    # Commit
    # -----------------------------------------------------

    try:
        db.commit()
        db.refresh(assignment)

    except Exception:
        db.rollback()
        raise

    return assignment


# =========================================================
# PUBLISH ASSIGNMENT
# =========================================================

def publish_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
):
    """
    Publish a Draft descriptive assignment.
    """

    teacher_id = get_teacher_id_from_user(
        db=db,
        current_user=current_user,
    )

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignment.teacher_id == teacher_id,
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    if assignment.status == "Published":
        raise ValueError(
            "Assignment is already published."
        )

    # -----------------------------------------------------
    # Must contain questions
    # -----------------------------------------------------

    if not assignment.questions:
        raise ValueError(
            "Assignment must contain at least one question."
        )

    # -----------------------------------------------------
    # Must have sections
    # -----------------------------------------------------

    if not assignment.sections:
        raise ValueError(
            "Assignment must be assigned to at least one section."
        )

    assignment.status = "Published"

    try:
        db.commit()
        db.refresh(assignment)

    except Exception:
        db.rollback()
        raise

    return assignment


# =========================================================
# UNPUBLISH ASSIGNMENT
# =========================================================

def unpublish_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
):
    """
    Move a published descriptive assignment back to Draft.
    """

    teacher_id = get_teacher_id_from_user(
        db=db,
        current_user=current_user,
    )

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignment.teacher_id == teacher_id,
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    if assignment.status != "Published":
        raise ValueError(
            "Only published assignments can be moved to draft."
        )

    assignment.status = "Draft"

    try:
        db.commit()
        db.refresh(assignment)

    except Exception:
        db.rollback()
        raise

    return assignment


# =========================================================
# MOVE ASSIGNMENT TO DRAFT
# =========================================================

def move_descriptive_assignment_to_draft(
    db: Session,
    current_user: User,
    assignment_id: int,
):
    """
    Alias/helper for moving a published assignment
    back to Draft.
    """

    return unpublish_descriptive_assignment(
        db=db,
        current_user=current_user,
        assignment_id=assignment_id,
    )


# =========================================================
# DELETE ASSIGNMENT
# =========================================================

def delete_descriptive_assignment(
    db: Session,
    current_user: User,
    assignment_id: int,
):
    """
    Delete a descriptive assignment belonging
    to the logged-in teacher.
    """

    teacher_id = get_teacher_id_from_user(
        db=db,
        current_user=current_user,
    )

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id == assignment_id,
            DescriptiveAssignment.teacher_id == teacher_id,
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Descriptive assignment not found."
        )

    try:
        db.delete(assignment)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Descriptive assignment deleted successfully."
    }