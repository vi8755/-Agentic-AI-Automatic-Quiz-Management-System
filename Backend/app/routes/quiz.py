import random
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi import BackgroundTasks
import threading
from sqlalchemy.orm import Session

from ..database import SessionLocal

from ..config import settings
from ..schemas import QuizCreate, QuizSubmit
from ..schemas import (
    AssignQuizRequest,
)

from langchain_core.messages import HumanMessage
from ..models import Quiz,Response,QuizAssignment

from ..evaluation_graph import app as evaluation_app
from ..agent_graph import app
from ..schemas import GenerateQuizRequest, GenerateTopicQuizRequest
from ..tools.quiz_tools import (generate_quiz, generate_topic_quiz_v2)
from ..tools.web_quiz_tools import create_quiz_web
from ..models import (
    Quiz,
    Question,
    Response,
    QuizAssignment,
    Teacher,
    User,
    UserRole,
    Student,
)

from datetime import datetime, timezone, timedelta

from ..security import require_role

router = APIRouter()



def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()



@router.post("/create_quiz")
def create_quiz(
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
):
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

    new_quiz = Quiz(
        title=quiz.title,
        questions=quiz.questions,
        teacher_id=teacher.id,
        subject_id=quiz.subject_id,
    )

    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)


    return {


        "message": "Quiz created",


        "quiz_id": new_quiz.id,


        "quiz_url":
        f"{settings.FRONTEND_URL}/quiz/{new_quiz.id}"

    }

@router.get("/get_quiz/{quiz_id}")
def get_quiz(

    quiz_id:int,

    db:Session = Depends(get_db)

):

    
    quiz = db.query(Quiz).filter(

        Quiz.id == quiz_id

    ).first()
     



    if not quiz:

        return {

            "error":"Quiz not found"

        }



    safe_questions=[]



    for q in quiz.questions:


        safe_questions.append({

            "question": q["question"],

            "options": q["options"]

        })



    return {


        "id":quiz.id,


        "title":quiz.title,


        "questions":safe_questions

    }
# ============================================================
# Background AI Evaluation
# ============================================================

# Maximum number of AI evaluations running at the same time.
# Start with 5. We can increase this after testing.
AI_EVALUATION_SEMAPHORE = threading.Semaphore(5)
def run_ai_evaluation_background(
    response_id: int,
    evaluation_state: dict,
    engine,
):
    """
    Run LangGraph AI evaluation after the student's
    quiz submission has already been saved.

    The student's score/submission does NOT depend
    on this function succeeding.
    """

    background_db = Session(bind=engine)

    try:

        # Limit concurrent Groq/LangGraph evaluations.
        with AI_EVALUATION_SEMAPHORE:

            print("=" * 60)
            print("🤖 BACKGROUND AI EVALUATION STARTED")
            print("Response ID:", response_id)
            print(
                "Student:",
                evaluation_state.get(
                    "student_email"
                ),
            )
            print("=" * 60)

            # ---------------------------------------------
            # Find saved response
            # ---------------------------------------------

            response_record = (
                background_db
                .query(Response)
                .filter(
                    Response.id == response_id
                )
                .first()
            )

            if not response_record:

                print(
                    "❌ Response not found:",
                    response_id,
                )

                return

            # ---------------------------------------------
            # Run LangGraph
            # ---------------------------------------------

            evaluation_result = (
                evaluation_app.invoke(
                    evaluation_state
                )
            )

            if not evaluation_result:

                print(
                    "⚠️ LangGraph returned no result."
                )

                return

            # ---------------------------------------------
            # Save structured AI analysis
            # ---------------------------------------------

            response_record.ai_analysis = {
                "performance_summary": (
                    evaluation_result.get(
                        "performance_summary",
                        "",
                    )
                ),

                "strengths": (
                    evaluation_result.get(
                        "strengths",
                        [],
                    )
                ),

                "weak_areas": (
                    evaluation_result.get(
                        "weak_areas",
                        [],
                    )
                ),

                "improvement_plan": (
                    evaluation_result.get(
                        "improvement_plan",
                        [],
                    )
                ),

                "recommendations": (
                    evaluation_result.get(
                        "recommendations",
                        [],
                    )
                ),
            }

            # ---------------------------------------------
            # Save AI feedback
            # ---------------------------------------------

            ai_feedback = (
                evaluation_result.get(
                    "feedback"
                )
            )

            if ai_feedback:

                response_record.feedback = (
                    ai_feedback
                )

            # ---------------------------------------------
            # Commit AI result
            # ---------------------------------------------

            background_db.commit()

            print("=" * 60)
            print("✅ BACKGROUND AI EVALUATION COMPLETED")
            print("Response ID:", response_id)
            print("=" * 60)

    except Exception as e:

        # IMPORTANT:
        # AI failure must NEVER delete/fail the
        # student's already-saved submission.

        background_db.rollback()

        print("=" * 60)
        print("❌ BACKGROUND AI EVALUATION FAILED")
        print("Response ID:", response_id)
        print("ERROR:", str(e))
        print("=" * 60)

    finally:

        background_db.close()
