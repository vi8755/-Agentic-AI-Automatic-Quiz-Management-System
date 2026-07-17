from sqlalchemy.orm import Session

from ..models import User
from ..schemas import LoginRequest, TokenResponse
from ..security import (
    verify_password,
    create_access_token,
)


def login_user(
    db: Session,
    login_data: LoginRequest,
):
    """
    Authenticate a user and generate a JWT token.
    """

    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    # User not found
    if not user:
        raise ValueError("Invalid email or password.")

    # Verify password
    if not verify_password(
        login_data.password,
        user.password,
    ):
        raise ValueError("Invalid email or password.")

    # Create JWT token
    access_token = create_access_token(
        {
            "sub": user.email,
            "role": user.role.value,
        }
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )