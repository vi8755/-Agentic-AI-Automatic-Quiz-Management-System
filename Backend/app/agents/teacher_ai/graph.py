from langgraph.graph import StateGraph, END
from .state import TeacherAIState
from .nodes import (
    clean_text_node,
    chunk_text_node,
    extract_topics_node,
    clean_topics_node,
    generate_questions_node,
    validate_questions_node,
    format_quiz_node,
    quiz_planner_node,
)

builder = StateGraph(TeacherAIState)

builder.add_node("clean_text", clean_text_node)
builder.add_node("chunk_text", chunk_text_node)
builder.add_node(
    "quiz_planner",
    quiz_planner_node,
)

builder.add_node(
    "generate_questions",
    generate_questions_node,
)
builder.add_node("validate_questions", validate_questions_node)
builder.add_node("format_quiz", format_quiz_node)
builder.add_node(
    "extract_topics",
    extract_topics_node,
)
builder.add_node(
    "clean_topics",
    clean_topics_node,
)
builder.set_entry_point("clean_text")

builder.add_edge(
    "clean_text",
    "chunk_text",
)

builder.add_edge(
    "chunk_text",
    "extract_topics",
)

builder.add_edge(
    "extract_topics",
    "clean_topics",
)

builder.add_edge(
    "clean_topics",
    "quiz_planner",
)

builder.add_edge(
    "quiz_planner",
    "generate_questions",
)

builder.add_edge(
    "generate_questions",
    "validate_questions",
)

builder.add_edge(
    "validate_questions",
    "format_quiz",
)

builder.add_edge(
    "format_quiz",
    END,
)

teacher_ai_graph = builder.compile()