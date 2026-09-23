import {
    X,
    ClipboardList,
    UserRound,
    Mail,
    BookOpen,
    FileQuestion,
    Award,
    Users,
    CheckCircle2,
    CalendarDays,
    Loader2,
    AlertCircle,
} from "lucide-react";

const QuizDetailsModal = ({
    isOpen,
    onClose,
    quiz,
    loading,
    error,
}) => {

    // =====================================================
    // Close
    // =====================================================

    const handleClose = () => {
        if (loading) {
            return;
        }

        onClose();
    };


    // =====================================================
    // Don't Render
    // =====================================================

    if (!isOpen) {
        return null;
    }


    // =====================================================
    // Render
    // =====================================================

    return (
        <div className="fixed inset-0 z-[100]">

            {/* =================================================
                Backdrop
            ================================================= */}

            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={handleClose}
            />


            {/* =================================================
                Modal Wrapper
            ================================================= */}

            <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">

                <div
                    className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >

                    {/* =================================================
                        Header
                    ================================================= */}

                    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

                        <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                                <ClipboardList
                                    size={21}
                                />

                            </div>

                            <div className="min-w-0">

                                <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                                    Quiz Details
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    View quiz information and statistics
                                </p>

                            </div>

                        </div>


                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Close"
                        >

                            <X
                                size={20}
                            />

                        </button>

                    </div>


                    {/* =================================================
                        Content
                    ================================================= */}

                    <div className="min-h-0 flex-1 overflow-y-auto">

                        {/* =================================================
                            Loading
                        ================================================= */}

                        {loading && (

                            <div className="flex min-h-[420px] items-center justify-center px-6">

                                <div className="flex flex-col items-center gap-3">

                                    <Loader2
                                        size={32}
                                        className="animate-spin text-blue-600"
                                    />

                                    <p className="text-sm font-medium text-slate-600">
                                        Loading quiz details...
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            Error
                        ================================================= */}

                        {!loading && error && (

                            <div className="flex min-h-[420px] items-center justify-center px-6">

                                <div className="max-w-md text-center">

                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">

                                        <AlertCircle
                                            size={27}
                                        />

                                    </div>

                                    <h3 className="mt-4 text-base font-semibold text-slate-800">
                                        Unable to load quiz
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {error}
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            Quiz Content
                        ================================================= */}

                        {!loading && !error && quiz && (

                            <div className="space-y-6 p-5 sm:p-6">

                                {/* =================================================
                                    Quiz Title + Status
                                ================================================= */}

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                        <div className="min-w-0">

                                            <div className="flex items-center gap-2">

                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                    Quiz #{quiz.id}
                                                </span>

                                            </div>

                                            <h3 className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                                                {quiz.title ||
                                                    "Untitled Quiz"}
                                            </h3>

                                        </div>


                                        <StatusBadge
                                            status={
                                                quiz.status
                                            }
                                        />

                                    </div>

                                </div>


                                {/* =================================================
                                    Quiz Information
                                ================================================= */}

                                <div>

                                    <h3 className="mb-3 text-sm font-semibold text-slate-800">
                                        Quiz Information
                                    </h3>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                        {/* Teacher */}

                                        <InfoCard
                                            icon={
                                                <UserRound
                                                    size={18}
                                                />
                                            }
                                            label="Teacher"
                                            value={
                                                quiz.teacher_name ||
                                                "Not assigned"
                                            }
                                        />


                                        {/* Teacher Email */}

                                        <InfoCard
                                            icon={
                                                <Mail
                                                    size={18}
                                                />
                                            }
                                            label="Teacher Email"
                                            value={
                                                quiz.teacher_email ||
                                                "Not available"
                                            }
                                        />


                                        {/* Subject */}

                                        <InfoCard
                                            icon={
                                                <BookOpen
                                                    size={18}
                                                />
                                            }
                                            label="Subject"
                                            value={
                                                quiz.subject_name ||
                                                "Not assigned"
                                            }
                                        />


                                        {/* Created */}

                                        <InfoCard
                                            icon={
                                                <CalendarDays
                                                    size={18}
                                                />
                                            }
                                            label="Created At"
                                            value={
                                                formatDate(
                                                    quiz.created_at
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                {/* =================================================
                                    Statistics
                                ================================================= */}

                                <div>

                                    <h3 className="mb-3 text-sm font-semibold text-slate-800">
                                        Quiz Statistics
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                                        {/* Questions */}

                                        <StatCard
                                            icon={
                                                <FileQuestion
                                                    size={19}
                                                />
                                            }
                                            label="Questions"
                                            value={
                                                quiz.total_questions ??
                                                0
                                            }
                                            className="bg-blue-50 text-blue-600"
                                        />


                                        {/* Total Marks */}

                                        <StatCard
                                            icon={
                                                <Award
                                                    size={19}
                                                />
                                            }
                                            label="Total Marks"
                                            value={
                                                quiz.total_marks ??
                                                0
                                            }
                                            className="bg-amber-50 text-amber-600"
                                        />


                                        {/* Assignments */}

                                        <StatCard
                                            icon={
                                                <Users
                                                    size={19}
                                                />
                                            }
                                            label="Assignments"
                                            value={
                                                quiz.assignment_count ??
                                                0
                                            }
                                            className="bg-purple-50 text-purple-600"
                                        />


                                        {/* Attempts */}

                                        <StatCard
                                            icon={
                                                <CheckCircle2
                                                    size={19}
                                                />
                                            }
                                            label="Attempts"
                                            value={
                                                quiz.attempt_count ??
                                                0
                                            }
                                            className="bg-emerald-50 text-emerald-600"
                                        />

                                    </div>

                                </div>


                                {/* =================================================
                                    Summary
                                ================================================= */}

                                <div className="rounded-2xl border border-slate-200 bg-white">

                                    <div className="border-b border-slate-100 px-5 py-4">

                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Summary
                                        </h3>

                                    </div>

                                    <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">

                                        <SummaryItem
                                            label="Quiz Status"
                                            value={
                                                quiz.status ||
                                                "Unknown"
                                            }
                                        />

                                        <SummaryItem
                                            label="Quiz ID"
                                            value={`#${quiz.id}`}
                                        />

                                    </div>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            No Data
                        ================================================= */}

                        {!loading &&
                            !error &&
                            !quiz && (

                                <div className="flex min-h-[420px] items-center justify-center px-6">

                                    <div className="text-center">

                                        <ClipboardList
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />

                                        <p className="mt-3 text-sm text-slate-500">
                                            Quiz details are not available.
                                        </p>

                                    </div>

                                </div>

                            )}

                    </div>


                    {/* =================================================
                        Footer
                    ================================================= */}

                    <div className="flex shrink-0 items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Close
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};


// =====================================================
// Info Card
// =====================================================

const InfoCard = ({
    icon,
    label,
    value,
}) => {

    return (

        <div className="rounded-xl border border-slate-200 bg-white p-4">

            <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">

                    {icon}

                </div>

                <div className="min-w-0">

                    <p className="text-xs font-medium text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                        {value}
                    </p>

                </div>

            </div>

        </div>

    );
};


// =====================================================
// Statistic Card
// =====================================================

const StatCard = ({
    icon,
    label,
    value,
    className = "",
}) => {

    return (

        <div className="rounded-xl border border-slate-200 bg-white p-4">

            <div className="flex items-center gap-3">

                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${className}`}
                >

                    {icon}

                </div>

                <div className="min-w-0">

                    <p className="truncate text-xs font-medium text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-800">
                        {value}
                    </p>

                </div>

            </div>

        </div>

    );
};


// =====================================================
// Summary Item
// =====================================================

const SummaryItem = ({
    label,
    value,
}) => {

    return (

        <div className="px-5 py-4">

            <p className="text-xs font-medium text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
                {value}
            </p>

        </div>

    );
};


// =====================================================
// Status Badge
// =====================================================

const StatusBadge = ({
    status,
}) => {

    const normalizedStatus =
        status?.toLowerCase();


    if (
        normalizedStatus ===
        "published"
    ) {

        return (

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Published

            </span>

        );
    }


    if (
        normalizedStatus ===
        "draft"
    ) {

        return (

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">

                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                Draft

            </span>

        );
    }


    return (

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">

            {status || "Unknown"}

        </span>

    );
};


// =====================================================
// Date Formatter
// =====================================================

const formatDate = (
    value
) => {

    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(
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


export default QuizDetailsModal;