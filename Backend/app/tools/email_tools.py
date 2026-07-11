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

    print("\n========== EMAIL FUNCTION CALLED ==========")
    print("Receiver:", receiver_email)
    print("Sender:", settings.EMAIL_ADDRESS)
    print("API Key Exists:", bool(settings.BREVO_API_KEY))

    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": settings.BREVO_API_KEY,
    }

    payload = {
        "sender": {
            "name": "AI Quiz System",
            "email": settings.EMAIL_ADDRESS,
        },
        "to": [
            {
                "email": receiver_email
            }
        ],
        "subject": subject,
        "textContent": body,
    }

    print("\nPayload:")
    print(payload)

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30,
        )

        print("\n========== BREVO RESPONSE ==========")
        print("Status Code:", response.status_code)
        print("Response Body:", response.text)
        print("===================================\n")

        response.raise_for_status()

        return {
            "success": True,
            "response": response.json(),
        }

    except Exception as e:
        print("\n========== EMAIL ERROR ==========")
        print(str(e))

        if "response" in locals():
            print("Status:", response.status_code)
            print("Body:", response.text)

        print("=================================\n")

        raise