from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from ..database import SessionLocal

from ..models import Quiz, Response, Student



router = APIRouter()



def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()





from typing import Optional

@router.get("/stats")
def get_stats(

    quiz_id: Optional[int] = None,

    db: Session = Depends(get_db)

):


    if quiz_id:

     total_quizzes = 1

    else:

     total_quizzes = db.query(Quiz).count()



    if quiz_id:

     total_students = (
        db.query(Response.student_email)
        .filter(Response.quiz_id == quiz_id)
        .distinct()
        .count()
    )

    else:

     total_students = (
        db.query(Response.student_email)
        .distinct()
        .count()
    )



    if quiz_id:

     responses = db.query(Response).filter(
        Response.quiz_id == quiz_id
    ).all()

    else:

     responses = db.query(Response).all()



    if responses:

        avg_score = sum(

            r.score for r in responses

        ) / len(responses)


    else:

        avg_score = 0



    return {


        "total_quizzes":total_quizzes,


        "total_students":total_students,


        "average_score":round(avg_score,2)

    }

from typing import Optional

from typing import Optional

@router.get("/performance")
def performance_data(

    quiz_id: Optional[int] = None,

    db: Session = Depends(get_db)

):


    if quiz_id:

     responses = db.query(Response).filter(
        Response.quiz_id == quiz_id
     ).all()

    else:

     responses = db.query(Response).all()


    result = {

        "Excellent":0,

        "Good":0,

        "Needs Improvement":0

    }


    for r in responses:


        percentage = (
            r.score / 5
        ) * 100



        if percentage >= 80:

            result["Excellent"] += 1


        elif percentage >= 50:

            result["Good"] += 1


        else:

            result["Needs Improvement"] += 1



    return result

@router.get("/weak-topics")
def weak_topics(

    quiz_id: Optional[int] = None,

    db: Session = Depends(get_db)

):


    if quiz_id:

     responses = db.query(Response).filter(
        Response.quiz_id == quiz_id
    ).all()

    else:

     responses = db.query(Response).all()


    topics={}


    for r in responses:


        if r.feedback:


            for word in [
                "Chemistry",
                "Astronomy",
                "Geography",
                "Art History"
            ]:


                if word in r.feedback:


                    topics[word] = (
                        topics.get(word,0)+1
                    )



    return topics

from typing import Optional

@router.get("/students")
def get_students(
    quiz_id: Optional[int] = None,
    db: Session = Depends(get_db)
):

    students = db.query(Student).all()

    result = []

    for student in students:

        query = db.query(Response).filter(
            Response.student_email == student.email
        )

        if quiz_id:
            query = query.filter(
                Response.quiz_id == quiz_id
            )

        responses = query.all()

        if not responses:
            continue

        attempts = len(responses)

        total_score = sum(r.score for r in responses)

        average = total_score / attempts

        if average >= 4:
            performance = "Excellent"
        elif average >= 2.5:
            performance = "Good"
        else:
            performance = "Needs Improvement"

        result.append({
            "name": student.name,
            "email": student.email,
            "roll_no": student.roll_no,
            "department": student.department,
            "attempts": attempts,
            "average_score": round(average, 2),
            "performance": performance
        })

    return result

@router.get("/student/{email}")
def student_detail(

    email:str,

    db:Session=Depends(get_db)

):


    responses = db.query(Response).filter(

        Response.student_email == email

    ).all()



    if not responses:

        return {

            "error":"Student not found"

        }




    quizzes=[]



    total_score=0



    for r in responses:


        quiz = db.query(Quiz).filter(

            Quiz.id == r.quiz_id

        ).first()



        quizzes.append({

            "quiz_id":r.quiz_id,

            "quiz_title":quiz.title,

            "score":r.score,

            "total_questions":len(quiz.questions),

            "feedback":r.feedback

        })


        total_score += r.score




    average = total_score / len(responses)



    return {


        "email":email,


        "total_attempts":len(responses),


        "average_score":round(average,2),


        "quizzes":quizzes


    }

