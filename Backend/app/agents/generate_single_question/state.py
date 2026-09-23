from typing import TypedDict

class GenerateQuestionState(TypedDict):
    topic: str
    difficulty: str

    generated_question: dict
    validated_question: dict