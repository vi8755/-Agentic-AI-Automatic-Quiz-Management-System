import { useEffect, useMemo, useState } from "react";
import {
    Trophy,
    Medal,
    Users,
    BarChart3,
    Loader2,
    TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";

import { getStudentPerformance } from "../../api/studentApi";

const AllQuizPerformance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPerformance = async () => {
            try {
                setLoading(true);

                const response =
                    await getStudentPerformance();

                setData(response);
            } catch (error) {
                console.error(
                    "Failed to load all quiz performance:",
                    error
                );

                toast.error(
                    error?.response?.data?.detail ||
                        "Unable to load all quiz performance."
                );
            } finally {
                setLoading(false);
            }
        };

        loadPerformance();
    }, []);

    const students = useMemo(() => {
        return Array.isArray(data?.students)
            ? data.students
            : [];
    }, [data]);

    const rankedStudents = useMemo(() => {
        return students.filter(
            (student) =>
                Number(student.attempts || 0) > 0
        );
    }, [students]);

    const topFive = rankedStudents.slice(0, 5);
    const topper =
        data?.topper ||
        topFive[0] ||
        null;

    const myRank =
        data?.my_rank ??
        null;

    const myPercentage =
        data?.my_average_percentage ??
        data?.average_percentage ??
        0;

    const classAverage =
        data?.class_average_percentage ??
        0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <Loader2
                            size={42}
                            className="mx-auto text-indigo-600 animate-spin"
                        />

                        <p className="mt-4 text-gray-500">
                            Loading all quiz performance...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER */}
                <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <BarChart3
                                size={28}
                                className="text-indigo-600"
                            />
                        </div>

                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                All Quiz Performance
                            </h1>

                            <p className="text-gray-500 mt-1">
                                Your overall performance across all completed quizzes.
                            </p>

                            <p className="text-sm text-indigo-600 mt-1 font-medium">
                                Your position is calculated among students in your section.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SUMMARY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Your Average
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {Number(myPercentage).toFixed(2)}%
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Across completed quizzes
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Your Rank
                        </p>

                        <h2 className="text-3xl font-bold text-indigo-600 mt-2">
                            {myRank ? `#${myRank}` : "—"}
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Among evaluated students
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Section Average
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {Number(classAverage).toFixed(2)}%
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Overall quiz average
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Completed Quizzes
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {data?.total_attempts ?? 0}
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Your completed attempts
                        </p>
                    </div>

                </div>

                {/* TOP PERFORMER */}
                <section className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Trophy
                                size={28}
                                className="text-yellow-600"
                            />
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                Top Performer
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900">
                                {topper
                                    ? topper.student_name
                                    : "No completed quiz data yet"}
                            </h2>

                            {topper && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {topper.roll_no || "—"}
                                    {" • "}
                                    {Number(
                                        topper.average_percentage || 0
                                    ).toFixed(2)}
                                    %
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* TOP 5 */}
                <section className="bg-white rounded-2xl shadow-sm border">
                    <div className="px-6 py-5 border-b">
                        <h2 className="text-xl font-bold text-gray-900">
                            Top 5 Students
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Ranked by average percentage across completed quizzes.
                        </p>
                    </div>

                    {topFive.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No completed quiz data available.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Rank
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Student
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Roll No
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Quizzes
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Average
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {topFive.map(
                                        (student, index) => (
                                            <tr
                                                key={
                                                    student.student_id
                                                }
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 font-bold">
                                                    <div className="flex items-center gap-2">
                                                        {index === 0 ? (
                                                            <Trophy
                                                                size={19}
                                                                className="text-yellow-500"
                                                            />
                                                        ) : (
                                                            <Medal
                                                                size={19}
                                                                className="text-indigo-500"
                                                            />
                                                        )}

                                                        #{index + 1}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-semibold text-gray-900">
                                                    {
                                                        student.student_name
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-gray-600">
                                                    {student.roll_no ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-4 text-gray-700">
                                                    {
                                                        student.attempts
                                                    }
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                                        {Number(
                                                            student.average_percentage ||
                                                                0
                                                        ).toFixed(2)}
                                                        %
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* ALL STUDENTS */}
                <section className="bg-white rounded-2xl shadow-sm border">
                    <div className="px-6 py-5 border-b">
                        <div className="flex items-center gap-3">
                            <Users
                                size={22}
                                className="text-indigo-600"
                            />

                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    All Student Performance
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Overall quiz standing of students in your section.
                                </p>
                            </div>
                        </div>
                    </div>

                    {students.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No student performance data available.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-indigo-600 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Rank
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Student
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Roll No
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Attempts
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Average %
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {students.map(
                                        (student) => (
                                            <tr
                                                key={
                                                    student.student_id
                                                }
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 font-semibold">
                                                    {student.rank
                                                        ? `#${student.rank}`
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-4 font-semibold text-gray-900">
                                                    {
                                                        student.student_name
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-gray-600">
                                                    {student.roll_no ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-4 text-gray-700">
                                                    {
                                                        student.attempts
                                                    }
                                                </td>

                                                <td className="px-6 py-4 font-semibold">
                                                    {student.attempts > 0
                                                        ? `${Number(
                                                              student.average_percentage ||
                                                                  0
                                                          ).toFixed(2)}%`
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            student.attempts > 0
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                                                        {student.attempts > 0
                                                            ? "Evaluated"
                                                            : "Not Attempted"}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* CURRENT QUIZ TREND */}
                {Array.isArray(data?.trend) &&
                    data.trend.length > 0 && (
                        <section className="bg-white rounded-2xl shadow-sm border p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <TrendingUp
                                    size={22}
                                    className="text-indigo-600"
                                />

                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Your Quiz History
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Individual quiz scores used in your overall performance.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                                Quiz
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                                Score
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                                Percentage
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                                Attempted
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {data.trend.map(
                                            (quiz) => (
                                                <tr
                                                    key={
                                                        quiz.response_id
                                                    }
                                                >
                                                    <td className="px-6 py-4 font-semibold text-gray-900">
                                                        {
                                                            quiz.title
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4 text-gray-700">
                                                        {
                                                            quiz.score
                                                        }
                                                        {" / "}
                                                        {
                                                            quiz.total_marks
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4 font-semibold text-indigo-600">
                                                        {Number(
                                                            quiz.percentage ||
                                                                0
                                                        ).toFixed(2)}
                                                        %
                                                    </td>

                                                    <td className="px-6 py-4 text-gray-600">
                                                        {quiz.attempted_at
                                                            ? new Date(
                                                                  quiz.attempted_at
                                                              ).toLocaleDateString(
                                                                  "en-IN"
                                                              )
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

            </div>
        </div>
    );
};

export default AllQuizPerformance;
