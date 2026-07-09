import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "./AdminDashboard.css";
import API_BASE_URL from "../config";
function StudentDetails() {
    const { email } = useParams();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStudent() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/admin/student/${email}`
                );

                const data = await response.json();

                setStudent(data);
            } catch (error) {
                console.error(
                    "Failed to fetch student details:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        fetchStudent();
    }, [email]);

    if (loading) {
        return <h2>Loading...</h2>;
    }

    if (!student) {
        return <h2>Student not found.</h2>;
    }

    return (
        <div className="admin-container">
            <h1 className="dashboard-title">
                👨‍🎓 Student Performance
            </h1>

            <div className="stats-container">
                <div className="stat-card">
                    <h3>Email</h3>
                    <h3>{student.email}</h3>
                </div>

                <div className="stat-card">
                    <h3>Attempts</h3>
                    <h1>{student.total_attempts}</h1>
                </div>

                <div className="stat-card">
                    <h3>Average Score</h3>
                    <h1>{student.average_score}</h1>
                </div>
            </div>

            <div className="table-card">
                <h2>Quiz History</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Quiz</th>
                            <th>Score</th>
                            <th>Feedback</th>
                        </tr>
                    </thead>

                    <tbody>
                        {student.quizzes.map((quiz) => (
                            <tr key={quiz.quiz_id}>
                                <td>{quiz.quiz_title}</td>

                                <td>
                                    {quiz.score}/
                                    {quiz.total_questions}
                                </td>

                                <td>
                                    {quiz.feedback.length > 80
                                        ? `${quiz.feedback.slice(
                                              0,
                                              80
                                          )}...`
                                        : quiz.feedback}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StudentDetails;