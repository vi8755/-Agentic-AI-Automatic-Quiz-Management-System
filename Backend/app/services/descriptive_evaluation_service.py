from sqlalchemy.orm import Session
from types import SimpleNamespace
from ..database import SessionLocal

from ..models import (
    DescriptiveSubmission,
    DescriptiveAnswer,
    DescriptiveAssignmentQuestion,
    DescriptiveAnswerAttachment,
)

from ..agents.descriptive_evaluation_agent import (
    evaluate_descriptive_answer,
)

from datetime import datetime, timedelta, timezone

import json
import os
import re

import fitz  # PyMuPDF
import base64

from groq import Groq

from ..config import settings

def extract_pdf_text_with_vision(document):
    """
    Extract text from scanned/handwritten PDF pages
    using Groq Vision OCR.
    """

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    vision_model = getattr(
        settings,
        "GROQ_VISION_MODEL",
        "qwen/qwen3.8-27b",
    )

    pages = []

    for page_number, page in enumerate(
        document,
        start=1,
    ):

        print(
            f"Running Vision OCR on page "
            f"{page_number}..."
        )

        # Render PDF page as PNG
        pix = page.get_pixmap(
            matrix=fitz.Matrix(2, 2),
            alpha=False,
        )

        image_bytes = pix.tobytes("png")

        # Convert image to base64
        image_base64 = base64.b64encode(
            image_bytes
        ).decode("utf-8")

        prompt = """
You are a high-accuracy academic document transcription system.

Your task is to transcribe the content of an educational question
paper from the provided image.

The document may contain printed text, handwriting, mathematical
notation, scientific notation, engineering notation, equations,
symbols, diagrams, tables, code, algorithms, circuit diagrams,
technical drawings, graphs, or mixed content.

Your primary goal is:

ACCURATE TRANSCRIPTION, NOT SOLVING, CORRECTING, INTERPRETING,
OR IMPROVING THE CONTENT.

=========================================================
1. GENERAL TRANSCRIPTION
=========================================================

- Transcribe all readable text visible in the image.
- Preserve the original order and structure.
- Preserve question numbers and sub-question numbers.
- Preserve headings, instructions, labels, options, and marks.
- Preserve meaningful line breaks where they help identify structure.
- Do not omit readable content merely because it appears difficult,
  technical, handwritten, or unusual.
- Do not invent text that is not visible.

=========================================================
2. QUESTION NUMBERING
=========================================================

Recognize and preserve question numbering such as:

Q1
Q1.
Q1)
Q1:
Q.1
Q.1.
Q. 1
Q 1
Question 1
Question 1.
Question No. 1

Also recognize sub-questions such as:

(a)
(b)
(c)

(i)
(ii)
(iii)

1(a)
1(b)
Q1(a)
Q1(b)

If the numbering is clearly visible, preserve it.

If normalization is necessary for downstream parsing, normalize only
the question marker, for example:

Q.3 -> Q3

Do NOT merge separate questions.

=========================================================
3. MATHEMATICAL EXPRESSIONS
=========================================================

Transcribe mathematical expressions as accurately as possible.

Preserve:

- superscripts
- subscripts
- fractions
- roots
- powers
- indices
- summations
- integrals
- limits
- matrices
- vectors
- Greek letters
- mathematical operators
- inequalities
- equations
- functions
- derivatives
- units
- variables
- brackets and parentheses

Examples of structures that may occur:

x²
x₁
aₙ
√x
x/y
∫
Σ
∂
∞
≤
≥
≠
≈
→
←
∑ᵢ₌₁ⁿ
f(x)
dy/dx
A⁻¹
|x|
log₂x

Do not simplify, solve, rearrange, or correct mathematical expressions.

If an expression is genuinely unclear, transcribe only what can
reasonably be observed instead of guessing.

=========================================================
4. SCIENCE AND ENGINEERING NOTATION
=========================================================

Pay special attention to technical notation used in engineering,
science, mathematics, and B.Tech academic subjects.

This may include:

- chemical formulas
- electron configurations
- atomic notation
- circuit symbols
- electrical quantities
- physical units
- vectors
- matrices
- coordinate notation
- engineering formulas
- scientific symbols
- technical abbreviations
- subscripts and superscripts

Examples:

1s² 2s² 2p³
H₂O
CO₂
Na⁺
SO₄²⁻
V = IR
F = ma
P = VI
E = mc²
x(t)
V₁, V₂
R₁ || R₂

IMPORTANT:

Visually similar characters must not be automatically substituted.

For example:

s ≠ 5
O ≠ 0
I ≠ 1
l ≠ 1
B ≠ 8
S ≠ 5
Z ≠ 2

Use the character that is actually visible.

Do NOT use your general knowledge to silently correct a technically
incorrect expression.

For example, if the paper visibly contains an incorrect formula,
transcribe the incorrect formula rather than replacing it with the
formula you believe should be correct.

=========================================================
5. ENGINEERING / B.TECH CONTENT
=========================================================

Be prepared to transcribe terminology from subjects such as:

- Computer Science
- Data Structures
- Algorithms
- DBMS
- Operating Systems
- Computer Networks
- Computer Architecture
- Software Engineering
- Artificial Intelligence
- Machine Learning
- Java
- Python
- C / C++
- Web Development
- Electrical Engineering
- Electronics
- Mechanical Engineering
- Civil Engineering
- Engineering Mathematics
- Physics
- Chemistry
- Digital Logic
- Microprocessors
- Embedded Systems
- Control Systems
- Signals and Systems
- Thermodynamics
- Engineering Mechanics
- Fluid Mechanics
- Manufacturing
- CAD / CAE
- and other technical subjects.

Preserve technical terminology exactly as visible.

Do not expand abbreviations unless the expansion is explicitly
written in the document.

For programming/code questions, preserve:

- keywords
- variable names
- operators
- brackets
- indentation when visually meaningful
- code symbols
- punctuation

Do not execute, explain, or correct the code.

=========================================================
6. DIAGRAMS AND FIGURES
=========================================================

If a question contains a visual element such as:

- diagram
- graph
- chart
- circuit
- ladder
- flowchart
- block diagram
- architecture diagram
- UML diagram
- ER diagram
- database schema
- network topology
- waveform
- engineering drawing
- mechanical figure
- geometry figure
- table
- technical illustration

do NOT attempt to solve or interpret the question.

Instead, provide a concise factual description of what is visibly
present.

For example:

[Diagram: two vertical rails connected by six horizontal rungs]

[Diagram: block diagram containing blocks labelled CPU, Memory,
Input and Output]

[Graph: x-axis labelled Time and y-axis labelled Voltage]

Preserve visible labels inside diagrams whenever readable.

Do not invent labels, values, connections, components, or meanings.

=========================================================
7. TABLES
=========================================================

If a table is present:

- preserve column and row information as much as possible;
- preserve headings;
- preserve visible values;
- maintain the relationship between values and their columns;
- do not calculate missing values.

=========================================================
8. MARKS AND EXAM INSTRUCTIONS
=========================================================

Preserve marks information such as:

[10 Marks]
(5 Marks)
10 Marks
2 × 5 = 10
Maximum Marks: 50

Also preserve instructions such as:

Attempt any five questions.
Answer all questions.
Choose the correct option.
All questions carry equal marks.

Do not interpret or modify the marking scheme.

=========================================================
9. OPTIONS / MCQs
=========================================================

Preserve multiple-choice options such as:

(a) ...
(b) ...
(c) ...
(d) ...

Preserve the option text exactly as visible.

Do NOT identify which option is correct.

=========================================================
10. HANDWRITING
=========================================================

For handwritten content:

- transcribe what is actually visible;
- preserve technical symbols and notation carefully;
- do not automatically correct spelling;
- do not infer missing words;
- do not convert an unclear expression into a known textbook
  expression simply because it seems likely.

If handwriting is genuinely unreadable, indicate:

[Unclear]

or describe only the clearly visible portion.

=========================================================
11. NO SOLVING OR ACADEMIC ASSISTANCE
=========================================================

You are ONLY transcribing the document.

Do NOT:

- solve questions;
- calculate answers;
- correct formulas;
- correct student mistakes;
- identify correct MCQ options;
- explain concepts;
- grade answers;
- infer intended answers;
- add textbook knowledge;
- improve the wording;
- complete missing information.

=========================================================
12. STRICT ANTI-INFERENCE RULE
=========================================================

The image is the source of truth.

Your general knowledge must NOT override what is visible.

If the document says something technically incorrect,
transcribe it as written.

If a formula appears unusual, preserve it.

If a student's handwriting appears to contain a mistake,
preserve the mistake.

Only normalize formatting when necessary for reliable question
or answer separation.

=========================================================
13. OUTPUT FORMAT
=========================================================

Return only the transcribed document content.

Keep separate questions separate.

For example:

Q1. [question text]

Q2. [question text]

Q3. [question text]

Do not add explanations before or after the transcription.
Do not answer any questions.
"""

        response = client.chat.completions.create(
            model=vision_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt,
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": (
                                    "data:image/png;base64,"
                                    f"{image_base64}"
                                )
                            },
                        },
                    ],
                }
            ],
            temperature=0.1,
            max_completion_tokens=700,
        )

        text = (
            response.choices[0]
            .message
            .content
            or ""
        )

        if text.strip():

            pages.append(
                f"\n--- PAGE {page_number} ---\n"
                f"{text.strip()}"
            )

            print(
                f"Vision OCR page {page_number}: "
                f"{len(text.strip())} characters"
            )

        else:

            print(
                f"Vision OCR returned no text "
                f"for page {page_number}."
            )

    return "\n".join(pages).strip()