@router.post("/submit_quiz")
def submit_quiz(
    data: QuizSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    assignment = None

    # =====================================================
    # 1. Secure Assignment Flow
    # =====================================================

    if data.assignment_id:

        assignment = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.id == data.assignment_id
            )
            .first()
        )

        if not assignment:

            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        # Never trust frontend quiz/student values
        data.quiz_id = assignment.quiz_id
        data.student_email = assignment.student_email

    # =====================================================
    # 2. Load Quiz
    # =====================================================

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == data.quiz_id
        )
        .first()
    )

    if not quiz:

        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    # =====================================================
    # 3. Check Quiz Timer
    # =====================================================

    if assignment:

        if not assignment.started_at:

            raise HTTPException(
                status_code=400,
                detail="Quiz has not been started.",
            )

        now = datetime.now(timezone.utc)

        quiz_expires_at = (
            assignment.started_at
            + timedelta(
                minutes=quiz.duration_minutes
            )
        )

        if now >= quiz_expires_at:

            # Allow automatic submission
            # when timer expires
            if data.auto_submit:

                print(
                    "⏰ Quiz time expired — "
                    "processing AUTO SUBMISSION"
                )

            else:

                assignment.status = "Expired"

                db.commit()

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Quiz time has expired. "
                        "Submission is no longer accepted."
                    ),
                )

    # =====================================================
    # 4. Prevent Duplicate Attempts
    # =====================================================

    existing_response = (
        db.query(Response)
        .filter(
            Response.quiz_id == data.quiz_id,
            Response.student_email
            == data.student_email,
        )
        .first()
    )

    if existing_response:

        raise HTTPException(
            status_code=400,
            detail="You have already attempted this quiz.",
        )

    # =====================================================
    # 5. Prepare Original Quiz Questions
    # =====================================================

    questions = []

    # -----------------------------------------------------
    # Version 2 — Question Table
    # -----------------------------------------------------

    if quiz.questions_relation:

        for q in quiz.questions_relation:

            print("=" * 60)
            print("QUESTION :", q.question_text)
            print("CORRECT  :", q.correct_answer)
            print("MARKS    :", q.marks)
            print(
                "TOPIC    :",
                getattr(q, "topic", None),
            )
            print("=" * 60)

            correct_text = (
                q.correct_answer.strip()
                if q.correct_answer
                else ""
            )

            # ---------------------------------------------
            # Convert correct answer TEXT -> original letter
            # ---------------------------------------------

            if correct_text == q.option_a:

                correct_letter = "A"

            elif correct_text == q.option_b:

                correct_letter = "B"

            elif correct_text == q.option_c:

                correct_letter = "C"

            elif correct_text == q.option_d:

                correct_letter = "D"

            else:

                # In case database already stores A/B/C/D
                correct_letter = (
                    correct_text.upper()
                )

            questions.append(
                {
                    "question": q.question_text,

                    "options": [
                        q.option_a,
                        q.option_b,
                        q.option_c,
                        q.option_d,
                    ],

                    "answer": correct_letter,

                    # Topic stored in Question table
                    "topic": (
                        getattr(
                            q,
                            "topic",
                            None,
                        )
                        or "General"
                    ),

                    "difficulty": "Medium",

                    "marks": q.marks or 1,
                }
            )

    # -----------------------------------------------------
    # Version 1 — JSON Questions
    # -----------------------------------------------------

    elif quiz.questions:

        questions = quiz.questions

    # =====================================================
    # 6. Convert Randomized Answers Back To Original
    # =====================================================

    evaluation_answers = {}

    if (
        assignment
        and assignment.randomization_data
    ):

        randomization = (
            assignment.randomization_data
        )

        question_order = (
            randomization.get(
                "question_order",
                [],
            )
        )

        option_orders = (
            randomization.get(
                "option_orders",
                {},
            )
        )

        # ---------------------------------------------
        # Convert every displayed answer
        # ---------------------------------------------

        for (
            displayed_index,
            selected_option,
        ) in data.answers.items():

            try:

                displayed_index = int(
                    displayed_index
                )

            except (
                TypeError,
                ValueError,
            ):

                continue

            # -----------------------------------------
            # Validate displayed question index
            # -----------------------------------------

            if (
                displayed_index < 0
                or displayed_index
                >= len(question_order)
            ):

                continue

            # -----------------------------------------
            # Find original question index
            # -----------------------------------------

            original_index = (
                question_order[
                    displayed_index
                ]
            )

            # -----------------------------------------
            # Student selected displayed A/B/C/D
            # -----------------------------------------

            displayed_option = (
                str(selected_option)
                .strip()
                .upper()
            )

            if displayed_option not in [
                "A",
                "B",
                "C",
                "D",
            ]:

                continue

            # -----------------------------------------
            # Find randomized option mapping
            # -----------------------------------------

            randomized_order = (
                option_orders.get(
                    str(original_index)
                )
            )

            if not randomized_order:

                continue

            # -----------------------------------------
            # Convert displayed option
            # back to original option
            #
            # Example:
            #
            # randomized_order =
            # ["C", "A", "D", "B"]
            #
            # Student selected displayed A
            #
            # A -> original C
            # -----------------------------------------

            displayed_position = (
                ord(displayed_option)
                - ord("A")
            )

            if (
                displayed_position < 0
                or displayed_position
                >= len(randomized_order)
            ):

                continue

            original_option = (
                randomized_order[
                    displayed_position
                ]
            )

            # -----------------------------------------
            # Store using ORIGINAL question index
            # -----------------------------------------

            evaluation_answers[
                str(original_index)
            ] = original_option

    else:

        # =================================================
        # Non-randomized / old quiz fallback
        # =================================================

        evaluation_answers = data.answers

    # =====================================================
    # 7. DETERMINISTIC MCQ EVALUATION
    #
    # IMPORTANT:
    # Do NOT use LLM to calculate marks.
    # =====================================================

    score = 0

    total_marks = 0

    correct_count = 0

    total_questions = len(
        questions
    )

    # ---------------------------------------------
    # Compare every question directly
    # with database answer
    # ---------------------------------------------

    for index, question in enumerate(
        questions
    ):

        marks = (
            question.get(
                "marks",
                1,
            )
            or 1
        )

        total_marks += marks

        # ---------------------------------------------
        # Student's ORIGINAL answer
        # ---------------------------------------------

        student_answer = (
            evaluation_answers.get(
                str(index)
            )
        )

        # ---------------------------------------------
        # Database ORIGINAL correct answer
        # ---------------------------------------------

        correct_answer = (
            question.get(
                "answer"
            )
        )

        if student_answer is None:

            continue

        if correct_answer is None:

            continue

        student_answer = (
            str(student_answer)
            .strip()
            .upper()
        )

        correct_answer = (
            str(correct_answer)
            .strip()
            .upper()
        )

        # ---------------------------------------------
        # Correct answer
        # ---------------------------------------------

        if (
            student_answer
            == correct_answer
        ):

            score += marks

            correct_count += 1

    # =====================================================
    # 8. Calculate Percentage
    # =====================================================

    percentage = (
        (score / total_marks) * 100
        if total_marks > 0
        else 0
    )

    percentage = round(
        percentage,
        2,
    )

    # =====================================================
    # 9. Performance
    # =====================================================

    if percentage >= 90:

        performance = "Excellent"

    elif percentage >= 75:

        performance = "Very Good"

    elif percentage >= 60:

        performance = "Good"

    elif percentage >= 40:

        performance = "Needs Improvement"

    else:

        performance = "Needs Improvement"

    # =====================================================
    # 10. Basic Feedback
    # =====================================================

    feedback = (
        f"You answered "
        f"{correct_count} out of "
        f"{total_questions} questions correctly."
    )

    # =====================================================
    # 11. Calculate Time Taken
    # =====================================================

    time_taken = None

    if assignment and assignment.started_at:

        time_taken = int(
            (
                datetime.now(timezone.utc)
                - assignment.started_at
            ).total_seconds()
        )

    # =====================================================
    # 12. Save Response
    # =====================================================

    print("=" * 60)
    print("QUIZ SUBMISSION")
    print(
        "Student        :",
        data.student_email,
    )
    print(
        "Quiz ID        :",
        data.quiz_id,
    )
    print(
        "Score          :",
        score,
    )
    print(
        "Total Marks    :",
        total_marks,
    )
    print(
        "Percentage     :",
        percentage,
    )
    print(
        "Correct Count  :",
        correct_count,
    )
    print(
        "Total Questions:",
        total_questions,
    )
    print("=" * 60)

    new_response = Response(
        student_email=data.student_email,

        quiz_id=data.quiz_id,

        # Save what the student selected
        # on the randomized screen.
        answers=data.answers,

        score=score,

        feedback=feedback,

        time_taken_seconds=time_taken,
    )

    db.add(new_response)

    # =====================================================
    # 13. Update Assignment
    # =====================================================

    if assignment:

        assignment.status = "Completed"

        assignment.score = score

        assignment.completed_at = (
            datetime.now(timezone.utc)
        )

    else:

        # -------------------------------------------------
        # Find Student
        # -------------------------------------------------

        user = (
            db.query(User)
            .filter(
                User.email
                == data.student_email
            )
            .first()
        )

        if user:

            student = (
                db.query(Student)
                .filter(
                    Student.user_id
                    == user.id
                )
                .first()
            )

            if student:

                assignment = (
                    db.query(QuizAssignment)
                    .filter(
                        QuizAssignment.quiz_id
                        == data.quiz_id,

                        QuizAssignment.student_id
                        == student.id,
                    )
                    .first()
                )

        # -------------------------------------------------
        # Fallback using email
        # -------------------------------------------------

        if assignment is None:

            assignment = (
                db.query(QuizAssignment)
                .filter(
                    QuizAssignment.quiz_id
                    == data.quiz_id,

                    QuizAssignment.student_email
                    == data.student_email,
                )
                .first()
            )

        if assignment:

            assignment.status = "Completed"

            assignment.score = score

            if hasattr(
                assignment,
                "completed_at",
            ):

                assignment.completed_at = (
                    datetime.now(timezone.utc)
                )

    # =====================================================
    # 14. Commit Basic Result
    #
    # THIS IS THE IMPORTANT CHANGE.
    #
    # Student submission is permanently saved BEFORE
    # any Groq/LangGraph processing.
    # =====================================================

    db.commit()

    # Refresh after commit so response ID is available.
    db.refresh(
        new_response
    )

    # =====================================================
    # 15. Get Student Information
    # =====================================================

    student_name = data.student_email

    student_user = (
        db.query(User)
        .filter(
            User.email
            == data.student_email
        )
        .first()
    )

    if student_user:

        student_name = (
            getattr(
                student_user,
                "name",
                None,
            )
            or getattr(
                student_user,
                "full_name",
                None,
            )
            or data.student_email
        )

    # =====================================================
    # 16. Prepare LangGraph State
    #
    # We DO NOT execute LangGraph here.
    # =====================================================

    evaluation_state = {

        "student_email":
            data.student_email,

        "student_name":
            student_name,

        "quiz_id":
            quiz.id,

        "quiz_title":
            quiz.title,

        "quiz_result": {
            "questions":
                questions,
        },

        "student_answers":
            evaluation_answers,

        "score":
            score,

        "total_marks":
            total_marks,

        "total_questions":
            total_questions,

        "percentage":
            percentage,

        "wrong_answers":
            [],

        "weak_topics":
            [],

        "performance":
            performance,

        "feedback":
            feedback,
    }

    # =====================================================
    # 17. Schedule Background AI Evaluation
    #
    # IMPORTANT:
    # No Groq call here.
    # No LangGraph call here.
    #
    # The HTTP response can return immediately.
    # =====================================================

    try:

        engine = db.get_bind()

        background_tasks.add_task(
            run_ai_evaluation_background,

            response_id=new_response.id,

            evaluation_state=evaluation_state,

            engine=engine,
        )

        print("=" * 60)
        print("🚀 AI EVALUATION SCHEDULED")
        print(
            "Response ID:",
            new_response.id,
        )
        print(
            "Student:",
            data.student_email,
        )
        print("=" * 60)

    except Exception as e:

        # IMPORTANT:
        # Even if background scheduling fails,
        # the student's quiz submission is already
        # safely stored in PostgreSQL.

        print("=" * 60)
        print(
            "⚠️ COULD NOT SCHEDULE AI EVALUATION"
        )
        print(
            "ERROR:",
            str(e),
        )
        print("=" * 60)

    # =====================================================
    # 18. Return Result IMMEDIATELY
    # =====================================================

    return {

        "message":
            "Quiz submitted successfully",

        "score":
            score,

        "total_marks":
            total_marks,

        "percentage":
            percentage,

        "performance":
            performance,

        "feedback":
            feedback,

        "response_id":
            new_response.id,

        # AI is not ready yet.
        "ai_analysis":
            None,

        "ai_status":
            "processing",
    }
