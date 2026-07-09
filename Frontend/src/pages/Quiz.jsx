import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config";
import "./Quiz.css";

function Quiz() {
    const { id } = useParams();
    const studentEmail = new URLSearchParams(
    window.location.search
    ).get("email");
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/get_quiz/${id}`
                );

                const data = await response.json();

                setQuiz(data);
            } catch (error) {
                console.error("Failed to load quiz:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [id]);

    function handleAnswer(questionIndex, option) {
        setAnswers((prev) => ({
            ...prev,
            [questionIndex]: option,
        }));
    }

    async function submitQuiz() {
        if (Object.keys(answers).length !== quiz.questions.length) {
            toast.warning("Please answer all questions.");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/submit_quiz`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        quiz_id: Number(id),
                        student_email: studentEmail,
                        answers: answers,
                    }),
                }
            );

            const data = await response.json();

if (!response.ok) {
    toast.error(data.detail || "Submission failed.");
    return;
}

toast.success("Quiz submitted successfully!");

navigate(`/result/${data.response_id}`);
        } catch (error) {
            console.error("Quiz submission failed:", error);
            toast.error("Unable to submit quiz. Please try again.");
        }
    }

    if (loading) {
        return <h2>Loading Quiz...</h2>;
    }

    if (!quiz) {
        return <h2>Quiz not found.</h2>;
    }


    return (
    <div className="quiz-page">

        <div className="quiz-container">

            <h1>{quiz.title}</h1>

            {quiz.questions.map((q, index) => (

                <div
                    className="question-card"
                    key={index}
                >

                    <h3>
                        {index + 1}. {q.question}
                    </h3>

                    <div className="options">

                        {q.options.map((option) => {

                            const optionLetter =
                                option.split(")")[0];

                            return (

                                <label
                                    key={option}
                                    className="option"
                                >

                                    <input
                                        type="radio"
                                        name={`q-${index}`}
                                        value={optionLetter}
                                        checked={
                                            answers[index] === optionLetter
                                        }
                                        onChange={() =>
                                            handleAnswer(
                                                index,
                                                optionLetter
                                            )
                                        }
                                    />

                                    <span>{option}</span>

                                </label>

                            );

                        })}

                    </div>

                </div>

            ))}

            <button
                className="submit-btn"
                onClick={submitQuiz}
            >
                Submit Quiz
            </button>

        </div>

    </div>
);
}
    
export default Quiz;