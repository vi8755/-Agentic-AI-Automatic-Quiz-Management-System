from ..config import settings

import requests
from langchain_core.tools import tool


BACKEND_URL = settings.BACKEND_URL


@tool
def create_quiz_web(
    title: str,
    questions: list,
):
    """
    Store an AI-generated quiz in the backend database.
    """

    quiz_data = {
        "title": title,
        "questions": questions,
    }

    try:
        response = requests.post(
            f"{settings.BACKEND_URL}/create_quiz",
            json=quiz_data,
            timeout=30,
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as e:
       

        return {
            "error": str(e)
        }