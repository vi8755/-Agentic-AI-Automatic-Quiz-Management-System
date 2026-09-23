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

from ..database import SessionLocal

from ..models import (
    User,
    UserRole,
    Student,
    Section,
    QuizAssignment,
    Response,
    Batch,
)

from ..schemas import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
)

from ..security import (
    hash_password,
    require_role,
)

from ..services.auth_service import (
    send_email_verification, resend_email_verification,
)

# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/dean/students",
    tags=["Dean Student Management"],
)


# =====================================================
# DATABASE DEPENDENCY
# =====================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =====================================================
# GET ALL STUDENTS
# =====================================================

@router.get(
    "",
    response_model=list[StudentResponse],
)
def get_dean_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):

    students = (
        db.query(Student)
        .join(
            User,
            Student.user_id == User.id,
        )
        .join(
            Section,
            Student.section_id == Section.id,
        )
        .order_by(User.name)
        .all()
    )

    result = []

    for student in students:

        # =====================================================
        # DEBUG
        # =====================================================

        print(
            "DEBUG STUDENT:",
            student.id,
            "SECTION:",
            student.section_id,
            "YEAR:",
            (
                student.section.year
                if student.section
                else None
            ),
            "SEMESTER:",
            (
                student.section.semester
                if student.section
                else None
            ),
            "BATCH:",
            (
                student.section.batch_id
                if student.section
                else None
            ),
            "BATCH NAME:",
            (
                student.section.batch.batch_name
                if student.section
                and student.section.batch
                else None
            ),
        )

        # =====================================================
        # STUDENT RESPONSE
        # =====================================================

        result.append(
            StudentResponse(
                id=student.id,
                user_id=student.user_id,

                name=student.user.name,
                email=student.user.email,
                roll_no=student.roll_no,

                section_id=student.section_id,

                section_name=(
                    student.section.section_name
                    if student.section
                    else None
                ),

                batch_id=(
                    student.section.batch_id
                    if student.section
                    else None
                ),

                batch_name=(
                    student.section.batch.batch_name
                    if student.section
                    and student.section.batch
                    else None
                ),

                department=(
                    student.section.department
                    if student.section
                    else None
                ),

                year=(
                    student.section.year
                    if student.section
                    else None
                ),

                semester=(
                    student.section.semester
                    if student.section
                    else None
                ),

                is_active=student.is_active,
                email_verified=student.user.email_verified,

                created_at=student.created_at,
                updated_at=student.updated_at,
            )
        )

    return result
# =====================================================
# CREATE STUDENT
# =====================================================

@router.post(
    "",
    response_model=StudentResponse,
    status_code=201,
)
def create_dean_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    print("🔥🔥🔥 THIS IS THE CURRENT DEAN STUDENT CREATE FUNCTION 🔥🔥🔥")

    # ---------------------------------------------
    # Check email
    # ---------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == student.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already exists.",
        )

    # ---------------------------------------------
    # Check roll number
    # ---------------------------------------------

    existing_roll = (
        db.query(Student)
        .filter(
            Student.roll_no == student.roll_no
        )
        .first()
    )

    if existing_roll:

        raise HTTPException(
            status_code=400,
            detail="Roll number already exists.",
        )

    # ---------------------------------------------
    # Check section
    #
    # Section must:
    # - exist
    # - be active
    # ---------------------------------------------

    section = (
    db.query(Section)
    .join(
        Batch,
        Section.batch_id == Batch.id,
    )
    .filter(
        Section.id == student.section_id,
        Section.is_active == True,
        Batch.is_active == True,
    )
    .first()
)

    if not section:

        raise HTTPException(
            status_code=404,
            detail="Section not found or inactive.",
        )

    # ---------------------------------------------
    # Create User
    # ---------------------------------------------

    user = User(
    name=student.name,
    email=student.email,
    password=hash_password(
        student.password
    ),
    role=UserRole.STUDENT,
    is_active=True,
    email_verified=False,
    )

    db.add(user)

    db.flush()

    # ---------------------------------------------
    # Create Student
    # ---------------------------------------------

    new_student = Student(
        user_id=user.id,
        roll_no=student.roll_no,
        section_id=student.section_id,
        is_active=True,
    )

    db.add(new_student)

    db.commit()

    db.refresh(new_student)
