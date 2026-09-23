def evaluation_agent(state):
    quiz_data = state.get("quiz_result", {})
    questions = quiz_data.get("questions", [])
    answers = state.get("student_answers", {})
    print("\n" + "=" * 70)
    print("STARTING QUIZ EVALUATION")
    print("Student Answers Received:", answers)
    print("Number of Questions:", len(questions))
    print("=" * 70 + "\n")

    score = 0
    total_marks = 0
    wrong_answers = []
    weak_topics = []

    # =====================================================
    # Evaluate Each Question
    # =====================================================
    for index, question in enumerate(questions):

        # -------------------------------------------------
        # Question Marks
        # -------------------------------------------------
        marks = question.get("marks", 1)

        # Safety: make sure marks is a valid number
        try:
            marks = int(marks)
        except (TypeError, ValueError):
            marks = 1

        total_marks += marks

        # -------------------------------------------------
        # Correct Answer
        # -------------------------------------------------
        correct_answer = question.get("answer")

        if correct_answer is not None:
            correct_answer = (
                str(correct_answer)
                .strip()
                .upper()
            )

        # -------------------------------------------------
        # Student Answer
        # -------------------------------------------------
        student_answer = (
            answers.get(str(index))
            or answers.get(index)
        )

        student_choice = None

        # Handle list answer
        if isinstance(student_answer, list):

            if student_answer:
                student_choice = student_answer[0]

        # Handle normal answer
        elif student_answer:

            student_choice = student_answer

        # -------------------------------------------------
        # Normalize Student Answer
        # -------------------------------------------------
        if student_choice is not None:

            student_choice = (
                str(student_choice)
                .strip()
                .upper()
            )

        # -------------------------------------------------
        # Debug Information
        # -------------------------------------------------
        print("=" * 40)
        print("Question:", question.get("question"))
        print("Student :", student_choice)
        print("Correct :", correct_answer)
        print("Marks   :", marks)
        print("=" * 40)

        # =================================================
        # Check Answer
        # =================================================
        if student_choice == correct_answer:

            # Correct answer gets question's marks
            score += marks

        else:

            # ---------------------------------------------
            # Wrong / Unanswered Question
            # ---------------------------------------------
            wrong_answers.append(
                {
                    "question": question.get(
                        "question",
                        ""
                    ),
                    "student_answer": student_answer,
                    "correct_answer": correct_answer,
                    "topic": question.get(
                        "topic",
                        "General"
                    ),
                    "difficulty": question.get(
                        "difficulty",
                        "Unknown"
                    ),
                    "marks": marks,
                }
            )

            weak_topics.append(
                question.get(
                    "topic",
                    "General"
                )
            )

    # =====================================================
    # Calculate Percentage
    # =====================================================
    percentage = (
        round(
            (score / total_marks) * 100,
            2
        )
        if total_marks > 0
        else 0
    )

    # =====================================================
    # Store Evaluation Results
    # =====================================================
    state["score"] = score
    state["total_marks"] = total_marks
    state["total_questions"] = len(questions)
    state["percentage"] = percentage
    state["wrong_answers"] = wrong_answers
    state["weak_topics"] = list(set(weak_topics))
    # =====================================================
    # Debug Final Result
    # =====================================================
    print("=" * 50)
    print("FINAL EVALUATION")
    print("Score       :", score)
    print("Total Marks :", total_marks)
    print("Percentage  :", percentage)
    print("Questions   :", len(questions))
    print("=" * 50)


    return state