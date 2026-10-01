import os
import time
import threading
from datetime import datetime, timezone

from ..database import SessionLocal
from ..models import (
    DescriptiveEvaluationJob,
    DescriptiveEvaluationLog,
)

from ..services.descriptive_evaluation_queue import (
    claim_next_job,
    mark_job_completed,
    mark_job_failed,
    refresh_job_lock,
)

from ..services.descriptive_evaluation_service import (
    evaluate_descriptive_submission,
    evaluate_descriptive_pdf_submission,
)


# ============================================================
# CONFIGURATION
# ============================================================

MAX_WORKERS = min(
    int(
        os.getenv(
            "DESCRIPTIVE_EVALUATION_WORKERS",
            "5",
        )
    ),
    5,
)


# ============================================================
# GLOBAL SHUTDOWN SIGNAL
# ============================================================

STOP_EVENT = threading.Event()


# ============================================================
# HEARTBEAT
# ============================================================

def heartbeat_job(
    job_id: int,
    stop_event: threading.Event,
):
    """
    Keep the evaluation job lock alive while the AI evaluation
    is running.

    The queue considers a job stale after 30 minutes, so we
    refresh locked_at every 5 minutes.
    """

    while not stop_event.wait(300):

        db = SessionLocal()

        try:

            refreshed = refresh_job_lock(
                db=db,
                job_id=job_id,
            )

            if refreshed:

                print(
                    f"[EVAL-HEARTBEAT] "
                    f"job={job_id} lock refreshed"
                )

            else:

                print(
                    f"[EVAL-HEARTBEAT] "
                    f"job={job_id} no longer processing"
                )

                break

        except Exception as e:

            print(
                f"[EVAL-HEARTBEAT] "
                f"job={job_id} ERROR | "
                f"{e}"
            )

        finally:

            db.close()


# ============================================================
# WORKER
# ============================================================

