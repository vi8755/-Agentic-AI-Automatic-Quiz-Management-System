import fitz
from fastapi import UploadFile
import re
from ..agents.teacher_ai.graph import (
    teacher_ai_graph,
)
import json
from ..ai.llm import llm
from ..utils.topic_extractor import extract_topics
from ..ai.topic_cleaner import clean_topics
def extract_pdf_text(
    file: UploadFile,
    selected_topics: list[str],
    question_count: int,
    difficulty: str,
    bloom_level: str,
    time_limit: int,
):

    pdf_bytes = file.file.read()

    pdf = fitz.open(
        stream=pdf_bytes,
        filetype="pdf",
    )

    extracted_text = ""

    for page in pdf:
        extracted_text += page.get_text()

    page_count = len(pdf)

    pdf.close()

    result = teacher_ai_graph.invoke(
        { 
            "pdf_text": extracted_text,
        "cleaned_text": "",
        "chunks": [],

        "title": "",
        "question_count": question_count,
        "difficulty": difficulty,
        "bloom_level": bloom_level,
        "time_limit": time_limit,

        "status": "Draft",

        "topics": [],
        "clean_topics": [],
        "selected_topics": selected_topics,

        "quiz_plan": {},

        "questions": [],
        "validated_questions": [],
        "quiz": {},
        }
    )
    print("\n========== RETURN TYPES ==========")

    print("result:", type(result))
    print("quiz:", type(result["quiz"]))
    print("questions:", type(result["questions"]))
    print("validated_questions:", type(result["validated_questions"]))

    print("\n========== FINAL QUIZ ==========")
    print(result["quiz"])
    print("================================\n")

    return {
    "message": "PDF processed successfully",
    "pages": page_count,
    "characters": len(result["cleaned_text"]),
    "chunks": len(result["chunks"]),
    "topics": result["topics"],
    "clean_topics": result["clean_topics"],
    "quiz_plan": result["quiz_plan"],
    "questions": result["questions"],
    "validated_questions": result["validated_questions"],
    "quiz": result["quiz"],
    }
def clean_text(text: str):

    text = re.sub(r"\n+", "\n", text)

    text = re.sub(r"[ \t]+", " ", text)

    text = text.strip()

    return text

def analyze_pdf(file: UploadFile):
    pdf_bytes = file.file.read()

    pdf = fitz.open(
        stream=pdf_bytes,
        filetype="pdf",
    )

    extracted_text = ""

    for page in pdf:
        extracted_text += page.get_text()

    page_count = len(pdf)

    pdf.close()

    cleaned = clean_text(extracted_text)

    topics = extract_topics(cleaned)

    cleaned_topics = clean_topics(topics)

    return {
        "message": "PDF analyzed successfully",
        "pages": page_count,
        "characters": len(cleaned),
        "topics": topics,
        "clean_topics": cleaned_topics,
    }


# ============================================================
# GENERIC QUESTION BANK PDF PARSER
# ============================================================

def _clean_pdf_line(line: str) -> str:
    """Normalize one PDF line without changing its meaning."""
    line = (line or "").replace("\u00a0", " ")
    line = re.sub(r"[ \t]+", " ", line)
    return line.strip()


def _is_answer_section_heading(line: str) -> bool:
    """Detect common answer-key headings."""
    text = re.sub(r"\s+", " ", (line or "").strip().lower())

    if not text:
        return False

    patterns = [
        r"^answers?$",
        r"^answers?\s*[-:–—].*$",
        r"^answer\s+key$",
        r"^answer\s+keys?$",
        r"^answer\s+key\s*[-:–—].*$",
        r"^solutions?$",
        r"^solution\s+key$",
        r"^solution\s+key\s*[-:–—].*$",
        r"^correct\s+answers?$",
        r"^answer\s+section$",
        r"^answer\s+sheet$",
    ]

    return any(
        re.match(pattern, text, re.IGNORECASE)
        for pattern in patterns
    )


def _is_non_topic_heading(line: str) -> bool:
    """Headings that must never become quiz topics."""
    text = re.sub(r"\s+", " ", (line or "").strip()).lower()

    excluded = {
        "answer",
        "answers",
        "answer key",
        "answer keys",
        "solutions",
        "solution key",
        "explanation",
        "explanations",
        "notes",
        "important notes",
        "references",
        "contents",
        "table of contents",
        "index",
        "bibliography",
        "appendix",
        "practice questions",
        "practice question",
        "questions",
        "question",
        "exercise",
        "exercises",
        "mixed review",
        "mixed review section",
    }

    if text in excluded:
        return True

    return bool(
        re.match(
            r"^(answer|answers|solution|solutions|"
            r"explanation|explanations)(\s+key|\s+section)?$",
            text,
            re.IGNORECASE,
        )
    )


