import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from ..config import settings
from ..models import (
    User, PasswordResetToken,
     UserRole,
    EmailVerificationToken,)
from ..schemas import LoginRequest, TokenResponse
from ..security import (
    verify_password,
    create_access_token,
      hash_password,
)
from ..tools.email_tools import send_quiz_email

def login_user(
    db: Session,
    login_data: LoginRequest,
):
    """
    Authenticate a user and generate a JWT token.

    Students must verify their email before
    they are allowed to log in.

    Dean and Teacher login behavior remains unchanged.
    """

    # ---------------------------------------------
    # Find user by email
    # ---------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    # ---------------------------------------------
    # User not found
    # ---------------------------------------------

    if not user:
        raise ValueError(
            "Invalid email or password."
        )

    # ---------------------------------------------
    # Verify password
    # ---------------------------------------------

    if not verify_password(
        login_data.password,
        user.password,
    ):
        raise ValueError(
            "Invalid email or password."
        )
      # Block unverified Teacher and Student accounts
    if user.role in [UserRole.TEACHER, UserRole.STUDENT]:
        if not user.email_verified:
            raise ValueError(
                "Please verify your email before logging in."
            )

    # ---------------------------------------------
    # Student email verification check
    # ---------------------------------------------

    if (
        user.role == UserRole.STUDENT
        and not user.email_verified
    ):
        raise ValueError(
            "Please verify your email before logging in."
        )

    # ---------------------------------------------
    # Create JWT token
    # ---------------------------------------------

    access_token = create_access_token(
        {
            "sub": user.email,
            "role": user.role.value,
        }
    )

    # ---------------------------------------------
    # Return token
    # ---------------------------------------------

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )
def send_email_verification(
    db: Session,
    user: User,
    temporary_password: str | None = None,
):
    """
    Generate a secure email verification token
    and send the verification email to the user.

    If temporary_password is provided:
    - Sends student login email + temporary password
    - Sends email verification link
    - Sends login link

    If temporary_password is not provided:
    - Sends only the email verification information
    """

    # -------------------------------------------------
    # Generate secure random verification token
    # -------------------------------------------------

    raw_token = secrets.token_urlsafe(32)

    # -------------------------------------------------
    # Store only the SHA-256 hash in database
    # -------------------------------------------------

    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

    # -------------------------------------------------
    # Token valid for 30 minutes
    # -------------------------------------------------

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=30)
    )

    # -------------------------------------------------
    # Invalidate previous unused verification tokens
    # -------------------------------------------------

    old_tokens = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
        )
        .all()
    )

    now = datetime.now(timezone.utc)

    for old_token in old_tokens:
        old_token.used_at = now

    # -------------------------------------------------
    # Create new verification token
    # -------------------------------------------------

    verification_token = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    db.add(verification_token)

    # -------------------------------------------------
    # Save token in database
    # -------------------------------------------------

    db.commit()

    # -------------------------------------------------
    # Create verification link
    # -------------------------------------------------

    verification_link = (
        f"{settings.FRONTEND_URL}"
        f"/verify-email?token={raw_token}"
    )

    # -------------------------------------------------
    # Create login link
    # -------------------------------------------------

    login_link = (
        f"{settings.FRONTEND_URL}"
        f"/login"
    )

    # -------------------------------------------------
    # Create email body
    # -------------------------------------------------

    if temporary_password:

        email_body = f"""
Hello {user.name},

Your AI Quiz System student account has been created successfully.

----------------------------------------
LOGIN DETAILS
----------------------------------------

Email:
{user.email}

Temporary Password:
{temporary_password}

----------------------------------------
EMAIL VERIFICATION
----------------------------------------

Before logging in, please verify your email address by clicking the link below:

{verification_link}

This verification link will expire in 30 minutes.

----------------------------------------
LOGIN
----------------------------------------

After verifying your email, you can log in here:

{login_link}

Please change your temporary password after your first login.

If you did not expect this account, please ignore this email.

Regards,
AI Quiz System
"""

    else:

        email_body = f"""
Hello {user.name},

Your AI Quiz System account requires email verification.

Please verify your email address by clicking the link below:

{verification_link}

This verification link will expire in 30 minutes.

You can log in after verifying your email:

{login_link}

If you did not expect this account, please ignore this email.

Regards,
AI Quiz System
"""

    # -------------------------------------------------
    # Send email
    # -------------------------------------------------

    send_quiz_email.invoke(
        {
            "receiver_email": user.email,
            "subject": (
                "Your AI Quiz System Student Account"
                if temporary_password
                else "Verify Your AI Quiz System Email"
            ),
            "body": email_body,
        }
    )

    return True

