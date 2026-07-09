from typing import TypedDict


class EvaluationState(TypedDict):
    student_email: str
    student_name: str

    quiz_id: int
    quiz_title: str

    quiz_result: dict
    student_answers: dict

    score: int
    total_questions: int
    percentage: float

    wrong_answers: list
    weak_topics: list

    performance: str
    feedback: str