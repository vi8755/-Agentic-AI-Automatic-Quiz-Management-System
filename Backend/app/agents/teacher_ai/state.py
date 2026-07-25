from typing import TypedDict


class TeacherAIState(TypedDict):
    pdf_text: str
    cleaned_text: str

    chunks: list[str]

    title: str
    question_count: int
    difficulty: str
    bloom_level: str
    time_limit: int
    status: str

    topics: list[str]
    clean_topics: list[str]

    quiz_plan: dict

    questions: list
    validated_questions: list

    quiz: dict