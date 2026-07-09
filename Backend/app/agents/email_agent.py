from langchain_core.messages import HumanMessage
from ..tools.email_tools import send_quiz_email


def email_agent(state):
    student_name = state.get("student_name", "Student")
    student_email = state.get("student_email")

    # ======================================
    # CASE 1: Send Performance Report
    # ======================================
    if state.get("feedback"):

        send_quiz_email.invoke(
            {
                "receiver_email": student_email,
                "subject": "Your Quiz Performance Report",
                "body": f"""
Hello {student_name},

Your quiz has been evaluated successfully.

----------------------------------------
Score:
{state.get("score", 0)}/{state.get("total_questions", 0)}

Performance:
{state.get("performance", "N/A")}

Weak Topics:
{", ".join(state.get("weak_topics", []))}

Personalized Feedback:

{state.get("feedback", "")}

----------------------------------------

Keep practicing and improving!

AI Training System
"""
            }
        )

        return {
            "messages": [
                HumanMessage(content="Performance report sent")
            ],
            "email_type": "performance"
        }

    # ======================================
    # CASE 2: Send Quiz Link
    # ======================================
    if state.get("quiz_link"):

        send_quiz_email.invoke(
            {
                "receiver_email": student_email,
                "subject": "Your AI Generated Quiz",
                "body": f"""
Hello {student_name},

Your AI-generated quiz is ready!

Click the link below to start your quiz:

{state.get("quiz_link")}

Best of luck!

AI Training System
"""
            }
        )

        return {
            "messages": [
                HumanMessage(content="Quiz email sent")
            ],
            "email_type": "quiz"
        }

    # ======================================
    # No Email Task
    # ======================================
    return {
        "messages": [
            HumanMessage(content="No email task found")
        ]
    }