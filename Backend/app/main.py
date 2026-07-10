
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .routes import admin, quiz, student
from .config import settings

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
    student.router,
    prefix="/students",
)


@app.get("/")
def home():
    return {
        "message": "Backend Running Successfully"
    }