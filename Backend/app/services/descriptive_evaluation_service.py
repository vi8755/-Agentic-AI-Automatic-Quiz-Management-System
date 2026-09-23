from sqlalchemy.orm import Session

from ..models import (
    DescriptiveSubmission,
    DescriptiveAnswer,
    DescriptiveAssignmentQuestion,
    DescriptiveAnswerAttachment,
)

from ..agents.descriptive_evaluation_agent import (
    evaluate_descriptive_answer,
)

from datetime import datetime

import json
import os
import re

import fitz  # PyMuPDF


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================


def extract_pdf_text(pdf_url: str):
    """
    Extract readable text from a PDF stored inside the
    application's uploads directory.

    Example:

        /uploads/descriptive_questions/file.pdf

    becomes:

        uploads/descriptive_questions/file.pdf
    """

    if not pdf_url:
        raise ValueError(
            "PDF URL is empty."
        )

    pdf_path = pdf_url.lstrip("/")

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(
            f"PDF file not found: {pdf_path}"
        )

    document = fitz.open(pdf_path)

    pages = []

    try:

        for page_number, page in enumerate(document):

            text = page.get_text("text")

            if text and text.strip():

                pages.append(
                    f"\n--- PAGE {page_number + 1} ---\n"
                    f"{text.strip()}"
                )

    finally:

        document.close()

    return "\n".join(pages).strip()


# ============================================================
# SAFE JSON EXTRACTION
# ============================================================


