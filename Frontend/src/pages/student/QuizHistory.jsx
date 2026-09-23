import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    History,
    Eye,
    Clock3,
    CalendarDays,
    UserRound,
    Trophy,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

import { getStudentHistory } from "../../api/studentApi";


const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


const formatTimeTaken = (seconds) => {
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


const getPerformance = (percentage) => {
    if (percentage >= 80) {
        return {
            label: "Excellent",
            className:
                "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
    }

    if (percentage >= 60) {
        return {
            label: "Good",
            className:
                "bg-blue-50 text-blue-700 border-blue-200",
        };
    }

    if (percentage >= 40) {
        return {
            label: "Average",
            className:
                "bg-amber-50 text-amber-700 border-amber-200",
        };
    }

    return {
        label: "Needs Improvement",
        className:
            "bg-red-50 text-red-700 border-red-200",
    };
};


export default function QuizHistory() {
    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getStudentHistory();

            setHistory(data?.items || []);
        } catch (err) {
            console.error(
                "Failed to load quiz history:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                    "Unable to load quiz history."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchHistory();
    }, []);


    const filteredHistory = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return history;
        }

        return history.filter((item) => {
            return (
                item.title
                    ?.toLowerCase()
                    .includes(query) ||
                item.teacher_name
                    ?.toLowerCase()
                    .includes(query)
            );
        });
    }, [history, search]);


    return (
        <div className="space-y-6">

            {/* ================================================= */}
            {/* Header */}
            {/* ================================================= */}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <History size={22} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Quiz History
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Review your completed quizzes and performance.
                            </p>
                        </div>
                    </div>
                </div>

                {!loading && (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-medium text-gray-500">
                            Completed Quizzes
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {history.length}
                        </p>
                    </div>
                )}
            </div>


            {/* ================================================= */}
            {/* Search */}
            {/* ================================================= */}

            {!loading && !error && history.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

                    <div className="relative">
                        <Search
                            size={19}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search quiz or teacher..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>
            )}


            {/* ================================================= */}
            {/* Loading */}
            {/* ================================================= */}

            {loading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

                    <RefreshCw
                        size={28}
                        className="mx-auto animate-spin text-indigo-500"
                    />

                    <p className="mt-4 text-sm font-medium text-gray-700">
                        Loading quiz history...
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
                        Unable to load history
                    </h2>

                    <p className="mt-1 text-sm text-red-600">
                        {error}
                    </p>

                    <button
                        onClick={fetchHistory}
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
                history.length === 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                            <History size={30} />
                        </div>

                        <h2 className="mt-5 text-lg font-semibold text-gray-900">
                            No quiz history yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            Once you complete a quiz, your score and
                            performance details will appear here.
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
            {/* No Search Results */}
            {/* ================================================= */}

            {!loading &&
                !error &&
                history.length > 0 &&
                filteredHistory.length === 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

                        <Search
                            size={30}
                            className="mx-auto text-gray-400"
                        />

                        <h2 className="mt-3 text-lg font-semibold text-gray-900">
                            No matching quizzes
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Try searching with a different quiz or teacher name.
                        </p>
                    </div>
                )}


            {/* ================================================= */}
            {/* Desktop Table */}
            {/* ================================================= */}

            {!loading &&
                !error &&
                filteredHistory.length > 0 && (
                    <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">

                        <div className="overflow-x-auto">

                            <table className="w-full">

                                <thead className="border-b border-gray-200 bg-gray-50">

                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Quiz
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Teacher
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Score
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Performance
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Attempted
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Time
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Action
                                        </th>
                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-gray-100">

                                    {filteredHistory.map((item) => {

                                        const performance =
                                            getPerformance(
                                                Number(
                                                    item.percentage || 0
                                                )
                                            );

                                        return (
                                            <tr
                                                key={item.response_id}
                                                className="transition hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                            <Trophy size={18} />
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
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <UserRound
                                                            size={16}
                                                            className="text-gray-400"
                                                        />

                                                        {item.teacher_name}
                                                    </div>
                                                </td>


                                                <td className="px-6 py-5">
                                                    <p className="font-bold text-gray-900">
                                                        {item.score}
                                                        <span className="font-normal text-gray-400">
                                                            {" "}
                                                            / {item.total_marks}
                                                        </span>
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {Number(
                                                            item.percentage || 0
                                                        ).toFixed(1)}
                                                        %
                                                    </p>
                                                </td>


                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${performance.className}`}
                                                    >
                                                        {performance.label}
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


                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Clock3
                                                            size={16}
                                                            className="text-gray-400"
                                                        />

                                                        {formatTimeTaken(
                                                            item.time_taken_seconds
                                                        )}
                                                    </div>
                                                </td>


                                                <td className="px-6 py-5 text-right">

                                                    <Link
                                                        to={`/student/result/${item.response_id}`}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                                                    >
                                                        <Eye size={16} />
                                                        View Result
                                                    </Link>

                                                </td>

                                            </tr>
                                        );
                                    })}

                                </tbody>

                            </table>

                        </div>

                    </div>
                )}


            {/* ================================================= */}
            {/* Mobile / Tablet Cards */}
            {/* ================================================= */}

            {!loading &&
                !error &&
                filteredHistory.length > 0 && (
                    <div className="grid gap-4 lg:hidden">

                        {filteredHistory.map((item) => {

                            const performance =
                                getPerformance(
                                    Number(
                                        item.percentage || 0
                                    )
                                );

                            return (
                                <div
                                    key={item.response_id}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                                >

                                    {/* Quiz Header */}

                                    <div className="flex items-start justify-between gap-3">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                <Trophy size={18} />
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {item.title}
                                                </h3>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {item.teacher_name}
                                                </p>
                                            </div>

                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${performance.className}`}
                                        >
                                            {performance.label}
                                        </span>

                                    </div>


                                    {/* Score */}

                                    <div className="mt-5 rounded-xl bg-gray-50 p-4">

                                        <div className="flex items-end justify-between">

                                            <div>
                                                <p className="text-xs font-medium text-gray-500">
                                                    Score
                                                </p>

                                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                                    {item.score}
                                                    <span className="text-base font-medium text-gray-400">
                                                        {" "}
                                                        / {item.total_marks}
                                                    </span>
                                                </p>
                                            </div>

                                            <p className="text-lg font-bold text-indigo-600">
                                                {Number(
                                                    item.percentage || 0
                                                ).toFixed(1)}
                                                %
                                            </p>

                                        </div>

                                    </div>


                                    {/* Details */}

                                    <div className="mt-4 grid grid-cols-2 gap-3">

                                        <div className="rounded-xl border border-gray-100 p-3">

                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <CalendarDays size={14} />
                                                Attempted
                                            </div>

                                            <p className="mt-1 text-sm font-medium text-gray-700">
                                                {formatDate(
                                                    item.attempted_at
                                                )}
                                            </p>

                                        </div>


                                        <div className="rounded-xl border border-gray-100 p-3">

                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Clock3 size={14} />
                                                Time
                                            </div>

                                            <p className="mt-1 text-sm font-medium text-gray-700">
                                                {formatTimeTaken(
                                                    item.time_taken_seconds
                                                )}
                                            </p>

                                        </div>

                                    </div>


                                    {/* Result Button */}

                                    <Link
                                        to={`/student/result/${item.response_id}`}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        <Eye size={17} />
                                        View Result
                                    </Link>

                                </div>
                            );
                        })}

                    </div>
                )}

        </div>
    );
}