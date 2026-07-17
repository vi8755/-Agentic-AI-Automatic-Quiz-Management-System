from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..schemas import LoginRequest, TokenResponse
from ..services.auth_service import login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    try:
        return login_user(
            db,
            login_data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )