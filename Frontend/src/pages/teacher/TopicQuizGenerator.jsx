import { useState } from "react";
import { FaBrain, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { generateTopicQuiz } from "../../api/teacherApi";

const TopicQuizGenerator = () => {
    const navigate = useNavigate();

    const [topic, setTopic] = useState("");

    const [questionCount, setQuestionCount] = useState(10);

    const [difficulty, setDifficulty] = useState("Medium");

    const [bloomLevel, setBloomLevel] =
        useState("Understand");

    const [timeLimit, setTimeLimit] = useState(20);

    const [loading, setLoading] = useState(false);


    // =========================
    // GENERATE QUIZ
    // =========================

    const handleGenerateQuiz = async () => {

        if (!topic.trim()) {
            toast.warning(
                "Please enter a topic."
            );
            return;
        }


        if (
            questionCount < 1 ||
            questionCount > 50
        ) {
            toast.warning(
                "Question count must be between 1 and 50."
            );
            return;
        }


        if (
            timeLimit < 1 ||
            timeLimit > 180
        ) {
            toast.warning(
                "Time limit must be between 1 and 180 minutes."
            );
            return;
        }


        try {

            setLoading(true);


            const requestData = {

                topic: topic.trim(),

                question_count: Number(
                    questionCount
                ),

                difficulty,

                bloom_level: bloomLevel,

                time_limit: Number(
                    timeLimit
                ),
            };


            console.log(
                "========== TOPIC QUIZ =========="
            );

            console.log(
                "Topic:",
                requestData.topic
            );

            console.log(
                "Question Count:",
                requestData.question_count
            );

            console.log(
                "Difficulty:",
                requestData.difficulty
            );

            console.log(
                "Bloom Level:",
                requestData.bloom_level
            );

            console.log(
                "Time Limit:",
                requestData.time_limit
            );


            const data =
                await generateTopicQuiz(
                    requestData
                );


            console.log(
                "Topic Quiz Response:",
                data
            );


            toast.success(
                `Quiz generated successfully! ${data.total_questions} questions created.`
            );


            console.log(
                "Quiz ID:",
                data.quiz_id
            );


            // Clear topic after successful generation
            setTopic("");

        } catch (error) {

            console.error(
                "Topic quiz generation error:",
                error
            );


            toast.error(
                error.response?.data?.detail ||
                "Failed to generate quiz."
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <div>

            {/* =========================
                PAGE HEADER
            ========================= */}

            <div className="mb-8">

                <div className="flex items-center gap-3">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/teacher/dashboard"
                            )
                        }
                        className="p-3 rounded-lg bg-white shadow hover:bg-gray-100 transition"
                    >
                        <FaArrowLeft />
                    </button>


                    <div>

                        <h1 className="text-5xl font-bold text-red-600">
                            Topic Quiz Generator
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Enter a topic and configure your
                            quiz before generation.
                        </p>

                    </div>

                </div>

            </div>


            {/* =========================
                MAIN CARD
            ========================= */}

            <div className="bg-white rounded-xl shadow-md p-8">


                {/* =========================
                    TOPIC
                ========================= */}

                <div className="flex items-center gap-3 mb-6">

                    <FaBrain className="text-red-600 text-2xl" />

                    <div>

                        <h2 className="text-xl font-semibold">
                            1. Enter Topic
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Enter the subject or topic from which
                            AI should generate questions.
                        </p>

                    </div>

                </div>


                <input
                    type="text"
                    value={topic}
                    onChange={(e) =>
                        setTopic(e.target.value)
                    }
                    placeholder="e.g. Operating Systems"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />


                {/* =========================
                    QUIZ SETTINGS
                ========================= */}

                <div className="mt-10">

                    <h2 className="text-xl font-semibold mb-2">
                        2. Quiz Settings
                    </h2>

                    <p className="text-gray-500 text-sm mb-6">
                        Configure how AI should generate your quiz.
                    </p>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                        {/* =========================
                            QUESTION COUNT
                        ========================= */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Questions
                            </label>

                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={questionCount}
                                onChange={(e) =>
                                    setQuestionCount(
                                        Number(e.target.value)
                                    )
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />

                            <p className="text-xs text-gray-500 mt-1">
                                Choose between 1 and 50 questions.
                            </p>

                        </div>


                        {/* =========================
                            DIFFICULTY
                        ========================= */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty
                            </label>

                            <select
                                value={difficulty}
                                onChange={(e) =>
                                    setDifficulty(
                                        e.target.value
                                    )
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >

                                <option value="Easy">
                                    Easy
                                </option>

                                <option value="Medium">
                                    Medium
                                </option>

                                <option value="Hard">
                                    Hard
                                </option>

                            </select>

                        </div>


                        {/* =========================
                            BLOOM LEVEL
                        ========================= */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bloom's Taxonomy Level
                            </label>

                            <select
                                value={bloomLevel}
                                onChange={(e) =>
                                    setBloomLevel(
                                        e.target.value
                                    )
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >

                                <option value="Remember">
                                    Remember
                                </option>

                                <option value="Understand">
                                    Understand
                                </option>

                                <option value="Apply">
                                    Apply
                                </option>

                                <option value="Analyze">
                                    Analyze
                                </option>

                            </select>

                        </div>


                        {/* =========================
                            TIME LIMIT
                        ========================= */}

                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Limit (Minutes)
                            </label>

                            <input
                                type="number"
                                min="1"
                                max="180"
                                value={timeLimit}
                                onChange={(e) =>
                                    setTimeLimit(
                                        Number(e.target.value)
                                    )
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />

                            <p className="text-xs text-gray-500 mt-1">
                                Set the maximum time allowed for the quiz.
                            </p>

                        </div>

                    </div>

                </div>


                {/* =========================
                    CONFIGURATION SUMMARY
                ========================= */}

                {topic.trim() && (

                    <div className="mt-8 p-5 bg-gray-50 rounded-lg border">

                        <h3 className="font-semibold mb-3">
                            Quiz Configuration
                        </h3>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">

                            <div>
                                <span className="font-medium">
                                    Topic:
                                </span>{" "}
                                {topic}
                            </div>


                            <div>
                                <span className="font-medium">
                                    Questions:
                                </span>{" "}
                                {questionCount}
                            </div>


                            <div>
                                <span className="font-medium">
                                    Difficulty:
                                </span>{" "}
                                {difficulty}
                            </div>


                            <div>
                                <span className="font-medium">
                                    Bloom Level:
                                </span>{" "}
                                {bloomLevel}
                            </div>


                            <div>
                                <span className="font-medium">
                                    Time Limit:
                                </span>{" "}
                                {timeLimit} minutes
                            </div>

                        </div>

                    </div>

                )}


                {/* =========================
                    GENERATE BUTTON
                ========================= */}

                <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={
                        !topic.trim() ||
                        loading
                    }
                    className={`mt-8 px-8 py-3 rounded-lg text-white font-medium ${
                        !topic.trim() || loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                    }`}
                >

                    {loading
                        ? "Generating Quiz..."
                        : "Generate Quiz"}

                </button>


            </div>

        </div>
    );
};

export default TopicQuizGenerator;