# ---------------------------------------------
# Send email verification
# ---------------------------------------------

    print("========== STARTING EMAIL VERIFICATION ==========")
    print("User ID:", user.id)
    print("User Email:", user.email)

    send_email_verification(
     db,
     user,
    temporary_password=student.password,
    )

    print("========== EMAIL VERIFICATION FUNCTION FINISHED ==========")

    # ---------------------------------------------
    # Response
    # ---------------------------------------------

    return StudentResponse(
        id=new_student.id,
        user_id=new_student.user_id,

        name=user.name,
        email=user.email,
        roll_no=new_student.roll_no,

        section_id=new_student.section_id,

        section_name=section.section_name,

        batch_id=section.batch_id,

        batch_name=(
            section.batch.batch_name
            if section.batch
            else None
        ),

        department=section.department,
        year=section.year,
        semester=section.semester,

        is_active=new_student.is_active,
        email_verified=user.email_verified,

        created_at=new_student.created_at,
        updated_at=new_student.updated_at,
    )

# =====================================================
# RESEND EMAIL VERIFICATION
# =====================================================

@router.post(
    "/{student_id}/resend-verification",
)
def resend_dean_student_verification(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):
    # ---------------------------------------------
    # Find student
    # ---------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # ---------------------------------------------
    # Find user account
    # ---------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id == student.user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Student user account not found.",
        )

    # ---------------------------------------------
    # Check verification status
    # ---------------------------------------------

    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="This student's email is already verified.",
        )

    # ---------------------------------------------
    # Send fresh verification email
    # ---------------------------------------------

    try:
        resend_email_verification(
            db,
            user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(
            "Failed to resend verification email:",
            str(e),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to send verification email.",
        )

    # ---------------------------------------------
    # Success response
    # ---------------------------------------------

    return {
        "message": (
            "Verification email sent successfully."
        ),
        "student_id": student.id,
        "email": user.email,
    }
# =====================================================
# UPDATE STUDENT
# =====================================================

@router.put(
    "/{student_id}",
    response_model=StudentResponse,
)
def update_dean_student(
    student_id: int,
    student: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):

    # ---------------------------------------------
    # Find student
    # ---------------------------------------------

    existing_student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not existing_student:

        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # ---------------------------------------------
    # Check email
    # ---------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == student.email,
            User.id != existing_student.user_id,
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already exists.",
        )

    # ---------------------------------------------
    # Check roll number
    # ---------------------------------------------

    existing_roll = (
        db.query(Student)
        .filter(
            Student.roll_no == student.roll_no,
            Student.id != student_id,
        )
        .first()
    )

    if existing_roll:

        raise HTTPException(
            status_code=400,
            detail="Roll number already exists.",
        )

    # ---------------------------------------------
    # Check new section
    #
    # Section must:
    # - exist
    # - be active
    #
    # Changing section automatically changes
    # student's Batch / Year / Semester /
    # Department information because those
    # belong to Section.
    # ---------------------------------------------

    section = (
    db.query(Section)
    .join(
        Batch,
        Section.batch_id == Batch.id,
    )
    .filter(
        Section.id == student.section_id,
        Section.is_active == True,
        Batch.is_active == True,
    )
    .first()
)

    if not section:

        raise HTTPException(
            status_code=404,
            detail="Section not found or inactive.",
        )

    # ---------------------------------------------
    # Find User
    # ---------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id == existing_student.user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Student user account not found.",
        )

    # ---------------------------------------------
    # Update User
    # ---------------------------------------------

    user.name = student.name
    user.email = student.email

    # ---------------------------------------------
    # Update Student
    # ---------------------------------------------

    existing_student.roll_no = student.roll_no

    # IMPORTANT:
    # Changing section changes the student's
    # academic placement.
    existing_student.section_id = student.section_id

    db.commit()

    db.refresh(existing_student)

    # ---------------------------------------------
    # Response
    # ---------------------------------------------

    return StudentResponse(
        id=existing_student.id,
        user_id=existing_student.user_id,

        name=user.name,
        email=user.email,
        roll_no=existing_student.roll_no,

        section_id=existing_student.section_id,

        section_name=section.section_name,

        batch_id=section.batch_id,

        batch_name=(
            section.batch.batch_name
            if section.batch
            else None
        ),

        department=section.department,
        year=section.year,
        semester=section.semester,

        is_active=existing_student.is_active,
        email_verified=user.email_verified,

        created_at=existing_student.created_at,
        updated_at=existing_student.updated_at,
    )


# =====================================================
# ACTIVATE / DEACTIVATE STUDENT
# =====================================================

@router.patch(
    "/{student_id}/status",
)
def update_dean_student_status(
    student_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):

    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    student.is_active = is_active

    db.commit()

    db.refresh(student)

    return {
        "message": (
            "Student activated successfully."
            if is_active
            else "Student deactivated successfully."
        ),
        "id": student.id,
        "is_active": student.is_active,
    }


# =====================================================
# DELETE STUDENT
# =====================================================