@router.get("/quizzes")
def quiz_analytics(

    db: Session = Depends(get_db)

):

    quizzes = db.query(Quiz).all()

    result = []

    for quiz in quizzes:

        responses = db.query(Response).filter(

            Response.quiz_id == quiz.id

        ).all()

        if not responses:

         result.append({

        "quiz_id": quiz.id,

        "title": quiz.title,

        "attempts": 0,

        "average_score": 0,

        "highest_score": 0,

        "lowest_score": 0,

        "topper": {

            "name": "-",

            "email": "-"

        },

        "last_submission": None

    })

        continue

        

        attempts = len(responses)

        scores = [r.score for r in responses]

        average = sum(scores) / attempts

        highest = max(scores)

        lowest = min(scores)

        top_response = next(
    r
        for r in responses
        if r.score == highest
)

        student = db.query(Student).filter(
        Student.email == top_response.student_email
        ).first()

        topper_name = student.name if student else "Inactive Student"
        topper_email = top_response.student_email

        latest = max(

            responses,

            key=lambda r: r.submitted_at

        )

        result.append({

            "quiz_id": quiz.id,

            "title": quiz.title,

            "attempts": attempts,

            "average_score": round(average, 2),

            "highest_score": highest,

            "lowest_score": lowest,

            "topper": {

                "name": topper_name,

                "email": topper_email

            },

            "last_submission": latest.submitted_at

        })

    return result

from typing import Optional

@router.get("/leaderboard")
def leaderboard(

    quiz_id: Optional[int] = None,

    db: Session = Depends(get_db)

):

    if quiz_id:

     responses = db.query(Response).filter(
        Response.quiz_id == quiz_id
    ).all()

    else:

     responses = db.query(Response).all()

    leaderboard = {}

    for response in responses:

        email = response.student_email

        if email not in leaderboard:

            student = db.query(Student).filter(
                Student.email == email
            ).first()

            leaderboard[email] = {

                "name": student.name if student else "Inactive Student",

                "email": email,

                "attempts": 0,

                "total_score": 0

            }

        leaderboard[email]["attempts"] += 1

        leaderboard[email]["total_score"] += response.score

    result = []

    for student in leaderboard.values():

        average = student["total_score"] / student["attempts"]

        result.append({

            "name": student["name"],

            "email": student["email"],

            "attempts": student["attempts"],

            "average_score": round(average, 2)

        })

    result.sort(

        key=lambda x: x["average_score"],

        reverse=True

    )

    for index, student in enumerate(result):

        student["rank"] = index + 1

    return result[:5]

@router.get("/recent-attempts")
def recent_attempts(
    db: Session = Depends(get_db)
):

    responses = (
        db.query(Response)
        .order_by(Response.submitted_at.desc())
        .limit(10)
        .all()
    )

    data = []

    for r in responses:

        quiz = db.query(Quiz).filter(
            Quiz.id == r.quiz_id
        ).first()

        student = db.query(Student).filter(
            Student.email == r.student_email
        ).first()

        total = len(quiz.questions)

        percentage = (r.score / total) * 100

        if percentage >= 80:
            performance = "Excellent"

        elif percentage >= 50:
            performance = "Good"

        else:
            performance = "Needs Improvement"

        data.append({

            "student":
                student.name if student else "Unknown",

            "email":
                r.student_email,

            "quiz":
                quiz.title,

            "score":
                f"{r.score}/{total}",

            "performance":
                performance,

            "submitted_at":
                r.submitted_at

        })

    return data

from typing import Optional

@router.get("/score-trend")
def score_trend(

    quiz_id: Optional[int] = None,

    db: Session = Depends(get_db)

):

    if quiz_id:

     quizzes = db.query(Quiz).filter(
        Quiz.id == quiz_id
    ).all()

    else:

     quizzes = db.query(Quiz).all()

    result = []

    for quiz in quizzes:

        responses = db.query(Response).filter(
            Response.quiz_id == quiz.id
        ).all()

        if responses:

            average = sum(
                r.score for r in responses
            ) / len(responses)

        else:

            average = 0

        result.append({

            "quiz": quiz.title,

            "average_score": round(average, 2),

            "attempts": len(responses)

        })

    return result

