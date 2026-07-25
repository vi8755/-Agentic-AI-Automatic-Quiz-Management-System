from typing import TypedDict


class RegenerateQuestionState(TypedDict):
    question: dict

    regenerated_question: dict

    validated_question: dict
    quiz_title: str
    existing_questions: str