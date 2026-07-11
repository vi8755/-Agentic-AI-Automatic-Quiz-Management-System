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
    Send an email using the Brevo Transactional Email API.
    """

    print("========== EMAIL FUNCTION CALLED ==========")
    print("Receiver:", receiver_email)

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

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30,
        )

        print("Status Code:", response.status_code)
        print("Response:", response.text)

        response.raise_for_status()

        return f"Email sent successfully to {receiver_email}"

    except Exception as e:
        print("Brevo Error:", str(e))
        raise