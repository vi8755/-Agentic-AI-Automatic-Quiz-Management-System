from sqlalchemy.orm import Session

from ..models import User
from ..schemas import UserCreate
from ..security import hash_password


def create_user(
    db: Session,
    user: UserCreate,
):
    """
    Create a new user.

    This function:
    - Checks duplicate email
    - Hashes password
    - Creates User
    - Flushes transaction
    - Returns User object

    NOTE:
    This function DOES NOT commit.
    The caller (Teacher/Student service) is responsible
    for committing or rolling back the transaction.
    """

    # Check duplicate email
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise ValueError("Email already exists.")

    # Hash password
    hashed_password = hash_password(user.password)

    # Create User
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role,
    )

    db.add(new_user)

    # Generate user.id without committing
    db.flush()

    return new_user