# ============================================================
# PDF TEXT EXTRACTION
# ============================================================


def extract_pdf_text(pdf_url: str):
    """
    Extract readable text from a PDF stored inside
    the application's uploads directory.

    For normal text PDFs:
        PyMuPDF text extraction is used.

    For scanned/handwritten PDFs:
        Groq Vision OCR is used as a fallback.
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

        # ========================================================
        # STEP 1: NORMAL TEXT EXTRACTION
        # ========================================================

        for page_number, page in enumerate(
            document,
            start=1,
        ):

            text = page.get_text("text")

            if text and text.strip():

                pages.append(
                    f"\n--- PAGE {page_number} ---\n"
                    f"{text.strip()}"
                )

        extracted_text = "\n".join(
            pages
        ).strip()

        # ========================================================
        # STEP 2: VISION OCR FALLBACK
        # ========================================================

        if not extracted_text:

            print(
                "\n========================================"
            )

            print(
                "No text layer found in PDF."
            )

            print(
                "Starting Groq Vision OCR..."
            )

            print(
                "========================================\n"
            )

            extracted_text = (
                extract_pdf_text_with_vision(
                    document
                )
            )

        # ========================================================
        # STEP 3: FINAL VALIDATION
        # ========================================================

        if not extracted_text:

            raise ValueError(
                "No readable text could be extracted "
                "from the PDF."
            )

        print(
            "\n========================================"
        )

        print(
            "PDF TEXT EXTRACTION SUCCESS"
        )

        print(
            f"Characters extracted: "
            f"{len(extracted_text)}"
        )

        print(
            "========================================\n"
        )

        return extracted_text

    finally:

        document.close()
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
        Q.1 ...
        Q. 1 ...
        Q 1. ...
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

    # Remove markdown code fences if Vision OCR returned them
    text = re.sub(
        r"```(?:markdown|text)?",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"```",
        "",
        text,
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

     # =========================================================
# FIND QUESTION MARKERS
# =========================================================

    question_pattern = re.compile(
     r"""
     (?:
        \bQ\s*\.?\s*(\d+)
        |
        \bQuestion\s+(\d+)
     )
     \s*
     [\.\):\-]?
     \s*
     """,
    flags=re.IGNORECASE | re.VERBOSE,
    )

    matches = list(
        question_pattern.finditer(text)
    )

# =========================================================
# FALLBACK FOR NUMERIC QUESTIONS
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

    # =========================================================
    # VALIDATE QUESTION MARKERS
    # =========================================================

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
            match.group(1) or match.group(2)
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


# ============================================================
# SPLIT STUDENT ANSWERS
# ============================================================

def extract_question_answers(
    answer_text,
    questions,
):
    """
    Split student's PDF text question-wise.

    IMPORTANT DESIGN RULE:
    Only strong evidence is allowed to create a new question
    boundary.

    Supported strong markers:
        Q1
        Q1.
        Q1)
        Q1:
        Q.1
        Q. 1
        Q 1
        Ques 1
        Ques 1.
        Ques 1)
        Question 1
        Answer 1
        Ans 1

    Normal answer formatting such as:
        1.
        2.
        3.
        1)
        2)
        -
        *
        •
        →
        (a)
        (b)
        a)
        b)

    is NEVER treated as a question marker by itself.

    If a question number is missing because of OCR, the function
    attempts to identify the question using the actual stored
    question text.
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

    # Remove markdown code fences
    text = re.sub(
        r"```(?:markdown|text|json)?",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"```",
        "",
        text,
    )

    # Normalize spaces but preserve line boundaries.
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
    # HELPERS
    # =========================================================

    def normalize_for_matching(value):
        """
        Normalize text for OCR-tolerant question matching.
        """

        value = value.lower()

        # Normalize common OCR variations
        value = value.replace(
            "expectation-maximization",
            "expectation maximization",
        )

        value = value.replace(
            "expectation maximisation",
            "expectation maximization",
        )

        # Common OCR abbreviation normalization
        value = value.replace(
            "algo.",
            "algorithm",
        )

        value = value.replace(
            "algo",
            "algorithm",
        )

        # Keep only alphanumeric characters
        value = re.sub(
            r"[^a-z0-9]+",
            " ",
            value,
        )

        value = re.sub(
            r"\s+",
            " ",
            value,
        )

        return value.strip()

    def meaningful_words(value):
        """
        Return useful words for fuzzy question matching.
        """

        stop_words = {
            "the",
            "a",
            "an",
            "is",
            "are",
            "was",
            "were",
            "what",
            "why",
            "how",
            "does",
            "do",
            "to",
            "of",
            "in",
            "on",
            "for",
            "and",
            "or",
            "with",
            "by",
            "from",
            "into",
            "be",
            "can",
            "will",
        }

        words = normalize_for_matching(
            value
        ).split()

        return [
            word
            for word in words
            if word not in stop_words
            and len(word) > 2
        ]

    # =========================================================
    # FIND STRONG QUESTION MARKERS
    # =========================================================

    markers = []

    for question in questions:

        number = int(
            question["question_order"]
        )

        patterns = [

            # -------------------------------------------------
            # Answer 1 / Answer 1. / Answer 1:
            # -------------------------------------------------

            rf"\bAnswer\s+{number}\s*[\.\):\-]?\s*",

            # -------------------------------------------------
            # Ans 1 / Ans 1. / Ans 1:
            # -------------------------------------------------

            rf"\bAns\s+{number}\s*[\.\):\-]?\s*",

            # -------------------------------------------------
            # Question 1 / Question 1. / Question 1:
            # -------------------------------------------------

            rf"\bQuestion\s+{number}\s*[\.\):\-]?\s*",

            # -------------------------------------------------
            # Ques 1 / Ques 1. / Ques 1)
            # Also supports OCR "Question"
            # -------------------------------------------------

            rf"\bQues(?:tion)?\s*\.?\s*{number}\s*[\.\):\-]?\s*",

            # -------------------------------------------------
            # Q1 / Q1. / Q1) / Q1:
            # Q.1 / Q. 1
            # -------------------------------------------------

            rf"\bQ\s*\.?\s*{number}\s*[\.\):\-]\s*",

            # -------------------------------------------------
            # Q1 without punctuation
            # -------------------------------------------------

            rf"\bQ\s*\.?\s*{number}\b",
        ]

        found_marker = None

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE,
            )

            if match:
                found_marker = match
                break

        if found_marker:

            markers.append(
                {
                    "question_order": number,
                    "position": found_marker.start(),
                    "end": found_marker.end(),
                    "source": "explicit_marker",
                }
            )

    # =========================================================
    # QUESTION TEXT FALLBACK
    # =========================================================
    #
    # Used when OCR loses the question number.
    #
    # Example:
    #
    # Database question:
    # "What problem does the expectation-maximization
    #  algo. solve?"
    #
    # OCR:
    # "(a) What problem does the EM algorithm solve?"
    #
    # We compare meaningful words and keep the BEST matching
    # location instead of simply taking the first occurrence.
    # =========================================================

    normalized_text = normalize_for_matching(
        text
    )

    normalized_tokens = (
        normalized_text.split()
    )

    for question in questions:

        number = int(
            question["question_order"]
        )

        # -----------------------------------------------------
        # Skip questions already detected by explicit markers
        # -----------------------------------------------------

        if any(
            marker["question_order"] == number
            for marker in markers
        ):
            continue

        question_text = (
            question.get("question_text")
            or ""
        )

        if not question_text:
            continue

        question_words = meaningful_words(
            question_text
        )

        if len(question_words) < 3:
            continue

        question_word_set = set(
            question_words
        )

        # -----------------------------------------------------
        # Find the best matching window
        # -----------------------------------------------------

        best_score = 0.0
        best_token_index = None

        window_size = max(
            8,
            min(
                20,
                len(question_words) + 8,
            ),
        )

        for index in range(
            len(normalized_tokens)
        ):

            window = normalized_tokens[
                index:index + window_size
            ]

            if not window:
                continue

            window_set = set(
                window
            )

            matched_words = (
                question_word_set
                & window_set
            )

            score = (
                len(matched_words)
                / len(question_word_set)
            )

            if score > best_score:

                best_score = score
                best_token_index = index

        # -----------------------------------------------------
        # Require a reasonably strong match
        # -----------------------------------------------------

        if (
            best_score < 0.50
            or best_token_index is None
        ):
            continue

        # -----------------------------------------------------
        # Get the best matching window
        # -----------------------------------------------------

        matched_window = normalized_tokens[
            best_token_index:
            best_token_index + window_size
        ]

        if not matched_window:
            continue

        # Use the first token of the best window as an anchor.
        anchor_token = matched_window[0]

        if not anchor_token:
            continue

        # -----------------------------------------------------
        # Find all anchor occurrences in normalized text
        # -----------------------------------------------------

        candidate_positions = []

        search_start = 0

        while True:

            position = normalized_text.find(
                anchor_token,
                search_start,
            )

            if position == -1:
                break

            candidate_positions.append(
                position
            )

            search_start = (
                position
                + len(anchor_token)
            )

        if not candidate_positions:
            continue

        # -----------------------------------------------------
        # Approximate normalized character position
        # -----------------------------------------------------

        approximate_character_position = len(
            " ".join(
                normalized_tokens[
                    :best_token_index
                ]
            )
        )

        best_character_position = min(
            candidate_positions,
            key=lambda position: abs(
                position
                - approximate_character_position
            ),
        )

        # -----------------------------------------------------
        # Find the same anchor in original OCR text
        # -----------------------------------------------------

        original_anchor_pattern = re.escape(
            anchor_token
        )

        original_candidates = []

        for match in re.finditer(
            original_anchor_pattern,
            text,
            flags=re.IGNORECASE,
        ):
            original_candidates.append(
                match
            )

        if not original_candidates:
            continue

        # -----------------------------------------------------
        # Convert normalized position approximately to the
        # original text position using relative location.
        # -----------------------------------------------------

        normalized_ratio = (
            best_character_position
            / max(
                len(normalized_text),
                1,
            )
        )

        best_original_match = min(
            original_candidates,
            key=lambda match: abs(
                (
                    match.start()
                    / max(len(text), 1)
                )
                - normalized_ratio
            ),
        )

        markers.append(
            {
                "question_order": number,
                "position": (
                    best_original_match.start()
                ),
                "end": (
                    best_original_match.end()
                ),
                "source": "question_text_fallback",
                "match_score": round(
                    best_score,
                    3,
                ),
            }
        )

    # =========================================================
    # NO MARKERS
    # =========================================================

    if not markers:

        raise ValueError(
            "No question/answer markers such as "
            "Q1, Ques 1, Question 1, Answer 1, "
            "or matching question text were detected "
            "in the student answer PDF."
        )

    # =========================================================
    # REMOVE DUPLICATE QUESTION NUMBERS
    # =========================================================

    unique_markers = {}

    for marker in markers:

        number = marker[
            "question_order"
        ]

        if number not in unique_markers:

            unique_markers[
                number
            ] = marker

        else:

            existing = unique_markers[
                number
            ]

            # Prefer explicit marker over fallback.
            if (
                marker.get("source")
                == "explicit_marker"
                and existing.get("source")
                != "explicit_marker"
            ):

                unique_markers[
                    number
                ] = marker

            elif (
                marker["position"]
                < existing["position"]
            ):

                unique_markers[
                    number
                ] = marker

    markers = list(
        unique_markers.values()
    )

    # =========================================================
    # SORT BY ACTUAL DOCUMENT POSITION
    # =========================================================

    markers.sort(
        key=lambda item: item["position"]
    )

    # =========================================================
    # EXTRACT ANSWERS
    # =========================================================

    answers = {}

    for index, marker in enumerate(
        markers
    ):

        question_number = (
            marker["question_order"]
        )

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

        # Preserve answer content but normalize whitespace.
        answer = re.sub(
            r"\s+",
            " ",
            answer,
        )

        answer = answer.strip(
            " :-"
        )

        if answer:

            answers[
                question_number
            ] = answer

    # =========================================================
    # FINAL VALIDATION
    # =========================================================

    expected_numbers = {
        int(
            question["question_order"]
        )
        for question in questions
    }

    detected_numbers = set(
        answers.keys()
    )

    missing_numbers = (
        expected_numbers
        - detected_numbers
    )

    if missing_numbers:

        print(
            "WARNING: Some questions were not "
            "detected from the student answer PDF:",
            sorted(missing_numbers),
        )

    print(
        "Detected question numbers:",
        sorted(detected_numbers),
    )

    print(
        "Question answer extraction completed."
    )

    return answers
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
            datetime.now(timezone.utc)
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

    Important:
    Database connections are NOT kept open during OCR or AI calls.
    """

    # =========================================================
    # PHASE 1: GET BASIC DATA AND MARK PROCESSING
    # =========================================================

    submission = (
        db.query(DescriptiveSubmission)
        .filter(
            DescriptiveSubmission.id == submission_id
        )
        .first()
    )

    if not submission:
        raise ValueError(
            "Descriptive submission not found."
        )

    assignment = submission.assignment

    if not assignment:
        raise ValueError(
            "Assignment not found."
        )

    if not assignment.question_pdf_url:
        raise ValueError(
            "Question PDF not found for this assignment."
        )

    if not submission.answer_pdf_url:
        raise ValueError(
            "Student answer PDF not found."
        )

    question_pdf_url = assignment.question_pdf_url
    answer_pdf_url = submission.answer_pdf_url
    assignment_id = assignment.id

    question_pdf_path = question_pdf_url.lstrip("/")
    answer_pdf_path = answer_pdf_url.lstrip("/")

    if not os.path.exists(question_pdf_path):
        raise FileNotFoundError(
            f"Question PDF file not found: {question_pdf_path}"
        )

    if not os.path.exists(answer_pdf_path):
        raise FileNotFoundError(
            f"Answer PDF file not found: {answer_pdf_path}"
        )

    submission.evaluation_status = "Processing"
    db.commit()

    # =========================================================
    # VERY IMPORTANT:
    # RELEASE DATABASE CONNECTION BEFORE OCR
    # =========================================================

    db.close()

    try:

        # =====================================================
        # PHASE 2: OCR
        # NO DATABASE CONNECTION HERE
        # =====================================================

        print(
            "\n=========================================="
        )
        print(
            "PDF EVALUATION - STARTING QUESTION OCR"
        )
        print(
            "=========================================="
        )

        question_text = extract_pdf_text(
            question_pdf_url
        )

        if not question_text:
            raise ValueError(
                "No readable text could be extracted "
                "from the question PDF."
            )

        print(
            "\n=========================================="
        )
        print(
            "PDF EVALUATION - STARTING ANSWER OCR"
        )
        print(
            "=========================================="
        )

        answer_text = extract_pdf_text(
            answer_pdf_url
        )

        if not answer_text:
            raise ValueError(
                "No readable text could be extracted "
                "from the answer PDF."
            )

        # =====================================================
        # PHASE 3: GET QUESTIONS USING FRESH DB SESSION
        # =====================================================

        db = SessionLocal()

        questions_db = (
            db.query(
                DescriptiveAssignmentQuestion
            )
            .filter(
                DescriptiveAssignmentQuestion.assignment_id
                == assignment_id
            )
            .order_by(
                DescriptiveAssignmentQuestion.question_order
            )
            .all()
        )

        if not questions_db:
            raise ValueError(
                "No questions found for this PDF assignment."
            )

        # Convert ORM objects into plain detached objects.
        # This allows AI evaluation without keeping DB connection open.
        questions = []

        for question in questions_db:
            questions.append(
                SimpleNamespace(
                    id=question.id,
                    question_order=question.question_order,
                    question_text=question.question_text,
                    max_marks=question.max_marks,
                    expected_answer=question.expected_answer,
                    evaluation_rubric=question.evaluation_rubric,
                )
            )

        db.close()

        # =====================================================
        # PHASE 4: EXTRACT STUDENT ANSWERS
        # NO DATABASE CONNECTION HERE
        # =====================================================

        question_data = [
            {
                "question_order": question.question_order,
                "question_text": question.question_text,
            }
            for question in questions
        ]

        extracted_answers = extract_question_answers(
            answer_text,
            question_data,
        )

        print(
            "\n========== PDF EVALUATION DEBUG =========="
        )

        print(
            "\nExtracted answer PDF text:"
        )
        print(answer_text)

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
        print(extracted_answers)

        print(
            "==========================================\n"
        )

        # =====================================================
        # PHASE 5: AI EVALUATION
        # NO DATABASE CONNECTION HERE
        # =====================================================

        total_marks = sum(
            int(question.max_marks or 0)
            for question in questions
        )

        if total_marks <= 0:
            raise ValueError(
                "Total marks for this assignment are zero."
            )

        evaluated_answers = []
        total_obtained_marks = 0.0

        for question in questions:

            question_number = question.question_order

            student_answer = extracted_answers.get(
                question_number,
                "",
            )

            if not student_answer.strip():

                evaluated_answers.append(
                    {
                        "question_id": question.id,
                        "answer_text": None,
                        "ai_marks": 0.0,
                        "ai_feedback": (
                            "No answer was detected for "
                            f"Question {question_number}."
                        ),
                    }
                )

                continue

            print(
                f"Evaluating Question "
                f"{question_number}..."
            )

            result = evaluate_descriptive_answer(
                question=question,
                student_answer=student_answer,
            )

            try:
                ai_marks = float(
                    result.get("marks", 0)
                )
            except (
                TypeError,
                ValueError,
            ):
                ai_marks = 0.0

            ai_marks = max(
                0.0,
                ai_marks,
            )

            ai_marks = min(
                ai_marks,
                float(question.max_marks),
            )

            ai_feedback = str(
                result.get(
                    "feedback",
                    "No feedback generated.",
                )
            ).strip()

            evaluated_answers.append(
                {
                    "question_id": question.id,
                    "answer_text": student_answer,
                    "ai_marks": ai_marks,
                    "ai_feedback": ai_feedback,
                }
            )

            total_obtained_marks += ai_marks

            print(
                f"Question {question_number}: "
                f"{ai_marks}/{question.max_marks}"
            )

        # =====================================================
        # PHASE 6: FRESH DB SESSION FOR SAVING RESULTS
        # =====================================================

        db = SessionLocal()

        submission = (
            db.query(DescriptiveSubmission)
            .filter(
                DescriptiveSubmission.id
                == submission_id
            )
            .first()
        )

        if not submission:
            raise ValueError(
                "Submission disappeared while evaluating."
            )

        # Delete any previous answers
        db.query(
            DescriptiveAnswer
        ).filter(
            DescriptiveAnswer.submission_id
            == submission.id
        ).delete(
            synchronize_session=False
        )

        # Save evaluated answers
        for evaluated in evaluated_answers:

            answer = DescriptiveAnswer(
                submission_id=submission.id,
                question_id=evaluated["question_id"],
                answer_text=evaluated["answer_text"],
                ai_marks=evaluated["ai_marks"],
                ai_feedback=evaluated["ai_feedback"],
                evaluation_status="Completed",
            )

            db.add(answer)

        submission.total_marks = total_marks

        submission.obtained_marks = round(
            total_obtained_marks,
            2,
        )

        submission.percentage = round(
            (
                submission.obtained_marks
                / total_marks
            )
            * 100,
            2,
        )

        submission.ai_feedback = (
            "The student's answer PDF was evaluated "
            "question-wise using AI based on correctness, "
            "relevance, conceptual understanding, "
            "completeness, accuracy, and the evaluation rubric."
        )

        submission.evaluation_status = "Completed"
        submission.status = "Evaluated"
        submission.evaluated_at = datetime.now(timezone.utc)

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

        # Always use a fresh session to mark failure.
        try:
            failed_db = SessionLocal()

            failed_submission = (
                failed_db.query(
                    DescriptiveSubmission
                )
                .filter(
                    DescriptiveSubmission.id
                    == submission_id
                )
                .first()
            )

            if failed_submission:
                failed_submission.evaluation_status = "Failed"
                failed_db.commit()

            failed_db.close()

        except Exception as failure_update_error:
            print(
                "Could not update failed evaluation status:",
                failure_update_error,
            )

        raise