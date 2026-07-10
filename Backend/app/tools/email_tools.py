import requests

from langchain_core.tools import tool
from ..config import settings


@tool
def send_quiz_email(
    receiver_email: str,
    subject: str,
    body: str,
):
    """
    Send an email using Brevo API.
    """

    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": "AI Quiz System",
            "email": settings.EMAIL_ADDRESS,
        },
        "to": [
            {
                "email": receiver_email,
            }
        ],
        "subject": subject,
        "textContent": body,
    }

    # 👇 Replace this section
    response = requests.post(
        url,
        json=payload,
        headers=headers,
        timeout=30,
    )

    print("Status:", response.status_code)
    print("Response:", response.text)

    if response.status_code not in [200, 201]:
        raise Exception(
            f"Brevo Error: {response.status_code} - {response.text}"
        )

    return f"Email sent successfully to {receiver_email}"