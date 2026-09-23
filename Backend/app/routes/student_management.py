from io import BytesIO
import secrets
from datetime import datetime, timedelta
import pandas as pd
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from openpyxl import Workbook

from sqlalchemy.orm import Session
from ..security import (
    hash_password,
    require_role,
)
from ..config import settings
from ..database import SessionLocal
from ..models import (
    Quiz,
    QuizAssignment,
    Response,
    Student,
    Teacher,
    User,
    UserRole,
    Section,
)
from ..schemas import (
    AssignQuizRequest,
    AssignQuizSectionRequest,
)
from ..tools.email_tools import send_quiz_email

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload_excel")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    contents = await file.read()

    try:
        df = pd.read_excel(
            BytesIO(contents),
            engine="openpyxl",
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid Excel file.",
        )

    # --------------------------------------------------------
    # Clean column names
    # --------------------------------------------------------

    df.columns = df.columns.str.strip()

    required_columns = {
        "Name",
        "Roll No",
        "Email",
        "Section ID",
    }

    missing_columns = (
        required_columns - set(df.columns)
    )

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing required columns: "
                + ", ".join(sorted(missing_columns))
            ),
        )

    # --------------------------------------------------------
    # Remove completely empty rows
    # --------------------------------------------------------

    df = df.dropna(how="all")

    # --------------------------------------------------------
    # Clean values
    # --------------------------------------------------------

    df["Name"] = (
        df["Name"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["Roll No"] = (
        df["Roll No"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["Email"] = (
        df["Email"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["Section ID"] = (
        df["Section ID"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    students = df.to_dict(
        orient="records"
    )

    added = 0
    skipped = 0
    errors = []

    # --------------------------------------------------------
    # Process every Excel row
    # --------------------------------------------------------

    for row_number, student in enumerate(
        students,
        start=2,
    ):

        name = student["Name"]
        roll_no = student["Roll No"]
        email = student["Email"]
        section_id_value = student["Section ID"]

        # ----------------------------------------------------
        # Required field validation
        # ----------------------------------------------------

        if not name:
            skipped += 1

            errors.append({
                "row": row_number,
                "error": "Name is required.",
            })

            continue

        if not roll_no:
            skipped += 1

            errors.append({
                "row": row_number,
                "error": "Roll number is required.",
            })

            continue

        if not email:
            skipped += 1

            errors.append({
                "row": row_number,
                "error": "Email is required.",
            })

            continue

        if not section_id_value:
            skipped += 1

            errors.append({
                "row": row_number,
                "error": "Section ID is required.",
            })

            continue

        # ----------------------------------------------------
        # Validate Section ID
        # ----------------------------------------------------

        try:
            section_id = int(
                float(section_id_value)
            )
        except (ValueError, TypeError):
            skipped += 1

            errors.append({
                "row": row_number,
                "error": (
                    f"Invalid Section ID: "
                    f"{section_id_value}"
                ),
            })

            continue

        # ----------------------------------------------------
        # Check Section
        # ----------------------------------------------------

        section = (
            db.query(Section)
            .filter(
                Section.id == section_id,
                Section.is_active == True,
            )
            .first()
        )

        if not section:
            skipped += 1

            errors.append({
                "row": row_number,
                "error": (
                    f"Section {section_id} "
                    "not found or inactive."
                ),
            })

            continue

        # ----------------------------------------------------
        # Check Batch
        # ----------------------------------------------------

        if (
            not section.batch
            or not section.batch.is_active
        ):
            skipped += 1

            errors.append({
                "row": row_number,
                "error": (
                    f"Batch for Section "
                    f"{section_id} is not found "
                    "or inactive."
                ),
            })

            continue

        # ----------------------------------------------------
        # Check duplicate email
        # ----------------------------------------------------

        existing_user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if existing_user:
            skipped += 1

            errors.append({
                "row": row_number,
                "error": (
                    f"Email already exists: "
                    f"{email}"
                ),
            })

            continue

        # ----------------------------------------------------
        # Check duplicate roll number
        # ----------------------------------------------------

        existing_roll = (
            db.query(Student)
            .filter(
                Student.roll_no == roll_no
            )
            .first()
        )

        if existing_roll:
            skipped += 1

            errors.append({
                "row": row_number,
                "error": (
                    f"Roll number already exists: "
                    f"{roll_no}"
                ),
            })

            continue

        # ----------------------------------------------------
        # Create User
        # ----------------------------------------------------

        user = User(
            name=name,
            email=email,
            password=hash_password(
                roll_no + "@123"
            ),
            role=UserRole.STUDENT,
        )

        db.add(user)

        # Generate user.id
        db.flush()

        # ----------------------------------------------------
        # Create Student
        #
        # Only section_id is stored.
        #
        # Batch, department, year and semester
        # come from Section.
        # ----------------------------------------------------

        new_student = Student(
            user_id=user.id,
            roll_no=roll_no,
            section_id=section_id,
        )

        db.add(new_student)

        added += 1

    # --------------------------------------------------------
    # Commit all successful rows
    # --------------------------------------------------------

    db.commit()

    return {
        "message": "Students uploaded successfully.",
        "added": added,
        "skipped": skipped,
        "errors": errors,
    }

@router.post("/assign_quiz")
def assign_quiz(
    
    data: AssignQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    print("ASSIGN QUIZ FUNCTION RUNNING")
    quiz_id = data.quiz_id
    student_emails = data.students

    teacher = (
        db.query(Teacher)
        .filter(
            Teacher.user_id == current_user.id
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher profile not found.",
        )

    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    sent = 0

    for email in student_emails:

        # Find student using email
        student = (
            db.query(Student)
            .join(User)
            .filter(User.email == email)
            .first()
        )

        if not student:
            continue


        # Prevent duplicate assignment
        existing = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id == quiz_id,
                QuizAssignment.student_id == student.id,
            )
            .first()
        )

        if existing:
            continue


        # Generate secure token
        token = secrets.token_urlsafe(32)
        print("GENERATED TOKEN:", token)

        # Quiz expiry (7 days)
        expires_at = datetime.utcnow() + timedelta(days=7)


        # Secure quiz URL
        quiz_link = (
            f"{settings.FRONTEND_URL}/quiz/start/{token}"
        )


        assignment = QuizAssignment(
            quiz_id=quiz_id,
            teacher_id=teacher.id,
            student_id=student.id,
            section_id=student.section_id,
            student_email=email,
            start_time=request.start_time,
            status="Assigned",
            token=token,
            expires_at=expires_at,
        )

        db.add(assignment)

        try:
            send_quiz_email.invoke(
                {
                    "receiver_email": email,
                    "subject": "AI Generated Quiz Assigned",
                    "body": f"""
Hello Student,

You have been assigned a new quiz.

Quiz:
{quiz.title}

Attempt your quiz here:

{quiz_link}

Good luck!

AI Quiz System
""",
                }
            )

            sent += 1

        except Exception as e:
            print(f"Email sending failed for {email}: {e}")


    db.commit()


    return {
        "message": "Quiz assigned successfully",
        "emails_sent": sent,
    }
@router.post("/assign_quiz_section")
def assign_quiz_section(
    data: AssignQuizSectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    # Find teacher
    teacher = (
        db.query(Teacher)
        .filter(Teacher.user_id == current_user.id)
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher profile not found.",
        )

    # Find quiz
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == data.quiz_id)
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    # Find section
    section = (
        db.query(Section)
        .filter(Section.id == data.section_id)
        .first()
    )

    if not section:
        raise HTTPException(
            status_code=404,
            detail="Section not found.",
        )

    # Get students
    students = (
        db.query(Student)
        .filter(Student.section_id == data.section_id)
        .all()
    )

    if not students:
        raise HTTPException(
            status_code=404,
            detail="No students found in this section.",
        )

    # Counters
    assigned = 0
    emails_sent = 0

    # Loop through students
    for student in students:

        user = (
            db.query(User)
            .filter(User.id == student.user_id)
            .first()
        )

        if not user:
            continue

        existing = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id == quiz.id,
                QuizAssignment.student_id == student.id,
            )
            .first()
        )

        if existing:
            continue

        assignment = QuizAssignment(
            quiz_id=quiz.id,
            teacher_id=teacher.id,
            student_id=student.id,
            section_id=section.id,
            student_email=user.email,  # Version 1 compatibility
            status="Assigned",
            due_date=data.due_date,
        )

        db.add(assignment)

        quiz_link = (
            f"{settings.FRONTEND_URL}/quiz/{quiz.id}"
            f"?email={user.email}"
        )

        try:
            send_quiz_email.invoke(
                {
                    "receiver_email": user.email,
                    "subject": "AI Generated Quiz Assigned",
                    "body": f"""
Hello {user.name},

You have been assigned a new quiz.

Quiz:
{quiz.title}

Attempt your quiz here:

{quiz_link}

Good luck!

AI Quiz System
""",
                }
            )

            emails_sent += 1

        except Exception as e:
            print(f"Email failed for {user.email}: {e}")

        assigned += 1

    db.commit()

    return {
        "message": "Quiz assigned successfully.",
        "students_assigned": assigned,
        "emails_sent": emails_sent,
    }

@router.get("/assignments")
def get_assignments(
    db: Session = Depends(get_db),
):
    return db.query(QuizAssignment).all()


@router.get("/download_template")
def download_template():

    workbook = Workbook()

    sheet = workbook.active
    sheet.title = "Students"

    sheet.append([
        "Name",
        "Roll No",
        "Email",
        "Section ID"
    ])

    excel_file = BytesIO()

    workbook.save(excel_file)

    excel_file.seek(0)

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition":
            "attachment; filename=student_template.xlsx"
        },
    )

@router.delete("/delete/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
):

    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )


    # Get linked user
    user = (
        db.query(User)
        .filter(User.id == student.user_id)
        .first()
    )

    if user:

        # Keep Version 1 quiz data cleanup working
        db.query(QuizAssignment).filter(
            QuizAssignment.student_email == user.email
        ).delete()

        db.query(Response).filter(
            Response.student_email == user.email
        ).delete()


    # Delete student profile
    db.delete(student)


    # Delete user account
    if user:
        db.delete(user)


    db.commit()


    return {
        "message": "Student deleted successfully"
    }