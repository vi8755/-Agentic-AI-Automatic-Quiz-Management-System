import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    Download,
    FileText,
    Loader2,
    Upload,
    Eye,
    Send,
    X,
} from "lucide-react";

import {
     getStudentDescriptiveAssignmentByToken,
    submitStudentDescriptiveAssignmentPdf,
} from "../../../api/studentApi";


const StudentPdfDescriptiveAssignment = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    // =========================================================
    // STATE
    // =========================================================

    const [assignment, setAssignment] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [answerFile, setAnswerFile] = useState(null);

    const [submitting, setSubmitting] = useState(false);

    // =========================================================
    // LOAD ASSIGNMENT
    // =========================================================

    useEffect(() => {
        if (token) {
            loadAssignment();
        } else {
            setError("Invalid assignment link.");
            setLoading(false);
        }
    }, [token]);

    const loadAssignment = async () => {
        try {
            setLoading(true);
            setError("");

            console.log(
                "Opening PDF descriptive assignment using token:",
                token
            );

            const data =
                await getStudentDescriptiveAssignmentByToken(
                    token
                );

            console.log(
                "PDF DESCRIPTIVE ASSIGNMENT:",
                data
            );

            setAssignment(data);

        } catch (err) {
            console.error(
                "Failed to load PDF descriptive assignment:",
                err
            );

            const message =
                err?.response?.data?.detail ||
                "Failed to load assignment.";

            setError(message);

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // DATE FORMAT
    // =========================================================

    const formatDate = (date) => {
        if (!date) {
            return "No due date";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "No due date";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =========================================================
    // PDF URL
    // =========================================================

    const getPdfUrl = () => {
        return (
            assignment?.question_pdf_url ||
            assignment?.pdf_url ||
            assignment?.question_pdf ||
            null
        );
    };

    const questionPdfUrl = getPdfUrl();
    const getFullPdfUrl = (url) => {
    if (!url) {
        return null;
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    const backendUrl =
        import.meta.env.VITE_BACKEND_URL;

    return `${backendUrl}${url}`;
};

const fullQuestionPdfUrl =
    getFullPdfUrl(questionPdfUrl);

    // =========================================================
    // FILE SELECTION
    // =========================================================

    const handleAnswerFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const isPdf =
            file.type === "application/pdf" ||
            file.name
                .toLowerCase()
                .endsWith(".pdf");

        if (!isPdf) {
            toast.error(
                "Please upload a PDF file."
            );

            event.target.value = "";
            return;
        }

        setAnswerFile(file);
    };

    // =========================================================
    // REMOVE ANSWER FILE
    // =========================================================

    const removeAnswerFile = () => {
        setAnswerFile(null);
    };

    // =========================================================
    // SUBMIT ANSWER PDF
    // =========================================================

     const handleSubmit = async () => {
    if (!answerFile) {
        toast.warning(
            "Please upload your Answer PDF first."
        );

        return;
    }

    if (!assignment?.assignment_id) {
        toast.error(
            "Assignment information is missing."
        );

        return;
    }

    try {
        setSubmitting(true);

        console.log(
            "Submitting Answer PDF:",
            answerFile.name
        );

        console.log(
            "Assignment ID:",
            assignment.assignment_id
        );

        const response =
            await submitStudentDescriptiveAssignmentPdf(
                assignment.assignment_id,
                answerFile
            );

        console.log(
            "Answer PDF submission response:",
            response
        );

        toast.success(
            "Answer PDF submitted successfully."
        );

        // Clear selected file after successful submission
        setAnswerFile(null);

    } catch (err) {
        console.error(
            "Answer PDF submission failed:",
            err?.response?.data || err
        );

        toast.error(
            err?.response?.data?.detail ||
                "Failed to submit Answer PDF."
        );

    } finally {
        setSubmitting(false);
    }
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

                        <h2 className="text-xl font-semibold text-gray-900">
                            Loading assignment...
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Please wait while we load your PDF assignment.
                        </p>

                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error || !assignment) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-5xl mx-auto">

                    <button
                        type="button"
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

                            <FileText
                                size={32}
                                className="text-red-600"
                            />

                        </div>

                        <h2 className="text-xl font-bold text-gray-900">
                            Unable to Load Assignment
                        </h2>

                        <p className="text-gray-500 mt-2">
                            {error ||
                                "The assignment could not be found."}
                        </p>

                        <button
                            type="button"
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
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            <div className="max-w-5xl mx-auto">

                {/* =================================================
                    BACK
                ================================================== */}

                <button
                    type="button"
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

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 md:p-8 text-white">

                        <div className="flex gap-4">

                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">

                                <FileText size={28} />

                            </div>

                            <div>

                                <p className="text-purple-100 text-sm font-medium">
                                    Descriptive PDF Assignment
                                </p>

                                <h1 className="text-2xl md:text-3xl font-bold mt-1">
                                    {assignment.title ||
                                        "Descriptive Assignment"}
                                </h1>

                            </div>

                        </div>

                    </div>

                    {/* META */}

                    <div className="p-5 md:p-6">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                            {/* TOTAL QUESTIONS */}

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">

                                    <FileText
                                        size={20}
                                        className="text-blue-600"
                                    />

                                </div>

                                <div>

                                    <p className="text-xs text-gray-500 uppercase font-medium">
                                        Question Paper
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        PDF Assignment
                                    </p>

                                </div>

                            </div>

                            {/* DUE DATE */}

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">

                                    <CalendarDays
                                        size={20}
                                        className="text-orange-600"
                                    />

                                </div>

                                <div>

                                    <p className="text-xs text-gray-500 uppercase font-medium">
                                        Due Date
                                    </p>

                                    <p className="font-semibold text-gray-900">
                                        {formatDate(
                                            assignment.due_date
                                        )}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    INSTRUCTIONS
                ================================================== */}

                {assignment.instructions && (

                    <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 mb-6">

                        <div className="flex items-center gap-3 mb-3">

                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">

                                <FileText
                                    size={20}
                                    className="text-purple-600"
                                />

                            </div>

                            <h2 className="text-lg font-bold text-gray-900">
                                Instructions
                            </h2>

                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-gray-700 whitespace-pre-line leading-relaxed">
                            {assignment.instructions}
                        </div>

                    </div>

                )}

                {/* =================================================
                    QUESTION PDF
                ================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-5 md:p-7 mb-6">

                    <div className="flex items-center gap-3 mb-5">

                        <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">

                            <FileText
                                size={22}
                                className="text-red-600"
                            />

                        </div>

                        <div>

                            <h2 className="text-xl font-bold text-gray-900">
                                Question Paper
                            </h2>

                            <p className="text-sm text-gray-500">
                                Read the questions before preparing your answers.
                            </p>

                        </div>

                    </div>

                    {questionPdfUrl ? (

                        <div className="border border-gray-200 rounded-xl p-5">

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                                <div className="flex items-center gap-3">

                                    <div className="w-11 h-11 bg-red-50 rounded-lg flex items-center justify-center">

                                        <FileText
                                            size={22}
                                            className="text-red-500"
                                        />

                                    </div>

                                    <div>

                                        <p className="font-semibold text-gray-900">
                                            {assignment.question_pdf_name ||
                                                "Question_Paper.pdf"}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            PDF Question Paper
                                        </p>

                                    </div>

                                </div>

                                <div className="flex flex-wrap gap-3">

                                    <a
                                        href={
                                            fullQuestionPdfUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-purple-500 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition"
                                    >
                                        <Eye size={18} />
                                        View PDF
                                    </a>

                                    <a
                                        href={
                                            fullQuestionPdfUrl
                                        }
                                        download
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                                    >
                                        <Download
                                            size={18}
                                        />
                                        Download PDF
                                    </a>

                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-orange-700">
                            Question PDF is not available.
                        </div>

                    )}

                </div>

                {/* =================================================
                    ANSWER PDF
                ================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-5 md:p-7 mb-6">

                    <div className="flex items-center gap-3 mb-5">

                        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">

                            <Upload
                                size={22}
                                className="text-blue-600"
                            />

                        </div>

                        <div>

                            <h2 className="text-xl font-bold text-gray-900">
                                Submit Your Answer
                            </h2>

                            <p className="text-sm text-gray-500">
                                Upload your completed Answer PDF.
                            </p>

                        </div>

                    </div>

                    {/* FILE NOT SELECTED */}

                    {!answerFile ? (

                        <label className="block cursor-pointer">

                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-purple-400 hover:bg-purple-50/30 transition">

                                <Upload
                                    size={42}
                                    className="mx-auto text-gray-400 mb-4"
                                />

                                <p className="font-semibold text-gray-800">
                                    Upload your Answer PDF
                                </p>

                                <p className="text-sm text-gray-500 mt-1">
                                    Click here to browse your PDF
                                </p>

                                <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={
                                        handleAnswerFileChange
                                    }
                                    className="hidden"
                                    disabled={
                                        submitting
                                    }
                                />

                            </div>

                        </label>

                    ) : (

                        <div className="border border-gray-200 rounded-2xl p-5">

                            <div className="flex items-center justify-between gap-4">

                                <div className="flex items-center gap-4">

                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">

                                        <FileText
                                            size={24}
                                            className="text-red-600"
                                        />

                                    </div>

                                    <div>

                                        <p className="font-semibold text-gray-900 break-all">
                                            {answerFile.name}
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            {(
                                                answerFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(
                                                2
                                            )}{" "}
                                            MB
                                        </p>

                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        removeAnswerFile
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">

                                <CheckCircle
                                    size={20}
                                    className="text-green-600 shrink-0"
                                />

                                <p className="text-sm font-medium text-green-700">
                                    Answer PDF selected and ready to submit.
                                </p>

                            </div>

                        </div>

                    )}

                </div>

                {/* =================================================
                    SUBMIT
                ================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 mb-8">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                        <div>

                            <h2 className="font-bold text-gray-900">
                                Ready to submit?
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Make sure your Answer PDF contains all your answers.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                submitting ||
                                !answerFile
                            }
                            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                            {submitting ? (

                                <>
                                    <Loader2
                                        size={19}
                                        className="animate-spin"
                                    />
                                    Preparing...
                                </>

                            ) : (

                                <>
                                    <Send size={19} />
                                    Submit Answer PDF
                                </>

                            )}

                        </button>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default StudentPdfDescriptiveAssignment;