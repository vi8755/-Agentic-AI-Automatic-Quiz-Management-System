from ..tools.email_tools import send_quiz_email


def report_email_agent(state):
    send_quiz_email.invoke(
        {
            "receiver_email": state.get("student_email"),
            "subject": "Your Quiz Performance Report",
            "body": f"""
Hello {state.get("student_name", "Student")},

Your quiz has been evaluated successfully.

----------------------------------------

Score:
{state.get("score", 0)}/{state.get("total_questions", 0)}

Performance:
{state.get("performance", "N/A")}

Feedback:

{state.get("feedback", "No feedback available.")}

----------------------------------------

Regards,
AI Quiz System
""",
        }
    )

    return state