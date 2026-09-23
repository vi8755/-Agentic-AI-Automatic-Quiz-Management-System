
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import dean
from . import models
from .database import Base, engine
from .routes import (
   admin,
    quiz,
    student,
    student_management,
    teacher,
    dean,
    dean_student,

)

import os
from fastapi.staticfiles import StaticFiles
from app.routes import dean_teacher
from .routes import descriptive_assignment
from .config import settings
from .routes import section
from .routes import subject
from .routes import teacher_section
from .routes import user
from .routes import auth
from .routes import teacher_ai
from .routes import dean_batch

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Agentic AI Automatic Quiz Management System",
    version="1.0.0",
    description="Backend API for AI-powered Automatic Quiz Management System",
)


origins = [
    settings.FRONTEND_URL,
    settings.FRONTEND_PREVIEW_URL,
]
os.makedirs("uploads", exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(quiz.router)

app.include_router(
    admin.router,
    prefix="/admin",
)
 
app.include_router(
    teacher_ai.router,
    prefix="/teachers/ai",
    tags=["Teacher AI"],
)

app.include_router(section.router)
app.include_router(teacher.router) 
app.include_router(
    descriptive_assignment.router
)
app.include_router(subject.router)
app.include_router(
    teacher_section.router
)
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(student.router) 
app.include_router(student_management.router)
app.include_router(dean.router)
app.include_router(
    dean_student.router
)
app.include_router(dean_batch.router)
app.include_router(
    dean_teacher.router
)

@app.get("/")
def home():
    return {
        "message": "Backend Running Successfully"
    }