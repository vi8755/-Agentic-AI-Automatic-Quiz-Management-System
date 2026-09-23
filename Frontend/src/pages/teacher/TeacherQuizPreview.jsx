import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getQuizById } from "../../api/teacherApi";

const TeacherQuizPreview = () => {
    const { quizId } = useParams();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        loadQuiz();
    }, []);

    const loadQuiz = async () => {
        try {
            const data = await getQuizById(quizId);

            console.log(data.questions);

            setQuiz(data);
        } catch (error) {
            console.error(error);

            toast.error("Failed to load quiz.");
        } finally {
            setLoading(false);
        }
    };

    /*
     * Check whether an option is the correct answer.
     *
     * Supports both formats:
     *
     * 1. correct_answer = "A"
     * 2. correct_answer = "Option text"
     *
     * This makes the preview compatible with both
     * Topic-Based and PDF-generated quizzes.
     */
    const isCorrectOption = (question, option) => {
        const correctAnswer = String(
            question.correct_answer || ""
        ).trim();

        const optionLetter = option.label
            .replace("Option ", "")
            .trim();

        const optionValue = String(
            option.value || ""
        ).trim();

        return (
            correctAnswer.toUpperCase() ===
                optionLetter.toUpperCase() ||
            correctAnswer === optionValue
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                Loading...
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-6">
                Quiz not found.
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            {/* Top Actions */}

            <div className="flex justify-between items-center">

                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded-lg font-medium"
                >
                    ← Back
                </button>

                <button
                    onClick={() =>
                        navigate(
                            `/teacher/quizzes/${quiz.id}/edit`
                        )
                    }
                    className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-medium"
                >
                    ✏ Edit Quiz
                </button>

            </div>


            {/* Header */}

            <div className="bg-white rounded-2xl shadow-md p-6">

                <div className="flex justify-between items-start">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-800">
                            {quiz.title}
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Created on{" "}
                            {new Date(
                                quiz.created_at
                            ).toLocaleDateString()}
                        </p>

                    </div>

                    <span
                        className={`px-4 py-2 rounded-full font-semibold ${
                            quiz.status === "Published"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                        {quiz.status}
                    </span>

                </div>

            </div>


            {/* Summary */}

            <div className="grid md:grid-cols-2 gap-5">

                <div className="bg-indigo-50 rounded-xl p-5">

                    <p className="text-gray-500">
                        Total Questions
                    </p>

                    <h2 className="text-3xl font-bold text-indigo-700">
                        {quiz.questions.length}
                    </h2>

                </div>


                <div className="bg-green-50 rounded-xl p-5">

                    <p className="text-gray-500">
                        Total Marks
                    </p>

                    <h2 className="text-3xl font-bold text-green-700">
                        {quiz.questions.reduce(
                            (sum, q) =>
                                sum + q.marks,
                            0
                        )}
                    </h2>

                </div>

            </div>


            {/* Questions */}

<div className="space-y-6">

    {quiz.questions.map(
        (question, index) => (
            <div
                key={question.id}
                className="bg-white rounded-2xl shadow-md p-6"
            >

                {/* Question Header */}

                <div className="flex justify-between items-center mb-5">

                    <h2 className="text-xl font-bold text-indigo-700">
                        Question {index + 1}
                    </h2>

                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                        {question.marks}{" "}
                        Mark
                        {question.marks > 1 ? "s" : ""}
                    </span>

                </div>


                {/* Question */}

                <p className="text-lg font-medium text-gray-800 mb-6">
                    {question.question_text}
                </p>


                {/* Options */}

                <div className="space-y-3">

                    {[
                        {
                            label: "Option A",
                            value: question.option_a,
                        },
                        {
                            label: "Option B",
                            value: question.option_b,
                        },
                        {
                            label: "Option C",
                            value: question.option_c,
                        },
                        {
                            label: "Option D",
                            value: question.option_d,
                        },
                    ].map((option) => {

                        const correct = isCorrectOption(
                            question,
                            option
                        );

                        return (
                            <div
                                key={option.label}
                                className={`border rounded-lg p-3 ${
                                    correct
                                        ? "bg-green-100 border-green-500"
                                        : "bg-gray-50"
                                }`}
                            >

                                <div className="flex justify-between items-center">

                                    <span>

                                        <span className="font-semibold">
                                            {option.label}:
                                        </span>{" "}

                                        {option.value}

                                    </span>

                                    {correct && (
                                        <span className="text-green-700 font-semibold">
                                            ✓ Correct
                                        </span>
                                    )}

                                </div>

                            </div>
                        );
                    })}

                </div>


                {/* Explanation */}

                {question.explanation && (
                    <div className="mt-6 border-l-4 border-blue-500 bg-blue-50 p-4 rounded">

                        <h3 className="font-semibold text-blue-700 mb-2">
                            Explanation
                        </h3>

                        <p className="text-gray-700">
                            {question.explanation}
                        </p>

                    </div>
                )}

            </div>
        )
    )}

</div>

        </div>
    );
};

export default TeacherQuizPreview;