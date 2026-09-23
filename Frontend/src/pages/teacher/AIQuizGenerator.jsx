import { useState } from "react";
import { FaFilePdf, FaTrash } from "react-icons/fa";
import { analyzePdfForQuiz , generateQuizFromPdf,} from "../../api/teacherApi";
import { toast } from "react-toastify";

const AIQuizGenerator = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // PDF topics
    const [topics, setTopics] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);

    // Quiz settings
    const [questionCount, setQuestionCount] = useState(10);
    const [difficulty, setDifficulty] = useState("Medium");
    const [bloomLevel, setBloomLevel] = useState("Understand");
    const [timeLimit, setTimeLimit] = useState(20);

    const handleAnalyze = async () => {
        if (!selectedFile) {
            toast.warning("Please select a PDF.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("file", selectedFile);

            const data = await analyzePdfForQuiz(formData);

            console.log("PDF Analysis:", data);

            setTopics(data.clean_topics || []);
            setSelectedTopics([]);

            toast.success(data.message);

        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to analyze PDF."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleTopicToggle = (topic) => {
        setSelectedTopics((previous) => {
            if (previous.includes(topic)) {
                return previous.filter(
                    (item) => item !== topic
                );
            }

            return [...previous, topic];
        });
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setTopics([]);
        setSelectedTopics([]);
    };

     const handleGenerateQuiz = async () => {
    if (!selectedFile) {
        toast.warning("Please select a PDF.");
        return;
    }

    if (selectedTopics.length === 0) {
        toast.warning("Please select at least one topic.");
        return;
    }

    if (questionCount < 1 || questionCount > 50) {
        toast.warning(
            "Question count must be between 1 and 50."
        );
        return;
    }

    if (timeLimit < 1 || timeLimit > 180) {
        toast.warning(
            "Time limit must be between 1 and 180 minutes."
        );
        return;
    }

    try {
        setLoading(true);

        const formData = new FormData();

        // PDF
        formData.append(
            "file",
            selectedFile
        );

        // Quiz configuration
        const requestData = {
            selected_topics: selectedTopics,
            question_count: questionCount,
            difficulty: difficulty,
            bloom_level: bloomLevel,
            time_limit: timeLimit,
        };

        formData.append(
            "request",
            JSON.stringify(requestData)
        );

        console.log(
            "========== GENERATING QUIZ =========="
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

        const data = await generateQuizFromPdf(
            formData
        );

        console.log(
            "Quiz Generation Response:",
            data
        );

        toast.success(
            `Quiz generated successfully! ${data.total_questions} questions created.`
        );

        console.log(
            "Quiz ID:",
            data.quiz_id
        );

    } catch (error) {
        console.error(
            "Quiz generation error:",
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

                <h1 className="text-5xl font-bold text-red-600">
                    AI Quiz Generator
                </h1>

                <p className="text-gray-500 mt-2">
                    Upload a PDF, select topics, and configure
                    your quiz before generation.
                </p>

            </div>


            <div className="bg-white rounded-xl shadow-md p-8">

                {/* =========================
                    1. UPLOAD PDF
                ========================= */}

                <h2 className="text-xl font-semibold mb-4">
                    1. Upload PDF
                </h2>

                <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                        setSelectedFile(
                            e.target.files?.[0] || null
                        );

                        setTopics([]);
                        setSelectedTopics([]);
                    }}
                />

                {selectedFile && (
                    <div className="mt-6 flex items-center justify-between bg-gray-100 p-4 rounded-lg">

                        <div className="flex items-center gap-3">

                            <FaFilePdf className="text-red-600 text-2xl" />

                            <span>
                                {selectedFile.name}
                            </span>

                        </div>

                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-red-600 hover:text-red-800"
                        >
                            <FaTrash />
                        </button>

                    </div>
                )}

                <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!selectedFile || loading}
                    className={`mt-6 px-6 py-3 rounded-lg text-white ${
                        !selectedFile || loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    {loading
                        ? "Analyzing PDF..."
                        : "Analyze PDF"}
                </button>


                {/* =========================
                    2. SELECT TOPICS
                ========================= */}

                {topics.length > 0 && (
                    <div className="mt-10">

                        <div className="flex items-center justify-between mb-4">

                            <div>
                                <h2 className="text-xl font-semibold">
                                    2. Select Topics
                                </h2>

                                <p className="text-gray-500 text-sm mt-1">
                                    Select the topics you want to
                                    include in your quiz.
                                </p>
                            </div>

                            <span className="text-sm font-medium text-gray-600">
                                {selectedTopics.length} selected
                            </span>

                        </div>


                        <div className="space-y-3">

                            {topics.map((topic, index) => {

                                const isSelected =
                                    selectedTopics.includes(topic);

                                return (
                                    <label
                                        key={`${topic}-${index}`}
                                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                                            isSelected
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >

                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() =>
                                                handleTopicToggle(topic)
                                            }
                                            className="w-5 h-5"
                                        />

                                        <span className="text-gray-800">
                                            {topic}
                                        </span>

                                    </label>
                                );
                            })}

                        </div>

                    </div>
                )}


                {/* =========================
                    3. QUIZ SETTINGS
                ========================= */}

                {topics.length > 0 && (
                    <div className="mt-10">

                        <h2 className="text-xl font-semibold mb-2">
                            3. Quiz Settings
                        </h2>

                        <p className="text-gray-500 text-sm mb-6">
                            Configure how AI should generate your quiz.
                        </p>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                            {/* Question Count */}

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


                            {/* Difficulty */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Difficulty
                                </label>

                                <select
                                    value={difficulty}
                                    onChange={(e) =>
                                        setDifficulty(e.target.value)
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


                            {/* Bloom Level */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bloom's Taxonomy Level
                                </label>

                                <select
                                    value={bloomLevel}
                                    onChange={(e) =>
                                        setBloomLevel(e.target.value)
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


                            {/* Time Limit */}

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


                        {/* =========================
                            SELECTED TOPICS SUMMARY
                        ========================= */}

                        {selectedTopics.length > 0 && (
                            <div className="mt-6 p-5 bg-gray-50 rounded-lg border">

                                <h3 className="font-semibold mb-3">
                                    Quiz Configuration
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">

                                    <div>
                                        <span className="font-medium">
                                            Topics:
                                        </span>{" "}
                                        {selectedTopics.length}
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
                            GENERATE QUIZ
                        ========================= */}

                        <button
                            type="button"
                            onClick={handleGenerateQuiz}
                            disabled={
    selectedTopics.length === 0 ||
    loading
}
                            className={`mt-8 px-8 py-3 rounded-lg text-white font-medium ${
                                selectedTopics.length === 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {loading
    ? "Generating Quiz..."
    : "Generate Quiz"}
                        </button>

                    </div>
                )}

            </div>

        </div>
    );
};

export default AIQuizGenerator;