@router.delete(
    "/{student_id}",
)
def delete_dean_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):

    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    user = (
        db.query(User)
        .filter(
            User.id == student.user_id
        )
        .first()
    )

    # ---------------------------------------------
    # Remove quiz assignments
    # ---------------------------------------------

    db.query(QuizAssignment).filter(
        QuizAssignment.student_id == student.id
    ).delete(
        synchronize_session=False
    )

    # ---------------------------------------------
    # Remove responses
    # ---------------------------------------------

    if user:

        db.query(Response).filter(
            Response.student_email == user.email
        ).delete(
            synchronize_session=False
        )

    # ---------------------------------------------
    # Delete Student
    # ---------------------------------------------

    db.delete(student)

    # ---------------------------------------------
    # Delete User
    # ---------------------------------------------

    if user:

        db.delete(user)

    db.commit()

    return {
        "message": "Student deleted successfully.",
        "id": student_id,
    }


# =====================================================
# BULK EXCEL UPLOAD
# =====================================================

@router.post(
    "/upload-excel",
)
async def upload_dean_students_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):

    # ---------------------------------------------
    # Validate file
    # ---------------------------------------------

    if not file.filename.lower().endswith(
        (".xlsx", ".xls")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an Excel file.",
        )

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

    # ---------------------------------------------
    # Clean column names
    # ---------------------------------------------

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
    )

    required_columns = {
        "Name",
        "Roll No",
        "Email",
        "Section ID",
    }

    missing_columns = (
        required_columns
        - set(df.columns)
    )

    if missing_columns:

        raise HTTPException(
            status_code=400,
            detail=(
                "Missing required columns: "
                + ", ".join(missing_columns)
            ),
        )

    df = df.dropna(how="all")

    # ---------------------------------------------
    # Clean values
    # ---------------------------------------------

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

    added = 0
    skipped = 0
    emails_sent = 0
    emails_failed = 0

    created_students = []

    # ---------------------------------------------
    # Process students
    # ---------------------------------------------

    for _, row in df.iterrows():

        name = row["Name"]
        roll_no = row["Roll No"]
        email = row["Email"]
        section_id = row["Section ID"]

        if (
            not name
            or not roll_no
            or not email
            or not section_id
        ):

            skipped += 1
            continue

        # -----------------------------------------
        # Validate Section ID
        # -----------------------------------------

        try:

            section_id = int(
                float(section_id)
            )

        except (ValueError, TypeError):

            skipped += 1
            continue

        # -----------------------------------------
        # Check active Section
        # -----------------------------------------

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
            continue

        # -----------------------------------------
        # Check email
        # -----------------------------------------

        existing_user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if existing_user:

            skipped += 1
            continue

        # -----------------------------------------
        # Check roll number
        # -----------------------------------------

        existing_roll = (
            db.query(Student)
            .filter(
                Student.roll_no == roll_no
            )
            .first()
        )

        if existing_roll:

            skipped += 1
            continue

        # -----------------------------------------
        # Create User
        # -----------------------------------------
        temporary_password = roll_no + "@123"

        user = User(
            name=name,
            email=email,
            password=hash_password(
                temporary_password
            ),
            role=UserRole.STUDENT,
            is_active=True,
            email_verified=False,
        )

        db.add(user)

        db.flush()

        # -----------------------------------------
        # Create Student
        # -----------------------------------------

        new_student = Student(
            user_id=user.id,
            roll_no=roll_no,
            section_id=section_id,
            is_active=True,
        )

        db.add(new_student)
        created_students.append(
    {
        "user": user,
        "temporary_password": temporary_password,
    }
)

        added += 1

    db.commit()

# ---------------------------------------------
# Send welcome + verification emails
# ---------------------------------------------

    for created_student in created_students:

      user = created_student["user"]

    temporary_password = (
        created_student["temporary_password"]
    )

    try:

        send_email_verification(
            db,
            user,
            temporary_password=temporary_password,
        )

        emails_sent += 1

    except Exception as e:

        print(
            f"Failed to send student welcome email "
            f"to {user.email}: {e}"
        )

        emails_failed += 1
    return {
     "message": "Students uploaded successfully.",
    "added": added,
    "skipped": skipped,
    "emails_sent": emails_sent,
    "emails_failed": emails_failed,
}


# =====================================================
# DOWNLOAD EXCEL TEMPLATE
# =====================================================

@router.get(
    "/download-template",
)
def download_dean_student_template(
    current_user: User = Depends(
        require_role(UserRole.DEAN)
    ),
):

    workbook = Workbook()

    sheet = workbook.active

    sheet.title = "Students"

    sheet.append(
        [
            "Name",
            "Roll No",
            "Email",
            "Section ID",
        ]
    )

    excel_file = BytesIO()

    workbook.save(excel_file)

    excel_file.seek(0)

    return StreamingResponse(
        excel_file,
        media_type=(
            "application/vnd."
            "openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
            "attachment; "
            "filename=student_template.xlsx"
        },
    )