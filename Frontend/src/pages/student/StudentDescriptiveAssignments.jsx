import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle,
    ClipboardList,
    FileText,
    Loader2,
    RefreshCw,
    Clock,
     BarChart3
} from "lucide-react";

import {
    getStudentDescriptiveAssignments,
} from "../../api/studentApi";

const StudentDescriptiveAssignments = () => {
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // =========================================================
    // FILTERS
    // =========================================================

    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // =========================================================
    // LOAD ASSIGNMENTS
    // =========================================================

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

    const getObtainedMarks = (assignment) => {
        return (
            assignment?.obtained_marks ??
            assignment?.score ??
            assignment?.marks_obtained ??
            assignment?.final_marks ??
            null
        );
    };

    const getSubmissionDate = (assignment) => {
        return (
            assignment?.submitted_at ??
            assignment?.submission_date ??
            assignment?.submitted_date ??
            assignment?.completed_at ??
            null
        );
    };

    const formatDate = (date) => {
        if (!date) {
            return "Date unavailable";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

     // =========================================================
// COMPLETED / SUBMITTED FILTER
// =========================================================

const completedAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
        const submissionStatus = String(
            assignment?.submission_status ?? ""
        ).toLowerCase();

        // Student has submitted the assignment
        if (
            submissionStatus === "submitted" ||
            submissionStatus === "evaluated" ||
            submissionStatus === "graded" ||
            submissionStatus === "completed"
        ) {
            return true;
        }

        // Boolean submission information
        if (
            assignment?.submitted === true ||
            assignment?.is_submitted === true ||
            assignment?.has_submission === true
        ) {
            return true;
        }

        // Submission ID exists
        if (
            assignment?.submission_id ||
            assignment?.descriptive_submission_id
        ) {
            return true;
        }

        return false;
    });
}, [assignments]);

    // =========================================================
    // SORT
    // =========================================================

    // =========================================================
    // SEARCH + DATE FILTER
    // =========================================================

    const filteredAssignments = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return completedAssignments.filter((assignment) => {
            const title = String(
                assignment?.title || ""
            ).toLowerCase();

            const instructions = String(
                assignment?.instructions || ""
            ).toLowerCase();

            const subject = String(
                assignment?.subject_name ||
                assignment?.subject ||
                assignment?.subject_title ||
                ""
            ).toLowerCase();

            const matchesSearch =
                !query ||
                title.includes(query) ||
                instructions.includes(query) ||
                subject.includes(query);

            const rawDate =
                getSubmissionDate(assignment) ||
                assignment?.due_date ||
                assignment?.created_at ||
                null;

            const assignmentDate = rawDate
                ? new Date(rawDate)
                : null;

            const validDate =
                assignmentDate &&
                !Number.isNaN(
                    assignmentDate.getTime()
                );

            const matchesFromDate =
                !fromDate ||
                (
                    validDate &&
                    assignmentDate >=
                        new Date(`${fromDate}T00:00:00`)
                );

            const matchesToDate =
                !toDate ||
                (
                    validDate &&
                    assignmentDate <=
                        new Date(`${toDate}T23:59:59.999`)
                );

            return (
                matchesSearch &&
                matchesFromDate &&
                matchesToDate
            );
        });
    }, [
        completedAssignments,
        searchTerm,
        fromDate,
        toDate,
    ]);

    // =========================================================
    // SORT
    // =========================================================

    const sortedAssignments = useMemo(() => {
        return [...filteredAssignments].sort(
            (a, b) => {
                const dateA = new Date(
                    getSubmissionDate(a) ||
                        a?.created_at ||
                        0
                ).getTime();

                const dateB = new Date(
                    getSubmissionDate(b) ||
                        b?.created_at ||
                        0
                ).getTime();

                return dateB - dateA;
            }
        );
    }, [filteredAssignments]);

    const clearFilters = () => {
        setSearchTerm("");
        setFromDate("");
        setToDate("");
    };

    const hasFilters =
        Boolean(searchTerm.trim()) ||
        Boolean(fromDate) ||
        Boolean(toDate);

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
                            Loading Descriptive Assignments...
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Please wait while we load your submitted assignments.
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
                        navigate("/student/dashboard")
                    }
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>

                {/* HEADER */}

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                        <div className="flex items-center gap-4">

                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">

                                <FileText
                                    size={28}
                                    className="text-purple-600"
                                />

                            </div>

                            <div>

                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Descriptive Assignments
                                </h1>

                                <p className="text-gray-500 mt-1">
                                    View your submitted assignments and results.
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

                {/* COMPLETED COUNT */}

                <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">

                            <CheckCircle
                                size={21}
                                className="text-green-600"
                            />

                        </div>

                        <div>

                            <p className="text-sm text-gray-500">
                                Completed Assignments
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                                {sortedAssignments.length}
                            </p>

                        </div>

                    </div>

                </div>

                {/* SEARCH + DATE FILTERS */}

                <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">

                    <div className="flex flex-col lg:flex-row lg:items-end gap-4">

                        {/* SEARCH */}

                        <div className="flex-1">

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Search Assignments
                            </label>

                            <div className="relative">

                                <FileText
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search by assignment title, subject or instructions..."
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />

                            </div>

                        </div>

                        {/* FROM DATE */}

                        <div className="w-full lg:w-52">

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                From Date
                            </label>

                            <input
                                type="date"
                                value={fromDate}
                                onChange={(event) =>
                                    setFromDate(
                                        event.target.value
                                    )
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />

                        </div>

                        {/* TO DATE */}

                        <div className="w-full lg:w-52">

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                To Date
                            </label>

                            <input
                                type="date"
                                value={toDate}
                                onChange={(event) =>
                                    setToDate(
                                        event.target.value
                                    )
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />

                        </div>

                        {/* CLEAR */}

                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={!hasFilters}
                            className="px-5 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Clear
                        </button>

                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-sm">

                        <p className="text-gray-500">
                            Showing{" "}
                            <span className="font-semibold text-gray-900">
                                {sortedAssignments.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-900">
                                {completedAssignments.length}
                            </span>{" "}
                            submitted assignments
                        </p>

                        {hasFilters && (
                            <p className="text-purple-600 font-medium">
                                Filters applied
                            </p>
                        )}

                    </div>

                </div>

                {/* PENDING BUTTON */}

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div className="flex items-center gap-3">

                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">

                                <Clock
                                    size={20}
                                    className="text-orange-600"
                                />

                            </div>

                            <div>

                                <p className="font-semibold text-gray-900">
                                    Have pending assignments?
                                </p>

                                <p className="text-sm text-gray-600">
                                    View assignments that you still need to complete.
                                </p>

                            </div>

                        </div>

                        <button
                            onClick={() =>
                                navigate(
                                    "/student/descriptive-assignments/pending"
                                )
                            }
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
                        >
                            View Pending
                            <ArrowRight size={18} />
                        </button>

                    </div>

                </div>

                {/* NO COMPLETED */}

                {sortedAssignments.length === 0 ? (

                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">

                            <FileText
                                size={32}
                                className="text-gray-400"
                            />

                        </div>

                        <h2 className="text-xl font-bold text-gray-900">
                            {hasFilters
                                ? "No Matching Assignments"
                                : "No Submitted Assignments"}
                        </h2>

                        <p className="text-gray-500 mt-2">
                            {hasFilters
                                ? "No submitted descriptive assignments match your search or selected dates."
                                : "You have not submitted any descriptive assignments yet."}
                        </p>

                        {hasFilters ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                            >
                                Clear Filters
                                <RefreshCw size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/student/descriptive-assignments/pending"
                                    )
                                }
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                            >
                                View Pending Assignments
                                <ArrowRight size={18} />
                            </button>
                        )}

                    </div>

                ) : (

                    /* COMPLETED ASSIGNMENTS */

                    <div className="space-y-5">

                        {sortedAssignments.map(
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

                                const obtainedMarks =
                                    getObtainedMarks(
                                        assignment
                                    );

                                const submissionDate =
                                    getSubmissionDate(
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

                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">

                                                            <CheckCircle
                                                                size={13}
                                                            />

                                                            Completed

                                                        </span>

                                                    </div>

                                                    <p className="text-gray-500 mt-1">
                                                        {
                                                            assignment?.instructions ||
                                                            "Descriptive assignment submitted successfully."
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

                                                            Submitted:{" "}
                                                            {formatDate(
                                                                submissionDate
                                                            )}

                                                        </span>

                                                    </div>

                                                    {/* SCORE */}

                                                    {obtainedMarks !==
                                                        null && (
                                                        <div className="mt-3">

                                                            <span className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold">

                                                                Score:{" "}
                                                                {
                                                                    obtainedMarks
                                                                }
                                                                /
                                                                {
                                                                    totalMarks
                                                                }

                                                            </span>

                                                        </div>
                                                    )}

                                                </div>

                                            </div>

                                            {/* VIEW RESULT */}

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/student/descriptive-assignments/${assignmentId}/result`
                                                    )
                                                }
                                                disabled={
                                                    !assignmentId
                                                }
                                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-purple-500 text-purple-600 rounded-xl font-semibold hover:bg-purple-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            >
                                                View Result
                                                <ArrowRight
                                                    size={19}
                                                />
                                            </button>
                                            <button
    onClick={() =>
        navigate(
            `/student/descriptive-assignments/${assignmentId}/performance`
        )
    }
    disabled={!assignmentId}
    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-indigo-500 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
>
    <BarChart3 size={19} />
    Performance
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

export default StudentDescriptiveAssignments;