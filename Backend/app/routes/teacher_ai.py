import traceback

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import (
    User,
    UserRole,
    Quiz,
    Question,
)
from ..security import require_role
from ..services.teacher_ai_service import extract_pdf_text


router = APIRouter(
    prefix="",
    tags=["Teacher AI"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload-pdf")
def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:

        print("\n========== AI QUIZ DEBUG ==========")

        print("Step 1: Starting AI generation...")

        # Generate quiz using AI pipeline
        ai_result = extract_pdf_text(file)

        print("Step 2: AI generation completed.")

        quiz_data = ai_result["quiz"]

        print("Quiz Title:", quiz_data["title"])
        print("Total Questions:", len(quiz_data["questions"]))

        print("Teacher ID:", current_user.teacher.id)

        # Create Quiz record
        quiz = Quiz(
            title=quiz_data["title"],
            teacher_id=current_user.teacher.id,
            status=quiz_data.get(
                "status",
                "Draft"
            ),
        )

        print("Adding quiz to database...")

        db.add(quiz)

        print("Flushing database...")

        db.flush()

        print("Generated Quiz ID:", quiz.id)

        # Create Question records
        questions = quiz_data["questions"]

        print(f"Saving {len(questions)} questions...")

        for index, question in enumerate(
            questions,
            start=1
        ):

            options = question["options"]

            db_question = Question(
                quiz_id=quiz.id,

                question_text=question["question"],

                option_a=options[0],
                option_b=options[1],
                option_c=options[2],
                option_d=options[3],

                correct_answer=question["correct_answer"],

                explanation=question.get(
                    "explanation"
                ),

                marks=1,

                question_order=index,
            )

            db.add(db_question)

        print("Committing transaction...")

        db.commit()

        print("Database commit successful.")

        print("========== SUCCESS ==========\n")

        return {
            "message": "Quiz generated successfully",
            "quiz_id": quiz.id,
            "total_questions": len(questions),
        }

    except Exception as e:

        db.rollback()

        print("\n========== FULL ERROR ==========")
        traceback.print_exc()
        print("================================\n")

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )