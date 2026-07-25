import json
import re

from langchain_core.messages import HumanMessage

from .llm import llm
from .prompts import QUIZ_PLANNER_PROMPT


def extract_json(text: str):
    text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)

    return json.loads(text.strip())


def create_quiz_plan(
    topics: list[str],
    question_count: int,
    difficulty: str,
    bloom_level: str,
):
    prompt = QUIZ_PLANNER_PROMPT.format(
        topics="\n".join(f"- {topic}" for topic in topics),
        question_count=question_count,
        difficulty=difficulty,
        bloom_level=bloom_level,
    )

    response = llm.invoke(
        [HumanMessage(content=prompt)]
    )

    return extract_json(response.content)