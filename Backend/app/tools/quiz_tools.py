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


@tool
def generate_topic_quiz_v2(
    topic: str,
    question_count: int,
    difficulty: str,
    bloom_level: str,
):
    """
    Generate an AI-powered MCQ quiz for the Version 2 Teacher Portal.
    """

    prompt = f"""
Generate exactly {question_count} multiple-choice questions
about the topic "{topic}".

Difficulty Level:
{difficulty}

Bloom's Taxonomy Level:
{bloom_level}

For every question, provide:

- Question
- Four options
- Correct answer (A, B, C or D)
- Topic name
- Difficulty
- Bloom level
- Explanation

Return ONLY valid JSON.

Required format:

{{
    "title": "Quiz Title",
    "questions": [
        {{
            "question": "",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": "A",
            "topic": "{topic}",
            "difficulty": "{difficulty}",
            "bloom_level": "{bloom_level}",
            "explanation": ""
        }}
    ]
}}

Rules:

1. Generate exactly {question_count} questions.
2. Every question must be related to "{topic}".
3. Follow the requested difficulty level.
4. Follow the requested Bloom's Taxonomy level.
5. Each question must have exactly four options.
6. The answer must be only A, B, C, or D.
7. Make sure the correct answer actually matches one of the options.
8. Do not repeat questions.
9. Return JSON only.
10. Do NOT use markdown.
11. Do NOT wrap the JSON inside ```json.
12. Use double quotes for all JSON keys and string values.
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