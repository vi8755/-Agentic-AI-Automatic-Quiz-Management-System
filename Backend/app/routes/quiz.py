from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

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
from ..schemas import GenerateQuizRequest
from ..tools.quiz_tools import generate_quiz
from ..tools.web_quiz_tools import create_quiz_web
from ..models import (
    Quiz,
    Response,
    QuizAssignment,
    Teacher,
    User,
    UserRole,
    Student,
)

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








@router.post("/submit_quiz")
def submit_quiz(

    data:QuizSubmit,

    db:Session = Depends(get_db)

):


    quiz = db.query(Quiz).filter(

        Quiz.id == data.quiz_id

    ).first()



    if not quiz:

        return {

            "error":"Quiz not found"

        }
    
    existing_response = (
        db.query(Response)
        .filter(
            Response.quiz_id == data.quiz_id,
            Response.student_email == data.student_email,
        )
        .first()
    )

    if existing_response:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail="You have already attempted this quiz."
        )

     



    result = evaluation_app.invoke(

{

"messages":[

HumanMessage(
content="check submitted answers and calculate score"
)

],

"student_email":data.student_email,

"student_name":"Student",

"quiz_title":quiz.title,

"quiz_result":{

"title":quiz.title,

"questions":quiz.questions

},

"student_answers":data.answers

},




    config={


        "configurable":{


            "thread_id":

            f"quiz_{data.quiz_id}_{data.student_email}"

        }


    }


    )





    score = result["score"]


    feedback = result["feedback"]


    performance = result["performance"]

    new_response = Response(


        student_email=data.student_email,


        quiz_id=data.quiz_id,


        answers=data.answers,


        score=score,


        feedback=feedback


    )



    db.add(new_response)


    db.commit()


    db.refresh(new_response)
      

    # Find the user by email
    user = (
    db.query(User)
    .filter(User.email == data.student_email)
    .first()
    )

    assignment = None

    if user:
    # Find the student's profile
     student = (
        db.query(Student)
        .filter(Student.user_id == user.id)
        .first()
    )

    if student:
        # Version 2 lookup using student_id
        assignment = (
            db.query(QuizAssignment)
            .filter(
                QuizAssignment.quiz_id == data.quiz_id,
                QuizAssignment.student_id == student.id,
            )
            .first()
        )

# Fallback for Version 1 assignments
    if assignment is None:
     assignment = (
        db.query(QuizAssignment)
        .filter(
            QuizAssignment.quiz_id == data.quiz_id,
            QuizAssignment.student_email == data.student_email,
        )
        .first()
    )

    if assignment:
     assignment.status = "Completed"
     assignment.score = score

    db.commit()




    return {


        "message":

        "Quiz submitted successfully",



        "score":score,


        "performance":performance,


        "feedback":feedback,


        "response_id":new_response.id

    }









@router.get("/result/{id}")
def get_result(

    id:int,

    db:Session = Depends(get_db)

):


    result = db.query(Response).filter(

        Response.id == id

    ).first()



    if not result:


        return {

            "error":"Result not found"

        }



    quiz = db.query(Quiz).filter(

        Quiz.id == result.quiz_id

    ).first()



    total_questions = len(

        quiz.questions

    )



    percentage = (

        result.score /

        total_questions

    ) * 100



    return {


        "score":result.score,


        "percentage":percentage,


        "feedback":result.feedback,
        "total_questions": total_questions,
        "quiz_id": result.quiz_id



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