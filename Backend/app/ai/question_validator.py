VALID_DIFFICULTIES = {
    "Easy",
    "Medium",
    "Hard",
}

VALID_BLOOM_LEVELS = {
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
}


def validate_questions(questions: list[dict]):
    """
    Used when generating a brand-new AI quiz.
    """
    validated = []

    for q in questions:

        if not q.get("question"):
            continue

        options = q.get("options", [])

        if len(options) != 4:
            continue

        if any(not str(option).strip() for option in options):
            continue

        answer = q.get("correct_answer")

        if answer not in options:
            continue

        if not q.get("explanation"):
            continue

        if not q.get("topic"):
            continue

        if q.get("difficulty") not in VALID_DIFFICULTIES:
            continue

        if q.get("bloom_level") not in VALID_BLOOM_LEVELS:
            continue

        validated.append(q)

    return validated


def validate_regenerated_question(question: dict):
    """
    Used when regenerating a single existing question.
    """

    if not question.get("question"):
        raise ValueError("Question text is missing.")

    options = question.get("options", [])

    if len(options) != 4:
        raise ValueError("Question must contain exactly 4 options.")

    if any(not str(option).strip() for option in options):
        raise ValueError("Options cannot be empty.")

    if question.get("correct_answer") not in options:
        raise ValueError("Correct answer must match one of the options.")

    if not question.get("explanation"):
        raise ValueError("Explanation is missing.")

    return question

def validate_generated_question(question: dict):
    """
    Used when generating a single new AI question.
    """

    if not question.get("question"):
        raise ValueError("Question text is missing.")

    options = question.get("options", [])

    if len(options) != 4:
        raise ValueError("Question must contain exactly 4 options.")

    if any(not str(option).strip() for option in options):
        raise ValueError("Options cannot be empty.")

    answer = question.get("correct_answer")

    if answer not in ["A", "B", "C", "D"]:
        raise ValueError(
            "Correct answer must be A, B, C, or D."
        )

    if not question.get("explanation"):
        raise ValueError("Explanation is missing.")

    return question