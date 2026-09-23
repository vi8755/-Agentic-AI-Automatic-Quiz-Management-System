import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    FaArrowLeft,
    FaCheckCircle,
    FaClock,
    FaFileAlt,
    FaSave,
    FaRobot,
    FaUser,
    FaPaperclip,
    FaSpinner,
    FaImage,
    FaExternalLinkAlt,
} from "react-icons/fa";

import {
    getTeacherDescriptiveSubmission,
    reviewTeacherDescriptiveSubmission,
} from "../../api/teacherApi";

const DescriptiveSubmissionReview = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [reviews, setReviews] = useState({});

    // =========================================================
    // FETCH SUBMISSION
    // =========================================================

    useEffect(() => {
        fetchSubmission();
    }, [submissionId]);

    const fetchSubmission = async () => {
        try {
            setLoading(true);

            const data =
                await getTeacherDescriptiveSubmission(submissionId);

            // Debug information
            console.log(
                "========== TEACHER DESCRIPTIVE SUBMISSION =========="
            );

            console.log(data);

            data?.answers?.forEach((answer) => {
                console.log(
                    `Question ${answer.question_id} attachments:`,
                    answer.attachments
                );
            });

            setSubmission(data);

            const initialReviews = {};

            data?.answers?.forEach((answer) => {
                initialReviews[answer.question_id] = {
                    teacher_marks:
                        answer.teacher_marks ??
                        answer.final_marks ??
                        answer.ai_marks ??
                        "",
                    teacher_feedback:
                        answer.teacher_feedback ?? "",
                };
            });

            setReviews(initialReviews);
        } catch (error) {
            console.error(
                "Failed to load descriptive submission:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load submission"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // TEACHER MARKS
    // =========================================================

    const handleMarksChange = (questionId, value) => {
        setReviews((prev) => ({
            ...prev,
            [questionId]: {
                ...(prev[questionId] || {}),
                teacher_marks: value,
            },
        }));
    };

    // =========================================================
    // TEACHER FEEDBACK
    // =========================================================

    const handleFeedbackChange = (questionId, value) => {
        setReviews((prev) => ({
            ...prev,
            [questionId]: {
                ...(prev[questionId] || {}),
                teacher_feedback: value,
            },
        }));
    };

    // =========================================================
    // SAVE TEACHER REVIEW
    // =========================================================

    const handleSaveReview = async () => {
        if (!submission?.answers?.length) {
            toast.error("No answers available for review.");
            return;
        }

        try {
            setSaving(true);

            const answers = submission.answers.map((answer) => {
                const review =
                    reviews[answer.question_id] || {};

                const marks = Number(
                    review.teacher_marks
                );

                if (Number.isNaN(marks)) {
                    throw new Error(
                        `Please enter valid marks for Question ${answer.question_order}.`
                    );
                }

                if (
                    marks < 0 ||
                    marks > Number(answer.max_marks)
                ) {
                    throw new Error(
                        `Marks for Question ${answer.question_order} must be between 0 and ${answer.max_marks}.`
                    );
                }

                return {
                    question_id: answer.question_id,
                    teacher_marks: marks,
                    teacher_feedback:
                        review.teacher_feedback?.trim() ||
                        null,
                };
            });

            await reviewTeacherDescriptiveSubmission(
                submission.submission_id,
                {
                    answers,
                }
            );

            toast.success(
                "Teacher review saved successfully!"
            );

            await fetchSubmission();
        } catch (error) {
            console.error(
                "Failed to save review:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    error?.message ||
                    "Failed to save teacher review"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // DATE FORMAT
    // =========================================================

    const formatDate = (date) => {
        if (!date) return "N/A";

        try {
            return new Date(date).toLocaleString();
        } catch {
            return "N/A";
        }
    };

    // =========================================================
    // STATUS STYLE
    // =========================================================

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "evaluated":
            case "completed":
                return "bg-green-100 text-green-700";

            case "submitted":
                return "bg-blue-100 text-blue-700";

            case "pending":
                return "bg-yellow-100 text-yellow-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    // =========================================================
    // CHECK IMAGE
    // =========================================================

    const isImageAttachment = (attachment) => {
        if (!attachment) return false;

        const fileType =
            attachment.file_type?.toLowerCase() || "";

        const mimeType =
            attachment.mime_type?.toLowerCase() || "";

        const fileName =
            attachment.file_name?.toLowerCase() || "";

        if (fileType === "drawing") {
            return true;
        }

        if (mimeType.startsWith("image/")) {
            return true;
        }

        if (
            fileName.endsWith(".png") ||
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            fileName.endsWith(".gif") ||
            fileName.endsWith(".webp") ||
            fileName.endsWith(".svg")
        ) {
            return true;
        }

        if (
            attachment.file_url?.startsWith(
                "data:image/"
            )
        ) {
            return true;
        }

        return false;
    };

    // =========================================================
    // IMAGE ERROR
    // =========================================================

    const handleImageError = (event) => {
        console.error(
            "Unable to load student drawing:",
            event.currentTarget.src
        );

        event.currentTarget.style.display = "none";

        const errorElement =
            event.currentTarget.parentElement?.querySelector(
                ".drawing-error"
            );

        if (errorElement) {
            errorElement.classList.remove("hidden");
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

                    <p className="text-gray-500">
                        Loading student submission...
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // NOT FOUND
    // =========================================================

    if (!submission) {
        return (
            <div className="rounded-2xl bg-white p-10 text-center shadow-md">
                <h2 className="text-2xl font-bold text-gray-800">
                    Submission not found
                </h2>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="pb-12">

            {/* =====================================================
                BACK BUTTON
            ===================================================== */}

            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
                <FaArrowLeft />

                Back to Submissions
            </button>


            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="mb-8 rounded-2xl bg-white p-6 shadow-md">

                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">
                            {submission.assignment_title ||
                                "Descriptive Assignment"}
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Student Answer Sheet & Teacher Review
                        </p>

                    </div>

                    <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(
                            submission.status
                        )}`}
                    >
                        <FaCheckCircle />

                        {submission.status}
                    </span>

                </div>


                {/* Student Information */}

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FaUser />

                            Student
                        </div>

                        <p className="mt-1 font-semibold text-gray-900">
                            {submission.student_name ||
                                "N/A"}
                        </p>

                    </div>


                    <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-sm text-gray-500">
                            Email
                        </p>

                        <p className="mt-1 break-all font-semibold text-gray-900">
                            {submission.student_email ||
                                "N/A"}
                        </p>

                    </div>


                    <div className="rounded-xl bg-gray-50 p-4">

                        <div className="flex items-center gap-2 text-sm text-gray-500">

                            <FaClock />

                            Submitted

                        </div>

                        <p className="mt-1 font-semibold text-gray-900">
                            {formatDate(
                                submission.submitted_at
                            )}
                        </p>

                    </div>


                    <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-sm text-gray-500">
                            Evaluation Status
                        </p>

                        <p className="mt-1 font-semibold text-green-600">
                            {submission.evaluation_status ||
                                "Pending"}
                        </p>

                    </div>

                </div>

            </div>


            {/* =====================================================
                SCORE SUMMARY
            ===================================================== */}

            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">

                <div className="rounded-2xl bg-white p-6 shadow-md">

                    <p className="text-sm font-medium text-gray-500">
                        Total Marks
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {submission.total_marks ?? 0}
                    </p>

                </div>


                <div className="rounded-2xl bg-white p-6 shadow-md">

                    <p className="text-sm font-medium text-gray-500">
                        Obtained Marks
                    </p>

                    <p className="mt-2 text-3xl font-bold text-blue-600">
                        {submission.obtained_marks ?? 0}
                    </p>

                </div>


                <div className="rounded-2xl bg-white p-6 shadow-md">

                    <p className="text-sm font-medium text-gray-500">
                        Percentage
                    </p>

                    <p className="mt-2 text-3xl font-bold text-green-600">
                        {submission.percentage ?? 0}%
                    </p>

                </div>

            </div>


            {/* =====================================================
                AI OVERALL FEEDBACK
            ===================================================== */}

            {submission.ai_feedback && (

                <div className="mb-8 rounded-2xl border border-purple-200 bg-purple-50 p-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">

                            <FaRobot className="text-purple-600" />

                        </div>

                        <h2 className="text-lg font-bold text-purple-900">
                            AI Overall Feedback
                        </h2>

                    </div>

                    <p className="mt-4 leading-7 text-purple-900">
                        {submission.ai_feedback}
                    </p>

                </div>

            )}


            {/* =====================================================
                QUESTIONS
            ===================================================== */}

            <div className="space-y-8">

                {submission.answers?.map((answer) => {

                    const review =
                        reviews[answer.question_id] || {
                            teacher_marks: "",
                            teacher_feedback: "",
                        };

                    const attachments =
                        Array.isArray(answer.attachments)
                            ? answer.attachments
                            : [];

                    return (

                        <div
                            key={answer.id}
                            className="overflow-hidden rounded-2xl bg-white shadow-md"
                        >

                            {/* =================================================
                                QUESTION HEADER
                            ================================================= */}

                            <div className="border-b border-gray-200 bg-gray-50 p-6">

                                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">

                                    <div>

                                        <p className="text-sm font-semibold text-blue-600">
                                            Question{" "}
                                            {answer.question_order}
                                        </p>

                                        <h2 className="mt-2 text-lg font-bold leading-7 text-gray-900">
                                            {answer.question_text}
                                        </h2>

                                    </div>

                                    <div className="shrink-0 rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                                        Max Marks:{" "}
                                        {answer.max_marks}
                                    </div>

                                </div>

                            </div>


                            <div className="space-y-6 p-6">

                                {/* =================================================
                                    STUDENT TEXT ANSWER
                                ================================================= */}

                                <div>

                                    <div className="mb-3 flex items-center gap-2">

                                        <FaFileAlt className="text-blue-600" />

                                        <h3 className="font-bold text-gray-900">
                                            Student Answer
                                        </h3>

                                    </div>

                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                                        {answer.answer_text ? (

                                            <p className="whitespace-pre-wrap leading-7 text-gray-700">
                                                {answer.answer_text}
                                            </p>

                                        ) : (

                                            <p className="italic text-gray-400">
                                                No text answer provided.
                                            </p>

                                        )}

                                    </div>

                                </div>


                                {/* =================================================
                                    DRAWING / ATTACHMENTS
                                ================================================= */}

                                {attachments.length > 0 && (

                                    <div>

                                        <div className="mb-4 flex items-center gap-2">

                                            <FaImage className="text-blue-600" />

                                            <h3 className="font-bold text-gray-900">
                                                Student Drawing / Attachments
                                            </h3>

                                        </div>


                                        <div className="space-y-5">

                                            {attachments.map(
                                                (
                                                    attachment,
                                                    attachmentIndex
                                                ) => {

                                                    const isImage =
                                                        isImageAttachment(
                                                            attachment
                                                        );

                                                    const fileUrl =
                                                        attachment.file_url ||
                                                        attachment.url ||
                                                        attachment.file_path ||
                                                        "";

                                                    return (

                                                        <div
                                                            key={
                                                                attachment.id ||
                                                                attachmentIndex
                                                            }
                                                            className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                                                        >

                                                            {isImage &&
                                                            fileUrl ? (

                                                                <div>

                                                                    <div className="mb-3 flex items-center justify-between gap-3">

                                                                        <div>

                                                                            <p className="font-semibold text-gray-900">

                                                                                {attachment.file_type ===
                                                                                "drawing"
                                                                                    ? "Student Drawing"
                                                                                    : attachment.file_name ||
                                                                                      "Student Image"}

                                                                            </p>

                                                                            {attachment.file_type ===
                                                                                "drawing" && (

                                                                                <p className="mt-1 text-sm text-gray-500">
                                                                                    Figure / drawing submitted by the student
                                                                                </p>

                                                                            )}

                                                                        </div>

                                                                        <FaImage className="text-blue-500" />

                                                                    </div>


                                                                    {/* IMAGE CONTAINER */}

                                                                    <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-white p-4">

                                                                        <img
                                                                            src={
                                                                                fileUrl
                                                                            }
                                                                            alt={
                                                                                attachment.file_type ===
                                                                                "drawing"
                                                                                    ? "Student drawing"
                                                                                    : attachment.file_name ||
                                                                                      "Student attachment"
                                                                            }
                                                                            onError={
                                                                                handleImageError
                                                                            }
                                                                            className="max-h-[650px] max-w-full rounded-lg object-contain"
                                                                        />


                                                                        <div className="drawing-error hidden text-center">

                                                                            <FaImage className="mx-auto mb-3 text-4xl text-gray-300" />

                                                                            <p className="font-semibold text-gray-600">
                                                                                Unable to display this image
                                                                            </p>

                                                                            <p className="mt-1 text-sm text-gray-400">
                                                                                The attachment URL may not be accessible.
                                                                            </p>

                                                                        </div>

                                                                    </div>


                                                                    {/* OPEN FULL SIZE */}

                                                                    <div className="mt-3 flex flex-wrap gap-3">

                                                                        <a
                                                                            href={
                                                                                fileUrl
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                                                                        >

                                                                            <FaExternalLinkAlt />

                                                                            Open Full Size

                                                                        </a>

                                                                    </div>

                                                                </div>

                                                            ) : (

                                                                /* NORMAL FILE */

                                                                <a
                                                                    href={
                                                                        fileUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 rounded-xl bg-white p-4 transition hover:bg-gray-100"
                                                                >

                                                                    <FaPaperclip className="text-gray-500" />

                                                                    <div>

                                                                        <p className="font-semibold text-blue-600">

                                                                            {attachment.file_name ||
                                                                                "Student Attachment"}

                                                                        </p>

                                                                        <p className="text-xs text-gray-500">
                                                                            Open attachment
                                                                        </p>

                                                                    </div>

                                                                </a>

                                                            )}

                                                        </div>

                                                    );
                                                }
                                            )}

                                        </div>

                                    </div>

                                )}


                                {/* =================================================
                                    NO ATTACHMENT MESSAGE
                                ================================================= */}

                                {attachments.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">

                                        <div className="flex items-center gap-3 text-gray-400">

                                            <FaImage />

                                            <p className="text-sm">
                                                No drawing or attachment submitted for this question.
                                            </p>

                                        </div>

                                    </div>
                                )}


                                {/* =================================================
                                    AI EVALUATION
                                ================================================= */}

                                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

                                    <div className="flex items-center gap-2">

                                        <FaRobot className="text-purple-600" />

                                        <h3 className="font-bold text-purple-900">
                                            AI Evaluation
                                        </h3>

                                    </div>


                                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                                        <div className="rounded-xl bg-white p-4">

                                            <p className="text-sm text-gray-500">
                                                AI Marks
                                            </p>

                                            <p className="mt-1 text-xl font-bold text-purple-700">

                                                {answer.ai_marks ??
                                                    "Not evaluated"}

                                                {" "}

                                                /{" "}
                                                {answer.max_marks}

                                            </p>

                                        </div>


                                        <div className="rounded-xl bg-white p-4 md:col-span-2">

                                            <p className="text-sm text-gray-500">
                                                AI Feedback
                                            </p>

                                            <p className="mt-1 leading-6 text-gray-700">

                                                {answer.ai_feedback ||
                                                    "No AI feedback available."}

                                            </p>

                                        </div>

                                    </div>

                                </div>


                                {/* =================================================
                                    TEACHER REVIEW
                                ================================================= */}

                                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                                    <h3 className="text-lg font-bold text-blue-900">
                                        Teacher Review
                                    </h3>


                                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

                                        {/* MARKS */}

                                        <div>

                                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                Teacher Marks
                                            </label>

                                            <div className="flex items-center gap-2">

                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={
                                                        answer.max_marks
                                                    }
                                                    step="0.5"
                                                    value={
                                                        review.teacher_marks
                                                    }
                                                    onChange={(e) =>
                                                        handleMarksChange(
                                                            answer.question_id,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                />

                                                <span className="font-semibold text-gray-500">
                                                    /{" "}
                                                    {
                                                        answer.max_marks
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        {/* FEEDBACK */}

                                        <div className="md:col-span-2">

                                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                Teacher Feedback
                                            </label>

                                            <textarea
                                                rows="4"
                                                value={
                                                    review.teacher_feedback
                                                }
                                                onChange={(e) =>
                                                    handleFeedbackChange(
                                                        answer.question_id,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Write your feedback for the student..."
                                                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    );
                })}

            </div>


            {/* =====================================================
                SAVE BUTTON
            ===================================================== */}

            <div className="sticky bottom-4 z-10 mt-8">

                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl md:flex-row md:items-center">

                    <div>

                        <p className="font-semibold text-gray-900">
                            Ready to save your review?
                        </p>

                        <p className="text-sm text-gray-500">
                            Teacher marks will become the final marks.
                        </p>

                    </div>


                    <button
                        onClick={handleSaveReview}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        {saving ? (
                            <>
                                <FaSpinner className="animate-spin" />

                                Saving...
                            </>
                        ) : (
                            <>
                                <FaSave />

                                Save Teacher Review
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
};

export default DescriptiveSubmissionReview;