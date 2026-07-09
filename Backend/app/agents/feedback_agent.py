from langchain_ollama import ChatOllama


llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0
)


def feedback_agent(state):
    score = state.get("score", 0)
    total = state.get("total_questions", 0)
    performance = state.get("performance", "")
    weak_topics = state.get("weak_topics", [])
    wrong_answers = state.get("wrong_answers", [])

    prompt = f"""
You are an AI learning assistant.

Analyze the student's quiz performance and generate personalized feedback.

### Student Performance

Score:
{score}/{total}

Performance:
{performance}

Weak Topics:
{weak_topics}

Wrong Answers:
{wrong_answers}

### Instructions

Generate feedback using the following sections:

## Performance Summary
Explain the student's overall performance.

## Strengths
Mention what the student performed well.

## Weak Areas
For each weak topic, explain:
- Topic name
- Mistake pattern
- Why improvement is needed

## Improvement Plan
Provide practical steps to improve.

## Recommended Learning
Suggest what the student should study next.

Important:
- Do not give generic advice.
- Base your feedback on the student's wrong answers and weak topics.
- Keep the feedback encouraging and constructive.
"""

    response = llm.invoke(prompt)

    state["feedback"] = (
        response.content.strip()
        if response and response.content
        else "Feedback could not be generated."
    )

    return state