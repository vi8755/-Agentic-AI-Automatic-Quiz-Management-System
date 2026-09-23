from .state import TeacherAIState

from .state import TeacherAIState
from ...utils.text_processing import (
    clean_text,
    chunk_text,
)
from ...ai.topic_cleaner import clean_topics
from ...utils.topic_extractor import extract_topics
from ...ai.quiz_planner import create_quiz_plan
from ...ai.mcq_generator import generate_mcqs
from ...ai.question_validator import validate_questions
def clean_text_node(
    state: TeacherAIState,
):
    cleaned = clean_text(
        state["pdf_text"]
    )

    state["cleaned_text"] = cleaned

    return state


def chunk_text_node(
    state: TeacherAIState,
):
    chunks = chunk_text(
        state["cleaned_text"]
    )

    state["chunks"] = chunks

    return state

def quiz_planner_node(
    state: TeacherAIState,
):
    quiz_plan = create_quiz_plan(
        topics=state["selected_topics"],
        question_count=state["question_count"],
        difficulty=state["difficulty"],
        bloom_level=state["bloom_level"],
    )

    print("\n========== QUIZ PLAN ==========\n")
    print(quiz_plan)
    print("\n================================\n")

    state["quiz_plan"] = quiz_plan

    return state

def generate_questions_node(
    state: TeacherAIState,
):
    all_questions = []

    for section in state["quiz_plan"]["distribution"]:

        questions = generate_mcqs(
            section=section["section"],
            topics=section["topics"],
            question_count=section["questions"],
            difficulty=state["difficulty"],
            bloom_level=state["bloom_level"],
        )

        all_questions.extend(questions)

    print("\n========== GENERATED QUESTIONS ==========\n")
    print(f"Total Questions: {len(all_questions)}")

    for i, q in enumerate(all_questions[:3], start=1):
     print(f"\nQuestion {i}")
     print(q)

    print("\n=========================================\n")

    state["questions"] = all_questions

    return state

def validate_questions_node(
    state: TeacherAIState,
):
    validated = validate_questions(
        state["questions"]
    )

    print("\n========== VALIDATED QUESTIONS ==========\n")
    print(f"Generated : {len(state['questions'])}")
    print(f"Validated : {len(validated)}")
    print("\n=========================================\n")

    state["validated_questions"] = validated

    return state


def format_quiz_node(
    state: TeacherAIState,
):
    quiz = {
        "title": state["quiz_plan"].get(
            "title",
            state["title"],
        ),
        "difficulty": state["difficulty"],
        "bloom_level": state["bloom_level"],
        "time_limit": state["time_limit"],
        "status": state["status"],
        "question_count": len(
            state["validated_questions"]
        ),
        "questions": state["validated_questions"],
    }

    state["quiz"] = quiz

    print("\n========== FINAL QUIZ ==========\n")
    print("Title :", quiz["title"])
    print("Questions :", quiz["question_count"])
    print("Difficulty :", quiz["difficulty"])
    print("Status :", quiz["status"])
    print("\n================================\n")

    return state

def extract_topics_node(state: TeacherAIState):

    print("\n========== CLEANED TEXT ==========\n")
    print(state["cleaned_text"][:1500])
    print("\n==================================\n")

    topics = extract_topics(
        state["cleaned_text"]
    )

    print("Detected Topics:", topics)

    state["topics"] = topics

    return state

def clean_topics_node(state: TeacherAIState):
    cleaned = clean_topics(
        state["topics"]
    )

    print("\n========== CLEAN TOPICS ==========\n")
    print(cleaned)
    print("\n==================================\n")

    state["clean_topics"] = cleaned

    return state
    