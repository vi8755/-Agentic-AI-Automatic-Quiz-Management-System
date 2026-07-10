from typing import TypedDict, Annotated
from sqlite3 import connect

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.sqlite import SqliteSaver

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from .llm import llm

from .agents.student_agent import student_agent
from .agents.quiz_agent import quiz_agent
from .agents.email_agent import email_agent
from .config import settings
from .rag_tool import knowledge_search


# ======================================================
# LLM
# ======================================================



# ======================================================
# Long Term Memory
# ======================================================

@tool
def save_memory(information: str):
    """
    Save important information into memory.
    """

    conn = connect(
        "agent_memory.db",
        check_same_thread=False
    )

    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS memories(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            information TEXT
        )
        """
    )

    cursor.execute(
        """
        INSERT INTO memories(information)
        VALUES(?)
        """,
        (information,)
    )

    conn.commit()
    conn.close()

    return "Memory saved successfully."


@tool
def search_memory(query: str):
    """
    Search stored memories.
    """

    conn = connect(
        "agent_memory.db",
        check_same_thread=False
    )

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT information
        FROM memories
        WHERE information LIKE ?
        """,
        (f"%{query}%",)
    )

    result = cursor.fetchall()

    conn.close()

    if result:
        return str(result)

    return "No memory found."


# ======================================================
# Agent State
# ======================================================

class AgentState(TypedDict):

    messages: Annotated[list, add_messages]

    plan: str

    next_agent: str

    student_name: str

    student_email: str

    quiz_title: str

    quiz_result: dict

    quiz_link: str

    student_answers: dict

    score: int

    total_questions: int

    performance: str

    feedback: str

    weak_topics: list

    wrong_answers: list

    research_result: str

    memory_result: str

    final_answer: str
    topic: str
    num_questions: int
    difficulty: str


# ======================================================
# Planner
# ======================================================

def planner_node(state):
    user_message = state["messages"][-1].content

    prompt = f"""
You are a planning agent.

Break the user's task into simple steps.

User Request:

{user_message}

Return only the plan.
"""

    response = llm.invoke(prompt)
    return {
        "plan": response.content
    }


# ======================================================
# Executor
# ======================================================

def executor_node(state):
    return {

        "plan": state["plan"]

    }


# ======================================================
# RAG Agent
# ======================================================

def research_agent(state):
    query = state["messages"][-1].content

    result = knowledge_search.invoke(query)

    return {

        "research_result": result

    }
# ======================================================
# Memory Agent
# ======================================================

def memory_agent(state):

    query = state["messages"][-1].content

    memory = search_memory.invoke(query)

    return {

        "memory_result": memory

    }


# ======================================================
# Final Answer Agent (Future Use)
# ======================================================

def answer_agent(state):

    prompt = f"""
Use the following information to answer the user.

Research:
{state.get("research_result", "")}

Memory:
{state.get("memory_result", "")}

Conversation:
{state["messages"]}
"""

    response = llm.invoke(prompt)

    return {

        "final_answer": response.content

    }


# ======================================================
# Supervisor
# ======================================================

def supervisor(state):

    question = state["messages"][-1].content.lower()

    if any(word in question for word in [
        "student",
        "students",
        "excel",
        "import"
    ]):

        decision = "student"

    elif any(word in question for word in [
        "quiz",
        "mcq",
        "question",
        "assessment"
    ]):

        decision = "quiz"

    elif any(word in question for word in [
        "email",
        "mail",
        "send"
    ]):

        decision = "email"

    elif any(word in question for word in [
        "research",
        "rag",
        "knowledge"
    ]):

        decision = "research"

    elif any(word in question for word in [
        "memory",
        "remember"
    ]):

        decision = "memory"

    else:

        decision = "student"

    return {

        "next_agent": decision

    }


# ======================================================
# Router
# ======================================================

def route(state):

    return state["next_agent"]


# ======================================================
# Build Workflow
# ======================================================

workflow = StateGraph(AgentState)

# Core Nodes

workflow.add_node(
    "planner",
    planner_node
)

workflow.add_node(
    "executor",
    executor_node
)

workflow.add_node(
    "supervisor",
    supervisor
)

# Workflow A

workflow.add_node(
    "student",
    student_agent
)

workflow.add_node(
    "quiz",
    quiz_agent
)

workflow.add_node(
    "email",
    email_agent
)

# Future Nodes

workflow.add_node(
    "research",
    research_agent
)

workflow.add_node(
    "memory",
    memory_agent
)

workflow.add_node(
    "answer",
    answer_agent)

# ======================================================
# Entry Point
# ======================================================

workflow.set_entry_point("planner")


# ======================================================
# Static Flow
# ======================================================

workflow.add_edge(
    "planner",
    "executor"
)

workflow.add_edge(
    "executor",
    "supervisor"
)


# ======================================================
# Dynamic Routing
# ======================================================

workflow.add_conditional_edges(

    "supervisor",

    route,

    {

        "student": "student",

        "quiz": "quiz",

        "email": "email",

        "research": "research",

        "memory": "memory"

    }

)


# ======================================================
# Workflow A
# ======================================================

workflow.add_edge(
    "student",
    "quiz"
)

workflow.add_edge(
    "quiz",
    "email"
)

workflow.add_edge(
    "email",
    END
)


# ======================================================
# Future Workflow
# ======================================================

workflow.add_edge(
    "research",
    "answer"
)

workflow.add_edge(
    "memory",
    "answer"
)

workflow.add_edge(
    "answer",
    END
)
# ======================================================
# SQLITE CHECKPOINTER
# ======================================================

conn = connect(
    "agent_memory.db",
    check_same_thread=False
)

memory = SqliteSaver(conn)


# ======================================================
# COMPILE GRAPH
# ======================================================

app = workflow.compile(
    checkpointer=memory
)


# ======================================================
# TEST WORKFLOW
# ======================================================

if __name__ == "__main__":

    config = {
        "configurable": {
            "thread_id": "workflow_a_test"
        }
    }

    result = app.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Import students from excel"
                )
            ]
        },
        config=config
    )

    

    for key, value in result.items():

        if key == "messages":
         
            for msg in value:
                try:
                    print("-", msg.content)
                except Exception:
                    print("-", msg)

        else:
            print(f"{key}: {value}")
 