@router.get("/result/{id}")
def get_result(
    id: int,
    token: str,
    db: Session = Depends(get_db),
):

    print("=" * 60)
    print("RESULT DEBUG")
    print("RESULT ID:", id)
    print("=" * 60)

    # =====================================================
    # 1. Find Response
    # =====================================================

    result = (
        db.query(Response)
        .filter(
            Response.id == id
        )
        .first()
    )

    if not result:

        raise HTTPException(
            status_code=404,
            detail="Result not found."
        )

    print(
        "RESULT STUDENT:",
        result.student_email
    )

    print(
        "RESULT QUIZ:",
        result.quiz_id
    )

    # =====================================================
    # 2. Verify Assignment Token
    # =====================================================

    assignment = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.token == token
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired quiz token."
        )

    # =====================================================
    # 3. Verify Result Belongs To Assignment
    # =====================================================

    if assignment.quiz_id != result.quiz_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "This result does not belong "
                "to this quiz."
            )
        )

    if (
        assignment.student_email
        != result.student_email
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized "
                "to view this result."
            )
        )

    # =====================================================
    # 4. Load Quiz
    # =====================================================

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == result.quiz_id
        )
        .first()
    )

    if not quiz:

        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    # =====================================================
    # 5. Prepare Result
    # =====================================================

    result_questions = []

    total_marks = 0

    correct_answers = 0

    # =====================================================
    # Version 2 — Question Table
    # =====================================================

    if quiz.questions_relation:

        # -------------------------------------------------
        # Build ORIGINAL questions
        # -------------------------------------------------

        original_questions = []

        for question in (
            quiz.questions_relation
        ):

            original_questions.append(
                {
                    "question":
                        question.question_text,

                    "options": {
                        "A":
                            question.option_a,

                        "B":
                            question.option_b,

                        "C":
                            question.option_c,

                        "D":
                            question.option_d,
                    },

                    "correct_answer":
                        question.correct_answer,

                    "marks":
                        question.marks or 1,
                }
            )

        # =================================================
        # 6. Load Randomization Data
        # =================================================

        question_order = list(
            range(
                len(
                    original_questions
                )
            )
        )

        option_orders = {}

        if assignment.randomization_data:

            randomization = (
                assignment.randomization_data
            )

            question_order = (
                randomization.get(
                    "question_order",
                    question_order
                )
            )

            option_orders = (
                randomization.get(
                    "option_orders",
                    {}
                )
            )

        # =================================================
        # 7. Process Questions In The SAME
        #    Order Student Saw
        # =================================================

        for (
            displayed_index,
            original_index
        ) in enumerate(
            question_order
        ):

            # ---------------------------------------------
            # Safety check
            # ---------------------------------------------

            if (
                original_index < 0
                or original_index
                >= len(original_questions)
            ):

                continue

            question = (
                original_questions[
                    original_index
                ]
            )

            marks = (
                question["marks"]
                or 1
            )

            total_marks += marks

            # =================================================
            # 8. Find ORIGINAL Correct Answer Letter
            # =================================================

            correct_text = (
                str(
                    question[
                        "correct_answer"
                    ]
                )
                .strip()
            )

            original_correct_letter = None

            if (
                correct_text
                == question["options"]["A"]
            ):

                original_correct_letter = "A"

            elif (
                correct_text
                == question["options"]["B"]
            ):

                original_correct_letter = "B"

            elif (
                correct_text
                == question["options"]["C"]
            ):

                original_correct_letter = "C"

            elif (
                correct_text
                == question["options"]["D"]
            ):

                original_correct_letter = "D"

            elif correct_text.upper() in [
                "A",
                "B",
                "C",
                "D",
            ]:

                original_correct_letter = (
                    correct_text.upper()
                )

            # =================================================
            # 9. Get Randomized Option Order
            # =================================================

            randomized_order = (
                option_orders.get(
                    str(original_index)
                )
            )

            # -------------------------------------------------
            # Old / non-randomized fallback
            # -------------------------------------------------

            if not randomized_order:

                randomized_order = [
                    "A",
                    "B",
                    "C",
                    "D",
                ]

            # =================================================
            # 10. Convert ORIGINAL Correct Answer
            #     To DISPLAYED Correct Answer
            # =================================================

            displayed_correct_letter = None

            if original_correct_letter:

                for (
                    displayed_position,
                    original_letter
                ) in enumerate(
                    randomized_order
                ):

                    if (
                        original_letter
                        == original_correct_letter
                    ):

                        displayed_correct_letter = (
                            chr(
                                ord("A")
                                + displayed_position
                            )
                        )

                        break

            # =================================================
            # 11. Get Student's DISPLAYED Answer
            # =================================================

            student_displayed_answer = None

            if result.answers:

                # Normal JSON string key
                student_displayed_answer = (
                    result.answers.get(
                        str(displayed_index)
                    )
                )

                # Fallback integer key
                if (
                    student_displayed_answer
                    is None
                ):

                    student_displayed_answer = (
                        result.answers.get(
                            displayed_index
                        )
                    )

            if student_displayed_answer:

                student_displayed_answer = (
                    str(
                        student_displayed_answer
                    )
                    .strip()
                    .upper()
                )

            # =================================================
            # 12. Check Student Answer
            # =================================================

            is_correct = (
                student_displayed_answer
                is not None
                and
                displayed_correct_letter
                is not None
                and
                student_displayed_answer
                == displayed_correct_letter
            )

            if is_correct:

                correct_answers += 1

            # =================================================
            # 13. Build Options In EXACT
            #     Order Student Saw
            # =================================================

            result_options = []

            for (
                displayed_position,
                original_letter
            ) in enumerate(
                randomized_order
            ):

                displayed_letter = chr(
                    ord("A")
                    + displayed_position
                )

                option_text = (
                    question[
                        "options"
                    ].get(
                        original_letter,
                        ""
                    )
                )

                result_options.append(
                    f"{displayed_letter}) "
                    f"{option_text}"
                )

            # =================================================
            # 14. Add Result Question
            # =================================================

            result_questions.append(
                {
                    "question_number":
                        displayed_index + 1,

                    "question":
                        question[
                            "question"
                        ],

                    "options":
                        result_options,

                    "student_answer":
                        student_displayed_answer,

                    "correct_answer":
                        displayed_correct_letter,

                    "is_correct":
                        is_correct,

                    "marks":
                        marks,
                }
            )

    # =====================================================
    # Version 1 — JSON Questions
    # =====================================================

    elif quiz.questions:

        for index, question in enumerate(
            quiz.questions
        ):

            marks = (
                question.get(
                    "marks",
                    1
                )
                or 1
            )

            total_marks += marks

            correct = (
                question.get(
                    "answer"
                )
            )

            student_answer = None

            if result.answers:

                student_answer = (
                    result.answers.get(
                        str(index)
                    )
                )

                if (
                    student_answer
                    is None
                ):

                    student_answer = (
                        result.answers.get(
                            index
                        )
                    )

            if student_answer:

                student_answer = (
                    str(
                        student_answer
                    )
                    .strip()
                    .upper()
                )

            if correct:

                correct = (
                    str(
                        correct
                    )
                    .strip()
                    .upper()
                )

            is_correct = (
                student_answer is not None
                and
                correct is not None
                and
                student_answer == correct
            )

            if is_correct:

                correct_answers += 1

            result_questions.append(
                {
                    "question_number":
                        index + 1,

                    "question":
                        question.get(
                            "question"
                        ),

                    "options":
                        question.get(
                            "options",
                            []
                        ),

                    "student_answer":
                        student_answer,

                    "correct_answer":
                        correct,

                    "is_correct":
                        is_correct,

                    "marks":
                        marks,
                }
            )

    # =====================================================
    # 15. Calculate Statistics
    # =====================================================

    total_questions = len(
        result_questions
    )

    wrong_answers = (
        total_questions
        - correct_answers
    )

    # -----------------------------------------------------
    # IMPORTANT:
    #
    # Score is the score saved during submission.
    # -----------------------------------------------------

    score = (
        result.score or 0
    )

    percentage = (
        (
            score
            / total_marks
        ) * 100
        if total_marks > 0
        else 0
    )

    percentage = round(
        percentage,
        2
    )

    # =====================================================
    # 16. Return Result
    # =====================================================

    return {

        "response_id":
            result.id,

        "quiz_id":
            result.quiz_id,

        "quiz_title":
            quiz.title,

        "score":
            score,

        "total_marks":
            total_marks,

        "percentage":
            percentage,

        "total_questions":
            total_questions,

        "correct_answers":
            correct_answers,

        "wrong_answers":
            wrong_answers,

        "feedback":
            result.feedback,
        "ai_analysis": result.ai_analysis,    

        "time_taken_seconds":
            result.time_taken_seconds,

        "questions":
            result_questions,
    }
