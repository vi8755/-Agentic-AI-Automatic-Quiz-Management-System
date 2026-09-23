import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    ClipboardList,
    FileText,
    Loader2,
    RefreshCw,
    Clock,
    ArrowRight,
} from "lucide-react";

import { getStudentDescriptiveAssignments } from "../../api/studentApi";

const StudentDescriptivePending = () => {
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAssignments = async () => {
        try {
            setLoading(true);

            const response =
                await getStudentDescriptiveAssignments();

            console.log(
                "STUDENT DESCRIPTIVE ASSIGNMENTS:",
                response
            );

            const data =
                Array.isArray(response)
                    ? response
                    : response?.assignments ||
                      response?.data ||
                      [];

            setAssignments(data);
        } catch (error) {
            console.error(
                "Failed to load descriptive assignments:",
                error
            );

            const message =
                error?.response?.data?.detail ||
                "Failed to load descriptive assignments.";

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssignments();
    }, []);

    // =========================================================
    // HELPERS
    // =========================================================

    const getAssignmentId = (assignment) => {
        return (
            assignment?.assignment_id ??
            assignment?.id ??
            null
        );
    };

    const getQuestionCount = (assignment) => {
        return (
            assignment?.question_count ??
            assignment?.total_questions ??
            assignment?.questions?.length ??
            0
        );
    };

    const getTotalMarks = (assignment) => {
        if (
            assignment?.total_marks !== undefined &&
            assignment?.total_marks !== null
        ) {
            return assignment.total_marks;
        }

        if (
            assignment?.max_marks !== undefined &&
            assignment?.max_marks !== null
        ) {
            return assignment.max_marks;
        }

        if (Array.isArray(assignment?.questions)) {
            return assignment.questions.reduce(
                (total, question) =>
                    total +
                    Number(
                        question?.max_marks ??
                        question?.marks ??
                        0
                    ),
                0
            );
        }

        return 0;
    };

    const formatDate = (date) => {
        if (!date) {
            return "No due date";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "No due date";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // =========================================================
    // PENDING FILTER
    // =========================================================

    const pendingAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const status =
                String(
                    assignment?.status ??
                    assignment?.submission_status ??
                    assignment?.student_status ??
                    ""
                ).toLowerCase();

            // Already submitted/completed
            if (
                status === "submitted" ||
                status === "completed" ||
                status === "evaluated" ||
                status === "graded"
            ) {
                return false;
            }

            // Explicitly pending
            if (
                status === "pending" ||
                status === "not_started" ||
                status === "assigned"
            ) {
                return true;
            }

            // If backend gives boolean submission flag
            if (
                assignment?.submitted === true ||
                assignment?.is_submitted === true ||
                assignment?.has_submission === true
            ) {
                return false;
            }

            if (
                assignment?.submitted === false ||
                assignment?.is_submitted === false ||
                assignment?.has_submission === false
            ) {
                return true;
            }

            // If no submission information exists,
            // treat it as pending.
            return true;
        });
    }, [assignments]);

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

                        <Loader2
                            size={42}
                            className="mx-auto text-purple-600 animate-spin mb-4"
                        />

                        <h2 className="text-xl font-semibold text-gray-900">
                            Loading Pending Assignments...
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Please wait while we load your assignments.
                        </p>

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

            <div className="max-w-6xl mx-auto">

                {/* BACK */}

                <button
                    onClick={() =>
                        navigate(
                            "/student/descriptive-assignments"
                        )
                    }
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <ArrowLeft size={18} />
                    Back to Descriptive Assignments
                </button>

                {/* HEADER */}

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                        <div className="flex items-center gap-4">

                            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">

                                <Clock
                                    size={28}
                                    className="text-orange-600"
                                />

                            </div>

                            <div>

                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Pending Assignments
                                </h1>

                                <p className="text-gray-500 mt-1">
                                    Complete your pending descriptive assignments.
                                </p>

                            </div>

                        </div>

                        <button
                            onClick={loadAssignments}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-purple-500 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>

                    </div>

                </div>

                {/* COUNT */}

                <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">

                            <Clock
                                size={20}
                                className="text-orange-600"
                            />

                        </div>

                        <div>

                            <p className="text-sm text-gray-500">
                                Pending Assignments
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                                {pendingAssignments.length}
                            </p>

                        </div>

                    </div>

                </div>

                {/* EMPTY */}

                {pendingAssignments.length === 0 ? (

                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">

                            <CheckCircle
                                size={32}
                                className="text-green-600"
                            />

                        </div>

                        <h2 className="text-xl font-bold text-gray-900">
                            No Pending Assignments
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Great job! You have completed all your descriptive assignments.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/student/descriptive-assignments"
                                )
                            }
                            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                        >
                            <ArrowLeft size={18} />
                            View Completed Assignments
                        </button>

                    </div>

                ) : (

                    <div className="space-y-5">

                        {pendingAssignments.map(
                            (assignment) => {

                                const assignmentId =
                                    getAssignmentId(
                                        assignment
                                    );

                                const questionCount =
                                    getQuestionCount(
                                        assignment
                                    );

                                const totalMarks =
                                    getTotalMarks(
                                        assignment
                                    );

                                return (
                                    <div
                                        key={
                                            assignmentId
                                        }
                                        className="bg-white rounded-2xl shadow-sm p-5 md:p-7"
                                    >

                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                                            {/* LEFT */}

                                            <div className="flex gap-4">

                                                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">

                                                    <FileText
                                                        size={28}
                                                        className="text-purple-600"
                                                    />

                                                </div>

                                                <div>

                                                    <div className="flex flex-wrap items-center gap-2">

                                                        <h2 className="text-xl font-bold text-gray-900">
                                                            {
                                                                assignment?.title ||
                                                                "Untitled Assignment"
                                                            }
                                                        </h2>

                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">

                                                            <Clock
                                                                size={13}
                                                            />

                                                            Pending

                                                        </span>

                                                    </div>

                                                    <p className="text-gray-500 mt-1">
                                                        {
                                                            assignment?.instructions ||
                                                            "Complete all questions and submit your assignment."
                                                        }
                                                    </p>

                                                    {/* META */}

                                                    <div className="flex flex-wrap items-center gap-5 mt-4 text-sm text-gray-500">

                                                        <span className="flex items-center gap-1.5">

                                                            <ClipboardList
                                                                size={16}
                                                            />

                                                            {
                                                                questionCount
                                                            }{" "}
                                                            {Number(
                                                                questionCount
                                                            ) === 1
                                                                ? "Question"
                                                                : "Questions"}

                                                        </span>

                                                        <span className="flex items-center gap-1.5">

                                                            <CheckCircle
                                                                size={16}
                                                            />

                                                            {
                                                                totalMarks
                                                            }{" "}
                                                            Marks

                                                        </span>

                                                        <span className="flex items-center gap-1.5">

                                                            <CalendarDays
                                                                size={16}
                                                            />

                                                            Due:{" "}
                                                            {formatDate(
                                                                assignment?.due_date
                                                            )}

                                                        </span>

                                                    </div>

                                                </div>

                                            </div>

                                            {/* ACTION */}

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/student/descriptive-assignments/${assignmentId}`
                                                    )
                                                }
                                                disabled={
                                                    !assignmentId
                                                }
                                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-purple-500 text-purple-600 rounded-xl font-semibold hover:bg-purple-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            >
                                                Start Assignment
                                                <ArrowRight
                                                    size={19}
                                                />
                                            </button>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </div>
        </div>
    );
};

export default StudentDescriptivePending;