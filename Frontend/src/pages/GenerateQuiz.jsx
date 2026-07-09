import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config";
 import { Link } from "react-router-dom";

import "./GenerateQuiz.css";

function GenerateQuiz() {
     const navigate = useNavigate();
    const [topic, setTopic] = useState("");
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState("Mixed");

    async function generateQuiz() {
        if (!topic.trim()) {
    toast.warning("Please enter a topic.");
    return;
}

        try {
            const response = await fetch(
                `${API_BASE_URL}/generate-quiz`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        topic,
                        num_questions: Number(numQuestions),
                        difficulty,
                    }),
                }
            );

            const data = await response.json();

            toast.success(
    data.message || "Quiz generated successfully!"
);
  setTopic("");
setNumQuestions(5);
setDifficulty("Mixed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate quiz.");
        }
       
    }
    

    return (
        <div className="page">
            <div className="card">

                <h1>🤖 Generate AI Quiz</h1>
                <div className="dashboard-actions">

    <button
        onClick={() => navigate("/admin")}
    >
        📊 Dashboard
    </button>

    <button
        onClick={() => navigate("/students")}
    >
        👨‍🎓 Student Management
    </button>

</div>
<div className="top-navigation">

    <Link to="/">
        <button className="home-btn">
            🏠 Home
        </button>
    </Link>

</div>

                <input
                    placeholder="Topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />

                <input
                    type="number"
                    min="1"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                />

                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Mixed</option>
                </select>

                <button onClick={generateQuiz}>
                    Generate Quiz
                </button>

            </div>
        </div>
    );
}

export default GenerateQuiz;