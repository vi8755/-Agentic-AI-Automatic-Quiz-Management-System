import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home">

      <div className="hero">

        <h1>
          🤖 Agentic AI Automatic Quiz Management System
        </h1>

        <p>
          Generate AI-powered quizzes, assign them to students,
          evaluate responses automatically, and analyze
          performance through an intelligent dashboard.
        </p>

        <div className="buttons">

          <Link to="/admin">
            <button className="primary">
              Admin Dashboard
            </button>
          </Link>

        </div>

      </div>

      <div className="features">

        <div className="card">
          <h3>🤖 AI Quiz Generation</h3>
          <p>Create quizzes automatically using AI.</p>
        </div>

        <div className="card">
          <h3>📊 Analytics</h3>
          <p>Track performance, weak topics and leaderboard.</p>
        </div>

        <div className="card">
          <h3>📧 Email Automation</h3>
          <p>Assign quizzes directly through email.</p>
        </div>

        <div className="card">
          <h3>🧠 LangGraph Workflow</h3>
          <p>Planner, Quiz, Email and Evaluation Agents.</p>
        </div>

      </div>

    </div>
  );
}

export default Home;