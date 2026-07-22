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
    "/bootstrap",
    response_model=UserResponse,
)
@router.post(
    "/bootstrap",
    response_model=UserResponse,
)
def bootstrap_dean(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    existing_users = db.query(User).count()

    if existing_users > 0:
        raise HTTPException(
            status_code=403,
            detail="Bootstrap is disabled. Users already exist."
        )

    if user.role != UserRole.DEAN:
        raise HTTPException(
            status_code=400,
            detail="First user must be a DEAN."
        )

    try:
        new_user = create_user(
            db,
            user,
        )

        db.commit()          # ✅ IMPORTANT
        db.refresh(new_user) # ✅ Reload committed data

        return new_user

    except ValueError as e:
        db.rollback()
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