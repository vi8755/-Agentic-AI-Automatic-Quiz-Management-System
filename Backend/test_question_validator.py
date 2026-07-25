from app.ai.question_validator import validate_questions

questions = [
    {
        "question": "What is an OS?",
        "options": [
            "Hardware",
            "Software",
            "Network",
            "Compiler",
        ],
        "correct_answer": "Software",
        "explanation": "Operating System is software.",
        "difficulty": "Medium",
        "bloom_level": "Understand",
        "topic": "Operating System",
    }
]

validated = validate_questions(questions)

print(validated)