def _extract_json(content: str):
    """
    Safely extract JSON from an LLM response.

    Handles:

        {...}

    and:

        ```json
        {...}
        ```
    """

    if not content:

        raise ValueError(
            "AI returned an empty response."
        )

    content = content.strip()

    # --------------------------------------------------------
    # Remove markdown code fence
    # --------------------------------------------------------

    content = re.sub(
        r"^```(?:json)?\s*",
        "",
        content,
        flags=re.IGNORECASE,
    )

    content = re.sub(
        r"\s*```$",
        "",
        content,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Direct JSON
    # --------------------------------------------------------

    try:

        return json.loads(content)

    except json.JSONDecodeError:

        pass

    # --------------------------------------------------------
    # Try JSON object
    # --------------------------------------------------------

    object_match = re.search(
        r"\{.*\}",
        content,
        flags=re.DOTALL,
    )

    if object_match:

        try:

            return json.loads(
                object_match.group(0)
            )

        except json.JSONDecodeError:

            pass

    # --------------------------------------------------------
    # Try JSON array
    # --------------------------------------------------------

    array_match = re.search(
        r"\[.*\]",
        content,
        flags=re.DOTALL,
    )

    if array_match:

        try:

            return json.loads(
                array_match.group(0)
            )

        except json.JSONDecodeError:

            pass

    raise ValueError(
        "AI returned invalid JSON."
    )


# ============================================================
# EXTRACT QUESTIONS FROM QUESTION PDF
# ============================================================


def extract_questions_from_pdf(
    question_pdf_text: str,
):
    """
    Extract questions from a question PDF.

    Supports:

        Q1. Question text [10 Marks]
        Q2. Question text [5 Marks]
        Q3. Question text [5 Marks]

    Also supports:

        Q1) ...
        Q1: ...
        Question 1. ...
        1. ...

    The question marker does NOT have to start
    at the beginning of a line.
    """

    if not question_pdf_text:

        raise ValueError(
            "Question PDF contains no readable text."
        )

    # =========================================================
    # NORMALIZE PDF TEXT
    # =========================================================

    text = question_pdf_text.replace(
        "\r\n",
        "\n",
    )

    text = text.replace(
        "\r",
        "\n",
    )

    # Remove page markers
    text = re.sub(
        r"---\s*PAGE\s*\d+\s*---",
        " ",
        text,
        flags=re.IGNORECASE,
    )

    # Normalize spaces
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\n+",
        "\n",
        text,
    )

    text = text.strip()

    # =========================================================
    # FIND QUESTION MARKERS
    # =========================================================

    question_pattern = re.compile(
        r"""
        (?:
            \bQ\s*
            |
            \bQuestion\s+
        )
        (\d+)
        \s*
        [\.\):\-]
        \s*
        """,
        flags=re.IGNORECASE | re.VERBOSE,
    )

    matches = list(
        question_pattern.finditer(text)
    )

    # =========================================================
    # FALLBACK
    # =========================================================

    if not matches:

        question_pattern = re.compile(
            r"""
            (?<!\d)
            (\d+)
            \s*
            [\.\)]
            \s+
            """,
            flags=re.IGNORECASE | re.VERBOSE,
        )

        matches = list(
            question_pattern.finditer(text)
        )

    if not matches:

        raise ValueError(
            "No questions could be detected in "
            "the question PDF. Detected text was: "
            f"{text[:500]}"
        )

    extracted_questions = []

    # =========================================================
    # EXTRACT QUESTIONS
    # =========================================================

    for index, match in enumerate(matches):

        question_number = int(
            match.group(1)
        )

        start_position = match.end()

        if index + 1 < len(matches):

            end_position = (
                matches[index + 1].start()
            )

        else:

            end_position = len(text)

        question_block = text[
            start_position:end_position
        ].strip()

        if not question_block:
            continue

        # =====================================================
        # EXTRACT MARKS
        # =====================================================

        marks = None

        marks_patterns = [

            # [10 Marks]
            r"\[\s*(\d+(?:\.\d+)?)\s*marks?\s*\]",

            # (10 Marks)
            r"\(\s*(\d+(?:\.\d+)?)\s*marks?\s*\)",

            # 10 Marks
            r"\b(\d+(?:\.\d+)?)\s*marks?\b",

            # [10]
            r"\[\s*(\d+(?:\.\d+)?)\s*\]",
        ]

        for marks_pattern in marks_patterns:

            marks_match = re.search(
                marks_pattern,
                question_block,
                flags=re.IGNORECASE,
            )

            if marks_match:

                marks = float(
                    marks_match.group(1)
                )

                question_block = (
                    question_block[
                        :marks_match.start()
                    ].strip()
                    + " "
                    + question_block[
                        marks_match.end():
                    ].strip()
                )

                break

        # =====================================================
        # DEFAULT MARKS
        # =====================================================

        if marks is None or marks <= 0:

            marks = 10

        if float(marks).is_integer():

            marks = int(marks)

        # =====================================================
        # CLEAN QUESTION TEXT
        # =====================================================

        question_text = question_block.strip()

        question_text = re.sub(
            r"\s+",
            " ",
            question_text,
        )

        question_text = question_text.strip(
            " -:\t"
        )

        if not question_text:
            continue

        # =====================================================
        # SAVE QUESTION
        # =====================================================

        extracted_questions.append(
            {
                "question_order": question_number,
                "question_text": question_text,
                "max_marks": marks,
                "expected_answer": None,
                "evaluation_rubric": (
                    "Evaluate based on correctness, "
                    "relevance, conceptual understanding, "
                    "completeness, accuracy, and appropriate "
                    "examples."
                ),
            }
        )

    # =========================================================
    # VALIDATE
    # =========================================================

    if not extracted_questions:

        raise ValueError(
            "Questions were detected but their text "
            "could not be extracted."
        )

    # =========================================================
    # SORT
    # =========================================================

    extracted_questions.sort(
        key=lambda item: item["question_order"]
    )

    # =========================================================
    # RE-NUMBER
    # =========================================================

    for index, question in enumerate(
        extracted_questions,
        start=1,
    ):

        question["question_order"] = index

    return extracted_questions


# ============================================================
# SPLIT STUDENT ANSWERS
# ============================================================


