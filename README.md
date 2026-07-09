# 🤖 Agentic AI Automatic Quiz Management System

An AI-powered Quiz Management System that automatically generates quizzes, assigns them to students, evaluates answers using AI, and provides personalized feedback.

Built using **FastAPI**, **React**, **LangGraph**, **LangChain**, **Ollama**, and **SQLite**.

---

# 📌 Features

## 🤖 AI Features

- AI Quiz Generation
- AI Quiz Evaluation
- AI Personalized Feedback
- LangGraph Evaluation Workflow
- Email Agent
- Retrieval-Augmented Generation (RAG)
- ChromaDB Knowledge Base

---

## 👨‍🎓 Student Management

- Add Student Manually
- Upload Students via Excel
- Download Excel Template
- Duplicate Student Validation
- Email Validation
- Delete Student
- Search Student
- Department Filter

---

## 📝 Quiz Management

- Generate AI Quiz
- Assign Quiz
- Email Quiz Link
- Student Quiz Page
- Result Page
- Prevent Multiple Attempts

---

## 📊 Admin Dashboard

- Overall Statistics
- Student Performance
- Student Progress
- Quiz Analytics
- Weak Topics
- Leaderboard
- Topic Analytics
- Score Trend
- Most Difficult Quiz
- Auto Refresh Dashboard

---

# 🛠 Tech Stack

## Backend

- FastAPI
- SQLAlchemy
- SQLite
- LangGraph
- LangChain
- Ollama (Qwen2.5:7B)
- ChromaDB
- Gmail SMTP

## Frontend

- React
- Vite
- Axios
- React Router
- React Toastify
- Recharts

---

# 🏗 Architecture

```
Admin
   │
   ▼
React Frontend
   │
   ▼
FastAPI Backend
   │
   ├── Student Management
   ├── Quiz Management
   ├── AI Quiz Generator
   ├── Evaluation Workflow
   └── Analytics
   │
   ▼
LangGraph
   │
   ├── Planner Agent
   ├── Student Agent
   ├── Quiz Agent
   ├── Email Agent
   └── Evaluation Agent
   │
   ▼
Ollama + ChromaDB + SQLite
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

## Backend

```bash
cd Backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file.

```env
GOOGLE_API_KEY=

EMAIL_ADDRESS=

EMAIL_PASSWORD=

FRONTEND_URL=http://localhost:4173

BACKEND_URL=http://localhost:8000

OLLAMA_MODEL=qwen2.5:7b
```

Run backend

```bash
uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd Frontend

npm install
```

Create a `.env`

```env
VITE_BACKEND_URL=http://localhost:8000
```

Run frontend

```bash
npm run dev
```

---

# 📂 Project Structure

```
Backend/
    app/
        agents/
        routes/
        tools/
        config.py
        database.py
        main.py

Frontend/
    src/
    public/

README.md
```

---

# 📸 Screenshots

> Add screenshots after deployment.

- Home Page
- Admin Dashboard
- Student Management
- Quiz Page
- Result Page
- Analytics Dashboard

---

# 🚀 Future Improvements

- Student Authentication
- Admin Authentication
- Quiz Timer
- Quiz Expiry
- Edit Quiz
- Edit Student
- Export PDF Reports
- Export Excel Reports
- AI Study Plan
- Email Reminders
- Docker Support
- Cloud Deployment

---

# 👨‍💻 Author

**Vishal Kumar**

B.Tech Computer Science Engineering

AI | Machine Learning | Full Stack Development

---

# ⭐ If you like this project

Give it a ⭐ on GitHub.