def _looks_like_question_text(text: str) -> bool:
    """Return True when text looks like a normal question."""
    lowered = (text or "").strip().lower()

    if not lowered:
        return False

    question_words = (
        "which ",
        "what ",
        "who ",
        "where ",
        "when ",
        "why ",
        "how ",
        "find ",
        "calculate ",
        "select ",
        "choose ",
        "identify ",
        "determine ",
        "is ",
        "are ",
        "was ",
        "were ",
        "following",
    )

    return "?" in text or any(
        lowered.startswith(word)
        for word in question_words
    )


def _is_question_bank_topic_heading(line: str):
    """
    Return (True, topic_name) for likely topic headings.

    No topic names are hardcoded.
    """
    text = re.sub(r"\s+", " ", (line or "").strip())

    if len(text) < 3 or len(text) > 120:
        return False, None

    if _is_non_topic_heading(text):
        return False, None

    # Unit 1 - Computer Fundamentals
    # Chapter 2: Operating Systems
    # Section A - Mathematics
    # 21.NON-VERBAL REASONING
    structural_pattern = re.compile(
        r"^(?:unit|chapter|section|part|module|topic|lesson|"
        r"set|paper|test)"
        r"\s*(?:[A-Za-z]|\d+|[IVXLC]+)?"
        r"\s*(?:[-:.)–—]\s*|\s+)"
        r"(.+)$",
        re.IGNORECASE,
    )

    match = structural_pattern.match(text)
    if match:
        topic_name = match.group(1).strip()
        if topic_name and not _looks_like_question_text(topic_name):
            return True, topic_name

    numbered_heading = re.match(
        r"^\s*\d{1,3}\s*[\.\):\-]\s*(.+)$",
        text,
        re.IGNORECASE,
    )

    if numbered_heading:
        topic_name = numbered_heading.group(1).strip()

        if _looks_like_question_text(topic_name):
            return False, None

        letters = re.sub(r"[^A-Za-z]+", "", topic_name)

        if letters:
            uppercase_ratio = (
                sum(1 for char in letters if char.isupper())
                / len(letters)
            )

            if uppercase_ratio >= 0.70:
                return True, topic_name

    # Standalone uppercase headings.
    letters = re.sub(r"[^A-Za-z]+", "", text)

    if letters:
        uppercase_ratio = (
            sum(1 for char in letters if char.isupper())
            / len(letters)
        )

        if (
            uppercase_ratio >= 0.85
            and 3 <= len(letters) <= 80
            and not _looks_like_question_text(text)
        ):
            return True, text

    return False, None