def extract_question_answers(
    answer_text,
    questions,
):
    """
    Split student's PDF text question-wise.

    Supports:

        Q1
        Q1.
        Q1)
        Q1:

        Question 1
        Question 1.

        1.
        1)

    The question marker does NOT have to start
    at a new line.
    """

    if not answer_text:

        return {}

    # =========================================================
    # NORMALIZE TEXT
    # =========================================================

    text = answer_text.replace(
        "\r\n",
        "\n",
    )

    text = text.replace(
        "\r",
        "\n",
    )

    # Remove page markers
    text = re.sub(
        r"---\s*PAGE\s*\d+\s*---",
        "\n",
        text,
        flags=re.IGNORECASE,
    )

    # Normalize spaces
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    text = text.strip()

    if not text:

        return {}

    # =========================================================
    # FIND QUESTION MARKERS
    # =========================================================

    markers = []

    for question in questions:

        number = int(
            question["question_order"]
        )

        patterns = [

            # Q1. / Q1) / Q1: / Q1-
            rf"\bQ\s*{number}\s*[\.\):\-]\s*",

            # Question 1. / Question 1)
            rf"\bQuestion\s+{number}\s*[\.\):\-]?\s*",

            # Q1 without punctuation
            rf"\bQ\s*{number}\b",

            # 1. / 1)
            rf"(?<!\d){number}\s*[\.\)]\s+",
        ]

        found_match = None

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE,
            )

            if match:

                found_match = match

                break

        if found_match:

            markers.append(
                {
                    "question_order": number,
                    "position": found_match.start(),
                    "end": found_match.end(),
                }
            )

    # =========================================================
    # NO MARKERS
    # =========================================================

    if not markers:

        raise ValueError(
            "No question markers such as Q1, Q2, "
            "or Q3 were detected in the student "
            "answer PDF."
        )

    # =========================================================
    # REMOVE DUPLICATES
    # =========================================================

    unique_markers = {}

    for marker in markers:

        number = marker[
            "question_order"
        ]

        if number not in unique_markers:

            unique_markers[number] = marker

    markers = list(
        unique_markers.values()
    )

    # =========================================================
    # SORT BY POSITION
    # =========================================================

    markers.sort(
        key=lambda item: item["position"]
    )

    # =========================================================
    # EXTRACT ANSWERS
    # =========================================================

    answers = {}

    for index, marker in enumerate(markers):

        question_number = marker[
            "question_order"
        ]

        start_position = marker["end"]

        if index + 1 < len(markers):

            end_position = markers[
                index + 1
            ]["position"]

        else:

            end_position = len(text)

        answer = text[
            start_position:end_position
        ].strip()

        # =====================================================
        # CLEAN ANSWER
        # =====================================================

        answer = re.sub(
            r"\s+",
            " ",
            answer,
        )

        answer = answer.strip()

        answers[
            question_number
        ] = answer

    return answers


# ============================================================
# EVALUATE NORMAL DESCRIPTIVE SUBMISSION
# ============================================================


