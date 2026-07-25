from langgraph.graph import (
    StateGraph,
    END,
)

from .state import RegenerateQuestionState

from .nodes import (
    regenerate_question_node,
    validate_question_node,
)

builder = StateGraph(
    RegenerateQuestionState
)

builder.add_node(
    "regenerate",
    regenerate_question_node,
)

builder.add_node(
    "validate",
    validate_question_node,
)

builder.set_entry_point(
    "regenerate"
)

builder.add_edge(
    "regenerate",
    "validate",
)

builder.add_edge(
    "validate",
    END,
)

regenerate_question_graph = builder.compile()