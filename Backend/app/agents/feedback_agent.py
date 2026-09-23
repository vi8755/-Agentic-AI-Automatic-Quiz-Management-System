import json

from ..llm import llm


def feedback_agent(state):

    score = state.get("score", 0)
    total_marks = state.get("total_marks", 0)
    total_questions = state.get("total_questions", 0)

    percentage = state.get("percentage", 0)
    performance = state.get("performance", "")

    weak_topics = state.get(
        "weak_topics",
        []
    )

    wrong_answers = state.get(
        "wrong_answers",
        []
    )

    # =====================================================
    # AI Prompt
    # =====================================================

    prompt = f"""
You are an AI learning assistant inside an online quiz management system.

Analyze the student's quiz performance and generate personalized learning feedback.

### Student Performance

Score: {score}/{total_marks}

Total Questions: {total_questions}

Percentage: {percentage}%

Performance: {performance}

Weak Topics:
{weak_topics}

Wrong Answers:
{wrong_answers}


### Required Analysis

Generate:

1. Performance Summary
   - Explain the student's overall performance.
   - Base it on the actual score, percentage and mistakes.

2. Strengths
   - Identify what the student performed well.
   - Do not invent strengths that are not supported by the result.

3. Weak Areas
   For every important weak topic provide:
   - topic
   - mistake_pattern
   - why_it_matters

4. Improvement Plan
   - Give practical and specific steps.
   - Base the plan on the student's actual mistakes.

5. Recommended Learning
   - Recommend useful learning resources or study areas.
   - Explain what to focus on and how to use the resource.

### Important Rules

- Do not invent information.
- Base the analysis on the actual wrong answers and weak topics.
- Avoid generic motivational statements.
- Keep the advice encouraging and constructive.
- If there are no clear strengths, say so honestly.
- If there are no weak topics, return an empty weak_areas list.
- Return ONLY valid JSON.
- Do NOT use Markdown.
- Do NOT use ```json.
- Do NOT add any text before or after the JSON.

### Required JSON Structure

{{
    "performance_summary": "string",

    "strengths": [
        "string",
        "string"
    ],

    "weak_areas": [
        {{
            "topic": "string",
            "mistake_pattern": "string",
            "why_it_matters": "string"
        }}
    ],

    "improvement_plan": [
        "string",
        "string"
    ],

    "recommendations": [
        {{
            "resource": "string",
            "focus": "string",
            "how_to_use": "string"
        }}
    ]
}}
"""

    # =====================================================
    # Call LLM
    # =====================================================

    try:

        response = llm.invoke(prompt)

        raw_content = (
            response.content.strip()
            if response and response.content
            else ""
        )

        if not raw_content:
            raise ValueError(
                "LLM returned empty feedback."
            )

        # =================================================
        # Clean accidental Markdown code fences
        # =================================================

        if raw_content.startswith("```"):

            raw_content = (
                raw_content
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

        # =================================================
        # Parse JSON
        # =================================================

        analysis = json.loads(
            raw_content
        )

        # =================================================
        # Extract Structured Fields
        # =================================================

        performance_summary = (
            analysis.get(
                "performance_summary",
                ""
            )
        )

        strengths = analysis.get(
            "strengths",
            []
        )

        weak_areas = analysis.get(
            "weak_areas",
            []
        )

        improvement_plan = analysis.get(
            "improvement_plan",
            []
        )

        recommendations = analysis.get(
            "recommendations",
            []
        )

        # =================================================
        # Store in State
        # =================================================

        state["performance_summary"] = (
            performance_summary
        )

        state["strengths"] = (
            strengths
        )

        state["weak_areas"] = (
            weak_areas
        )

        state["improvement_plan"] = (
            improvement_plan
        )

        state["recommendations"] = (
            recommendations
        )

        # =================================================
        # Keep feedback for backward compatibility
        #
        # Other existing code may still use state["feedback"]
        # =================================================

        state["feedback"] = (
            performance_summary
        )

        return state

    except Exception as e:

        print(
            "❌ Feedback Agent Error:",
            str(e)
        )

        # =================================================
        # Safe fallback
        # =================================================

        state["performance_summary"] = (
            f"You scored {score} out of "
            f"{total_marks} marks "
            f"({percentage}%)."
        )

        state["strengths"] = []

        state["weak_areas"] = []

        state["improvement_plan"] = []

        state["recommendations"] = []

        state["feedback"] = (
            state["performance_summary"]
        )

        return state