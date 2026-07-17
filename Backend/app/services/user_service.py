from sqlalchemy.orm import Session

from ..models import User
from ..schemas import UserCreate
from ..security import hash_password
from sqlalchemy import text

def create_user(
    db: Session,
    user: UserCreate,
):
    """
    Create a new user.
    """

    # Check duplicate email
    existing_user = None

    if existing_user:
        raise ValueError("Email already exists.")

    # Hash password
    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    

    return new_user