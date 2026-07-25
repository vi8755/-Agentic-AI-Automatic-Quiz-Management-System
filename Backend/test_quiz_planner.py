from app.ai.quiz_planner import create_quiz_plan

topics = [
    "Operating System",
    "CPU Scheduling",
    "Deadlock",
    "Memory Management",
    "Paging",
    "Disk Scheduling",
]

plan = create_quiz_plan(
    topics=topics,
    question_count=20,
    difficulty="Medium",
    bloom_level="Understand",
)

print(plan)