import fitz
from fastapi import UploadFile
import re
from ..agents.teacher_ai.graph import (
    teacher_ai_graph,
)
def extract_pdf_text(
    file: UploadFile,
):

    pdf_bytes = file.file.read()

    pdf = fitz.open(
        stream=pdf_bytes,
        filetype="pdf",
    )

    extracted_text = ""

    for page in pdf:
        extracted_text += page.get_text()

    page_count = len(pdf)

    pdf.close()

    result = teacher_ai_graph.invoke(
        { 
            "pdf_text": extracted_text,
        "cleaned_text": "",
        "chunks": [],

        "title": "",
        "question_count": 20,
        "difficulty": "Medium",
        "bloom_level": "Understand",
        "time_limit": 30,
        "status": "Draft",

        "topics": [],
        "clean_topics": [],

        "quiz_plan": {},

        "questions": [],
        "validated_questions": [],
        "quiz": {},
        }
    )
    print("\n========== RETURN TYPES ==========")

    print("result:", type(result))
    print("quiz:", type(result["quiz"]))
    print("questions:", type(result["questions"]))
    print("validated_questions:", type(result["validated_questions"]))

    print("\n========== FINAL QUIZ ==========")
    print(result["quiz"])
    print("================================\n")

    return {
    "message": "PDF processed successfully",
    "pages": page_count,
    "characters": len(result["cleaned_text"]),
    "chunks": len(result["chunks"]),
    "topics": result["topics"],
    "clean_topics": result["clean_topics"],
    "quiz_plan": result["quiz_plan"],
    "questions": result["questions"],
    "validated_questions": result["validated_questions"],
    "quiz": result["quiz"],
    }
def clean_text(text: str):

    text = re.sub(r"\n+", "\n", text)

    text = re.sub(r"[ \t]+", " ", text)

    text = text.strip()

    return text