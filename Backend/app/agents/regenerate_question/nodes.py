from .state import RegenerateQuestionState

from ...ai.mcq_generator import regenerate_mcq
from ...ai.question_validator import validate_regenerated_question
def regenerate_question_node(state: RegenerateQuestionState):

    regenerated = regenerate_mcq(
    question=state["question"],
    quiz_title=state["quiz_title"],
    existing_questions=state["existing_questions"],
    )
    

    

    state["regenerated_question"] = regenerated

    return state

def validate_question_node(
    state: RegenerateQuestionState,
):
    validated = validate_regenerated_question(
    state["regenerated_question"]
)

    state["validated_question"] = validated

    return state