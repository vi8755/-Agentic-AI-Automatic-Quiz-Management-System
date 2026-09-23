from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal

from ..services.auth_service import (login_user,  request_password_reset,reset_password,
                                         verify_email,)
from ..models import User
from ..schemas import (
    LoginRequest,
    TokenResponse,
    ChangePasswordRequest,
     ForgotPasswordRequest,
    ResetPasswordRequest,
)
from ..security import (
    get_current_user,
    verify_password,
    hash_password,
)
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
@router.get("/verify-email")
def verify_user_email(
    token: str,
    db: Session = Depends(get_db),
):
    try:
        verify_email(
            db,
            token,
        )

        return {
            "message": "Email verified successfully."
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # =====================================================
    # 1. Verify current password
    # =====================================================

    if not verify_password(
        password_data.current_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    # =====================================================
    # 2. Check that new password is different
    # =====================================================

    if verify_password(
        password_data.new_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password.",
        )

    # =====================================================
    # 3. Validate new password
    # =====================================================

    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters long.",
        )

    # =====================================================
    # 4. Get the same user inside THIS database session
    # =====================================================

    user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # =====================================================
    # 5. Hash and update password
    # =====================================================

    user.password = hash_password(
        password_data.new_password
    )

    # =====================================================
    # 6. Save changes
    # =====================================================

    db.commit()

    return {
        "message": "Password changed successfully."
    }

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    request_password_reset(
        db,
        request.email,
    )

    return {
        "message": (
            "If an account with that email exists, "
            "a password reset link has been sent."
        )
    }

@router.post("/reset-password")
def reset_user_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        reset_password(
            db,
            request.token,
            request.new_password,
        )

        return {
            "message": "Password reset successfully."
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )