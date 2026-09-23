import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Clock,
    CalendarDays,
    BookOpen,
    Play,
    RotateCcw,
    Eye,
    AlertCircle,
    CheckCircle2,
    TimerOff,
    Trophy,
    BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStudentQuizzes } from "../../api/studentApi";

const MyQuizzes = () => {

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const navigate = useNavigate();


    // =====================================================
    // Fetch Student Quizzes
    // =====================================================

    useEffect(() => {

        const fetchQuizzes = async () => {

            try {

                setLoading(true);
                setError("");

                const data = await getStudentQuizzes();

                setQuizzes(Array.isArray(data) ? data : []);

            } catch (err) {

                console.error(
                    "Failed to fetch student quizzes:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load your quizzes."
                );

            } finally {

                setLoading(false);

            }

        };

        fetchQuizzes();

    }, []);


    // =====================================================
    // Filter Quizzes
    // =====================================================

    const filteredQuizzes = useMemo(() => {

        const searchValue = search.trim().toLowerCase();

        return quizzes.filter((quiz) => {

            const matchesSearch =
                !searchValue ||
                quiz.title
                    ?.toLowerCase()
                    .includes(searchValue) ||
                quiz.teacher_name
                    ?.toLowerCase()
                    .includes(searchValue);


            const matchesStatus =
                statusFilter === "All" ||
                quiz.status === statusFilter;


            return matchesSearch && matchesStatus;

        });

    }, [quizzes, search, statusFilter]);


    // =====================================================
    // Format Date
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "No due date";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Invalid date";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );

    };


    // =====================================================
    // Format Date + Time
    // =====================================================

    const formatDateTime = (date) => {

        if (!date) {
            return "—";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    };


    // =====================================================
    // Status Style
    // =====================================================

    const getStatusStyle = (status) => {

        switch (status) {

            case "Completed":
                return "bg-emerald-50 text-emerald-700 border border-emerald-100";

            case "Started":
                return "bg-amber-50 text-amber-700 border border-amber-100";

            case "Assigned":
                return "bg-indigo-50 text-indigo-700 border border-indigo-100";

            case "Expired":
                return "bg-red-50 text-red-700 border border-red-100";

            default:
                return "bg-slate-50 text-slate-600 border border-slate-100";

        }

    };


    // =====================================================
    // Start / Continue Quiz
    // =====================================================

    const handleStartQuiz = (quiz) => {

        if (!quiz.token) {
            return;
        }

        window.location.href =
            `/quiz/start/${quiz.token}`;

    };


    // =====================================================
    // View Result
    // =====================================================

    const handleViewResult = (quiz) => {
    if (!quiz?.response_id) {
        return;
    }

    if (!quiz?.token) {
        console.error("Result token is missing:", quiz);
        return;
    }

    navigate(
        `/student/result/${quiz.response_id}?token=${encodeURIComponent(
            quiz.token
        )}`
    );
};

    // =====================================================
    // View Quiz Performance
    // =====================================================

    const handleViewPerformance = (quiz) => {
        if (!quiz?.quiz_id) {
            return;
        }

        navigate(
            `/student/quizzes/${quiz.quiz_id}/performance`
        );
    };

    // =====================================================
    // Loading State
    // =====================================================

    if (loading) {

        return (
            <div className="space-y-6">

                {/* Header Skeleton */}

                <div>

                    <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />

                    <div className="h-4 w-72 bg-slate-200 rounded mt-2 animate-pulse" />

                </div>


                {/* Filter Skeleton */}

                <div className="bg-white border border-slate-200 rounded-2xl p-4">

                    <div className="flex flex-col md:flex-row gap-4">

                        <div className="flex-1 h-11 bg-slate-200 rounded-xl animate-pulse" />

                        <div className="w-full md:w-40 h-11 bg-slate-200 rounded-xl animate-pulse" />

                    </div>

                </div>


                {/* Card Skeletons */}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {[1, 2, 3].map((item) => (

                        <div
                            key={item}
                            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
                        >

                            <div className="flex items-center gap-3">

                                <div className="w-11 h-11 bg-slate-200 rounded-xl animate-pulse" />

                                <div className="flex-1 space-y-2">

                                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />

                                    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />

                                </div>

                            </div>

                            <div className="h-20 bg-slate-200 rounded-xl animate-pulse" />

                            <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />

                        </div>

                    ))}

                </div>

            </div>
        );

    }


    // =====================================================
    // Error State
    // =====================================================

    if (error) {

        return (
            <div className="flex items-center justify-center min-h-100">

                <div className="text-center max-w-md">

                    <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">

                        <AlertCircle
                            className="w-7 h-7 text-red-600"
                        />

                    </div>

                    <h2 className="text-lg font-semibold text-slate-900 mt-4">
                        Unable to load quizzes
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );

    }


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="space-y-6">


            {/* =================================================
                Header
            ================================================= */}

            <div>

                <p className="text-sm font-medium text-indigo-600">
                    Student Portal
                </p>

                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">
                    My Quizzes
                </h1>

                <p className="text-sm text-slate-500 mt-2">
                    View and manage all quizzes assigned to you.
                </p>

            </div>


            {/* =================================================
                Filters
            ================================================= */}

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">

                <div className="flex flex-col md:flex-row gap-4">

                    {/* Search */}

                    <div className="relative flex-1">

                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={19}
                        />

                        <input
                            type="text"
                            placeholder="Search quizzes or teachers..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
 className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                    </div>


                    {/* Status */}

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >

                        <option value="All">
                            All Status
                        </option>

                        <option value="Assigned">
                            Assigned
                        </option>

                        <option value="Started">
                            Started
                        </option>

                        <option value="Completed">
                            Completed
                        </option>

                        <option value="Expired">
                            Expired
                        </option>

                    </select>

                </div>

            </div>


            {/* =================================================
                Result Count
            ================================================= */}

            <div className="flex items-center justify-between">

                <p className="text-sm text-slate-500">

                    Showing{" "}

                    <span className="font-semibold text-slate-800">
                        {filteredQuizzes.length}
                    </span>{" "}

                    quiz
                    {filteredQuizzes.length !== 1 && "zes"}

                </p>

            </div>


            {/* =================================================
                Empty State
            ================================================= */}

            {filteredQuizzes.length === 0 ? (

                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">

                    <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">

                        <BookOpen
                            className="w-8 h-8 text-slate-400"
                        />

                    </div>

                    <h2 className="text-lg font-semibold text-slate-800 mt-4">
                        No quizzes found
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        No quizzes match your current search or filter.
                    </p>

                </div>

            ) : (


                /* =================================================
                   Quiz Cards
                ================================================= */

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {filteredQuizzes.map((quiz) => (

                        <div
                            key={quiz.assignment_id}
                            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >


                            {/* =====================================
                                Header
                            ===================================== */}

                            <div className="flex items-start justify-between gap-3">

                                <div className="flex items-start gap-3 min-w-0">

                                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">

                                        <BookOpen
                                            className="w-5 h-5 text-indigo-600"
                                        />

                                    </div>

                                    <div className="min-w-0">

                                        <h2 className="font-semibold text-slate-900 line-clamp-2">
                                            {quiz.title}
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1 truncate">
                                            {quiz.teacher_name || "Unknown Teacher"}
                                        </p>

                                    </div>

                                </div>


                                {/* Status */}

                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(
                                        quiz.status
                                    )}`}
                                >
                                    {quiz.status}
                                </span>

                            </div>


                            {/* =====================================
                                Quiz Details
                            ===================================== */}

                            <div className="mt-6 space-y-3">

                                {/* Duration */}

                                <div className="flex items-center gap-3 text-sm text-slate-600">

                                    <Clock
                                        size={17}
                                        className="text-slate-400 shrink-0"
                                    />

                                    <span>
                                        {quiz.duration_minutes ?? "—"} minutes
                                    </span>

                                </div>


                                {/* Due Date */}

                                <div className="flex items-center gap-3 text-sm text-slate-600">

                                    <CalendarDays
                                        size={17}
                                        className="text-slate-400 shrink-0"
                                    />

                                    <span>
                                        Due: {formatDate(quiz.due_date)}
                                    </span>

                                </div>


                                {/* Completed Score */}

                                {quiz.status === "Completed" && (

                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">

                                        <div className="flex items-center justify-between">

                                            <div className="flex items-center gap-2">

                                                <Trophy
                                                    size={17}
                                                    className="text-emerald-600"
                                                />

                                                <span className="text-sm text-emerald-700">
                                                    Score
                                                </span>

                                            </div>
                                                    <span className="font-bold text-gray-900">
            {quiz.score ?? 0} / {quiz.total_marks ?? "—"}
        </span>

 

                                        </div>


                                        {quiz.percentage !== null &&
                                            quiz.percentage !== undefined && (

                                                <div className="mt-2">

                                                    <div className="flex items-center justify-between">

                                                        <span className="text-xs text-emerald-600">
                                                            Percentage
                                                        </span>

                                                        <span className="text-xs font-semibold text-emerald-700">
                                                            {Number(
                                                                quiz.percentage
                                                            ).toFixed(1)}
                                                            %
                                                        </span>

                                                    </div>


                                                    <div className="mt-1.5 h-1.5 bg-emerald-100 rounded-full overflow-hidden">

                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{
                                                                width: `${Math.min(
                                                                    Math.max(
                                                                        Number(
                                                                            quiz.percentage
                                                                        ),
                                                                        0
                                                                    ),
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />

                                                    </div>

                                                </div>

                                            )}

                                    </div>

                                )}


                                {/* Started At */}

                                {quiz.status === "Started" && quiz.started_at && (

                                    <div className="flex items-center gap-3 text-xs text-amber-600">

                                        <Clock size={15} />

                                        <span>
                                            Started:{" "}
                                            {formatDateTime(
                                                quiz.started_at
                                            )}
                                        </span>

                                    </div>

                                )}

                            </div>


                            {/* =====================================
                                Action
                            ===================================== */}

                            <div className="mt-6">


                                {/* Completed */}

                                {quiz.status === "Completed" ? (

                                    <div className="space-y-2">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleViewResult(quiz)
                                            }
                                            disabled={!quiz.response_id}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            <Eye size={18} />
                                            View Result
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleViewPerformance(quiz)
                                            }
                                            disabled={!quiz.quiz_id}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 font-medium hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            <BarChart3 size={18} />
                                            Performance
                                        </button>

                                    </div>


                                ) : quiz.status === "Started" ? (


                                    /* Started */

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleStartQuiz(quiz)
                                        }
                                        disabled={!quiz.token}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >

                                        <RotateCcw size={18} />

                                        Continue Quiz

                                    </button>


                                ) : quiz.status === "Assigned" ? (


                                    /* Assigned */

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleStartQuiz(quiz)
                                        }
                                        disabled={!quiz.token}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >

                                        <Play size={18} />

                                        Start Quiz

                                    </button>


                                ) : quiz.status === "Expired" ? (


                                    /* Expired */

                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 font-medium">

                                        <TimerOff size={18} />

                                        Quiz Expired

                                    </div>


                                ) : (


                                    /* Unknown status */

                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-medium">

                                        <AlertCircle size={18} />

                                        Unavailable

                                    </div>

                                )}

                            </div>


                            {/* =====================================
                                Completed Timestamp
                            ===================================== */}

                            {quiz.status === "Completed" &&
                                quiz.completed_at && (

                                    <p className="mt-3 text-center text-xs text-slate-400">

                                        Completed{" "}
                                        {formatDateTime(
                                            quiz.completed_at
                                        )}

                                    </p>

                                )}

                        </div>

                    ))}

                </div>

            )}

        </div>
    );

};

export default MyQuizzes;