def evaluate_descriptive_submission(
    submission_id: int,
    db: Session,
):
    """
    Evaluate manually created descriptive assignment answers.
    """

    submission = (
        db.query(
            DescriptiveSubmission
        )
        .filter(
            DescriptiveSubmission.id
            == submission_id
        )
        .first()
    )

    if not submission:

        raise ValueError(
            "Descriptive submission not found."
        )

    submission.evaluation_status = (
        "Processing"
    )

    db.commit()

    try:

        total_obtained_marks = 0.0

        answers = (
            db.query(
                DescriptiveAnswer
            )
            .filter(
                DescriptiveAnswer.submission_id
                == submission.id
            )
            .all()
        )

        for answer in answers:

            question = (
                db.query(
                    DescriptiveAssignmentQuestion
                )
                .filter(
                    DescriptiveAssignmentQuestion.id
                    == answer.question_id
                )
                .first()
            )

            if not question:
                continue

            # ====================================================
            # FIND DRAWING ATTACHMENT
            # ====================================================

            drawing_attachment = (
                db.query(
                    DescriptiveAnswerAttachment
                )
                .filter(
                    DescriptiveAnswerAttachment.answer_id
                    == answer.id,
                    DescriptiveAnswerAttachment.file_type
                    == "drawing",
                )
                .first()
            )

            drawing_data = (
                drawing_attachment.file_url
                if drawing_attachment
                else None
            )

            # ====================================================
            # CHECK TEXT ANSWER
            # ====================================================

            has_text = bool(
                answer.answer_text
                and answer.answer_text.strip()
            )

            # ====================================================
            # CHECK DRAWING ANSWER
            # ====================================================

            has_drawing = bool(
                drawing_data
                and drawing_data.strip()
            )

            # ====================================================
            # EMPTY ANSWER
            # ====================================================

            if not has_text and not has_drawing:

                answer.ai_marks = 0

                answer.ai_feedback = (
                    "No answer was provided."
                )

                answer.evaluation_status = (
                    "Completed"
                )

                total_obtained_marks += 0

                continue

            # ====================================================
            # AI EVALUATION
            # ====================================================

            result = evaluate_descriptive_answer(
                question=question,
                student_answer=(
                    answer.answer_text
                    if has_text
                    else ""
                ),
                drawing_data=(
                    drawing_data
                    if has_drawing
                    else None
                ),
            )

            # ====================================================
            # GET AI MARKS
            # ====================================================

            try:

                ai_marks = float(
                    result.get(
                        "marks",
                        0,
                    )
                )

            except (
                TypeError,
                ValueError,
            ):

                ai_marks = 0.0

            # ====================================================
            # PROTECT MARKS
            # ====================================================

            ai_marks = max(
                0.0,
                ai_marks,
            )

            ai_marks = min(
                ai_marks,
                float(question.max_marks),
            )

            answer.ai_marks = ai_marks

            answer.ai_feedback = str(
                result.get(
                    "feedback",
                    "No feedback was generated.",
                )
            ).strip()

            answer.evaluation_status = (
                "Completed"
            )

            total_obtained_marks += (
                ai_marks
            )

        # ========================================================
        # TOTAL MARKS
        # ========================================================

        if submission.total_marks is None:

            submission.total_marks = sum(
                answer.question.max_marks
                for answer in answers
                if answer.question
            )

        submission.obtained_marks = round(
            total_obtained_marks,
            2,
        )

        # ========================================================
        # PERCENTAGE
        # ========================================================

        if submission.total_marks:

            submission.percentage = round(
                (
                    submission.obtained_marks
                    / submission.total_marks
                )
                * 100,
                2,
            )

        else:

            submission.percentage = 0.0

        # ========================================================
        # OVERALL AI FEEDBACK
        # ========================================================

        submission.ai_feedback = (
            "Your descriptive assignment has been "
            "evaluated using AI based on correctness, "
            "relevance, conceptual understanding, "
            "completeness, and the evaluation rubric."
        )

        submission.evaluation_status = (
            "Completed"
        )

        submission.status = (
            "Evaluated"
        )

        submission.evaluated_at = (
            datetime.utcnow()
        )

        db.commit()

        db.refresh(submission)

        return submission

    except Exception:

        db.rollback()

        failed_submission = (
            db.query(
                DescriptiveSubmission
            )
            .filter(
                DescriptiveSubmission.id
                == submission_id
            )
            .first()
        )

        if failed_submission:

            failed_submission.evaluation_status = (
                "Failed"
            )

            db.commit()

        raise

# ============================================================
# EVALUATE PDF DESCRIPTIVE SUBMISSION
# ============================================================