def process_jobs(worker_id: int):

    print(
        f"[EVAL-WORKER-{worker_id}] started"
    )

    while not STOP_EVENT.is_set():

        # ----------------------------------------------------
        # Reset state for this iteration
        # ----------------------------------------------------

        db = SessionLocal()

        job = None
        execution_log = None
        execution_log_id = None
        started_at = None

        submission_id = None
        job_type = None
        job_id = None
        attempt = None

        heartbeat_stop_event = None
        heartbeat_thread = None

        try:

            # =================================================
            # CLAIM NEXT JOB
            # =================================================

            job = claim_next_job(db)

            if not job:

                db.close()

                # Wait up to 2 seconds, but wake immediately
                # if shutdown is requested.
                STOP_EVENT.wait(2)

                continue

            # ------------------------------------------------
            # Capture primitive values BEFORE closing session
            # ------------------------------------------------

            submission_id = job.submission_id
            job_type = job.job_type
            job_id = job.id
            attempt = job.attempts

            started_at = datetime.now(timezone.utc)

            print(
                f"[EVAL-WORKER-{worker_id}] "
                f"Processing job={job_id} "
                f"submission={submission_id} "
                f"type={job_type} "
                f"attempt={attempt}"
            )

            # =================================================
            # CREATE EXECUTION LOG
            # =================================================

            execution_log = DescriptiveEvaluationLog(
                job_id=job_id,
                submission_id=submission_id,
                worker_id=worker_id,
                job_type=job_type,
                status="PROCESSING",
                attempt=attempt,
                started_at=started_at,
            )

            db.add(execution_log)
            db.commit()
            db.refresh(execution_log)

            execution_log_id = execution_log.id

            print(
                f"[EVAL-WORKER-{worker_id}] "
                f"LOG CREATED | "
                f"log={execution_log_id} | "
                f"job={job_id}"
            )

            # =================================================
            # CLOSE CLAIM SESSION
            # =================================================

            db.close()

            # =================================================
            # START HEARTBEAT
            # =================================================

            heartbeat_stop_event = threading.Event()

            heartbeat_thread = threading.Thread(
                target=heartbeat_job,
                args=(
                    job_id,
                    heartbeat_stop_event,
                ),
                daemon=True,
            )

            heartbeat_thread.start()

            # =================================================
            # RUN AI EVALUATION
            # =================================================

            evaluation_db = SessionLocal()

            try:

                if job_type == "PDF":

                    evaluate_descriptive_pdf_submission(
                        submission_id=submission_id,
                        db=evaluation_db,
                    )

                else:

                    evaluate_descriptive_submission(
                        submission_id=submission_id,
                        db=evaluation_db,
                    )

            finally:

                evaluation_db.close()

            # =================================================
            # STOP HEARTBEAT
            # =================================================

            if heartbeat_stop_event is not None:

                heartbeat_stop_event.set()

            if heartbeat_thread is not None:

                heartbeat_thread.join(
                    timeout=2
                )

            # =================================================
            # MARK JOB COMPLETED
            # =================================================

            db = SessionLocal()

            try:

                fresh_job = (
                    db.query(
                        DescriptiveEvaluationJob
                    )
                    .filter(
                        DescriptiveEvaluationJob.id
                        == job_id
                    )
                    .first()
                )

                if fresh_job:

                    mark_job_completed(
                        db,
                        fresh_job,
                    )

            finally:

                db.close()

            # =================================================
            # UPDATE EXECUTION LOG -> COMPLETED
            # =================================================

            completed_at = datetime.now(
                timezone.utc
            )

            duration_seconds = (
                completed_at - started_at
            ).total_seconds()

            db = SessionLocal()

            try:

                fresh_log = (
                    db.query(
                        DescriptiveEvaluationLog
                    )
                    .filter(
                        DescriptiveEvaluationLog.id
                        == execution_log_id
                    )
                    .first()
                )

                if fresh_log:

                    fresh_log.status = "COMPLETED"

                    fresh_log.completed_at = (
                        completed_at
                    )

                    fresh_log.duration_seconds = (
                        duration_seconds
                    )

                    fresh_log.error = None

                    db.commit()

                    print(
                        f"[EVAL-WORKER-{worker_id}] "
                        f"LOG COMPLETED | "
                        f"log={execution_log_id} | "
                        f"duration="
                        f"{duration_seconds:.2f}s"
                    )

            finally:

                db.close()

        # =====================================================
        # ERROR HANDLING
        # =====================================================

        except Exception as e:

            print(
                f"[EVAL-WORKER-{worker_id}] "
                f"ERROR | "
                f"job="
                f"{job_id if job_id else 'UNKNOWN'} | "
                f"submission="
                f"{submission_id if submission_id else 'UNKNOWN'} | "
                f"job_type="
                f"{job_type if job_type else 'UNKNOWN'} | "
                f"error={e}"
            )

            # =================================================
            # STOP HEARTBEAT AFTER FAILURE
            # =================================================

            try:

                if heartbeat_stop_event is not None:

                    heartbeat_stop_event.set()

                if heartbeat_thread is not None:

                    heartbeat_thread.join(
                        timeout=2
                    )

            except Exception as heartbeat_error:

                print(
                    "[EVAL-WORKER] "
                    "Failed to stop heartbeat: "
                    f"{heartbeat_error}"
                )

            # =================================================
            # UPDATE JOB -> FAILED / RETRY
            # =================================================

            failure_db = None

            try:

                if job_id is not None:

                    failure_db = SessionLocal()

                    fresh_job = (
                        failure_db.query(
                            DescriptiveEvaluationJob
                        )
                        .filter(
                            DescriptiveEvaluationJob.id
                            == job_id
                        )
                        .first()
                    )

                    if fresh_job:

                        mark_job_failed(
                            failure_db,
                            fresh_job,
                            str(e),
                        )

                        print(
                            f"[EVAL-WORKER-{worker_id}] "
                            f"JOB UPDATE | "
                            f"job={fresh_job.id} | "
                            f"attempt="
                            f"{fresh_job.attempts}/"
                            f"{fresh_job.max_attempts} | "
                            f"status="
                            f"{fresh_job.status}"
                        )

            except Exception as retry_error:

                print(
                    "[EVAL-WORKER] "
                    "Failed to update job: "
                    f"{retry_error}"
                )

            finally:

                if failure_db is not None:

                    failure_db.close()

            # =================================================
            # UPDATE EXECUTION LOG -> FAILED
            # =================================================

            if execution_log_id is not None:

                try:

                    completed_at = datetime.now(
                        timezone.utc
                    )

                    if started_at is not None:

                        duration_seconds = (
                            completed_at - started_at
                        ).total_seconds()

                    else:

                        duration_seconds = None

                    log_db = SessionLocal()

                    try:

                        fresh_log = (
                            log_db.query(
                                DescriptiveEvaluationLog
                            )
                            .filter(
                                DescriptiveEvaluationLog.id
                                == execution_log_id
                            )
                            .first()
                        )

                        if fresh_log:

                            fresh_log.status = "FAILED"

                            fresh_log.completed_at = (
                                completed_at
                            )

                            fresh_log.duration_seconds = (
                                duration_seconds
                            )

                            fresh_log.error = str(e)

                            log_db.commit()

                            print(
                                f"[EVAL-WORKER-{worker_id}] "
                                f"LOG FAILED | "
                                f"log={execution_log_id} | "
                                f"duration="
                                f"{duration_seconds:.2f}s"
                            )

                    finally:

                        log_db.close()

                except Exception as log_error:

                    print(
                        f"[EVAL-WORKER-{worker_id}] "
                        "Failed to update execution log: "
                        f"{log_error}"
                    )

            # =================================================
            # WAIT BEFORE NEXT JOB
            # =================================================

            STOP_EVENT.wait(2)

        # =====================================================
        # FINAL SESSION CLEANUP
        # =====================================================

        finally:

            # Make absolutely sure the claim-session
            # connection is closed.

            try:

                db.close()

            except Exception:

                pass

    print(
        f"[EVAL-WORKER-{worker_id}] stopped"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print(
        "======================================"
    )

    print(
        "DESCRIPTIVE EVALUATION WORKER"
    )

    print(
        f"MAX WORKERS: {MAX_WORKERS}"
    )

    print(
        "======================================"
    )

    threads = []

    try:

        for worker_id in range(
            1,
            MAX_WORKERS + 1,
        ):

            thread = threading.Thread(
                target=process_jobs,
                args=(worker_id,),
                daemon=False,
            )

            thread.start()

            threads.append(thread)

        # Keep main thread alive while workers run.

        while True:

            alive = any(
                thread.is_alive()
                for thread in threads
            )

            if not alive:

                break

            time.sleep(1)

    except KeyboardInterrupt:

        print(
            "\n======================================"
        )

        print(
            "SHUTDOWN REQUESTED"
        )

        print(
            "Stopping evaluation workers..."
        )

        print(
            "======================================"
        )

        STOP_EVENT.set()

    finally:

        # Make sure shutdown signal is set even
        # if another exception occurs.

        STOP_EVENT.set()

        for thread in threads:

            thread.join()

        print(
            "======================================"
        )

        print(
            "ALL EVALUATION WORKERS STOPPED"
        )

        print(
            "======================================"
        )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    main()