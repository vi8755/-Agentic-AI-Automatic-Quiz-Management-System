import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from langchain_core.tools import tool
from ..config import settings


@tool
def send_quiz_email(
    receiver_email: str,
    subject: str,
    body: str,
):
    """
    Send an email to a student.
    """

    sender_email = settings.EMAIL_ADDRESS
    password = settings.EMAIL_PASSWORD

 

    server = smtplib.SMTP(
        "smtp.gmail.com",
        587,
        timeout=30,
    )

 

    server.starttls()

 

    server.login(
        sender_email,
        password,
    )

 
    # Create UTF-8 email
    msg = MIMEMultipart()

    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = subject

    msg.attach(
        MIMEText(body, "plain", "utf-8")
    )

    server.sendmail(
        sender_email,
        receiver_email,
        msg.as_string(),
    )



    server.quit()

    return f"Email sent successfully to {receiver_email}"