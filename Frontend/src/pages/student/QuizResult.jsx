import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    Trophy,
    Target,
    AlertCircle,
    MessageSquareText,
    BookOpen,
    Loader2,
} from "lucide-react";

import { getStudentQuizResult } from "../../api/studentApi";

const QuizResult = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // Get response ID from URL
    // =====================================================

    const responseId = window.location.pathname.split("/").pop();

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // =====================================================
    // Fetch Result + AI Polling
    // =====================================================

    useEffect(() => {
        let isMounted = true;
        let timeoutId = null;

        const fetchResult = async () => {
            try {
                if (!responseId) {
                    throw new Error("Invalid result ID.");
                }

                const data = await getStudentQuizResult(
                    responseId,
                    token
                );

                if (!isMounted) {
                    return;
                }

                setResult(data);
                setError("");
                setLoading(false);

                // -------------------------------------------------
                // Keep polling while AI analysis is processing.
                // -------------------------------------------------

                const aiStillProcessing =
                    !data.ai_analysis &&
                    data.ai_status !== "completed" &&
                    data.ai_status !== "failed";

                if (aiStillProcessing) {
                    timeoutId = setTimeout(() => {
                        fetchResult();
                    }, 3000);
                }
            } catch (err) {
                console.error(
                    "Failed to load quiz result:",
                    err
                );

                if (!isMounted) {
                    return;
                }

                setError(
                    err?.response?.data?.detail ||
                        err?.message ||
                        "Unable to load quiz result."
                );

                setLoading(false);
            }
        };

        fetchResult();

        // -----------------------------------------------------
        // Cleanup polling when component unmounts.
        // -----------------------------------------------------

        return () => {
            isMounted = false;

            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [responseId, token]);

    // =====================================================
    // Format Time
    // =====================================================

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) {
            return "—";
        }

        const totalSeconds = Number(seconds);

        if (Number.isNaN(totalSeconds)) {
            return "—";
        }

        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;

        if (minutes === 0) {
            return `${remainingSeconds}s`;
        }

        return `${minutes}m ${remainingSeconds}s`;
    };

    // =====================================================
    // Loading
    // =====================================================

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />

                    <div>
                        <div className="h-7 w-56 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mt-2" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="bg-white border border-gray-200 rounded-2xl p-6"
                        >
                            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-4" />
                        </div>
                    ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />

                    <div className="space-y-5 mt-6">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-24 bg-gray-200 rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // Error
    // =====================================================

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 mt-5">
                        Unable to load result
                    </h2>

                    <p className="text-gray-500 mt-2">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                    >
                        <ArrowLeft size={18} />
                        Back to My Quizzes
                    </button>
                </div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    // =====================================================
    // Result values
    // =====================================================

    const percentage = Number(result.percentage || 0);

    const questions = result.questions || [];

    const aiAnalysis = result.ai_analysis;

    const aiProcessing =
        !aiAnalysis &&
        result.ai_status !== "completed" &&
        result.ai_status !== "failed";

    const aiFailed =
        !aiAnalysis && result.ai_status === "failed";

    // =====================================================
    // Main UI
    // =====================================================

    return (
        <div className="space-y-6 pb-10">

            {/* =================================================
                Header
            ================================================= */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
                        title="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <p className="text-sm text-indigo-600 font-medium">
                            Quiz Result
                        </p>

                        <h1 className="text-2xl font-bold text-gray-900 mt-1">
                            {result.quiz_title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <BookOpen size={17} />

                    <span>
                        {result.total_questions} Questions
                    </span>
                </div>
            </div>

            {/* =================================================
                Score Hero
            ================================================= */}

            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">

                    {/* Score */}

                    <div className="lg:col-span-1 flex flex-col items-center justify-center">
                        <div className="relative w-36 h-36 rounded-full border-12 border-indigo-100 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {result.score}
                                </div>

                                <div className="text-sm text-gray-400">
                                    / {result.total_marks}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <Trophy
                                size={18}
                                className="text-yellow-500"
                            />

                            <span className="font-semibold text-gray-900">
                                {percentage.toFixed(1)}%
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                            Overall Score
                        </p>
                    </div>

                    {/* Progress */}

                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">
                                Performance
                            </span>

                            <span className="text-sm font-semibold text-indigo-600">
                                {percentage.toFixed(1)}%
                            </span>
                        </div>

                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                                style={{
                                    width: `${Math.min(
                                        Math.max(percentage, 0),
                                        100
                                    )}%`,
                                }}
                            />
                        </div>

                        <p className="text-sm text-gray-500 mt-3">
                            You scored{" "}
                            <span className="font-semibold text-gray-900">
                                {result.score}
                            </span>{" "}
                            out of{" "}
                            <span className="font-semibold text-gray-900">
                                {result.total_marks}
                            </span>{" "}
                            marks.
                        </p>
                    </div>
                </div>
            </div>

            {/* =================================================
                Statistics
            ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                {/* Correct */}

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Correct Answers
                            </p>

                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {result.correct_answers}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                            <CheckCircle2
                                className="text-green-600"
                                size={22}
                            />
                        </div>
                    </div>
                </div>

                {/* Wrong */}

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Wrong Answers
                            </p>

                            <p className="text-2xl font-bold text-red-600 mt-2">
                                {result.wrong_answers}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                            <XCircle
                                className="text-red-600"
                                size={22}
                            />
                        </div>
                    </div>
                </div>

                {/* Time */}

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Time Taken
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {formatTime(
                                    result.time_taken_seconds
                                )}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Clock
                                className="text-indigo-600"
                                size={22}
                            />
                        </div>
                    </div>
                </div>

                {/* Accuracy */}

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Accuracy
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {result.total_questions > 0
                                    ? Math.round(
                                          (result.correct_answers /
                                              result.total_questions) *
                                              100
                                      )
                                    : 0}
                                %
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Target
                                className="text-purple-600"
                                size={22}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                AI Performance Analysis
            ================================================= */}

            <div className="bg-white border border-gray-200 rounded-2xl p-6">

                {/* Header */}

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <MessageSquareText
                            size={20}
                            className="text-indigo-600"
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            AI Performance Analysis
                        </h2>

                        <p className="text-sm text-gray-500">
                            Personalized analysis based on your quiz
                            performance
                        </p>
                    </div>
                </div>

                {/* =================================================
                    AI PROCESSING STATE
                ================================================= */}

                {aiProcessing && (
                    <div className="mt-6">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                            <div className="flex items-center gap-4">

                                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                                    <Loader2
                                        size={22}
                                        className="text-indigo-600 animate-spin"
                                    />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        AI analysis is being generated...
                                    </h3>

                                    <p className="text-sm text-gray-600 mt-1">
                                        Your quiz score is already saved.
                                        We're preparing your personalized
                                        performance analysis.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 text-xs text-gray-500">
                                This usually takes a few moments. This page
                                will update automatically.
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    AI FAILED
                ================================================= */}

                {aiFailed && (
                    <div className="mt-6">
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                                <AlertCircle
                                    size={20}
                                    className="text-yellow-600 mt-0.5 shrink-0"
                                />

                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        AI analysis is currently unavailable
                                    </h3>

                                    <p className="text-sm text-gray-600 mt-1">
                                        Your quiz result and score have been
                                        saved successfully.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    AI READY
                ================================================= */}

                {aiAnalysis && (
                    <>
                        {/* -----------------------------------------
                            Performance Summary
                        ----------------------------------------- */}

                        {aiAnalysis.performance_summary && (
                            <div className="mt-6">
                                <h3 className="text-base font-semibold text-gray-900">
                                    Performance Summary
                                </h3>

                                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                                    <p className="text-gray-700 leading-7">
                                        {aiAnalysis.performance_summary}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* -----------------------------------------
                            Strengths
                        ----------------------------------------- */}

                        <div className="mt-6">
                            <h3 className="text-base font-semibold text-gray-900">
                                💪 Strengths
                            </h3>

                            {aiAnalysis.strengths?.length > 0 ? (
                                <div className="mt-3 space-y-3">
                                    {aiAnalysis.strengths.map(
                                        (strength, index) => (
                                            <div
                                                key={index}
                                                className="flex gap-3 bg-green-50 border border-green-100 rounded-xl p-4"
                                            >
                                                <CheckCircle2
                                                    size={20}
                                                    className="text-green-600 mt-0.5 shrink-0"
                                                />

                                                <p className="text-gray-700 leading-6">
                                                    {strength}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                                    <p className="text-sm text-gray-500">
                                        No clear strengths were identified
                                        from this attempt.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* -----------------------------------------
                            Weak Areas
                        ----------------------------------------- */}

                        <div className="mt-6">
                            <h3 className="text-base font-semibold text-gray-900">
                                ⚠️ Weak Areas
                            </h3>

                            {aiAnalysis.weak_areas?.length > 0 ? (
                                <div className="mt-3 space-y-4">
                                    {aiAnalysis.weak_areas.map(
                                        (area, index) => (
                                            <div
                                                key={index}
                                                className="bg-red-50 border border-red-100 rounded-xl p-5"
                                            >
                                                <h4 className="font-semibold text-gray-900">
                                                    {area.topic ||
                                                        "General"}
                                                </h4>

                                                <div className="mt-3">
                                                    <p className="text-sm font-medium text-gray-600">
                                                        Mistake Pattern
                                                    </p>

                                                    <p className="text-gray-700 mt-1 leading-6">
                                                        {area.mistake_pattern}
                                                    </p>
                                                </div>

                                                <div className="mt-3">
                                                    <p className="text-sm font-medium text-gray-600">
                                                        Why It Matters
                                                    </p>

                                                    <p className="text-gray-700 mt-1 leading-6">
                                                        {area.why_it_matters}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-4">
                                    <p className="text-sm text-green-700">
                                        No significant weak areas were
                                        identified.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* -----------------------------------------
                            Improvement Plan
                        ----------------------------------------- */}

                        <div className="mt-6">
                            <h3 className="text-base font-semibold text-gray-900">
                                📈 Improvement Plan
                            </h3>

                            {aiAnalysis.improvement_plan?.length > 0 ? (
                                <div className="mt-3 space-y-3">
                                    {aiAnalysis.improvement_plan.map(
                                        (step, index) => (
                                            <div
                                                key={index}
                                                className="flex gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0">
                                                    {index + 1}
                                                </div>

                                                <p className="text-gray-700 leading-6">
                                                    {step}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-gray-500">
                                    No improvement plan is available for
                                    this attempt.
                                </p>
                            )}
                        </div>

                        {/* -----------------------------------------
                            Recommended Learning
                        ----------------------------------------- */}

                        <div className="mt-6">
                            <h3 className="text-base font-semibold text-gray-900">
                                📚 Recommended Learning
                            </h3>

                            {aiAnalysis.recommendations?.length > 0 ? (
                                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {aiAnalysis.recommendations.map(
                                        (recommendation, index) => (
                                            <div
                                                key={index}
                                                className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                        <BookOpen
                                                            size={18}
                                                            className="text-indigo-600"
                                                        />
                                                    </div>

                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {
                                                                recommendation.resource
                                                            }
                                                        </h4>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-600">
                                                        Focus
                                                    </p>

                                                    <p className="text-sm text-gray-700 mt-1 leading-6">
                                                        {
                                                            recommendation.focus
                                                        }
                                                    </p>
                                                </div>

                                                <div className="mt-3">
                                                    <p className="text-sm font-medium text-gray-600">
                                                        How to Use
                                                    </p>

                                                    <p className="text-sm text-gray-700 mt-1 leading-6">
                                                        {
                                                            recommendation.how_to_use
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-gray-500">
                                    No learning recommendations are
                                    available.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* =================================================
                Question Review
            ================================================= */}

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Question Review
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Review your answers and see the correct answers.
                        </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle2 size={16} />
                            Correct
                        </div>

                        <div className="flex items-center gap-1.5 text-red-600">
                            <XCircle size={16} />
                            Incorrect
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-5">
                    {questions.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No question details available.
                        </div>
                    ) : (
                        questions.map((question, index) => (
                            <div
                                key={
                                    question.question_number ?? index
                                }
                                className={`rounded-2xl border p-5 ${
                                    question.is_correct
                                        ? "border-green-200 bg-green-50/40"
                                        : "border-red-200 bg-red-50/40"
                                }`}
                            >
                                {/* Question Header */}

                                <div className="flex items-start gap-3">
                                    {question.is_correct ? (
                                        <CheckCircle2
                                            className="text-green-600 mt-0.5 shrink-0"
                                            size={21}
                                        />
                                    ) : (
                                        <XCircle
                                            className="text-red-600 mt-0.5 shrink-0"
                                            size={21}
                                        />
                                    )}

                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <h3 className="font-semibold text-gray-900">
                                                Question{" "}
                                                {question.question_number}
                                            </h3>

                                            <span className="text-sm font-medium text-gray-600">
                                                {question.marks} mark
                                                {question.marks !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        </div>

                                        <p className="text-gray-800 mt-3 leading-6">
                                            {question.question}
                                        </p>
                                    </div>
                                </div>

                                {/* Options */}

                                <div className="mt-5 space-y-2.5">
                                    {(question.options || []).map(
                                        (option, optionIndex) => {
                                            const letter =
                                                String.fromCharCode(
                                                    65 + optionIndex
                                                );

                                            const isStudentAnswer =
                                                question.student_answer ===
                                                letter;

                                            const isCorrectAnswer =
                                                question.correct_answer ===
                                                letter;

                                            let optionStyle =
                                                "border-gray-200 bg-white";

                                            if (isCorrectAnswer) {
                                                optionStyle =
                                                    "border-green-300 bg-green-100";
                                            } else if (
                                                isStudentAnswer
                                            ) {
                                                optionStyle =
                                                    "border-red-300 bg-red-100";
                                            }

                                            return (
                                                <div
                                                    key={optionIndex}
                                                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${optionStyle}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-gray-500">
                                                            {letter}.
                                                        </span>

                                                        <span className="text-sm text-gray-700">
                                                            {option.replace(
                                                                /^[A-D]\)\s*/,
                                                                ""
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs font-medium">
                                                        {isStudentAnswer && (
                                                            <span className="text-gray-600">
                                                                Your answer
                                                            </span>
                                                        )}

                                                        {isCorrectAnswer && (
                                                            <span className="text-green-700">
                                                                Correct
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>

                                {/* Answer Summary */}

                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                                    <span className="text-gray-500">
                                        Your answer:
                                    </span>

                                    <span
                                        className={`font-semibold ${
                                            question.is_correct
                                                ? "text-green-700"
                                                : "text-red-700"
                                        }`}
                                    >
                                        {question.student_answer ||
                                            "Not answered"}
                                    </span>

                                    {!question.is_correct && (
                                        <>
                                            <span className="text-gray-400 hidden sm:inline">
                                                →
                                            </span>

                                            <span className="text-gray-500">
                                                Correct answer:
                                            </span>

                                            <span className="font-semibold text-green-700">
                                                {question.correct_answer}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* =================================================
                Bottom Action
            ================================================= */}

            <div className="flex justify-center pt-2">
                <button
                    type="button"
                    onClick={() => {
                        window.location.href = "/login";
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                    <ArrowLeft size={18} />
                    Go to Login
                </button>
            </div>
        </div>
    );
};

export default QuizResult;