def resend_email_verification(
    db: Session,
    user: User,
):
    """
    Generate a fresh email verification token
    and send a new verification email.

    Rules:
    - User must not already be verified.
    - Previous unused verification tokens are invalidated
      by send_email_verification().
    - New token is valid for 30 minutes.
    """

    # ---------------------------------------------
    # Check whether email is already verified
    # ---------------------------------------------

    if user.email_verified:
        raise ValueError(
            "This email address is already verified."
        )

    # ---------------------------------------------
    # Generate and send a fresh verification token
    # ---------------------------------------------

    send_email_verification(
        db,
        user,
    )

    return True
def verify_email(
    db: Session,
    token: str,
):
    """
    Validate an email verification token
    and mark the user's email as verified.
    """

    # Hash the token received from the URL
    token_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    # Find verification token
    verification_token = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.token_hash == token_hash
        )
        .first()
    )

    if not verification_token:
        raise ValueError(
            "Invalid or expired email verification token."
        )

    now = datetime.now(timezone.utc)

    # Check whether token was already used
    if verification_token.used_at is not None:
        raise ValueError(
            "This email verification link has already been used."
        )

    # Check expiration
    if verification_token.expires_at <= now:
        raise ValueError(
            "This email verification link has expired."
        )

    # Find user
    user = (
        db.query(User)
        .filter(
            User.id == verification_token.user_id
        )
        .first()
    )

    if not user:
        raise ValueError(
            "User account not found."
        )

    # Mark email as verified
    user.email_verified = True

    # Make token single-use
    verification_token.used_at = now

    db.commit()

    return True
def request_password_reset(
    db: Session,
    email: str,
):
    """
    Create a secure password reset token
    and send the reset link by email.
    """

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Do not reveal whether the email exists.
    if not user:
        return

    # Generate secure random token
    raw_token = secrets.token_urlsafe(32)

    # Store only the hash in database
    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

    # Token valid for 30 minutes
    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=30)
    )

    # Invalidate previous unused tokens
    old_tokens = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
        .all()
    )

    now = datetime.now(timezone.utc)

    for old_token in old_tokens:
        old_token.used_at = now

    # Save new token
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    db.add(reset_token)
    db.commit()

    # IMPORTANT:
    # Change this later to your deployed frontend URL.
    reset_link = (
          f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    )

    # Send email using your existing Brevo tool
    send_quiz_email.invoke(
        {
            "receiver_email": user.email,
            "subject": "Reset Your AI Quiz System Password",
            "body": f"""
Hello {user.name},

We received a request to reset your password.

Click the link below to create a new password:

{reset_link}

This link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

AI Training System
""",
        }
    )

    return True

def reset_password(
    db: Session,
    token: str,
    new_password: str,
):
    """
    Validate reset token and update password.
    """

    token_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    reset_token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash
        )
        .first()
    )

    if not reset_token:
        raise ValueError(
            "Invalid or expired password reset token."
        )

    now = datetime.now(timezone.utc)

    if reset_token.used_at is not None:
        raise ValueError(
            "This password reset link has already been used."
        )

    if reset_token.expires_at <= now:
        raise ValueError(
            "This password reset link has expired."
        )

    user = (
        db.query(User)
        .filter(User.id == reset_token.user_id)
        .first()
    )

    if not user:
        raise ValueError(
            "User account not found."
        )

    # Hash the new password
    user.password = hash_password(new_password)

    # Make token single-use
    reset_token.used_at = now

    db.commit()

    return True