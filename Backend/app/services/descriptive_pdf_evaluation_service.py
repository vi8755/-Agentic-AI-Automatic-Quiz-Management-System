import os

from sqlalchemy.orm import Session

from ..models import (
    DescriptiveSubmission,
    DescriptiveAssignment,
    DescriptiveAssignmentQuestion,
    DescriptiveAnswer,
)

from .pdf_service import extract_text_from_pdf


def evaluate_descriptive_pdf_submission(
    db: Session,
    submission_id: int,
):
    # =====================================================
    # FIND SUBMISSION
    # =====================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.id == submission_id
        )
        .first()
    )

    if not submission:
        raise ValueError(
            "Submission not found."
        )

    if not submission.answer_pdf_url:
        raise ValueError(
            "Answer PDF not found."
        )

    # =====================================================
    # FIND ASSIGNMENT
    # =====================================================

    assignment = (
        db.query(DescriptiveAssignment)
        .filter(
            DescriptiveAssignment.id
            == submission.assignment_id
        )
        .first()
    )

    if not assignment:
        raise ValueError(
            "Assignment not found."
        )

    # =====================================================
    # CONVERT URL TO LOCAL PATH
    # =====================================================

    relative_path = (
        submission.answer_pdf_url
        .lstrip("/")
    )

    answer_pdf_path = relative_path

    if not os.path.exists(answer_pdf_path):
        raise ValueError(
            "Answer PDF file not found on server."
        )

    # =====================================================
    # EXTRACT ANSWER PDF TEXT
    # =====================================================

    answer_text = extract_text_from_pdf(
        answer_pdf_path
    )

    if not answer_text:
        raise ValueError(
            "Could not extract text from answer PDF."
        )

    # =====================================================
    # PDF ASSIGNMENT
    # =====================================================

    if assignment.assignment_type == "PDF":

        if not assignment.question_pdf_url:
            raise ValueError(
                "Question PDF not found."
            )

        question_pdf_path = (
            assignment.question_pdf_url
            .lstrip("/")
        )

        if not os.path.exists(
            question_pdf_path
        ):
            raise ValueError(
                "Question PDF file not found."
            )

        question_text = extract_text_from_pdf(
            question_pdf_path
        )

        if not question_text:
            raise ValueError(
                "Could not extract text from question PDF."
            )

        # -------------------------------------------------
        # TODO: SEND QUESTION + ANSWER TO AI
        # -------------------------------------------------

        # This is the next AI node/service.
        #
        # For now we have successfully prepared:
        #
        # question_text
        # answer_text
        #
        # These will be passed to your Groq/LangGraph
        # evaluation workflow.

    # =====================================================
    # MANUAL ASSIGNMENT
    # =====================================================

    else:

        questions = (
            db.query(
                DescriptiveAssignmentQuestion
            )
            .filter(
                DescriptiveAssignmentQuestion.assignment_id
                == assignment.id
            )
            .order_by(
                DescriptiveAssignmentQuestion.question_order
            )
            .all()
        )

        # Manual questions already exist in DB.
        #
        # Their:
        # - question_text
        # - max_marks
        # - expected_answer
        # - evaluation_rubric
        #
        # can be passed to your existing AI evaluator.

    # =====================================================
    # CURRENT STATUS
    # =====================================================

    submission.evaluation_status = "Pending"

    db.commit()

    return {
        "submission_id": submission.id,
        "assignment_id": assignment.id,
        "answer_text": answer_text,
        "message": (
            "PDF text extracted successfully. "
            "Ready for AI evaluation."
        ),
    }