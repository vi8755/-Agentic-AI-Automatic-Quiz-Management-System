import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
    ArrowLeft,
    Award,
    CheckCircle,
    FileText,
    Loader2,
    MessageSquare,
    Clock,
    AlertCircle,
    Image as ImageIcon,
} from "lucide-react";

import {
    getStudentDescriptiveSubmission,
} from "../../api/studentApi";

const StudentDescriptiveResult = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD RESULT
    // =========================================================

    useEffect(() => {
        if (!assignmentId) {
            setError("Invalid assignment ID.");
            setLoading(false);
            return;
        }

        loadResult();
    }, [assignmentId]);

    const loadResult = async () => {
        try {
            setLoading(true);
            setError("");

            const data =
                await getStudentDescriptiveSubmission(
                    assignmentId
                );

            console.log(
                "STUDENT DESCRIPTIVE RESULT:",
                data
            );

            setResult(data);
        } catch (err) {
            console.error(
                "Failed to load descriptive result:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                "Unable to load assignment result.";

            setError(message);

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // DATE FORMAT
    // =========================================================

    const formatDateTime = (date) => {
        if (!date) {
            return "—";
        }

        const parsedDate = new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "—";
        }

        return parsedDate.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

                        <Loader2
                            size={42}
                            className="mx-auto text-purple-600 animate-spin mb-4"
                        />

                        <h2 className="text-lg font-semibold text-gray-900">
                            Loading your result...
                        </h2>

                        <p className="text-gray-500 mt-1">
                            Please wait while we load your evaluation.
                        </p>

                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error || !result) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">

                <div className="max-w-5xl mx-auto">

                    <button
                        onClick={() =>
                            navigate(
                                "/student/dashboard"
                            )
                        }
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm p-10 text-center">

                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">

                            <AlertCircle
                                size={32}
                                className="text-red-600"
                            />

                        </div>

                        <h2 className="text-xl font-bold text-gray-900">
                            Result Not Available
                        </h2>

                        <p className="text-gray-500 mt-2">
                            {error ||
                                "Your assignment result could not be loaded."}
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/student/dashboard"
                                )
                            }
                            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>

                    </div>

                </div>

            </div>
        );
    }

    // =========================================================
    // RESULT DATA
    // =========================================================

    const obtainedMarks =
        Number(
            result.obtained_marks ?? 0
        );

    const totalMarks =
        Number(
            result.total_marks ?? 0
        );

    const percentage =
        Number(
            result.percentage ??
            (
                totalMarks > 0
                    ? (obtainedMarks /
                          totalMarks) *
                      100
                    : 0
            )
        );

    const percentageValue =
        Math.min(
            Math.max(
                percentage,
                0
            ),
            100
        );

    const evaluationStatus =
        result.evaluation_status ||
        result.status ||
        "Evaluated";

    const isTeacherReviewed =
        evaluationStatus
            .toLowerCase()
            .includes("teacher");

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            <div className="max-w-5xl mx-auto">

                {/* =====================================================
                    BACK
                ===================================================== */}

                <button
                    onClick={() =>
                        navigate(
                            "/student/dashboard"
                        )
                    }
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-5 transition"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 md:p-8 text-white">

                        <div className="flex items-center gap-4">

                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">

                                <Award
                                    size={30}
                                />

                            </div>

                            <div>

                                <p className="text-purple-100 text-sm font-medium">
                                    Descriptive Assignment
                                </p>

                                <h1 className="text-2xl md:text-3xl font-bold mt-1">
                                    Assignment Result
                                </h1>

                                <p className="text-purple-100 mt-2">
                                    Assignment #
                                    {assignmentId}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* =================================================
                        SCORE
                    ================================================= */}

                    <div className="p-6 md:p-8">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                            {/* OBTAINED */}

                            <div className="border border-purple-100 bg-purple-50 rounded-2xl p-6">

                                <p className="text-sm text-purple-600 font-medium">
                                    Obtained Marks
                                </p>

                                <p className="text-3xl font-bold text-purple-700 mt-2">
                                    {obtainedMarks}
                                </p>

                            </div>

                            {/* TOTAL */}

                            <div className="border border-blue-100 bg-blue-50 rounded-2xl p-6">

                                <p className="text-sm text-blue-600 font-medium">
                                    Total Marks
                                </p>

                                <p className="text-3xl font-bold text-blue-700 mt-2">
                                    {totalMarks}
                                </p>

                            </div>

                            {/* PERCENTAGE */}

                            <div className="border border-green-100 bg-green-50 rounded-2xl p-6">

                                <p className="text-sm text-green-600 font-medium">
                                    Percentage
                                </p>

                                <p className="text-3xl font-bold text-green-700 mt-2">
                                    {percentage.toFixed(
                                        1
                                    )}
                                    %
                                </p>

                            </div>

                        </div>

                        {/* PROGRESS */}

                        <div className="mt-6">

                            <div className="flex items-center justify-between mb-2">

                                <span className="text-sm font-medium text-gray-600">
                                    Overall Performance
                                </span>

                                <span className="text-sm font-bold text-gray-900">
                                    {percentage.toFixed(
                                        1
                                    )}
                                    %
                                </span>

                            </div>

                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                                <div
                                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${percentageValue}%`,
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* =====================================================
                    EVALUATION STATUS
                ===================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">

                    <div className="flex items-start gap-4">

                        <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">

                            <CheckCircle
                                size={22}
                                className="text-green-600"
                            />

                        </div>

                        <div className="flex-1">

                            <p className="font-semibold text-gray-900">
                                Evaluation Status
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                {evaluationStatus}
                            </p>

                            {isTeacherReviewed && (
                                <p className="text-sm text-green-600 mt-2">
                                    Your teacher has reviewed your assignment.
                                </p>
                            )}

                        </div>

                    </div>

                </div>

                {/* =====================================================
                    SUBMISSION INFORMATION
                ===================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">

                    <div className="flex items-center gap-3 mb-5">

                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">

                            <Clock
                                size={20}
                                className="text-blue-600"
                            />

                        </div>

                        <h2 className="text-lg font-bold text-gray-900">
                            Submission Information
                        </h2>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>

                            <p className="text-xs text-gray-500 uppercase font-medium">
                                Submitted At
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {formatDateTime(
                                    result.submitted_at
                                )}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs text-gray-500 uppercase font-medium">
                                Evaluated At
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {formatDateTime(
                                    result.evaluated_at
                                )}
                            </p>

                        </div>

                    </div>

                </div>

                {/* =====================================================
                    AI FEEDBACK
                ===================================================== */}

                {result.ai_feedback && (

                    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">

                        <div className="flex items-center gap-3 mb-4">

                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">

                                <FileText
                                    size={20}
                                    className="text-purple-600"
                                />

                            </div>

                            <div>

                                <h2 className="text-lg font-bold text-gray-900">
                                    AI Feedback
                                </h2>

                                <p className="text-xs text-gray-500">
                                    Automated evaluation feedback
                                </p>

                            </div>

                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-gray-700 leading-relaxed whitespace-pre-line">
                            {result.ai_feedback}
                        </div>

                    </div>

                )}

                {/* =====================================================
                    ANSWERS
                ===================================================== */}

                {Array.isArray(result.answers) &&
                    result.answers.length > 0 && (

                    <div className="mt-6">

                        {/* SECTION HEADER */}

                        <div className="flex items-center gap-3 mb-5">

                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">

                                <FileText
                                    size={20}
                                    className="text-indigo-600"
                                />

                            </div>

                            <div>

                                <h2 className="text-lg font-bold text-gray-900">
                                    Your Answers & Evaluation
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Detailed marks, figures and feedback for each answer
                                </p>

                            </div>

                        </div>

                        <div className="space-y-5">

                            {result.answers.map(
                                (answer, index) => {

                                /*
                                 * =================================================
                                 * FIND DRAWING ATTACHMENTS
                                 * =================================================
                                 */

                                const drawingAttachments =
                                    Array.isArray(
                                        answer.attachments
                                    )
                                        ? answer.attachments.filter(
                                              (attachment) =>
                                                  attachment.file_type ===
                                                  "drawing"
                                          )
                                        : [];

                                return (
                                    <div
                                        key={
                                            answer.id ??
                                            index
                                        }
                                        className="bg-white rounded-2xl shadow-sm p-5 md:p-7"
                                    >

                                        {/* =================================================
                                            QUESTION
                                        ================================================= */}

                                        <div className="flex items-center justify-between gap-4 mb-4">

                                            <h3 className="font-bold text-gray-900">
                                                Question{" "}
                                                {index + 1}
                                            </h3>

                                            {answer.final_marks !==
                                                null &&
                                                answer.final_marks !==
                                                    undefined && (

                                                <span className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm font-bold">
                                                    {
                                                        answer.final_marks
                                                    }{" "}
                                                    Marks
                                                </span>

                                            )}

                                        </div>

                                        {/* =================================================
                                            STUDENT WRITTEN ANSWER
                                        ================================================= */}

                                        <div>

                                            <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                                                Your Answer
                                            </p>

                                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-700 leading-relaxed whitespace-pre-line">
                                                {answer.answer_text ||
                                                    "No written answer submitted."}
                                            </div>

                                        </div>

                                        {/* =================================================
                                            DRAWING / FIGURE
                                        ================================================= */}

                                        {drawingAttachments.length >
                                            0 && (

                                            <div className="mt-5">

                                                <div className="flex items-center gap-2 mb-3">

                                                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">

                                                        <ImageIcon
                                                            size={18}
                                                            className="text-purple-600"
                                                        />

                                                    </div>

                                                    <div>

                                                        <p className="font-semibold text-gray-900">
                                                            Your Figure / Drawing
                                                        </p>

                                                        <p className="text-xs text-gray-500">
                                                            Figure submitted with your answer
                                                        </p>

                                                    </div>

                                                </div>

                                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 overflow-hidden">

                                                    {drawingAttachments.map(
                                                        (
                                                            attachment,
                                                            drawingIndex
                                                        ) => (
                                                            <div
                                                                key={
                                                                    attachment.id ??
                                                                    drawingIndex
                                                                }
                                                                className="mb-3 last:mb-0"
                                                            >

                                                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                                                                    <img
                                                                        src={
                                                                            attachment.file_url
                                                                        }
                                                                        alt={`Your drawing for question ${
                                                                            index +
                                                                            1
                                                                        }`}
                                                                        className="w-full h-auto max-h-[600px] object-contain bg-white"
                                                                    />

                                                                </div>

                                                            </div>
                                                        )
                                                    )}

                                                </div>

                                            </div>

                                        )}

                                        {/* =================================================
                                            MARKS
                                        ================================================= */}

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">

                                            <div className="bg-purple-50 rounded-xl p-4">

                                                <p className="text-xs text-purple-600 font-medium">
                                                    AI Marks
                                                </p>

                                                <p className="text-xl font-bold text-purple-700 mt-1">
                                                    {answer.ai_marks ??
                                                        "—"}
                                                </p>

                                            </div>

                                            <div className="bg-blue-50 rounded-xl p-4">

                                                <p className="text-xs text-blue-600 font-medium">
                                                    Teacher Marks
                                                </p>

                                                <p className="text-xl font-bold text-blue-700 mt-1">
                                                    {answer.teacher_marks ??
                                                        "—"}
                                                </p>

                                            </div>

                                            <div className="bg-green-50 rounded-xl p-4">

                                                <p className="text-xs text-green-600 font-medium">
                                                    Final Marks
                                                </p>

                                                <p className="text-xl font-bold text-green-700 mt-1">
                                                    {answer.final_marks ??
                                                        "—"}
                                                </p>

                                            </div>

                                        </div>

                                        {/* =================================================
                                            TEACHER FEEDBACK
                                        ================================================= */}

                                        {answer.teacher_feedback && (

                                            <div className="mt-5">

                                                <div className="flex items-center gap-2 mb-2">

                                                    <MessageSquare
                                                        size={18}
                                                        className="text-indigo-600"
                                                    />

                                                    <p className="font-semibold text-gray-900">
                                                        Teacher Feedback
                                                    </p>

                                                </div>

                                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-gray-700 whitespace-pre-line">
                                                    {
                                                        answer.teacher_feedback
                                                    }
                                                </div>

                                            </div>

                                        )}

                                        {/* =================================================
                                            AI ANSWER FEEDBACK
                                        ================================================= */}

                                        {answer.ai_feedback && (

                                            <div className="mt-5">

                                                <p className="font-semibold text-gray-900 mb-2">
                                                    AI Evaluation
                                                </p>

                                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                                    {
                                                        answer.ai_feedback
                                                    }
                                                </div>

                                            </div>

                                        )}

                                    </div>
                                );
                            })}

                        </div>

                    </div>

                )}

                {/* =====================================================
                    BOTTOM
                ===================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 mb-8">

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                        <div>

                            <p className="font-semibold text-gray-900">
                                Assignment Evaluation Complete
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                Your marks, figures and teacher feedback are shown above.
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate(
                                    "/student/dashboard"
                                )
                            }
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default StudentDescriptiveResult;