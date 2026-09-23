from typing import TypedDict


class EvaluationState(TypedDict, total=False):
    student_email: str
    student_name: str

    quiz_id: int
    quiz_title: str

    quiz_result: dict
    student_answers: dict

    score: int
    total_marks: int
    total_questions: int
    percentage: float

    wrong_answers: list
    weak_topics: list

    performance: str

    # =====================================================
    # AI Performance Analysis
    # =====================================================

    performance_summary: str

    strengths: list

    weak_areas: list

    improvement_plan: list

    recommendations: list

    # Keep existing feedback for backward compatibility
    feedback: str