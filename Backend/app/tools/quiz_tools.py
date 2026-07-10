import json

from json_repair import repair_json
from langchain_core.tools import tool
from ..llm import llm




@tool
def generate_quiz(
    topic: str,
    num_questions: int,
    difficulty: str,
):
    """
    Generate an AI-powered MCQ quiz.
    """

    prompt = f"""
Generate {num_questions} multiple-choice questions about "{topic}".

Difficulty Level:
{difficulty}

For each question include:
- Question
- Four options
- Correct answer (A, B, C or D)
- Topic name
- Difficulty (Easy, Medium, Hard)

Return ONLY valid JSON.

Format:

{{
    "title": "Quiz Title",
    "questions": [
        {{
            "question": "",
            "options": [
                "A) Option",
                "B) Option",
                "C) Option",
                "D) Option"
            ],
            "answer": "A",
            "topic": "",
            "difficulty": ""
        }}
    ]
}}

Rules:
- Return JSON only.
- Do NOT use markdown.
- Do NOT wrap the JSON inside ```json.
- Use double quotes for all keys and values.
"""

    response = llm.invoke(prompt)

    

    text = response.content.strip()

    # Remove markdown if the model returns it
    text = text.replace("```json", "")
    text = text.replace("```", "")

    try:
        repaired_json = repair_json(text)

        quiz = json.loads(repaired_json)

    except Exception:
         

        return {
            "title": "",
            "questions": []
        }

   

    return quiz


@tool
def evaluate_quiz(answer: str):
    """
    Placeholder tool for future quiz evaluation.
    """

    return "Evaluation will be added later."