def _normalize_topic_name(line: str) -> str:
    """Remove structural numbering from a topic heading."""
    text = re.sub(r"\s+", " ", (line or "").strip())

    patterns = [
        r"^(?:unit|chapter|section|part|module|topic|lesson|set|paper|test)"
        r"\s*(?:[A-Za-z]|\d+|[IVXLC]+)?"
        r"\s*[-:.)–—]\s*(.+)$",
        r"^\d{1,3}\s*[\.\):\-]\s*(.+)$",
    ]

    for pattern in patterns:
        match = re.match(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return text


# ============================================================
# QUESTION NUMBER DETECTION
# ============================================================

def _match_question_start(line: str):
    """
    Supports:
        1. Question
        1) Question
        1: Question
        1- Question
        1.Question
        Q1. Question
        Q.1 Question
        Question 1: Question
    """
    patterns = [
        r"^\s*question\s*(?:no\.?\s*)?(\d{1,4})\s*[\.\):\-]\s*(.+)$",
        r"^\s*q\s*\.?\s*(\d{1,4})\s*[\.\):\-]\s*(.+)$",
        r"^\s*(\d{1,4})\s*[\.\):\-]\s*(.+)$",
    ]

    for pattern in patterns:
        match = re.match(pattern, line or "", re.IGNORECASE)
        if match:
            return {
                "number": int(match.group(1)),
                "text": match.group(2).strip(),
            }

    return None


# ============================================================
# OPTION EXTRACTION
# ============================================================

_OPTION_MARKER_RE = re.compile(
    r"(\([A-Da-d]\)|[A-Da-d][\.\):])\s*"
)


def _extract_options_from_text(text: str):
    """
    Extract exactly four A/B/C/D options.

    Supports:
        A. CPU B. RAM C. ROM D. SSD
        A) CPU B) RAM C) ROM D) SSD
        (a) CPU (b) RAM (c) ROM (d) SSD
        Round RobinC. SJF
    """
    text = re.sub(r"\s+", " ", text or "").strip()

    matches = list(_OPTION_MARKER_RE.finditer(text))

    if len(matches) < 4:
        return None

    for start_index in range(len(matches) - 3):
        candidate = matches[start_index:start_index + 4]

        labels = []

        for match in candidate:
            marker = match.group(1)
            label_match = re.search(r"[A-Da-d]", marker)

            if not label_match:
                labels = []
                break

            labels.append(label_match.group(0).upper())

        if labels != ["A", "B", "C", "D"]:
            continue

        options = []

        for index, match in enumerate(candidate):
            content_start = match.end()

            if index < 3:
                content_end = candidate[index + 1].start()
            else:
                content_end = len(text)

            option_text = text[content_start:content_end].strip()
            option_text = re.sub(r"\s+", " ", option_text).strip()

            if not option_text:
                options = []
                break

            options.append(option_text)

        if len(options) == 4:
            return options

    return None


# Backward-compatible alias in case another part of the file uses it.
_extract_question_options = _extract_options_from_text


# ============================================================
# ANSWER KEY EXTRACTION
# ============================================================

def _extract_answer_pairs(line: str):
    """
    Extract answer mappings from common formats.

    Examples:
        1 - B
        1-B
        1. B
        1) B
        1.b
        Q1 - B
        Q2: C
        (1) B
        1-B 2-C 3-A
    """
    line = line or ""

    patterns = [
        re.compile(
            r"\(\s*(\d{1,4})\s*\)"
            r"\s*[-.:)]?\s*"
            r"\(?([A-Ea-e])\)?"
        ),
        re.compile(
            r"\bQ(?:uestion)?\s*(\d{1,4})"
            r"\s*[-.:)]\s*\(?([A-Ea-e])\)?",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?<!\d)(\d{1,4})\s*[-.:)]\s*\(?([A-Ea-e])\)?"
        ),
    ]

    pairs = []

    for pattern in patterns:
        for match in pattern.finditer(line):
            number = int(match.group(1))
            answer = match.group(2).upper()

            if answer in {"A", "B", "C", "D"}:
                pairs.append((number, answer))

    result = []
    seen = set()

    for pair in pairs:
        if pair in seen:
            continue
        seen.add(pair)
        result.append(pair)

    return result


# ============================================================
# GENERIC QUESTION BANK PARSER
# ============================================================

