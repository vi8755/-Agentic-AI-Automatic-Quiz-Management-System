from langgraph.graph import StateGraph, END

from .evaluation_state import EvaluationState

from .agents.evaluation_agent import evaluation_agent
from .agents.performance_agent import performance_agent
from .agents.feedback_agent import feedback_agent
from .agents.report_email_agent import report_email_agent


workflow = StateGraph(EvaluationState)

workflow.add_node("Evaluation", evaluation_agent)
workflow.add_node("Performance", performance_agent)
workflow.add_node("Feedback", feedback_agent)
workflow.add_node("ReportEmail", report_email_agent)


workflow.set_entry_point("Evaluation")

workflow.add_edge("Evaluation", "Performance")
workflow.add_edge("Performance", "Feedback")
workflow.add_edge("Feedback", "ReportEmail")
workflow.add_edge("ReportEmail", END)


app = workflow.compile()