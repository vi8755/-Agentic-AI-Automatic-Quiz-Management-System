import json
import re

from langchain_core.messages import HumanMessage

from .llm import llm
from .prompts import MCQ_GENERATOR_PROMPT

def extract_json(text: str):
    """
    Extract JSON from an LLM response.
    Handles markdown code blocks and extra text.
    """

    # Remove markdown fences
    text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)

    text = text.strip()

    # Find the JSON array
    start = text.find("[")
    end = text.rfind("]")

    if start != -1 and end != -1:
        text = text[start:end + 1]

    return json.loads(text)


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