def _parse_question_bank_pdf(file: UploadFile):
    """
    Parse a Question Bank PDF locally.

    Pipeline:
        PDF
        -> extract text
        -> detect topics
        -> detect questions
        -> detect options
        -> detect answer keys
        -> match answers
        -> validate
        -> build topic statistics

    No LLM.
    No Groq.
    No hardcoded topic names.
    """

    pdf_bytes = file.file.read()

    if not pdf_bytes:
        raise ValueError("Question bank PDF is empty.")

    pdf = fitz.open(
        stream=pdf_bytes,
        filetype="pdf",
    )

    try:
        total_pages = len(pdf)

        if total_pages == 0:
            raise ValueError(
                "Question bank PDF contains no pages."
            )

        # =====================================================
        # 1. EXTRACT ALL PDF LINES
        # =====================================================

        pages = []

        for page_number, page in enumerate(pdf, start=1):
            raw_text = page.get_text("text") or ""

            lines = []

            for raw_line in raw_text.splitlines():
                line = _clean_pdf_line(raw_line)

                if line:
                    lines.append(line)

            pages.append({
                "page": page_number,
                "lines": lines,
            })

    finally:
        pdf.close()

    # =========================================================
    # 2. GLOBAL STORAGE
    # =========================================================

    all_questions = []

    global_answers = {}

    topic_answers = {}

    topics = {}

    current_topic = None

    in_answer_section = False

    current_answer_topic = None

    current_question = None

    # =========================================================
    # 3. TOPIC HELPERS
    # =========================================================

    def get_or_create_topic(topic_name, page_number):
        nonlocal current_topic

        topic_name = re.sub(
            r"\s+",
            " ",
            (topic_name or "").strip(),
        )

        if not topic_name:
            return None

        key = topic_name.lower()

        if key not in topics:
            topics[key] = {
                "name": topic_name,
                "start_page": page_number,
                "end_page": page_number,
                "question_count": 0,
            }
        else:
            topics[key]["end_page"] = max(
                topics[key]["end_page"],
                page_number,
            )

        current_topic = topics[key]

        return current_topic

    def find_existing_topic(line):
        """
        Match an answer-key topic against topics already discovered.
        Exact normalized matching is preferred.
        """
        candidate = _normalize_topic_name(line).strip().lower()

        if not candidate:
            return None

        if candidate in topics:
            return topics[candidate]

        for key, topic in topics.items():
            if key == candidate:
                return topic

        return None

    # =========================================================
    # 4. SAVE CURRENT QUESTION
    # =========================================================

    def save_current_question():
        nonlocal current_question

        if not current_question:
            return

        combined_text = (
            current_question.get("question", "")
            + " "
            + " ".join(
                current_question.get(
                    "raw_option_lines",
                    [],
                )
            )
        )

        combined_text = re.sub(
            r"\s+",
            " ",
            combined_text,
        ).strip()

        options = _extract_options_from_text(
            combined_text
        )

        # A valid source MCQ must have exactly four options.
        if not options or len(options) != 4:
            current_question = None
            return

        current_question["options"] = options

        first_option = _OPTION_MARKER_RE.search(
            combined_text
        )

        if first_option:
            question_text = (
                combined_text[:first_option.start()]
                .strip()
            )
        else:
            question_text = (
                current_question.get(
                    "question",
                    "",
                ).strip()
            )

        question_text = re.sub(
            r"\s+",
            " ",
            question_text,
        ).strip()

        question_text = re.sub(
            r"^\s*(?:Q(?:uestion)?\s*)?"
            r"\d{1,4}\s*[\.\):\-]\s*",
            "",
            question_text,
            count=1,
            flags=re.IGNORECASE,
        ).strip()

        if not question_text:
            current_question = None
            return

        current_question["question"] = question_text

        all_questions.append(current_question)

        current_question = None

    # =========================================================
    # 5. PROCESS PDF
    # =========================================================

    for page_data in pages:
        page_number = page_data["page"]

        for line in page_data["lines"]:

            # -------------------------------------------------
            # ANSWER SECTION
            # -------------------------------------------------

            if _is_answer_section_heading(line):
                save_current_question()

                in_answer_section = True
                current_answer_topic = None

                continue

            # -------------------------------------------------
            # ANSWER KEY CONTENT
            # -------------------------------------------------

            if in_answer_section:

                pairs = _extract_answer_pairs(line)

                if pairs:
                    topic_key = (
                        current_answer_topic["name"].lower()
                        if current_answer_topic
                        else None
                    )

                    for number, answer in pairs:
                        if topic_key:
                            topic_answers[
                                (topic_key, number)
                            ] = answer
                        else:
                            global_answers[number] = answer

                    continue

                # A topic heading inside the answer section can
                # identify which numbered answer list follows it.
                existing_topic = find_existing_topic(line)

                if existing_topic:
                    current_answer_topic = existing_topic
                    continue

                # Also support numbered/uppercase topic headings
                # inside the answer section.
                is_heading, topic_name = (
                    _is_question_bank_topic_heading(line)
                )

                if is_heading:
                    existing_topic = find_existing_topic(
                        topic_name
                    )

                    if existing_topic:
                        current_answer_topic = existing_topic

                # Ignore all other answer-section text.
                continue

            # -------------------------------------------------
            # TOPIC / SECTION
            # -------------------------------------------------

            is_heading, topic_name = (
                _is_question_bank_topic_heading(line)
            )

            if is_heading:
                save_current_question()

                normalized_name = _normalize_topic_name(
                    topic_name
                )

                current_topic = get_or_create_topic(
                    normalized_name,
                    page_number,
                )

                continue

            # -------------------------------------------------
            # QUESTION START
            # -------------------------------------------------

            question_info = _match_question_start(line)

            if question_info:
                save_current_question()

                current_question = {
                    "question_number": question_info["number"],
                    "page": page_number,
                    "topic": (
                        current_topic["name"]
                        if current_topic
                        else "General"
                    ),
                    "question": question_info["text"],
                    "raw_option_lines": [],
                    "options": [],
                    "correct_answer": None,
                }

                continue

            # -------------------------------------------------
            # QUESTION CONTINUATION / OPTIONS
            # -------------------------------------------------

            if current_question:
                current_question[
                    "raw_option_lines"
                ].append(line)

    # Save final candidate.
    save_current_question()

    # =========================================================
    # 6. MATCH ANSWERS TO QUESTIONS
    # =========================================================

    valid_questions = []

    for question in all_questions:
        topic_name = (
            question.get("topic") or "General"
        )

        topic_key = topic_name.strip().lower()

        number = question.get("question_number")

        answer = topic_answers.get(
            (topic_key, number)
        )

        if not answer:
            answer = global_answers.get(number)

        # Keep only questions with a verified answer.
        if answer not in {"A", "B", "C", "D"}:
            continue

        question["correct_answer"] = answer

        valid_questions.append(question)

    # =========================================================
    # 7. BUILD TOPIC STATISTICS
    # =========================================================

    topic_list = []

    for topic in topics.values():
        count = sum(
            1
            for question in valid_questions
            if question.get("topic", "").strip().lower()
            == topic["name"].strip().lower()
        )

        if count == 0:
            continue

        topic["question_count"] = count

        topic_list.append(topic)

    # Preserve PDF discovery order.
    topic_list.sort(
        key=lambda item: (
            item["start_page"],
            item["name"].lower(),
        )
    )

    return {
        "pages": total_pages,
        "topics": topic_list,
        "total_topics": len(topic_list),
        "total_questions": len(valid_questions),
        "questions": valid_questions,
    }