@router.get("/all")
def get_all_quizzes(

    db:Session=Depends(get_db)

):

    quizzes = db.query(Quiz).all()


    return [

        {

            "id":quiz.id,

            "title":quiz.title

        }

        for quiz in quizzes

    ]

@router.post("/generate-quiz")
def generate_ai_quiz(data: GenerateQuizRequest):

    quiz = generate_quiz.invoke(
        {
            "topic": data.topic,
            "num_questions": data.num_questions,
            "difficulty": data.difficulty,
        }
    )

    if not quiz or not quiz.get("questions"):
        return {
            "error": "Quiz generation failed"
        }

    db_result = create_quiz_web.invoke(
        {
            "title": quiz["title"],
            "questions": quiz["questions"],
        }
    )

    return {
        "message": "Quiz generated successfully",
        "quiz_id": db_result.get("quiz_id"),
        "quiz_url": db_result.get("quiz_url"),
    }
@router.post("/generate-topic-quiz")
def generate_topic_quiz(
    data: GenerateTopicQuizRequest,
    current_user: User = Depends(
        require_role(UserRole.TEACHER)
    ),
    db: Session = Depends(get_db),
):
    try:
        # Get the logged-in teacher
        teacher = current_user.teacher

        if not teacher:
            raise ValueError("Teacher profile not found.")

        # Generate questions using the new Version 2 AI function
        quiz_data = generate_topic_quiz_v2.invoke(
            {
                "topic": data.topic,
                "question_count": data.question_count,
                "difficulty": data.difficulty,
                "bloom_level": data.bloom_level,
            }
        )

        if not quiz_data or not quiz_data.get("questions"):
            raise ValueError("Quiz generation failed.")

        # Create Quiz record
        quiz = Quiz(
            title=quiz_data.get(
                "title",
                f"{data.topic} Quiz"
            ),
            teacher_id=teacher.id,
            status="Draft",
            duration_minutes=data.time_limit,
        )

        db.add(quiz)
        db.flush()

        # Create Question records
        for index, question in enumerate(
            quiz_data["questions"],
            start=1,
        ):
            options = question.get("options", [])

            if len(options) != 4:
                raise ValueError(
                    f"Question {index} does not have exactly 4 options."
                )

            db_question = Question(
                quiz_id=quiz.id,
                question_text=question["question"],
                option_a=options[0],
                option_b=options[1],
                option_c=options[2],
                option_d=options[3],
                correct_answer=question["answer"],
                explanation=question.get("explanation"),
                marks=1,
                question_order=index,
            )

            db.add(db_question)

        db.commit()

        return {
            "message": "Quiz generated successfully",
            "quiz_id": quiz.id,
            "title": quiz.title,
            "total_questions": len(quiz_data["questions"]),
            "duration_minutes": quiz.duration_minutes,
            "status": quiz.status,
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
            
        )
            
