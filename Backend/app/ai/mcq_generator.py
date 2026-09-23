import json
import re

from langchain_core.messages import HumanMessage

from .llm import llm
from .prompts import (
    MCQ_GENERATOR_PROMPT,
    REGENERATE_MCQ_PROMPT,
    GENERATE_SINGLE_MCQ_PROMPT,
)

 


def extract_json(text: str):
    """
    Extract either a JSON object or a JSON array from an LLM response.
    """

    text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)
    text = text.strip()

    # JSON object
    obj_start = text.find("{")
    obj_end = text.rfind("}")

    # JSON array
    arr_start = text.find("[")
    arr_end = text.rfind("]")

    # If object exists and appears before array,
    # parse the object.
    if obj_start != -1 and obj_end != -1 and (
        arr_start == -1 or obj_start < arr_start
    ):
        return json.loads(text[obj_start:obj_end + 1])

    # Otherwise parse the array.
    if arr_start != -1 and arr_end != -1:
        return json.loads(text[arr_start:arr_end + 1])

    raise ValueError("No valid JSON found.")


def generate_mcqs(
    section: str,
    topics: list[str],
    question_count: int,
    difficulty: str,
    bloom_level: str,
):
    """
    Generates MCQs for a single quiz section.
    """

    prompt = MCQ_GENERATOR_PROMPT.format(
        section=section,
        topics="\n".join(f"- {topic}" for topic in topics),
        question_count=question_count,
        difficulty=difficulty,
        bloom_level=bloom_level,
    )

    response = llm.invoke(
        [HumanMessage(content=prompt)]
    )

    try:
        return extract_json(response.content)

    except Exception as e:
        print("\n========== RAW MCQ RESPONSE ==========\n")
        print(response.content)
        print("\n======================================\n")
        print(e)

        raise

def regenerate_mcq(
    question: dict,
    quiz_title: str,
    existing_questions: str,
):
    """
    Regenerates a single MCQ while keeping
    the same concept and difficulty.
    """

    prompt = REGENERATE_MCQ_PROMPT.format(
    quiz_title=quiz_title,
    existing_questions=existing_questions,

    question=question["question_text"],
    option_a=question["option_a"],
    option_b=question["option_b"],
    option_c=question["option_c"],
    option_d=question["option_d"],
    correct_answer=question["correct_answer"],
    explanation=question.get("explanation", ""),
)

    response = llm.invoke(
        [HumanMessage(content=prompt)]

    )
    print("\n========== RAW LLM RESPONSE ==========\n")
    print(response.content)
    print("\n======================================\n")

    try:
        result = extract_json(response.content)
        print("\n========== AFTER extract_json ==========")
        print(type(result))
        print(result)
        print("========================================\n")

        # If AI returns a list, use the first question.
        if isinstance(result, list):
            return result[0]

        return result

    except Exception as e:

        print("\n========== RAW REGENERATE RESPONSE ==========\n")
        print(response.content)
        print("\n============================================\n")

        print(e)
        raise

def generate_single_mcq(
    topic: str,
    difficulty: str,
    existing_questions: str,
):
    """
    Generates a single MCQ.
    """

    prompt = GENERATE_SINGLE_MCQ_PROMPT.format(
        topic=topic,
        difficulty=difficulty,
        existing_questions=existing_questions,
    )

    response = llm.invoke(
        [HumanMessage(content=prompt)]
    )

    print("\n========== RAW SINGLE MCQ ==========\n")
    print(response.content)
    print("\n====================================\n")

    try:
        result = extract_json(response.content)

        if isinstance(result, list):
            return result[0]

        return result

    except Exception as e:
        print("\n========== RAW SINGLE MCQ ==========\n")
        print(response.content)
        print("\n====================================\n")

        print(e)
        raise