# ============================================================
# QUESTION BANK ANALYZE API SERVICE
# ============================================================

def analyze_question_bank_pdf(
    file: UploadFile,
):
    """
    Analyze a question-bank PDF locally.

    IMPORTANT:
    This does NOT use Groq or any LLM.
    """

    result = _parse_question_bank_pdf(file)

    print(
        "\n========== QUESTION BANK LOCAL ANALYSIS =========="
    )

    print("Pages:", result["pages"])
    print("Topics:", result["total_topics"])
    print("Questions:", result["total_questions"])

    for topic in result["topics"]:
        print(
            f"  {topic['name']} "
            f"({topic['question_count']} questions)"
        )

    print(
        "=================================================\n"
    )

    return {
        "message": "Question bank analyzed successfully",
        "pages": result["pages"],
        "topics": result["topics"],
        "total_topics": result["total_topics"],
        "total_questions": result["total_questions"],
    }


# ============================================================
# QUESTION BANK -> QUIZ GENERATION
# ============================================================

def generate_quiz_from_question_bank(
    file: UploadFile,
    selected_topics: list[str],
    question_count: int,
    difficulty: str,
    bloom_level: str,
    time_limit: int,
):
    """
    Generate a quiz using ONLY actual questions extracted
    from the uploaded question bank.

    No LLM-generated questions.
    """

    result = _parse_question_bank_pdf(file)

    selected_topic_keys = {
        topic.strip().lower()
        for topic in selected_topics
        if topic and topic.strip()
    }

    available_questions = [
        question
        for question in result["questions"]
        if question["topic"].strip().lower()
        in selected_topic_keys
    ]

    if not available_questions:
        raise ValueError(
            "No valid questions were found "
            "for the selected topics."
        )

    if question_count <= 0:
        raise ValueError(
            "Question count must be greater than zero."
        )

    if question_count > len(available_questions):
        raise ValueError(
            f"Only {len(available_questions)} valid questions "
            f"are available for the selected topic(s), "
            f"but {question_count} were requested."
        )

    # Select actual source questions.
    selected_questions = available_questions[:question_count]

    quiz_questions = []

    for index, source_question in enumerate(
        selected_questions,
        start=1,
    ):
        quiz_questions.append({
            "question": source_question["question"],
            "options": source_question["options"],
            "correct_answer": source_question["correct_answer"],
            "explanation": None,
            "source_topic": source_question["topic"],
            "source_question_number": source_question[
                "question_number"
            ],
            "source_page": source_question["page"],
            "difficulty": difficulty,
            "bloom_level": bloom_level,
            "question_order": index,
        })

    return {
        "message": "Quiz generated from question bank",
        "title": "Question Bank Quiz",
        "status": "Draft",
        "question_count": len(quiz_questions),
        "time_limit": time_limit,
        "questions": quiz_questions,
    }

