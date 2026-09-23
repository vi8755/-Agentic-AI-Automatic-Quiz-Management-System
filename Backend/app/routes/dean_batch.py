from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..schemas import (
    BatchCreate,
    BatchUpdate,
    BatchStatusUpdate,
    BatchResponse,
)
from ..services.dean_batch_service import (
    get_batches,
    get_batch,
    create_batch,
    update_batch,
    update_batch_status,
    delete_batch,
)
from ..models import User, UserRole
from ..security import require_role


router = APIRouter(
    prefix="/dean/batches",
    tags=["Dean - Batch Management"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# GET ALL
# ============================================================

@router.get(
    "",
    response_model=list[BatchResponse],
)
def get_all_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return get_batches(db)


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{batch_id}",
    response_model=BatchResponse,
)
def get_single_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return get_batch(
        db,
        batch_id,
    )


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=BatchResponse,
    status_code=201,
)
def add_batch(
    batch: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return create_batch(
        db,
        batch,
    )


# ============================================================
# UPDATE
# ============================================================

@router.patch(
    "/{batch_id}",
    response_model=BatchResponse,
)
def edit_batch(
    batch_id: int,
    batch_data: BatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return update_batch(
        db,
        batch_id,
        batch_data,
    )


# ============================================================
# STATUS
# ============================================================

@router.patch(
    "/{batch_id}/status",
    response_model=BatchResponse,
)
def change_batch_status(
    batch_id: int,
    data: BatchStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return update_batch_status(
        db,
        batch_id,
        data.is_active,
    )


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{batch_id}",
)
def remove_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    return delete_batch(
        db,
        batch_id,
    )