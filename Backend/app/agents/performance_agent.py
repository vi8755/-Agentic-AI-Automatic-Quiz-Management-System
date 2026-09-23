def performance_agent(state):
    score = state.get("score", 0)
    total_marks = state.get("total_marks", 0)

    percentage = (
        (score / total_marks) * 100
        if total_marks > 0
        else 0
    )

    if percentage >= 80:
        performance = "Excellent"
    elif percentage >= 60:
        performance = "Good"
    elif percentage >= 40:
        performance = "Average"
    else:
        performance = "Needs Improvement"

    state["percentage"] = round(percentage, 2)
    state["performance"] = performance

    return state