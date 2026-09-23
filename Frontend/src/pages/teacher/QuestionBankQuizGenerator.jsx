import { useState } from "react";
import {
    FaFilePdf,
    FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

import {
    analyzeQuestionBank,
    generateQuestionBankQuiz,
} from "../../api/teacherApi";


const QuestionBankQuizGenerator = () => {

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [analysis, setAnalysis] =
        useState(null);

    const [topics, setTopics] =
        useState([]);

    const [selectedTopics, setSelectedTopics] =
        useState([]);

    const [questionCount, setQuestionCount] =
        useState(10);

    const [difficulty, setDifficulty] =
        useState("Medium");

    const [bloomLevel, setBloomLevel] =
        useState("Understand");

    const [timeLimit, setTimeLimit] =
        useState(20);

    const [loading, setLoading] =
        useState(false);

    const [generating, setGenerating] =
        useState(false);


    // =====================================================
    // FILE SELECT
    // =====================================================

    const handleFileChange = (event) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(file);

        setAnalysis(null);
        setTopics([]);
        setSelectedTopics([]);
    };


    // =====================================================
    // ANALYZE PDF
    // =====================================================

    const handleAnalyze = async () => {

        if (!selectedFile) {

            toast.warning(
                "Please select a question-bank PDF."
            );

            return;
        }

        try {

            setLoading(true);

            const formData =
                new FormData();

            formData.append(
                "file",
                selectedFile
            );

            const data =
                await analyzeQuestionBank(
                    formData
                );

            console.log(
                "Question Bank Analysis:",
                data
            );

            setAnalysis(data);

            setTopics(
                data.topics || []
            );

            setSelectedTopics([]);

            toast.success(
                "Question bank analyzed successfully."
            );

        } catch (error) {

            console.error(
                "Analysis error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to analyze question bank."
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // TOPIC SELECT
    // =====================================================

    const toggleTopic = (topicName) => {

        setSelectedTopics(
            (previous) => {

                if (
                    previous.includes(
                        topicName
                    )
                ) {

                    return previous.filter(
                        (item) =>
                            item !== topicName
                    );
                }

                return [
                    ...previous,
                    topicName,
                ];
            }
        );
    };


    // =====================================================
    // GENERATE QUIZ
    // =====================================================

    const handleGenerate = async () => {

        if (!selectedFile) {

            toast.warning(
                "Please select a PDF."
            );

            return;
        }

        if (!analysis) {

            toast.warning(
                "Please analyze the PDF first."
            );

            return;
        }

        if (
            selectedTopics.length === 0
        ) {

            toast.warning(
                "Please select at least one topic."
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

        try {

            setGenerating(true);

            const formData =
                new FormData();

            // PDF
            formData.append(
                "file",
                selectedFile
            );

            // Selected topics
            formData.append(
                "selected_topics",
                JSON.stringify(
                    selectedTopics
                )
            );

            // Number of questions
            formData.append(
                "question_count",
                String(
                    questionCount
                )
            );

            // Difficulty
            formData.append(
                "difficulty",
                difficulty
            );

            // Bloom level
            formData.append(
                "bloom_level",
                bloomLevel
            );

            // Time limit
            formData.append(
                "time_limit",
                String(
                    timeLimit
                )
            );

            console.log(
                "========== GENERATING QUESTION BANK QUIZ =========="
            );

            console.log(
                "Selected Topics:",
                selectedTopics
            );

            console.log(
                "Question Count:",
                questionCount
            );

            console.log(
                "Difficulty:",
                difficulty
            );

            console.log(
                "Bloom Level:",
                bloomLevel
            );

            console.log(
                "Time Limit:",
                timeLimit
            );

            // Generate quiz
            // IMPORTANT:
            // No "analysis" is sent here.
            const data =
                await generateQuestionBankQuiz(
                    formData
                );

            console.log(
                "Generated Quiz:",
                data
            );

            toast.success(
                `Quiz generated successfully! ${data.total_questions} questions created.`
            );

        } catch (error) {

            console.error(
                "Generation error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to generate quiz."
            );

        } finally {

            setGenerating(false);
        }
    };


    return (
        <div className="p-6">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="mb-8">

                <h1 className="text-3xl font-bold text-gray-800">
                    Question Bank → Quiz
                </h1>

                <p className="text-gray-500 mt-2">
                    Upload a question-bank PDF,
                    analyze its structure,
                    select topics and generate a quiz.
                </p>

            </div>


            {/* =====================================================
                UPLOAD
            ===================================================== */}

            <div className="bg-white rounded-xl shadow p-6 mb-6">

                <h2 className="text-xl font-semibold mb-4">
                    1. Upload Question Bank
                </h2>

                <input
                    type="file"
                    accept=".pdf"
                    onChange={
                        handleFileChange
                    }
                    className="block w-full border rounded-lg p-3"
                />

                {selectedFile && (

                    <div className="mt-4 flex items-center gap-3 text-green-600">

                        <FaFilePdf />

                        <span>
                            {selectedFile.name}
                        </span>

                    </div>
                )}

                <button
                    onClick={
                        handleAnalyze
                    }
                    disabled={
                        loading ||
                        !selectedFile
                    }
                    className="mt-5 px-5 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >

                    {loading
                        ? "Analyzing..."
                        : "Analyze Question Bank"
                    }

                </button>

            </div>


            {/* =====================================================
                TOPICS
            ===================================================== */}

            {topics.length > 0 && (

                <div className="bg-white rounded-xl shadow p-6 mb-6">

                    <h2 className="text-xl font-semibold mb-4">
                        2. Select Topics
                    </h2>

                    <div className="grid md:grid-cols-2 gap-3">

                        {topics.map(
                            (topic, index) => {

                                const name =
                                    topic.name;

                                const selected =
                                    selectedTopics.includes(
                                        name
                                    );

                                return (

                                    <button
                                        key={
                                            `${name}-${index}`
                                        }
                                        type="button"
                                        onClick={() =>
                                            toggleTopic(
                                                name
                                            )
                                        }
                                        className={`text-left p-4 rounded-lg border ${
                                            selected
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-gray-200"
                                        }`}
                                    >

                                        <div className="flex justify-between">

                                            <span className="font-medium">
                                                {name}
                                            </span>

                                            {selected && (
                                                <FaCheckCircle className="text-blue-600" />
                                            )}

                                        </div>

                                        <p className="text-sm text-gray-500 mt-1">

                                            {topic.question_count !== undefined
                                                ? `${topic.question_count} questions`
                                                : `Pages ${topic.start_page} - ${topic.end_page}`
                                            }

                                        </p>

                                    </button>
                                );
                            }
                        )}

                    </div>

                </div>
            )}


            {/* =====================================================
                SETTINGS
            ===================================================== */}

            {analysis && (

                <div className="bg-white rounded-xl shadow p-6 mb-6">

                    <h2 className="text-xl font-semibold mb-4">
                        3. Quiz Settings
                    </h2>

                    <div className="grid md:grid-cols-2 gap-5">

                        {/* QUESTION COUNT */}

                        <div>

                            <label className="block mb-2 font-medium">
                                Number of Questions
                            </label>

                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={
                                    questionCount
                                }
                                onChange={(e) =>
                                    setQuestionCount(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="w-full border rounded-lg p-3"
                            />

                        </div>


                        {/* DIFFICULTY */}

                        <div>

                            <label className="block mb-2 font-medium">
                                Difficulty
                            </label>

                            <select
                                value={
                                    difficulty
                                }
                                onChange={(e) =>
                                    setDifficulty(
                                        e.target.value
                                    )
                                }
                                className="w-full border rounded-lg p-3"
                            >

                                <option>
                                    Easy
                                </option>

                                <option>
                                    Medium
                                </option>

                                <option>
                                    Hard
                                </option>

                            </select>

                        </div>


                        {/* BLOOM LEVEL */}

                        <div>

                            <label className="block mb-2 font-medium">
                                Bloom Level
                            </label>

                            <select
                                value={
                                    bloomLevel
                                }
                                onChange={(e) =>
                                    setBloomLevel(
                                        e.target.value
                                    )
                                }
                                className="w-full border rounded-lg p-3"
                            >

                                <option>
                                    Remember
                                </option>

                                <option>
                                    Understand
                                </option>

                                <option>
                                    Apply
                                </option>

                                <option>
                                    Analyze
                                </option>

                            </select>

                        </div>


                        {/* TIME LIMIT */}

                        <div>

                            <label className="block mb-2 font-medium">
                                Time Limit (minutes)
                            </label>

                            <input
                                type="number"
                                min="1"
                                max="180"
                                value={
                                    timeLimit
                                }
                                onChange={(e) =>
                                    setTimeLimit(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="w-full border rounded-lg p-3"
                            />

                        </div>

                    </div>

                </div>
            )}


            {/* =====================================================
                GENERATE
            ===================================================== */}

            {analysis && (

                <div className="flex justify-end">

                    <button
                        onClick={
                            handleGenerate
                        }
                        disabled={
                            generating ||
                            selectedTopics.length === 0
                        }
                        className="px-7 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50"
                    >

                        {generating
                            ? "Generating Quiz..."
                            : "Generate Quiz"
                        }

                    </button>

                </div>
            )}

        </div>
    );
};


export default QuestionBankQuizGenerator;