def performance_agent(state):
    score = state.get("score", 0)
    total = state.get("total_questions", 0)

    percentage = (score / total) * 100 if total > 0 else 0

    if percentage >= 80:
        performance = "Excellent"
    elif percentage >= 50:
        performance = "Good"
    else:
        performance = "Needs Improvement"

    state["performance"] = performance

    return state