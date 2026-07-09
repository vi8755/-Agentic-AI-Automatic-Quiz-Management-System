from ..config import settings

from sqlalchemy.orm import Session

from ..tools.email_tools import send_quiz_email

from ..database import SessionLocal
from io import BytesIO
import pandas as pd
from openpyxl import Workbook
from sqlalchemy.exc import IntegrityError

from fastapi.responses import StreamingResponse
from ..models import (
    Quiz,
    QuizAssignment,
    Response,
    Student,
)

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
)
from ..schemas import StudentCreate, AssignQuizRequest,StudentResponse
from email_validator import validate_email, EmailNotValidError
router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.post("/add",response_model=StudentResponse)
def add_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
):

    if (
        not student.name.strip()
        or not student.roll_no.strip()
        or not student.department.strip()
    ):
        raise HTTPException(
            status_code=400,
            detail="All fields are required."
        )

    # ✅ Email validation
    try:
        validate_email(student.email)
    except EmailNotValidError:
        raise HTTPException(
            status_code=400,
            detail="Invalid email address."
        )

    existing = (
        db.query(Student)
        .filter(Student.email == student.email)
        .first()
    )

    if existing:
        raise HTTPException(
    status_code=409,
    detail="Student already exists."
)

    new_student = Student(
        name=student.name,
        roll_no=student.roll_no,
        email=student.email,
        department=student.department,
    )

    try:
     db.add(new_student)
     db.commit()
     db.refresh(new_student)

    except IntegrityError:
     db.rollback()
     raise HTTPException(
        status_code=409,
        detail="Student already exists."
    )

    return {
        "message": "Student added",
        "id": new_student.id,
    }

@router.get("/all")
def get_students(
    db: Session = Depends(get_db),
):
    return db.query(Student).all()


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
    df["Department"] = df["Department"].fillna("").astype(str).str.strip()

    # Remove rows without email
    df = df[df["Email"] != ""]

    # Convert DataFrame to list of dictionaries
    students = df.to_dict(orient="records")

    added = 0
    skipped = 0

    for student in students:

        existing = (
            db.query(Student)
            .filter(Student.email == student["Email"])
            .first()
        )

        if existing:
            skipped += 1
            continue

        db.add(
            Student(
                name=student["Name"],
                roll_no=student["Roll No"],
                email=student["Email"],
                department=student["Department"],
            )
        )

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
):
    quiz_id = data.quiz_id
    student_emails = data.students

    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
            raise HTTPException(
            status_code=404,
            detail="Quiz not found"
)
        

    sent = 0

    for email in student_emails:

        quiz_link = (
            f"{settings.FRONTEND_URL}/quiz/{quiz_id}"
            f"?email={email}"
        )

        existing = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id == quiz_id,
                QuizAssignment.student_email == email,
            )
            .first()
        )

        if existing:
            continue

        assignment = QuizAssignment(
            student_email=email,
            quiz_id=quiz_id,
            status="Assigned",
        )

        db.add(assignment)

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

    db.commit()

    return {
        "message": "Quiz assigned successfully",
        "emails_sent": sent,
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
        "Department"
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

    db.query(QuizAssignment).filter(
        QuizAssignment.student_email == student.email
    ).delete()

    db.query(Response).filter(
        Response.student_email == student.email
    ).delete()

    db.delete(student)

    db.commit()

    return {
        "message": "Student deleted successfully"
    }

@router.get("/check-responses")
def check_responses(db: Session = Depends(get_db)):
    return db.query(Response).all()