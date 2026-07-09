def evaluation_agent(state):
    quiz_data = state.get("quiz_result", {})
    questions = quiz_data.get("questions", [])
    answers = state.get("student_answers", {})

    score = 0
    wrong_answers = []
    weak_topics = []

    for index, question in enumerate(questions):
        correct_answer = question.get("answer")

        student_answer = (
            answers.get(str(index))
            or answers.get(index)
        )

        student_choice = None

        if isinstance(student_answer, list) and student_answer:
            student_choice = student_answer[0]
        elif student_answer:
            student_choice = student_answer
  

        if student_choice == correct_answer:
            score += 1
        else:
            wrong_answers.append(
                {
                    "question": question.get("question", ""),
                    "student_answer": student_answer,
                    "correct_answer": correct_answer,
                    "topic": question.get("topic", "General"),
                    "difficulty": question.get("difficulty", "Unknown"),
                }
            )

            weak_topics.append(
                question.get("topic", "General")
            )

    state["score"] = score
    state["total_questions"] = len(questions)
    state["wrong_answers"] = wrong_answers
    state["weak_topics"] = list(set(weak_topics))

    return state