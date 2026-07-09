from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama

from ..database import SessionLocal
from ..models import Student
from ..tools.student_tools import read_students_excel


llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0,
)


student_tools = [
    read_students_excel,
]


def student_agent(state):
    students = read_students_excel.invoke(
        {
            "file_path": "finalStudent.xlsx"
        }
    )

    if not students:
        return {
            "messages": [
                HumanMessage(content="No students found in Excel.")
            ]
        }

    db = SessionLocal()

    try:
        for student in students:
            email = student["Email"].strip()

            existing = (
                db.query(Student)
                .filter(Student.email == email)
                .first()
            )

            if existing:
                continue

            new_student = Student(
                name=student["Name"].strip(),
                roll_no=student["roll_no"],
                email=email,
                department=student["Department"].strip(),
            )

            db.add(new_student)

        db.commit()

    finally:
        db.close()

    return {
        "messages": [
            HumanMessage(content="Students imported successfully")
        ],
        "student_email": students[0]["Email"],
        "student_name": students[0]["Name"],
    }