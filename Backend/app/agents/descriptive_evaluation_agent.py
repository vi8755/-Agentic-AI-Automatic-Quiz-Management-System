import json
import re
import os

from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq

from ..ai.llm import llm
from ..ai.prompts import DESCRIPTIVE_EVALUATION_PROMPT


def _extract_json(content: str):
    """
    Extract JSON safely from the LLM response.

    Handles responses such as:

    {
        "marks": 8,
        "feedback": "..."
    }

    and responses wrapped in ```json ... ```.
    """

    if not content:
        raise ValueError(
            "AI returned an empty response."
        )

    content = content.strip()

    # Remove markdown code fences if present
    content = re.sub(
        r"^```(?:json)?\s*",
        "",
        content,
        flags=re.IGNORECASE,
    )

    content = re.sub(
        r"\s*```$",
        "",
        content,
        flags=re.IGNORECASE,
    )

    try:

        return json.loads(content)

    except json.JSONDecodeError:

        # Try extracting the first JSON object
        match = re.search(
            r"\{.*\}",
            content,
            flags=re.DOTALL,
        )

        if not match:

            raise ValueError(
                "AI returned an invalid JSON response."
            )

        return json.loads(
            match.group(0)
        )


def evaluate_descriptive_answer(
    question,
    student_answer: str = "",
    drawing_data: str | None = None,
):
    """
    Evaluate one descriptive answer.

    Supports:

    - Text-only answers
    - Drawing-only answers
    - Text + drawing answers
    """

    # ============================================================
    # EXPECTED ANSWER
    # ============================================================

    expected_answer = (
        question.expected_answer
        if question.expected_answer
        else (
            "No expected answer was provided. "
            "Evaluate the student's answer based on "
            "the question and established university-level knowledge."
        )
    )

    # ============================================================
    # EVALUATION RUBRIC
    # ============================================================

    evaluation_rubric = (
        question.evaluation_rubric
        if question.evaluation_rubric
        else (
            "Evaluate based on correctness, relevance, "
            "conceptual understanding, completeness, "
            "accuracy, and use of suitable examples."
        )
    )

    # ============================================================
    # BUILD EVALUATION PROMPT
    # ============================================================

    prompt = DESCRIPTIVE_EVALUATION_PROMPT.format(
        question=question.question_text,
        max_marks=question.max_marks,
        expected_answer=expected_answer,
        evaluation_rubric=evaluation_rubric,
        student_answer=student_answer or "",
    )

    # ============================================================
    # DRAWING ANSWER
    # ============================================================

    if drawing_data:

        vision_llm = ChatGroq(
            model=os.getenv(
                "GROQ_VISION_MODEL",
                 "qwen/qwen3.8-27b"
            ),
            temperature=0,
            api_key=os.getenv(
                "GROQ_API_KEY"
            ),
        )

        # --------------------------------------------------------
        # Send question + rubric + text answer + drawing
        # --------------------------------------------------------

        message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": prompt,
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": drawing_data,
                    },
                },
            ]
        )

        response = vision_llm.invoke(
            [message]
        )

    # ============================================================
    # TEXT-ONLY ANSWER
    # ============================================================

    else:

        response = llm.invoke(
            prompt
        )

    # ============================================================
    # PARSE AI RESPONSE
    # ============================================================

    result = _extract_json(
        response.content
    )

    # ============================================================
    # EXTRACT MARKS
    # ============================================================

    try:

        marks = float(
            result.get(
                "marks",
                0,
            )
        )

    except (
        TypeError,
        ValueError,
    ):

        marks = 0.0

    # ============================================================
    # PROTECT MARKS
    # ============================================================

    marks = max(
        0.0,
        marks,
    )

    marks = min(
        marks,
        float(question.max_marks),
    )

    # ============================================================
    # EXTRACT FEEDBACK
    # ============================================================

    feedback = str(
        result.get(
            "feedback",
            "No feedback was generated.",
        )
    ).strip()

    # ============================================================
    # RETURN RESULT
    # ============================================================

    return {
        "marks": marks,
        "feedback": feedback,
    }