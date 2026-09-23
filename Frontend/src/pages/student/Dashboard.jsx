import { useEffect, useState } from "react";

import {
    ClipboardList,
    Clock,
    CheckCircle2,
    Trophy,
    TrendingUp,
    Calendar,
    ArrowRight,
    Activity,
    UserRound,
    GraduationCap,
} from "lucide-react";

import { getStudentDashboard } from "../../api/studentApi";

const Dashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================
    // Fetch Student Dashboard
    // =========================================

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getStudentDashboard();

                setDashboard(data);
            } catch (err) {
                console.error(
                    "Student dashboard error:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                        "Unable to load your dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    // =========================================
    // Loading State
    // =========================================

    if (loading) {
        return (
            <div className="space-y-6">

                {/* Header Skeleton */}
                <div className="animate-pulse">
                    <div className="h-8 w-72 bg-slate-200 rounded-lg" />

                    <div className="h-4 w-96 max-w-full bg-slate-200 rounded mt-3" />
                </div>

                {/* Student Information Skeleton */}
                <div className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />

                {/* KPI Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse"
                        >
                            <div className="flex justify-between">
                                <div className="h-11 w-11 bg-slate-200 rounded-xl" />

                                <div className="h-6 w-16 bg-slate-200 rounded-full" />
                            </div>

                            <div className="h-8 w-20 bg-slate-200 rounded mt-6" />

                            <div className="h-4 w-28 bg-slate-200 rounded mt-2" />

                            <div className="h-3 w-full bg-slate-200 rounded mt-4" />
                        </div>
                    ))}

                </div>

                {/* Main Content Skeleton */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    <div className="xl:col-span-2 h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />

                    <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />

                </div>

                {/* Activity Skeleton */}
                <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />

            </div>
        );
    }

    // =========================================
    // Error State
    // =========================================

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-100">

                <div className="text-center max-w-md">

                    <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                        <Activity
                            size={26}
                            className="text-red-500"
                        />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-slate-800">
                        Unable to load dashboard
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    // =========================================
    // Dashboard Data
    // =========================================

    const student = dashboard.student || {};
    const stats = dashboard.stats || {};
    const performance = dashboard.performance || {};

    const recentActivity =
        dashboard.recent_activity || [];

    const upcomingQuiz =
        dashboard.upcoming_quiz;

    // =========================================
    // Statistics Cards
    // =========================================

    const statisticCards = [
        {
            title: "Total Quizzes",
            value: stats.total_quizzes ?? 0,
            icon: ClipboardList,
            description: "Assigned quizzes",
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
        },

        {
            title: "Pending Quizzes",
            value: stats.pending_quizzes ?? 0,
            icon: Clock,
            description: "Waiting to attempt",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
        },

        {
            title: "Completed",
            value: stats.completed_quizzes ?? 0,
            icon: CheckCircle2,
            description: "Quizzes completed",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
        },

        {
            title: "Average Score",
            value: `${Number(
                stats.average_percentage ?? 0
            ).toFixed(1)}%`,
            icon: Trophy,
            description: `${Number(
                stats.average_score ?? 0
            ).toFixed(1)} marks earned`,
            iconBg: "bg-violet-50",
            iconColor: "text-violet-600",
        },
    ];

    // =========================================
    // Score Progress
    // =========================================

    const averageScore = Math.min(
        Math.max(
            Number(stats.average_percentage ?? 0),
            0
        ),
        100
    );

    // =========================================
    // Format Average Time
    // =========================================

    const formatAverageTime = (seconds) => {
        if (
            seconds === null ||
            seconds === undefined ||
            Number(seconds) <= 0
        ) {
            return "—";
        }

        const totalSeconds = Math.round(
            Number(seconds)
        );

        const minutes = Math.floor(
            totalSeconds / 60
        );

        const remainingSeconds =
            totalSeconds % 60;

        if (minutes === 0) {
            return `${remainingSeconds}s`;
        }

        return `${minutes}m ${remainingSeconds}s`;
    };

    // =========================================
    // Format Quiz Due Date
    // =========================================

    const formatDueDate = (date) => {
        if (!date) {
            return "No due date";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "No due date";
        }

        return parsedDate.toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short",
            }
        );
    };

    // =========================================
    // Render Dashboard
    // =========================================

    return (
        <div className="space-y-6">

            {/* =========================================
                Welcome Header
            ========================================= */}

            <section>

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">

                    <div>

                        <p className="text-sm font-medium text-indigo-600 mb-1">
                            Student Dashboard
                        </p>

                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                            Welcome back,{" "}
                            {student.name || "Student"} 👋
                        </h1>

                        <p className="mt-2 text-sm lg:text-base text-slate-500">
                            Here's an overview of your academic activity
                            and quiz performance.
                        </p>

                    </div>

                    {/* Student Quick Identity */}

                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">

                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">

                            <UserRound
                                size={19}
                                className="text-indigo-600"
                            />

                        </div>

                        <div>

                            <p className="text-xs text-slate-400">
                                Student
                            </p>

                            <p className="text-sm font-semibold text-slate-700">
                                {student.roll_no || "—"}
                            </p>

                        </div>

                    </div>

                </div>

            </section>


            {/* =========================================
                Student Information
            ========================================= */}

            <section className="bg-white border border-slate-200 rounded-2xl p-5">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">

                            <GraduationCap
                                size={23}
                                className="text-indigo-600"
                            />

                        </div>

                        <div>

                            <p className="text-sm font-semibold text-slate-800">
                                Academic Information
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                                Your current student details
                            </p>

                        </div>

                    </div>


                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-7 gap-y-4 text-sm">

                        {/* Roll Number */}

                        <div>
                            <p className="text-xs text-slate-400">
                                Roll No.
                            </p>

                            <p className="font-medium text-slate-700 mt-0.5">
                                {student.roll_no || "—"}
                            </p>
                        </div>


                        {/* Department */}

                        <div>
                            <p className="text-xs text-slate-400">
                                Department
                            </p>

                            <p className="font-medium text-slate-700 mt-0.5">
                                {student.department || "—"}
                            </p>
                        </div>


                        {/* Section */}

                        <div>
                            <p className="text-xs text-slate-400">
                                Section
                            </p>

                            <p className="font-medium text-slate-700 mt-0.5">
                                {student.section_name || "—"}
                            </p>
                        </div>


                        {/* Year */}

                        <div>
                            <p className="text-xs text-slate-400">
                                Year
                            </p>

                            <p className="font-medium text-slate-700 mt-0.5">
                                {student.year
                                    ? `Year ${student.year}`
                                    : "—"}
                            </p>
                        </div>


                        {/* Semester */}

                        <div>
                            <p className="text-xs text-slate-400">
                                Semester
                            </p>

                            <p className="font-medium text-slate-700 mt-0.5">
                                {student.semester
                                    ? `Semester ${student.semester}`
                                    : "—"}
                            </p>
                        </div>

                    </div>

                </div>

            </section>


            {/* =========================================
                Statistics
            ========================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                {statisticCards.map((card) => {

                    const Icon = card.icon;

                    return (
                        <div
                            key={card.title}
                            className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >

                            <div className="flex items-start justify-between">

                                <div
                                    className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}
                                >

                                    <Icon
                                        size={21}
                                        className={card.iconColor}
                                    />

                                </div>

                                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition" />

                            </div>


                            <p className="mt-5 text-2xl font-bold text-slate-800">
                                {card.value}
                            </p>


                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {card.title}
                            </p>


                            <p className="mt-1 text-xs text-slate-400">
                                {card.description}
                            </p>

                        </div>
                    );
                })}

            </div>


            {/* =========================================
                Upcoming Quiz + Performance
            ========================================= */}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* =========================================
                    Upcoming Quiz
                ========================================= */}

                <section className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-slate-800">
                                Upcoming Quiz
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                                Your next scheduled assessment
                            </p>

                        </div>


                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">

                            <Calendar
                                size={20}
                                className="text-indigo-600"
                            />

                        </div>

                    </div>


                    {upcomingQuiz ? (

                        <div className="mt-6">

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                                <div>

                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                                        Upcoming
                                    </span>

                                    <h3 className="mt-3 text-xl font-semibold text-slate-800">
                                        {upcomingQuiz.title}
                                    </h3>


                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                                        {upcomingQuiz.duration_minutes && (
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={15} />
                                                {upcomingQuiz.duration_minutes} minutes
                                            </span>
                                        )}


                                        {upcomingQuiz.due_date && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={15} />
                                                {formatDueDate(
                                                    upcomingQuiz.due_date
                                                )}
                                            </span>
                                        )}

                                    </div>

                                </div>


                                <button
                                    onClick={() => {

                                        if (
                                            upcomingQuiz.token
                                        ) {
                                            window.location.href =
                                                `/quiz/start/${upcomingQuiz.token}`;
                                        }

                                    }}
                                    disabled={
                                        !upcomingQuiz.token
                                    }
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
                                >

                                    Start Quiz

                                    <ArrowRight size={16} />

                                </button>

                            </div>


                            <div className="mt-6 h-1.5 bg-slate-100 rounded-full overflow-hidden">

                                <div className="h-full w-1/3 bg-indigo-500 rounded-full" />

                            </div>

                        </div>

                    ) : (

                        <div className="mt-8 text-center py-8">

                            <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 flex items-center justify-center">

                                <Calendar
                                    size={24}
                                    className="text-slate-300"
                                />

                            </div>

                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                No upcoming quizzes
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                You're all caught up!
                            </p>

                        </div>

                    )}

                </section>


                {/* =========================================
                    Performance Overview
                ========================================= */}

                <section className="bg-white border border-slate-200 rounded-2xl p-6">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-slate-800">
                                Performance
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                                Overall quiz performance
                            </p>

                        </div>


                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">

                            <TrendingUp
                                size={20}
                                className="text-violet-600"
                            />

                        </div>

                    </div>


                    {/* Score Circle */}

                    <div className="mt-6 flex items-center gap-5">

                        <div className="relative w-24 h-24 shrink-0">

                            <svg
                                className="w-24 h-24 -rotate-90"
                                viewBox="0 0 100 100"
                            >

                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-slate-100"
                                />

                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    className="text-indigo-500"
                                    strokeDasharray={`${averageScore * 2.64} 264`}
                                />

                            </svg>


                            <div className="absolute inset-0 flex items-center justify-center">

                                <span className="text-lg font-bold text-slate-800">
                                    {averageScore.toFixed(0)}%
                                </span>

                            </div>

                        </div>


                        <div>

                            <p className="text-sm font-semibold text-slate-700">
                                Average Score
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                                Based on your quiz attempts
                            </p>

                        </div>

                    </div>


                    {/* Performance Stats */}

                    <div className="grid grid-cols-2 gap-3 mt-6">

                        <PerformanceItem
                            label="Attempts"
                            value={
                                performance.total_attempts ??
                                0
                            }
                        />


                        <PerformanceItem
                            label="Highest"
                            value={
                                performance.highest_score ??
                                0
                            }
                        />


                        <PerformanceItem
                            label="Lowest"
                            value={
                                performance.lowest_score ??
                                0
                            }
                        />


                        <PerformanceItem
                            label="Average Score"
                            value={`${Number(
                                performance.average_score ??
                                    0
                            ).toFixed(1)} marks`}
                        />


                        <PerformanceItem
                            label="Average Time"
                            value={formatAverageTime(
                                performance.average_time_taken_seconds
                            )}
                        />

                    </div>

                </section>

            </div>


            {/* =========================================
                Recent Activity
            ========================================= */}

            <section className="bg-white border border-slate-200 rounded-2xl p-6">

                <div className="flex items-center justify-between">

                    <div>

                        <h2 className="text-lg font-semibold text-slate-800">
                            Recent Activity
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Your latest quiz activity
                        </p>

                    </div>


                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">

                        <Activity
                            size={20}
                            className="text-emerald-600"
                        />

                    </div>

                </div>


                {recentActivity.length > 0 ? (

                    <div className="mt-5 divide-y divide-slate-100">

                        {recentActivity.map(
                            (activity, index) => (

                                <div
                                    key={
                                        activity.id ||
                                        activity.quiz_id ||
                                        index
                                    }
                                    className="flex items-center justify-between gap-4 py-4"
                                >

                                    <div className="flex items-center gap-3 min-w-0">

                                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">

                                            <CheckCircle2
                                                size={17}
                                                className="text-emerald-600"
                                            />

                                        </div>


                                        <div className="min-w-0">

                                            <p className="text-sm font-medium text-slate-700 truncate">

                                                {activity.title ||
                                                    activity.quiz_title ||
                                                    "Quiz"}

                                            </p>


                                            <p className="text-xs text-slate-400 mt-1">

                                                {activity.type ===
                                                    "quiz_completed"
                                                    ? "Completed"
                                                    : activity.type ===
                                                        "quiz_assigned"
                                                      ? "Assigned"
                                                      : activity.status ||
                                                        "Quiz activity"}

                                            </p>

                                        </div>

                                    </div>


                                    {activity.score !==
                                        undefined &&
                                        activity.score !==
                                            null && (

                                            <div className="text-right shrink-0">

                                                <p className="text-sm font-semibold text-slate-700">
                                                    {activity.score}{" "}
                                                    /{" "}
                                                    {activity.total_marks ??
                                                        "—"}
                                                </p>


                                                {activity.percentage !==
                                                    null &&
                                                    activity.percentage !==
                                                        undefined && (

                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {Number(
                                                                activity.percentage
                                                            ).toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </p>

                                                    )}

                                            </div>

                                        )}

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <div className="py-10 text-center">

                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 flex items-center justify-center">

                            <Activity
                                size={24}
                                className="text-slate-300"
                            />

                        </div>


                        <p className="mt-3 text-sm font-semibold text-slate-600">
                            No recent activity
                        </p>


                        <p className="mt-1 text-xs text-slate-400">
                            Your quiz activity will appear here.
                        </p>

                    </div>

                )}

            </section>

        </div>
    );
};


// =========================================
// Performance Item
// =========================================

const PerformanceItem = ({
    label,
    value,
}) => {
    return (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">

            <p className="text-xs text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
                {value}
            </p>

        </div>
    );
};

export default Dashboard;