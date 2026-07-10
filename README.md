# QuizGenAI -- Agentic AI Quiz Management System

> An AI-powered quiz management platform built with **FastAPI**,
> **React**, **LangGraph**, **LangChain**, **ChromaDB**, **SQLite**, and
> **Groq LLM**.

## 🚀 Overview

QuizGenAI automates the complete quiz lifecycle---from student
management to AI-generated quizzes, evaluation, analytics, and
personalized feedback.

## ✨ Features

-   Student Management
    -   Add/Delete students
    -   Excel upload
    -   Search & filter
-   AI Quiz Generation using Groq
-   Quiz Assignment
-   Email Notifications (SMTP)
-   Online Quiz Attempt
-   Automatic Evaluation
-   Personalized AI Feedback
-   Admin Dashboard & Analytics
-   RAG-based Knowledge Retrieval
-   LangGraph Workflow

## 🏗️ Tech Stack

### Frontend

-   React
-   Vite
-   CSS

### Backend

-   FastAPI
-   SQLAlchemy
-   SQLite

### AI

-   LangChain
-   LangGraph
-   Groq (Llama 3.3 70B)
-   ChromaDB
-   HuggingFace Embeddings

## 📂 Project Structure

``` text
first-agent/
├── Backend/
│   ├── app/
│   ├── requirements.txt
│   └── .env
├── Frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## ⚙️ Installation

### Backend

``` bash
git clone <repo-url>
cd first-agent/Backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

``` bash
cd ../Frontend
npm install
npm run dev
```

## 🔑 Environment Variables

Backend `.env`

``` env
DATABASE_URL=sqlite:///quiz.db
EMAIL_ADDRESS=your_email
EMAIL_PASSWORD=your_password
GROQ_API_KEY=your_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

## 🤖 AI Workflow

1.  Admin uploads students.
2.  Admin generates quiz.
3.  Groq generates MCQs.
4.  Quiz is stored.
5.  Email with quiz link is sent.
6.  Student attempts quiz.
7.  AI evaluates performance.
8.  Personalized feedback is generated.
9.  Dashboard updates analytics.

## 📊 Current Status

-   ✅ Student Management
-   ✅ Quiz Generation
-   ✅ AI Feedback
-   ✅ Dashboard
-   ✅ Email
-   ✅ LangGraph
-   ✅ RAG
-   ✅ Groq Integration
-   ⏳ Render Deployment
-   ⏳ Vercel Deployment

## 📸 Screenshots

Add after deployment:

-   Home Page
-   Admin Dashboard
-   Student Quiz
-   Result Page
-   Analytics
-   AI Feedback

## 🚀 Deployment

Backend: Render

Frontend: Vercel

## 🛣️ Future Improvements

-   JWT Authentication
-   Role-based Access
-   PDF Reports
-   AI Difficulty Adaptation
-   Leaderboard
-   Timer
-   Question Bank
-   Multi-language Support

## 👨‍💻 Author

**Vishal Kumar**

B.Tech CSE \| AI & Full Stack Developer

If you found this project useful, consider giving it a ⭐ on GitHub.