def evaluate_descriptive_pdf_submission(
    submission_id: int,
    db: Session,
):
    """
    Evaluate a PDF-based descriptive assignment.

    Flow:

        Question PDF
            ↓
        Extract question text
            ↓
        Read questions from DB
            ↓
        Student Answer PDF
            ↓
        Extract answers
            ↓
        Match question number
            ↓
        Existing AI evaluator
            ↓
        Create DescriptiveAnswer
            ↓
        Calculate marks
    """

    # =========================================================
    # 1. GET SUBMISSION
    # =========================================================

    submission = (
        db.query(
            DescriptiveSubmission
        )
        .filter(
            DescriptiveSubmission.id
            == submission_id
        )
        .first()
    )

    if not submission:

        raise ValueError(
            "Descriptive submission not found."
        )

    # =========================================================
    # 2. GET ASSIGNMENT
    # =========================================================

    assignment = submission.assignment

    if not assignment:

        raise ValueError(
            "Assignment not found."
        )

    # =========================================================
    # 3. CHECK PDF FILES
    # =========================================================

    if not assignment.question_pdf_url:

        raise ValueError(
            "Question PDF not found for this assignment."
        )

    if not submission.answer_pdf_url:

        raise ValueError(
            "Student answer PDF not found."
        )

    question_pdf_path = (
        assignment.question_pdf_url.lstrip("/")
    )

    answer_pdf_path = (
        submission.answer_pdf_url.lstrip("/")
    )

    if not os.path.exists(
        question_pdf_path
    ):

        raise FileNotFoundError(
            "Question PDF file not found: "
            f"{question_pdf_path}"
        )

    if not os.path.exists(
        answer_pdf_path
    ):

        raise FileNotFoundError(
            "Answer PDF file not found: "
            f"{answer_pdf_path}"
        )

    # =========================================================
    # 4. MARK PROCESSING
    # =========================================================

    submission.evaluation_status = (
        "Processing"
    )

    db.commit()

    try:

        # =====================================================
        # 5. EXTRACT QUESTION PDF TEXT
        # =====================================================

        question_text = extract_pdf_text(
            assignment.question_pdf_url
        )

        if not question_text:

            raise ValueError(
                "No readable text could be extracted "
                "from the question PDF."
            )

        # =====================================================
        # 6. EXTRACT ANSWER PDF TEXT
        # =====================================================

        answer_text = extract_pdf_text(
            submission.answer_pdf_url
        )

        if not answer_text:

            raise ValueError(
                "No readable text could be extracted "
                "from the answer PDF."
            )

        # =====================================================
        # 7. GET QUESTIONS FROM DATABASE
        # =====================================================

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

        # =====================================================
        # 8. SAFETY FALLBACK
        # =====================================================

        if not questions:

            extracted_questions = (
                extract_questions_from_pdf(
                    question_text
                )
            )

            for extracted_question in (
                extracted_questions
            ):

                question = (
                    DescriptiveAssignmentQuestion(
                        assignment_id=assignment.id,

                        question_text=(
                            extracted_question[
                                "question_text"
                            ]
                        ),

                        max_marks=(
                            extracted_question[
                                "max_marks"
                            ]
                        ),

                        expected_answer=(
                            extracted_question[
                                "expected_answer"
                            ]
                        ),

                        evaluation_rubric=(
                            extracted_question[
                                "evaluation_rubric"
                            ]
                        ),

                        question_order=(
                            extracted_question[
                                "question_order"
                            ]
                        ),
                    )
                )

                db.add(question)

            db.flush()

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

        if not questions:

            raise ValueError(
                "No questions found for this PDF assignment."
            )

        # =====================================================
        # 9. EXTRACT STUDENT ANSWERS
        # =====================================================

        question_data = [
            {
                "question_order": (
                    question.question_order
                )
            }
            for question in questions
        ]

        extracted_answers = (
            extract_question_answers(
                answer_text,
                question_data,
            )
        )

        # =====================================================
        # DEBUG INFORMATION
        # =====================================================

        print(
            "\n"
            "========== PDF EVALUATION DEBUG =========="
        )

        print(
            "\nExtracted answer PDF text:"
        )

        print(
            answer_text
        )

        print(
            "\nQuestions from database:"
        )

        for question in questions:

            print(
                f"Q{question.question_order}: "
                f"{question.question_text} "
                f"({question.max_marks} marks)"
            )

        print(
            "\nExtracted question answers:"
        )

        print(
            extracted_answers
        )

        print(
            "==========================================\n"
        )

        # =====================================================
        # 10. DELETE PREVIOUS ANSWERS
        # =====================================================

        db.query(
            DescriptiveAnswer
        ).filter(
            DescriptiveAnswer.submission_id
            == submission.id
        ).delete(
            synchronize_session=False
        )

        db.flush()

        # =====================================================
        # 11. CALCULATE TOTAL MARKS
        # =====================================================

        total_marks = sum(
            int(question.max_marks or 0)
            for question in questions
        )

        if total_marks <= 0:

            raise ValueError(
                "Total marks for this assignment are zero."
            )

        total_obtained_marks = 0.0

        # =====================================================
        # 12. EVALUATE EACH QUESTION
        # =====================================================

        for question in questions:

            question_number = (
                question.question_order
            )

            student_answer = (
                extracted_answers.get(
                    question_number,
                    "",
                )
            )

            # =================================================
            # EMPTY ANSWER
            # =================================================

            if not student_answer.strip():

                answer = DescriptiveAnswer(
                    submission_id=submission.id,

                    question_id=question.id,

                    answer_text=None,

                    ai_marks=0.0,

                    ai_feedback=(
                        "No answer was detected for "
                        f"Question {question_number}."
                    ),

                    evaluation_status="Completed",
                )

                db.add(answer)

                continue

            # =================================================
            # AI EVALUATION
            # =================================================

            print(
                f"Evaluating Question "
                f"{question_number}..."
            )

            result = evaluate_descriptive_answer(
                question=question,
                student_answer=student_answer,
            )

            # =================================================
            # GET AI MARKS
            # =================================================

            try:

                ai_marks = float(
                    result.get(
                        "marks",
                        0,
                    )
                )

            except (
                TypeError,
                ValueError,
            ):

                ai_marks = 0.0

            # =================================================
            # PROTECT MARKS
            # =================================================

            ai_marks = max(
                0.0,
                ai_marks,
            )

            ai_marks = min(
                ai_marks,
                float(question.max_marks),
            )

            # =================================================
            # GET FEEDBACK
            # =================================================

            ai_feedback = str(
                result.get(
                    "feedback",
                    "No feedback generated.",
                )
            ).strip()

            # =================================================
            # CREATE ANSWER
            # =================================================

            answer = DescriptiveAnswer(
                submission_id=submission.id,

                question_id=question.id,

                answer_text=student_answer,

                ai_marks=ai_marks,

                ai_feedback=ai_feedback,

                evaluation_status="Completed",
            )

            db.add(answer)

            total_obtained_marks += (
                ai_marks
            )

            print(
                f"Question {question_number}: "
                f"{ai_marks}/{question.max_marks}"
            )

        # =====================================================
        # 13. SAVE ANSWERS
        # =====================================================

        db.flush()

        # =====================================================
        # 14. UPDATE TOTALS
        # =====================================================

        submission.total_marks = (
            total_marks
        )

        submission.obtained_marks = round(
            total_obtained_marks,
            2,
        )

        # =====================================================
        # 15. PERCENTAGE
        # =====================================================

        submission.percentage = round(
            (
                submission.obtained_marks
                / total_marks
            )
            * 100,
            2,
        )

        # =====================================================
        # 16. OVERALL FEEDBACK
        # =====================================================

        submission.ai_feedback = (
            "The student's answer PDF was evaluated "
            "question-wise using AI based on correctness, "
            "relevance, conceptual understanding, "
            "completeness, accuracy, and the evaluation rubric."
        )

        # =====================================================
        # 17. COMPLETE EVALUATION
        # =====================================================

        submission.evaluation_status = (
            "Completed"
        )

        submission.status = (
            "Evaluated"
        )

        submission.evaluated_at = (
            datetime.utcnow()
        )

        # =====================================================
        # 18. SAVE EVERYTHING
        # =====================================================

        db.commit()

        db.refresh(submission)

        print(
            "\n========== FINAL RESULT =========="
        )

        print(
            f"Submission ID: {submission.id}"
        )

        print(
            f"Total Marks: {submission.total_marks}"
        )

        print(
            f"Obtained Marks: "
            f"{submission.obtained_marks}"
        )

        print(
            f"Percentage: "
            f"{submission.percentage}%"
        )

        print(
            "==================================\n"
        )

        return submission

    except Exception:

        db.rollback()

        failed_submission = (
            db.query(
                DescriptiveSubmission
            )
            .filter(
                DescriptiveSubmission.id
                == submission_id
            )
            .first()
        )

        if failed_submission:

            failed_submission.evaluation_status = (
                "Failed"
            )

            db.commit()

        raise