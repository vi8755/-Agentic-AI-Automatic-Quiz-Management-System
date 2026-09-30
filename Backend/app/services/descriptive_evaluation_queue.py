from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session

from ..models import DescriptiveEvaluationJob


# Global PostgreSQL advisory-lock key.
# This lock is shared by every worker process using this database.
EVALUATION_QUEUE_LOCK_KEY = 874321


def create_evaluation_job(
    db: Session,
    submission_id: int,
    job_type: str = "MANUAL",
):
    """
    Create an evaluation job for a submission.

    The database has a UNIQUE constraint on submission_id,
    so only one evaluation job can exist for a submission.

    If a job already exists, return the existing job instead
    of creating a duplicate or raising an IntegrityError.
    """

    # ---------------------------------------------------------
    # CHECK FOR EXISTING JOB
    # ---------------------------------------------------------

    existing_job = (
        db.query(
            DescriptiveEvaluationJob
        )
        .filter(
            DescriptiveEvaluationJob.submission_id
            == submission_id
        )
        .first()
    )

    if existing_job:
        return existing_job

    # ---------------------------------------------------------
    # CREATE NEW JOB
    # ---------------------------------------------------------

    job = DescriptiveEvaluationJob(
        submission_id=submission_id,
        job_type=job_type,
        status="PENDING",
        attempts=0,
        max_attempts=3,
    )

    db.add(job)

    try:
        db.commit()
        db.refresh(job)

        return job

    except Exception:
        db.rollback()

        # -----------------------------------------------------
        # RACE CONDITION PROTECTION
        # -----------------------------------------------------
        #
        # Another request may have created the job between
        # our SELECT and INSERT.
        #
        # Re-query the database and return that job.
        # -----------------------------------------------------

        existing_job = (
            db.query(
                DescriptiveEvaluationJob
            )
            .filter(
                DescriptiveEvaluationJob.submission_id
                == submission_id
            )
            .first()
        )

        if existing_job:
            return existing_job

        raise

def claim_next_job(
    db: Session,
):
    """
    Safely claim one evaluation job.

    Guarantees:
    - Multiple workers cannot claim the same job.
    - PostgreSQL SKIP LOCKED allows concurrent job processing.
    - A global maximum of 5 PROCESSING jobs is enforced
      across all worker threads/processes.
    - Stale PROCESSING jobs can be reclaimed.
    """

    stale_time = datetime.now(timezone.utc) - timedelta(
        minutes=30
    )

    try:
        # ---------------------------------------------------------
        # GLOBAL QUEUE LOCK
        # ---------------------------------------------------------
        #
        # PostgreSQL advisory transaction lock.
        #
        # Every worker/process uses the same lock key, so only
        # one worker can perform the "count + claim" operation
        # at a time.
        #
        # The lock automatically releases when this transaction
        # commits or rolls back.
        #
        db.execute(
            text(
                "SELECT pg_advisory_xact_lock(:lock_key)"
            ),
            {
                "lock_key": EVALUATION_QUEUE_LOCK_KEY
            },
        )

        # ---------------------------------------------------------
        # COUNT CURRENT ACTIVE EVALUATIONS
        # ---------------------------------------------------------
        #
        # Only non-stale PROCESSING jobs count toward the limit.
        #
        # A stale job is considered abandoned and can be reclaimed.
        #
        active_processing_count = (
            db.query(
                func.count(
                    DescriptiveEvaluationJob.id
                )
            )
            .filter(
                DescriptiveEvaluationJob.status
                == "PROCESSING",
                DescriptiveEvaluationJob.locked_at
                >= stale_time,
            )
            .scalar()
        )

        # ---------------------------------------------------------
        # HARD GLOBAL LIMIT
        # ---------------------------------------------------------
        #
        # This applies across ALL worker processes.
        #
        if active_processing_count >= 5:
            db.rollback()
            return None

        # ---------------------------------------------------------
        # CLAIM NEXT AVAILABLE JOB
        # ---------------------------------------------------------
        #
        # PENDING jobs are preferred.
        # Stale PROCESSING jobs can also be reclaimed.
        #
        job = (
            db.query(
                DescriptiveEvaluationJob
            )
            .filter(
                or_(
                    DescriptiveEvaluationJob.status
                    == "PENDING",

                    (
                        (
                            DescriptiveEvaluationJob.status
                            == "PROCESSING"
                        )
                        &
                        (
                            DescriptiveEvaluationJob.locked_at
                            < stale_time
                        )
                    ),
                )
            )
            .order_by(
                DescriptiveEvaluationJob.created_at.asc()
            )
            .with_for_update(
                skip_locked=True
            )
            .first()
        )

        if not job:
            db.rollback()
            return None

        # ---------------------------------------------------------
        # MARK JOB AS PROCESSING
        # ---------------------------------------------------------

        job.status = "PROCESSING"
        job.locked_at = datetime.now(timezone.utc)
        job.attempts += 1

        db.commit()
        db.refresh(job)

        return job

    except Exception:
        db.rollback()
        raise
def refresh_job_lock(
    db: Session,
    job_id: int,
):
    """
    Refresh the lock timestamp for a currently processing job.

    This prevents a long-running AI evaluation from being
    incorrectly considered stale and reclaimed by another worker.
    """

    job = (
        db.query(
            DescriptiveEvaluationJob
        )
        .filter(
            DescriptiveEvaluationJob.id
            == job_id,
            DescriptiveEvaluationJob.status
            == "PROCESSING",
        )
        .first()
    )

    if not job:
        return False

    job.locked_at = datetime.now(timezone.utc)

    db.commit()

    return True

def mark_job_completed(
    db: Session,
    job: DescriptiveEvaluationJob,
):
    job.status = "COMPLETED"
    job.completed_at = datetime.now(timezone.utc)
    job.locked_at = None
    job.last_error = None

    db.commit()


def mark_job_failed(
    db: Session,
    job: DescriptiveEvaluationJob,
    error: str,
):
    job.locked_at = None
    job.last_error = str(error)

    if job.attempts >= job.max_attempts:
        job.status = "FAILED"
    else:
        job.status = "PENDING"

    db.commit()