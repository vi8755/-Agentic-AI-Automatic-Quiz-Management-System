import traceback
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File,Form
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import (
    User,
    UserRole,
    Quiz,
    Question,
)
from ..schemas import GeneratePDFQuizRequest
from ..security import require_role
from ..services.teacher_ai_service import (
    extract_pdf_text,
    analyze_pdf,
    analyze_question_bank_pdf,
    generate_quiz_from_question_bank,
)   


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
@router.post("/analyze-pdf")
def analyze_pdf_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    try:
        result = analyze_pdf(file)

        return result

    except Exception as e:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
 
@router.post("/analyze-question-bank")
def analyze_question_bank(
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
    try:

        print(
            "\n========== QUESTION BANK AI ANALYSIS =========="
        )

        result = analyze_question_bank_pdf(
            file
        )

        print("Pages:", result.get("pages", 0))
        print("Topics:", result.get("total_topics", 0))
        print("Questions:", result.get("total_questions", 0))

        print(
            "===============================================\n"
        )

        return result

    except Exception as e:

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
@router.post("/generate-question-bank-quiz")
def generate_question_bank_quiz(
    file: UploadFile = File(...),

    selected_topics: str = Form(...),

    question_count: int = Form(...),

    difficulty: str = Form("Medium"),

    bloom_level: str = Form("Understand"),

    time_limit: int = Form(30),

    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),

    db: Session = Depends(get_db),
):
    try:

        print(
            "\n========== QUESTION BANK QUIZ GENERATION =========="
        )

        topics = json.loads(
            selected_topics
        )

        print(
            "Selected Topics:",
            topics
        )

        teacher_id = (
            current_user.teacher.id
        )

        print(
            "Teacher ID:",
            teacher_id
        )

        # =====================================================
        # Generate ACTUAL source questions
        # =====================================================

        ai_result = (
            generate_quiz_from_question_bank(
                file=file,
                selected_topics=topics,
                question_count=question_count,
                difficulty=difficulty,
                bloom_level=bloom_level,
                time_limit=time_limit,
            )
        )

        questions = ai_result[
            "questions"
        ]

        # =====================================================
        # CREATE QUIZ
        # =====================================================

        quiz = Quiz(
            title=ai_result.get(
                "title",
                "Question Bank Quiz",
            ),

            teacher_id=teacher_id,

            status="Draft",

            duration_minutes=time_limit,
        )

        db.add(quiz)

        db.flush()

        print(
            "Generated Quiz ID:",
            quiz.id
        )

        # =====================================================
        # CREATE QUESTIONS
        # =====================================================

        for index, question in enumerate(
            questions,
            start=1,
        ):

            options = question[
                "options"
            ]

            db_question = Question(

                quiz_id=quiz.id,

                question_text=question[
                    "question"
                ],

                option_a=options[0],

                option_b=options[1],

                option_c=options[2],

                option_d=options[3],

                correct_answer=question[
                    "correct_answer"
                ],

                explanation=question.get(
                    "explanation",
                    "",
                ),

                marks=1,

                question_order=index,
                topic=question.get("source_topic"),
            )

            db.add(
                db_question
            )

        # =====================================================
        # SAVE
        # =====================================================

        db.commit()

        db.refresh(
            quiz
        )

        print(
            "Database commit successful."
        )

        print(
            "========== QUESTION BANK SUCCESS ==========\n"
        )

        return {
            "message":
                "Question Bank Quiz "
                "generated and saved successfully",

            "quiz_id":
                quiz.id,

            "title":
                quiz.title,

            "total_questions":
                len(questions),

            "selected_topics":
                topics,
        }

    except Exception as e:

        db.rollback()

        print(
            "\n========== QUESTION BANK ERROR =========="
        )

        traceback.print_exc()

        print(
            "========================================\n"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
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

        # Get teacher ID BEFORE the long AI generation
        teacher_id = current_user.teacher.id

        print("Teacher ID:", teacher_id)

# End the current DB transaction so the connection
# is returned to the pool before AI processing starts.
        db.commit()

        print("\n========== AI QUIZ DEBUG ==========")
        print("Step 1: Starting AI generation...")

# Generate quiz using AI pipeline
        ai_result = extract_pdf_text(file)

        print("Step 2: AI generation completed.")

        quiz_data = ai_result["quiz"]

        print("Quiz Title:", quiz_data["title"])
        print("Total Questions:", len(quiz_data["questions"]))

        print("Teacher ID:", teacher_id)

        # Create Quiz record
        quiz = Quiz(
            title=quiz_data["title"],
            teacher_id=teacher_id,
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
                topic=question.get("topic"),
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
    
@router.post("/generate-pdf-quiz")
def generate_pdf_quiz(
    file: UploadFile = File(...),
    request: str = Form(...),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        print("\n========== AI PDF QUIZ GENERATION ==========")

        # Convert JSON string from FormData
        quiz_request = GeneratePDFQuizRequest.model_validate_json(
            request
        )

        print("Selected Topics:", quiz_request.selected_topics)
        print("Question Count:", quiz_request.question_count)
        print("Difficulty:", quiz_request.difficulty)
        print("Bloom Level:", quiz_request.bloom_level)
        print("Time Limit:", quiz_request.time_limit)

        # Get teacher ID before AI generation
        teacher_id = current_user.teacher.id

        print("Teacher ID:", teacher_id)

        # Generate quiz using selected settings
        ai_result = extract_pdf_text(
            file=file,
            selected_topics=quiz_request.selected_topics,
            question_count=quiz_request.question_count,
            difficulty=quiz_request.difficulty,
            bloom_level=quiz_request.bloom_level,
            time_limit=quiz_request.time_limit,
        )

        print("AI generation completed.")

        quiz_data = ai_result["quiz"]

        print("Quiz Title:", quiz_data["title"])
        print(
            "Total Questions:",
            len(quiz_data["questions"])
        )

        # =========================
        # Create Quiz
        # =========================

        quiz = Quiz(
            title=quiz_data["title"],
            teacher_id=teacher_id,
            status=quiz_data.get(
                "status",
                "Draft",
            ),
        )

        db.add(quiz)
        db.flush()

        print("Generated Quiz ID:", quiz.id)

        # =========================
        # Create Questions
        # =========================

        questions = quiz_data["questions"]

        for index, question in enumerate(
            questions,
            start=1,
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
                topic=question.get("topic"),
            )

            db.add(db_question)

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