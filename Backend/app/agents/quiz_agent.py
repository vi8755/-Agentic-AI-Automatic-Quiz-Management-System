from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama

from ..tools.quiz_tools import generate_quiz
from ..tools.web_quiz_tools import create_quiz_web


quiz_tools = [
    generate_quiz,
    create_quiz_web,
]


llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0,
)


def quiz_agent(state):
    result = generate_quiz.invoke(
{
    "topic": state["topic"],
    "num_questions": state["num_questions"],
    "difficulty": state["difficulty"],
}
)

    if not result:
        return {
            "messages": [
                HumanMessage(content="Quiz generation failed")
            ]
        }

    quiz_result = result

    db_result = create_quiz_web.invoke(quiz_result)

    quiz_link = db_result.get("quiz_url")

    return {
        "messages": [
            HumanMessage(content="Quiz generated successfully")
        ],
        "quiz_result": quiz_result,
        "quiz_link": quiz_link,
        "student_email": state.get("student_email"),
    }