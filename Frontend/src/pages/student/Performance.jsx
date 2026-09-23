import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    TrendingUp,
    Trophy,
    Target,
    BarChart3,
    CalendarDays,
    Eye,
    RefreshCw,
    AlertCircle,
    ClipboardCheck,
} from "lucide-react";

import { getStudentPerformance } from "../../api/studentApi";


const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


const getPerformanceLabel = (percentage) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Average";
    return "Needs Improvement";
};


const getPerformanceClass = (percentage) => {
    if (percentage >= 80) {
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (percentage >= 60) {
        return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (percentage >= 40) {
        return "bg-amber-50 text-amber-700 border-amber-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
};


export default function Performance() {
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const fetchPerformance = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getStudentPerformance();

            setPerformance(data);
        } catch (err) {
            console.error(
                "Failed to load student performance:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                    "Unable to load performance data."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchPerformance();
    }, []);


    const trend = performance?.trend || [];


    const highestQuiz = useMemo(() => {
        if (!trend.length) return null;

        return trend.reduce((best, current) => {
            return current.percentage > best.percentage
                ? current
                : best;
        });
    }, [trend]);


    return (
        <div className="space-y-6">

            {/* ================================================= */}
            {/* Header */}
            {/* ================================================= */}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <TrendingUp size={22} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Performance
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Track your quiz performance and progress.
                        </p>
                    </div>

                </div>

                {!loading && performance && (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">

                        <p className="text-xs font-medium text-gray-500">
                            Total Attempts
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {performance.total_attempts}
                        </p>

                    </div>
                )}

            </div>


            {/* ================================================= */}
            {/* Loading */}
            {/* ================================================= */}

            {loading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

                    <RefreshCw
                        size={28}
                        className="mx-auto animate-spin text-indigo-500"
                    />

                    <p className="mt-4 text-sm font-medium text-gray-700">
                        Loading performance...
                    </p>

                </div>
            )}


            {/* ================================================= */}
            {/* Error */}
            {/* ================================================= */}

            {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

                    <AlertCircle
                        size={30}
                        className="mx-auto text-red-500"
                    />

                    <h2 className="mt-3 text-lg font-semibold text-red-800">
                        Unable to load performance
                    </h2>

                    <p className="mt-1 text-sm text-red-600">
                        {error}
                    </p>

                    <button
                        onClick={fetchPerformance}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>

                </div>
            )}


            {/* ================================================= */}
            {/* Empty State */}
            {/* ================================================= */}

            {!loading &&
                !error &&
                performance &&
                performance.total_attempts === 0 && (

                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                            <BarChart3 size={30} />
                        </div>

                        <h2 className="mt-5 text-lg font-semibold text-gray-900">
                            No performance data yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            Complete your first quiz to start building
                            your performance history.
                        </p>

                        <Link
                            to="/student/quizzes"
                            className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            View My Quizzes
                        </Link>

                    </div>
                )}


            {/* ================================================= */}
            {/* Performance Content */}
            {/* ================================================= */}

            {!loading &&
                !error &&
                performance &&
                performance.total_attempts > 0 && (

                    <>
                        {/* ========================================= */}
                        {/* KPI Cards */}
                        {/* ========================================= */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                            {/* Average */}

                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                                <div className="flex items-start justify-between">

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Average Score
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-gray-900">
                                            {Number(
                                                performance.average_percentage
                                            ).toFixed(1)}
                                            <span className="text-lg text-gray-400">
                                                %
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <Target size={21} />
                                    </div>

                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    Average percentage across completed quizzes
                                </p>

                            </div>


                            {/* Highest */}

                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                                <div className="flex items-start justify-between">

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Highest Score
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-gray-900">
                                            {Number(
                                                performance.highest_percentage
                                            ).toFixed(1)}
                                            <span className="text-lg text-gray-400">
                                                %
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                        <Trophy size={21} />
                                    </div>

                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    Your best quiz percentage
                                </p>

                            </div>


                            {/* Lowest */}

                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                                <div className="flex items-start justify-between">

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Lowest Score
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-gray-900">
                                            {Number(
                                                performance.lowest_percentage
                                            ).toFixed(1)}
                                            <span className="text-lg text-gray-400">
                                                %
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                                        <BarChart3 size={21} />
                                    </div>

                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    Lowest quiz percentage
                                </p>

                            </div>


                            {/* Attempts */}

                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                                <div className="flex items-start justify-between">

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Total Attempts
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-gray-900">
                                            {performance.total_attempts}
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <ClipboardCheck size={21} />
                                    </div>

                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    Successfully completed quizzes
                                </p>

                            </div>

                        </div>


                        {/* ========================================= */}
                        {/* Trend + Best Performance */}
                        {/* ========================================= */}

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                            {/* Performance Trend */}

                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Performance Trend
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Your quiz scores over time.
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <TrendingUp size={19} />
                                    </div>

                                </div>


                                {/* Chart */}

                                <div className="mt-8">

                                    <div className="flex h-64 items-end gap-3 overflow-x-auto pb-8">

                                        {trend.map((item) => {

                                            const percentage = Math.min(
                                                Math.max(
                                                    Number(
                                                        item.percentage || 0
                                                    ),
                                                    0
                                                ),
                                                100
                                            );

                                            return (
                                                <div
                                                    key={`${item.quiz_id}-${item.attempted_at}`}
                                                    className="group flex h-full min-w-[72px] flex-1 flex-col items-center justify-end"
                                                >

                                                    <div className="relative flex h-full w-full max-w-[54px] items-end">

                                                        <div
                                                            className="w-full rounded-t-xl bg-indigo-500 transition-all duration-500 group-hover:bg-indigo-600"
                                                            style={{
                                                                height: `${Math.max(
                                                                    percentage,
                                                                    4
                                                                )}%`,
                                                            }}
                                                        >

                                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                                                {percentage.toFixed(
                                                                    1
                                                                )}
                                                                %
                                                            </div>

                                                        </div>

                                                    </div>


                                                    <p className="mt-3 max-w-[72px] truncate text-center text-xs font-medium text-gray-600">
                                                        {item.title}
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-gray-400">
                                                        {formatDate(
                                                            item.attempted_at
                                                        )}
                                                    </p>

                                                </div>
                                            );
                                        })}

                                    </div>

                                    {/* Chart scale */}

                                    <div className="mt-2 flex justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                                        <span>0%</span>
                                        <span>25%</span>
                                        <span>50%</span>
                                        <span>75%</span>
                                        <span>100%</span>
                                    </div>

                                </div>

                            </div>


                            {/* Best Performance */}

                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Best Performance
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Your strongest quiz.
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                        <Trophy size={19} />
                                    </div>

                                </div>


                                {highestQuiz && (
                                    <div className="mt-7">

                                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-indigo-100 bg-indigo-50">

                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-indigo-600">
                                                    {Number(
                                                        highestQuiz.percentage
                                                    ).toFixed(0)}
                                                    %
                                                </p>

                                                <p className="text-[10px] font-medium text-gray-500">
                                                    SCORE
                                                </p>
                                            </div>

                                        </div>


                                        <h3 className="mt-6 text-lg font-bold text-gray-900">
                                            {highestQuiz.title}
                                        </h3>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {highestQuiz.score} /{" "}
                                            {highestQuiz.total_marks} marks
                                        </p>


                                        <div className="mt-5">

                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPerformanceClass(
                                                    highestQuiz.percentage
                                                )}`}
                                            >
                                                {getPerformanceLabel(
                                                    highestQuiz.percentage
                                                )}
                                            </span>

                                        </div>


                                        <Link
                                            to={`/student/result/${highestQuiz.quiz_id}`}
                                            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                                        >
                                            <Eye size={16} />
                                            View Result
                                        </Link>

                                    </div>
                                )}

                            </div>

                        </div>


                        {/* ========================================= */}
                        {/* Quiz Performance Table */}
                        {/* ========================================= */}

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                            <div className="border-b border-gray-200 px-6 py-5">

                                <h2 className="text-lg font-bold text-gray-900">
                                    Quiz Performance
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Detailed breakdown of your completed quizzes.
                                </p>

                            </div>


                            {/* Desktop */}

                            <div className="hidden overflow-x-auto lg:block">

                                <table className="w-full">

                                    <thead className="border-b border-gray-200 bg-gray-50">

                                        <tr>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Quiz
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Score
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Percentage
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Performance
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Attempted
                                            </th>

                                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Action
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-gray-100">

                                        {trend.map((item) => (

                                            <tr
                                                key={`${item.quiz_id}-${item.attempted_at}`}
                                                className="transition hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-5">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                            <ClipboardCheck
                                                                size={18}
                                                            />
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {item.title}
                                                            </p>

                                                            <p className="mt-1 text-xs text-gray-400">
                                                                Quiz #{item.quiz_id}
                                                            </p>
                                                        </div>

                                                    </div>

                                                </td>


                                                <td className="px-6 py-5">

                                                    <p className="font-bold text-gray-900">
                                                        {item.score}
                                                        <span className="font-normal text-gray-400">
                                                            {" "}
                                                            /{" "}
                                                            {item.total_marks}
                                                        </span>
                                                    </p>

                                                </td>


                                                <td className="px-6 py-5">

                                                    <p className="font-semibold text-indigo-600">
                                                        {Number(
                                                            item.percentage
                                                        ).toFixed(1)}
                                                        %
                                                    </p>

                                                </td>


                                                <td className="px-6 py-5">

                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPerformanceClass(
                                                            item.percentage
                                                        )}`}
                                                    >
                                                        {getPerformanceLabel(
                                                            item.percentage
                                                        )}
                                                    </span>

                                                </td>


                                                <td className="px-6 py-5">

                                                    <div className="flex items-center gap-2 text-sm text-gray-600">

                                                        <CalendarDays
                                                            size={16}
                                                            className="text-gray-400"
                                                        />

                                                        {formatDate(
                                                            item.attempted_at
                                                        )}

                                                    </div>

                                                </td>


                                                <td className="px-6 py-5 text-right">

                                                    <Link
                                                        to={`/student/result/${item.quiz_id}`}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                                                    >
                                                        <Eye size={16} />
                                                        View Result
                                                    </Link>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>


                            {/* Mobile */}

                            <div className="grid gap-4 p-4 lg:hidden">

                                {trend.map((item) => (

                                    <div
                                        key={`${item.quiz_id}-${item.attempted_at}`}
                                        className="rounded-xl border border-gray-200 p-4"
                                    >

                                        <div className="flex items-start justify-between gap-3">

                                            <div>

                                                <h3 className="font-semibold text-gray-900">
                                                    {item.title}
                                                </h3>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {formatDate(
                                                        item.attempted_at
                                                    )}
                                                </p>

                                            </div>

                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPerformanceClass(
                                                    item.percentage
                                                )}`}
                                            >
                                                {getPerformanceLabel(
                                                    item.percentage
                                                )}
                                            </span>

                                        </div>


                                        <div className="mt-4 flex items-end justify-between">

                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Score
                                                </p>

                                                <p className="mt-1 text-xl font-bold text-gray-900">
                                                    {item.score}
                                                    <span className="text-sm font-medium text-gray-400">
                                                        {" "}
                                                        /{" "}
                                                        {item.total_marks}
                                                    </span>
                                                </p>
                                            </div>


                                            <p className="text-lg font-bold text-indigo-600">
                                                {Number(
                                                    item.percentage
                                                ).toFixed(1)}
                                                %
                                            </p>

                                        </div>


                                        <Link
                                            to={`/student/result/${item.quiz_id}`}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                        >
                                            <Eye size={16} />
                                            View Result
                                        </Link>

                                    </div>

                                ))}

                            </div>

                        </div>

                    </>
                )}

        </div>
    );
}