@router.get("/department-performance")
def department_performance(
    db: Session = Depends(get_db)
):

    students = db.query(Student).all()

    departments = {}

    for student in students:

        responses = db.query(Response).filter(
            Response.student_email == student.email
        ).all()

        if student.department not in departments:

            departments[student.department] = {
                "students": 0,
                "total_score": 0,
                "attempts": 0
            }

        departments[student.department]["students"] += 1

        for response in responses:

            departments[student.department]["total_score"] += response.score
            departments[student.department]["attempts"] += 1

    result = []

    for dept, data in departments.items():

        if data["attempts"]:

            average = data["total_score"] / data["attempts"]

        else:

            average = 0

        result.append({

            "department": dept,

            "students": data["students"],

            "attempts": data["attempts"],

            "average_score": round(average, 2)

        })

    return result
from typing import Optional
@router.get("/topic-analytics")
def topic_analytics(
   quiz_id:Optional[int]=None,
    db: Session = Depends(get_db)
):

    if quiz_id:

     quizzes = db.query(Quiz).filter(
        Quiz.id == quiz_id
    ).all()

    else:

     quizzes = db.query(Quiz).all()

    topics = {}

    for quiz in quizzes:

        responses = db.query(Response).filter(
            Response.quiz_id == quiz.id
        ).all()

        for response in responses:

            answers = response.answers

            for index, question in enumerate(quiz.questions):

                topic = question.get(
                    "topic",
                    "General"
                )

                if topic not in topics:

                    topics[topic] = {

                        "correct": 0,

                        "wrong": 0
                    }

                student_answer = (
                 answers.get(str(index))
                 or
                 answers.get(index)
                )

                student_choice = None

                if student_answer:

                 student_choice = student_answer[0]

                if student_choice == question["answer"]:

                    topics[topic]["correct"] += 1

                else:

                    topics[topic]["wrong"] += 1

    result = []

    for topic, value in topics.items():

        total = value["correct"] + value["wrong"]

        accuracy = 0

        if total > 0:

            accuracy = round(
                (value["correct"] / total) * 100,
                2
            )

        result.append({

            "topic": topic,

            "correct": value["correct"],

            "wrong": value["wrong"],

            "accuracy": accuracy

        })

    return result

@router.get("/most-difficult-quiz")
def most_difficult_quiz(
    db: Session = Depends(get_db)
):

    quizzes = db.query(Quiz).all()

    if not quizzes:
        return {"message": "No quizzes found"}

    difficult_quiz = None
    lowest_average = float("inf")

    for quiz in quizzes:

        responses = db.query(Response).filter(
            Response.quiz_id == quiz.id
        ).all()

        if not responses:
            continue

        average = sum(
            r.score for r in responses
        ) / len(responses)

        if average < lowest_average:

            lowest_average = average

            topper = max(
                responses,
                key=lambda x: x.score
            )

            difficult_quiz = {

                "quiz_id": quiz.id,

                "title": quiz.title,

                "attempts": len(responses),

                "average_score": round(average, 2),

                "highest_score": topper.score,

                "topper_email": topper.student_email

            }

    if difficult_quiz is None:

        return {
            "message": "No quiz attempts yet"
        }

    return difficult_quiz

from typing import Optional

@router.get("/student-progress")
def student_progress(

    quiz_id: Optional[int] = None,

    db: Session = Depends(get_db)

):

    students = db.query(Student).all()

    result = []

    for student in students:

        query_builder = db.query(Response).filter(
         Response.student_email == student.email
        )

        if quiz_id:

         query_builder = query_builder.filter(
          Response.quiz_id == quiz_id
        )

        responses = (
         query_builder
          .order_by(Response.submitted_at)
          .all()
         )
       

        if not responses:
            continue

        scores = [r.score for r in responses]

        first_score = scores[0]
        latest_score = scores[-1]

        improvement = latest_score - first_score

        result.append({

            "name": student.name,

            "email": student.email,

            "attempts": len(scores),

            "first_score": first_score,

            "latest_score": latest_score,

            "best_score": max(scores),

            "average_score": round(
                sum(scores)/len(scores),
                2
            ),

            "improvement": improvement

        })

    result.sort(
        key=lambda x: x["improvement"],
        reverse=True
    )

    return result