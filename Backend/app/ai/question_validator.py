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


def validate_questions(
    questions: list[dict],
):
    validated = []

    for q in questions:

        # Question
        if not q.get("question"):
            continue

        # Options
        options = q.get("options", [])

        if len(options) != 4:
            continue

        if any(not str(option).strip() for option in options):
            continue

        # Correct Answer
        answer = q.get("correct_answer")

        if answer not in options:
            continue

        # Explanation
        if not q.get("explanation"):
            continue

        # Topic
        if not q.get("topic"):
            continue

        # Difficulty
        if q.get("difficulty") not in VALID_DIFFICULTIES:
            continue

        # Bloom
        if q.get("bloom_level") not in VALID_BLOOM_LEVELS:
            continue

        validated.append(q)

    return validated