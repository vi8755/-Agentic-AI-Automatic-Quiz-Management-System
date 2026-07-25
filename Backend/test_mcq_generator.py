from app.ai.mcq_generator import generate_mcqs

questions = generate_mcqs(
    section="Memory Management",
    topics=[
        "Memory Management",
        "Virtual Memory",
        "Demand Paging",
        "Frame Allocation",
        "Thrashing",
    ],
    question_count=3,
    difficulty="Medium",
    bloom_level="Understand",
)

for i, q in enumerate(questions, start=1):
    print(f"\nQuestion {i}")
    print(q)