@router.get("/start/{token}")
def start_quiz(
    token: str,
    db: Session = Depends(get_db),
):
    # =====================================================
    # 1. FIND ASSIGNMENT
    # =====================================================

    assignment = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.token == token
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Invalid quiz link.",
        )

    now = datetime.now(timezone.utc)

    # =====================================================
    # 2. CHECK LINK EXPIRY
    # =====================================================

    if (
        assignment.expires_at
        and assignment.expires_at < now
    ):
        assignment.status = "Expired"
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Quiz link expired.",
        )
    # =====================================================
# CHECK ASSIGNMENT DUE DATE
# =====================================================

    if assignment.due_date:

      due_date = assignment.due_date

      if due_date.tzinfo is None:
        due_date = due_date.replace(
            tzinfo=timezone.utc
        )

      if now > due_date:

        assignment.status = "Expired"
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="The submission deadline for this quiz has passed.",
        )

    # =====================================================
    # 3. ALREADY COMPLETED
    # =====================================================

    if assignment.status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Quiz already submitted.",
        )

    # =====================================================
    # 4. LOAD QUIZ
    # =====================================================

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == assignment.quiz_id
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    # =====================================================
    # 5. SCHEDULED START TIME
    # =====================================================

    scheduled_start = assignment.start_time

    if scheduled_start:
        # Convert naive datetime to UTC if necessary
        if scheduled_start.tzinfo is None:
            scheduled_start = scheduled_start.replace(
                tzinfo=timezone.utc
            )

        # -----------------------------------------------
        # Quiz has NOT started yet
        # -----------------------------------------------

        if now < scheduled_start:

            remaining_seconds = int(
                (
                    scheduled_start - now
                ).total_seconds()
            )

            return {
                "can_start": False,

                "assignment_id":
                    assignment.id,

                "quiz_id":
                    quiz.id,

                "title":
                    quiz.title,

                "student_email":
                    assignment.student_email,

                "start_time":
                    scheduled_start,

                "remaining_seconds":
                    max(0, remaining_seconds),

                "duration_minutes":
                    quiz.duration_minutes,

                "expires_at":
                    assignment.expires_at,
            }

    # =====================================================
    # 6. ALREADY STARTED
    #
    # Student may refresh the browser while taking quiz.
    # In that case we return the SAME randomized quiz.
    # =====================================================

    if (
        assignment.status == "Started"
        and assignment.started_at
    ):

        started_at = assignment.started_at

        if started_at.tzinfo is None:
            started_at = started_at.replace(
                tzinfo=timezone.utc
            )

        quiz_expires_at = (
            started_at
            + timedelta(
                minutes=quiz.duration_minutes
            )
        )

        if now >= quiz_expires_at:

            assignment.status = "Expired"
            db.commit()

            raise HTTPException(
                status_code=400,
                detail="Quiz time has expired.",
            )

        # -------------------------------------------------
        # Build original questions
        # -------------------------------------------------

        original_questions = []

        if quiz.questions_relation:

            for q in quiz.questions_relation:

                original_questions.append(
                    {
                        "question_id": q.id,

                        "question":
                            q.question_text,

                        "options": {
                            "A": q.option_a,
                            "B": q.option_b,
                            "C": q.option_c,
                            "D": q.option_d,
                        },
                    }
                )

        elif quiz.questions:

            for index, q in enumerate(
                quiz.questions
            ):

                original_questions.append(
                    {
                        "question_id": index,

                        "question":
                            q["question"],

                        "options": {
                            "A":
                                q["options"][0],

                            "B":
                                q["options"][1],

                            "C":
                                q["options"][2],

                            "D":
                                q["options"][3],
                        },
                    }
                )

        # -------------------------------------------------
        # Existing randomization
        # -------------------------------------------------

        if not assignment.randomization_data:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Quiz randomization data is missing."
                ),
            )

        randomization = (
            assignment.randomization_data
        )

        question_indexes = (
            randomization["question_order"]
        )

        option_orders = (
            randomization["option_orders"]
        )

        # -------------------------------------------------
        # Build SAFE randomized questions
        # -------------------------------------------------

        safe_questions = []

        for original_index in question_indexes:

            original_question = (
                original_questions[
                    original_index
                ]
            )

            randomized_options = []

            for letter in option_orders[
                str(original_index)
            ]:

                randomized_options.append(
                    {
                        "key": (
                            chr(
                                65
                                + len(
                                    randomized_options
                                )
                            )
                        ),

                        "text":
                            original_question[
                                "options"
                            ][letter],
                    }
                )

            safe_questions.append(
                {
                    "question":
                        original_question[
                            "question"
                        ],

                    "options":
                        randomized_options,
                }
            )

        return {
            "can_start": True,

            "already_started": True,

            "assignment_id":
                assignment.id,

            "quiz_id":
                quiz.id,

            "title":
                quiz.title,

            "student_email":
                assignment.student_email,

            "duration_minutes":
                quiz.duration_minutes,

            "started_at":
                started_at,

            "quiz_expires_at":
                quiz_expires_at,

            "expires_at":
                assignment.expires_at,

            "questions":
                safe_questions,
        }

    # =====================================================
    # 7. QUIZ IS READY TO START
    #
    # IMPORTANT:
    # We DO NOT set started_at here.
    # We DO NOT randomize here.
    # =====================================================

    return {
        "can_start": True,

        "already_started": False,

        "assignment_id":
            assignment.id,

        "quiz_id":
            quiz.id,

        "title":
            quiz.title,

        "student_email":
            assignment.student_email,

        "duration_minutes":
            quiz.duration_minutes,

        "start_time":
            scheduled_start,

        "expires_at":
            assignment.expires_at,
    }

