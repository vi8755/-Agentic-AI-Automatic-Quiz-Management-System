from io import BytesIO

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
):
    contents = await file.read()

    df = pd.read_excel(
        BytesIO(contents),
        engine="openpyxl"
    )

    # Remove extra spaces from column names
    df.columns = df.columns.str.strip()

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Clean values
    df["Name"] = df["Name"].fillna("").astype(str).str.strip()
    df["Roll No"] = df["Roll No"].fillna("").astype(str).str.strip()
    df["Email"] = df["Email"].fillna("").astype(str).str.strip()
    df["Section ID"] = (
        df["Section ID"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    # Remove rows without email
    df = df[df["Email"] != ""]

    students = df.to_dict(orient="records")

    added = 0
    skipped = 0

    for student in students:

        # Check user already exists
        existing_user = (
            db.query(User)
            .filter(
                User.email == student["Email"]
            )
            .first()
        )

        if existing_user:
            skipped += 1
            continue


        # Create User account
        user = User(
            name=student["Name"],
            email=student["Email"],
            password=hash_password(
                student["Roll No"] + "@123"
            ),
            role=UserRole.STUDENT,
        )

        db.add(user)

        # Generate user.id before creating student
        db.flush()


        # Create Student profile
        new_student = Student(
            user_id=user.id,
            roll_no=student["Roll No"],
            section_id=int(student["Section ID"]),
        )

        db.add(new_student)

        added += 1


    db.commit()

    return {
        "message": "Students uploaded successfully",
        "added": added,
        "skipped": skipped,
    }
@router.post("/assign_quiz")
def assign_quiz(
    data: AssignQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
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

        quiz_link = (
            f"{settings.FRONTEND_URL}/quiz/{quiz_id}"
            f"?email={email}"
        )

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

        assignment = QuizAssignment(
            quiz_id=quiz_id,
            teacher_id=teacher.id,
            student_id=student.id,
            section_id=student.section_id,
            student_email=email,   # Version 1 compatibility
            status="Assigned",
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