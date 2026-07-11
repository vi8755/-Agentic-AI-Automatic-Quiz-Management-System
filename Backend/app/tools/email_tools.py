@router.post("/assign_quiz")
def assign_quiz(
    data: AssignQuizRequest,
    db: Session = Depends(get_db),
):
    print("\n========== ASSIGN QUIZ START ==========")

    quiz_id = data.quiz_id
    student_emails = data.students

    print("Quiz ID:", quiz_id)
    print("Students:", student_emails)

    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        print("Quiz not found!")
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    sent = 0

    for email in student_emails:

        print("\n--------------------------------")
        print("Processing:", email)

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
            print("Assignment already exists. Skipping email.")
            continue

        print("Creating new assignment...")

        assignment = QuizAssignment(
            student_email=email,
            quiz_id=quiz_id,
            status="Assigned",
        )

        db.add(assignment)

        try:
            print("Calling send_quiz_email()...")

            result = send_quiz_email.invoke(
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

            print("Email Result:", result)

            sent += 1

        except Exception as e:
            print("EMAIL ERROR:")
            print(str(e))

    db.commit()

    print("Emails Sent:", sent)
    print("========== ASSIGN QUIZ END ==========\n")

    return {
        "message": "Quiz assigned successfully",
        "emails_sent": sent,
    }