@router.post("/start-attempt/{token}")
def start_quiz_attempt(
    token: str,
    db: Session = Depends(get_db),
):
    # =====================================================
    # 1. FIND ASSIGNMENT
    # =====================================================

    assignment = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.token == token
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Invalid quiz link.",
        )

    now = datetime.now(timezone.utc)

    # =====================================================
    # 2. CHECK LINK EXPIRY
    # =====================================================

    if (
        assignment.expires_at
        and assignment.expires_at < now
    ):
        assignment.status = "Expired"
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Quiz link expired.",
        )
    # =====================================================
# CHECK ASSIGNMENT DUE DATE
# =====================================================

    if assignment.due_date:

     due_date = assignment.due_date

     if due_date.tzinfo is None:
        due_date = due_date.replace(
            tzinfo=timezone.utc
        )

     if now > due_date:

        assignment.status = "Expired"
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="The submission deadline for this quiz has passed.",
        )

    # =====================================================
    # 3. COMPLETED
    # =====================================================

    if assignment.status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Quiz already submitted.",
        )

    # =====================================================
    # 4. LOAD QUIZ
    # =====================================================

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == assignment.quiz_id
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    # =====================================================
    # 5. CHECK SCHEDULED START TIME
    # =====================================================

    if assignment.start_time:

        scheduled_start = assignment.start_time

        if scheduled_start.tzinfo is None:
            scheduled_start = scheduled_start.replace(
                tzinfo=timezone.utc
            )

        if now < scheduled_start:

            remaining_seconds = int(
                (
                    scheduled_start - now
                ).total_seconds()
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Quiz has not started yet. "
                    f"Starts in "
                    f"{max(0, remaining_seconds)} seconds."
                ),
            )

    # =====================================================
    # 6. IF ALREADY STARTED
    # =====================================================

    if (
        assignment.status == "Started"
        and assignment.started_at
    ):

        started_at = assignment.started_at

        if started_at.tzinfo is None:
            started_at = started_at.replace(
                tzinfo=timezone.utc
            )

    else:

        # =================================================
        # ACTUALLY START THE QUIZ
        # =================================================

        assignment.status = "Started"
        assignment.started_at = now

        started_at = now

        db.commit()
        db.refresh(assignment)

    # =====================================================
    # 7. CALCULATE QUIZ EXPIRY
    # =====================================================

    quiz_expires_at = (
        started_at
        + timedelta(
            minutes=quiz.duration_minutes
        )
    )

    if now >= quiz_expires_at:

        assignment.status = "Expired"

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Quiz time has expired.",
        )

    # =====================================================
    # 8. BUILD ORIGINAL QUESTIONS
    # =====================================================

    original_questions = []

    if quiz.questions_relation:

        for q in quiz.questions_relation:

            original_questions.append(
                {
                    "question_id": q.id,

                    "question":
                        q.question_text,

                    "options": {
                        "A": q.option_a,
                        "B": q.option_b,
                        "C": q.option_c,
                        "D": q.option_d,
                    },
                }
            )

    elif quiz.questions:

        for index, q in enumerate(
            quiz.questions
        ):

            original_questions.append(
                {
                    "question_id": index,

                    "question":
                        q["question"],

                    "options": {
                        "A":
                            q["options"][0],

                        "B":
                            q["options"][1],

                        "C":
                            q["options"][2],

                        "D":
                            q["options"][3],
                    },
                }
            )

    # =====================================================
    # 9. CREATE RANDOMIZATION
    # =====================================================

    if not assignment.randomization_data:

        question_indexes = list(
            range(
                len(original_questions)
            )
        )

        # Shuffle questions
        random.shuffle(
            question_indexes
        )

        option_orders = {}

        for original_index in question_indexes:

            option_letters = [
                "A",
                "B",
                "C",
                "D",
            ]

            random.shuffle(
                option_letters
            )

            option_orders[
                str(original_index)
            ] = option_letters

        assignment.randomization_data = {
            "question_order":
                question_indexes,

            "option_orders":
                option_orders,
        }

        db.commit()
        db.refresh(assignment)

    else:

        randomization = (
            assignment.randomization_data
        )

        question_indexes = (
            randomization[
                "question_order"
            ]
        )

        option_orders = (
            randomization[
                "option_orders"
            ]
        )

    # =====================================================
    # 10. BUILD SAFE QUESTIONS
    # =====================================================

    safe_questions = []

    for original_index in question_indexes:

        original_question = (
            original_questions[
                original_index
            ]
        )

        randomized_options = []

        for display_index, letter in enumerate(
            option_orders[
                str(original_index)
            ]
        ):

            randomized_options.append(
                {
                    "key":
                        chr(
                            65
                            + display_index
                        ),

                    "text":
                        original_question[
                            "options"
                        ][letter],
                }
            )

        safe_questions.append(
            {
                "question":
                    original_question[
                        "question"
                    ],

                "options":
                    randomized_options,
            }
        )

    # =====================================================
    # 11. RETURN STARTED QUIZ
    # =====================================================

    return {
        "can_start": True,

        "already_started": True,

        "assignment_id":
            assignment.id,

        "quiz_id":
            quiz.id,

        "title":
            quiz.title,

        "student_email":
            assignment.student_email,

        "duration_minutes":
            quiz.duration_minutes,

        "started_at":
            started_at,

        "quiz_expires_at":
            quiz_expires_at,

        "expires_at":
            assignment.expires_at,

        "questions":
            safe_questions,
    }