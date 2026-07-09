import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./Result.css";

import API_BASE_URL from "../config";

function Result() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/result/${id}`
                );

                const data = await response.json();

                setResult(data);
            } catch (error) {
    console.error("Failed to load result:", error);
    toast.error("Failed to load result.");
} finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [id]);

    if (loading) {
        return <h2>Loading Result...</h2>;
    }

    if (!result) {
        return (
    <div className="page">
        <div className="result-card">
            <h2>Result not found.</h2>

            <button onClick={() => navigate("/admin")}>
                Back to Dashboard
            </button>
        </div>
    </div>
);
    }

    const performance =
        result.percentage >= 80
            ? "Excellent"
            : result.percentage >= 50
            ? "Good"
            : "Needs Improvement";

    return (
        <div className="page">
            <div className="result-card">
                <h1>🎉 Quiz Completed!</h1>

                <p className="subtitle">
                    Great effort! Keep learning and improving. ✨
                </p>

                <div className="top-section">
                    <div className="circle-box">
                        <div
                            className="progress-circle"
                            style={{
                                background: `conic-gradient(#7c3aed ${
                                    result.percentage * 3.6
                                }deg, #eee 0deg)`,
                            }}
                        >
                            <div className="inner">
                                <h2>{result.percentage}%</h2>

                                <p>Your Score</p>
                            </div>
                        </div>
                    </div>

                    <div className="score-box">
                        <div>
                            🏆

                            <h3>Score</h3>

                            <h2>
                                {result.score}/
                                {result.total_questions ?? 5}
                            </h2>
                        </div>

                        <div>
                            📄

                            <h3>Total Questions</h3>

                            <h2>
                                {result.total_questions ?? 5}
                            </h2>
                        </div>
                    </div>

                    <div className="performance">
                        <h3>Performance</h3>

                        <div className="emoji">
                            {result.percentage >= 50
                                ? "😊"
                                : "😟"}
                        </div>

                        <h2>{performance}</h2>

                        <p>
                            Keep practicing and improve your
                            weak areas.
                        </p>
                    </div>
                </div>

                <div className="motivation">
                    <h2>💡 Keep Going!</h2>

                    <p>
                        Focus on your weak areas and practice
                        more. You will do great in the next
                        quiz! 💪
                    </p>
                </div>

                <div className="feedback">
                    <h2>🤖 AI Mentor Feedback</h2>

                    <p>{result.feedback}</p>
                </div>

                <div className="buttons">
                    <button
                        onClick={() => navigate("/")}
                    >
                        🏠 Back to Home
                    </button>

                    <button
                        onClick={() =>
                            navigate(
    `/quiz/${result.quiz_id}?email=${result.student_email}`
)
                        }
                    >
                        🔄 Retake Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Result;