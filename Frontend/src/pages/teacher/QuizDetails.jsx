import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getQuizById } from "../../api/teacherApi";

const QuizDetails = () => {
    const { quizId } = useParams();

    const [quiz, setQuiz] = useState(null);

    useEffect(() => {
        loadQuiz();
    }, []);

    const loadQuiz = async () => {
        try {
            const data = await getQuizById(quizId);
            setQuiz(data);
        } catch (error) {
            toast.error("Failed to load quiz.");
        }
    };

    if (!quiz) {
        return <div>Loading...</div>;
    }

    return (
    <div className="space-y-8">

        <div>
            <h1 className="text-4xl font-bold text-slate-800">
                {quiz.title}
            </h1>

            <p className="text-slate-500 mt-2">
                {quiz.total_questions} Questions
            </p>
        </div>

        {quiz.questions.map((question, index) => (
            <div
                key={index}
                className="bg-white rounded-2xl shadow-md border p-6"
            >
                <h2 className="text-xl font-semibold mb-5">
                    Question {index + 1}
                </h2>

                <p className="text-lg font-medium mb-6">
                    {question.question}
                </p>

                <div className="space-y-3">

                    {question.options.map((option, optionIndex) => (
                        <div
                            key={optionIndex}
                            className={`p-3 rounded-lg border ${
                                option === question.answer
                                    ? "bg-green-100 border-green-500 text-green-700 font-semibold"
                                    : "bg-gray-50 border-gray-200"
                            }`}
                        >
                            {option}
                        </div>
                    ))}

                </div>
            </div>
        ))}

    </div>
);
};

export default QuizDetails;