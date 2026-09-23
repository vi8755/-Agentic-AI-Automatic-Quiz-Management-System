from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Batch
from ..schemas import (
    BatchCreate,
    BatchUpdate,
   
)


def get_batches(db: Session):

    return (
        db.query(Batch)
        .order_by(
            Batch.start_year.desc(),
            Batch.department.asc(),
        )
        .all()
    )


def get_batch(
    db: Session,
    batch_id: int,
):

    batch = (
        db.query(Batch)
        .filter(Batch.id == batch_id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found.",
        )

    return batch


def validate_batch_years(
    start_year: int,
    end_year: int,
):

    if start_year >= end_year:
        raise HTTPException(
            status_code=400,
            detail="End year must be greater than start year.",
        )


def validate_batch_name(
    batch_name: str,
    start_year: int,
    end_year: int,
):

    expected_batch_name = (
        f"{start_year}-{str(end_year)[-2:]}"
    )

    if batch_name.strip() != expected_batch_name:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Batch name must be "
                f"'{expected_batch_name}'."
            ),
        )

def create_batch(
    db: Session,
    batch_data: BatchCreate,
):

    # ========================================================
    # VALIDATE YEARS
    # ========================================================

    validate_batch_years(
        batch_data.start_year,
        batch_data.end_year,
    )

    # ========================================================
    # VALIDATE BATCH NAME
    # ========================================================

    validate_batch_name(
        batch_data.batch_name,
        batch_data.start_year,
        batch_data.end_year,
    )

    # ========================================================
    # CHECK DUPLICATE
    # ========================================================

    existing_batch = (
        db.query(Batch)
        .filter(
            Batch.batch_name
            == batch_data.batch_name.strip(),
            Batch.department
            == batch_data.department.strip(),
        )
        .first()
    )

    if existing_batch:
        raise HTTPException(
            status_code=400,
            detail=(
                "A batch with this name "
                "already exists for this department."
            ),
        )

    # ========================================================
    # CREATE BATCH
    # ========================================================

    new_batch = Batch(
        batch_name=batch_data.batch_name.strip(),
        department=batch_data.department.strip(),
        start_year=batch_data.start_year,
        end_year=batch_data.end_year,
        is_active=True,
    )

    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    return new_batch
def update_batch(
    db: Session,
    batch_id: int,
    batch_data: BatchUpdate,
):

    batch = get_batch(
        db,
        batch_id,
    )

    batch_name = (
        batch_data.batch_name.strip()
        if batch_data.batch_name is not None
        else batch.batch_name
    )

    department = (
        batch_data.department.strip()
        if batch_data.department is not None
        else batch.department
    )

    start_year = (
        batch_data.start_year
        if batch_data.start_year is not None
        else batch.start_year
    )

    end_year = (
        batch_data.end_year
        if batch_data.end_year is not None
        else batch.end_year
    )

    validate_batch_years(
        start_year,
        end_year,
    )

    validate_batch_name(
        batch_name,
        start_year,
        end_year,
    )

    existing_batch = (
        db.query(Batch)
        .filter(
            Batch.id != batch_id,
            Batch.batch_name == batch_name,
            Batch.department == department,
        )
        .first()
    )

    if existing_batch:
        raise HTTPException(
            status_code=400,
            detail=(
                "Another batch with this name "
                "already exists for this department."
            ),
        )

    batch.batch_name = batch_name
    batch.department = department
    batch.start_year = start_year
    batch.end_year = end_year

    db.commit()
    db.refresh(batch)

    return batch


def update_batch_status(
    db: Session,
    batch_id: int,
    is_active: bool,
):

    batch = get_batch(
        db,
        batch_id,
    )

    batch.is_active = is_active

    db.commit()
    db.refresh(batch)

    return batch


def delete_batch(
    db: Session,
    batch_id: int,
):

    batch = get_batch(
        db,
        batch_id,
    )

    if batch.sections:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete this batch because "
                "sections are associated with it."
            ),
        )

    db.delete(batch)
    db.commit()

    return {
        "message": "Batch deleted successfully."
    }