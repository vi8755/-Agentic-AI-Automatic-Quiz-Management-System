from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..schemas import UserCreate, UserResponse
from ..services.user_service import create_user
from ..database import get_db

from ..models import User, UserRole
from ..security import (
    get_current_user,
    require_role,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

 

@router.post(
    "/",
    response_model=UserResponse,
)
def create_user_api(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
    require_role(UserRole.DEAN)
    ),
):
    try:
        return create_user(
            db,
            user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
    }