import re


def extract_topics(text: str) -> list[str]:
    """
    Extract headings/topics from lecture notes.
    """

    topics = []
    lines = text.split("\n")

    for line in lines:

        line = line.strip()

        if not line:
            continue

        # Skip very short lines
        if len(line) < 5:
            continue

        # Ignore page numbers
        if line.lower().startswith("page"):
            continue

        # Ignore lecture notes title
        if line.upper() in [
            "OPERATING SYSTEM",
            "LECTURE NOTES",
        ]:
            continue

        # Unit / Chapter / Module
        if re.match(
            r"^(Unit|Chapter|Module)\s+\d+",
            line,
            re.IGNORECASE,
        ):
            topics.append(line)
            continue

        # Lecture headings
        if re.match(
            r"^Lecture\s*#?\d+",
            line,
            re.IGNORECASE,
        ):
            topics.append(line)
            continue

        # Question-style headings
        if line.endswith("?"):
            topics.append(line)
            continue

        # ALL CAPS headings
        if (
            line.isupper()
            and len(line.split()) <= 6
            and len(line) > 6
        ):
            topics.append(line)

    # Remove duplicates
    unique_topics = []

    for topic in topics:
        if topic not in unique_topics:
            unique_topics.append(topic)

    return unique_topics