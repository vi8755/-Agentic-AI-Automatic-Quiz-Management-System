import json
import re

from langchain_core.messages import HumanMessage

from .llm import llm
from .prompts import TOPIC_CLEANING_PROMPT


def extract_json(text: str):
    """
    Extracts a JSON array from an LLM response, even if it is wrapped
    inside Markdown code fences.
    """

    # Remove ```json and ``` fences
    text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)

    text = text.strip()

    return json.loads(text)


def clean_topics(raw_topics: list[str]) -> list[str]:
    if not raw_topics:
        return []

    prompt = TOPIC_CLEANING_PROMPT.format(
        topics="\n".join(f"- {topic}" for topic in raw_topics)
    )

    response = llm.invoke(
        [HumanMessage(content=prompt)]
    )

    try:
        cleaned_topics = extract_json(response.content)

        if isinstance(cleaned_topics, list):
            return cleaned_topics

    except Exception as e:
        print("Topic Cleaning Error:", e)

    return raw_topics