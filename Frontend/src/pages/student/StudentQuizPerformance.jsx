import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Trophy,
    Medal,
    Users,
    Award,
    Loader2,
    BarChart3,
} from "lucide-react";
import { toast } from "react-toastify";

import {
    getStudentQuizPerformance,
} from "../../api/studentApi";

const StudentQuizPerformance = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPerformance = async () => {
            try {
                setLoading(true);

                const response =
                    await getStudentQuizPerformance(quizId);

                setData(response);
            } catch (error) {
                console.error(
                    "Failed to load quiz performance:",
                    error
                );

                toast.error(
                    error?.response?.data?.detail ||
                        "Unable to load quiz performance."
                );
            } finally {
                setLoading(false);
            }
        };

        if (quizId) {
            loadPerformance();
        }
    }, [quizId]);

    const students = useMemo(() => {
        const rows = Array.isArray(data?.students)
            ? data.students
            : [];

        return [...rows].sort(
            (a, b) =>
                Number(b.percentage ?? 0) -
                Number(a.percentage ?? 0)
        );
    }, [data]);

    const rankedStudents = useMemo(
        () =>
            students.filter(
                (student) => student.attempted === true
            ),
        [students]
    );

    const topFive = rankedStudents.slice(0, 5);
    const topper = topFive[0] || null;

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
                            Loading quiz performance...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-5xl mx-auto">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/student/quizzes")
                        }
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft size={18} />
                        Back to My Quizzes
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <BarChart3
                            size={42}
                            className="mx-auto text-gray-400"
                        />

                        <h2 className="text-xl font-bold text-gray-900 mt-4">
                            Performance Not Available
                        </h2>

                        <p className="text-gray-500 mt-2">
                            This quiz performance could not be loaded.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">

                {/* BACK */}
                <button
                    type="button"
                    onClick={() =>
                        navigate("/student/quizzes")
                    }
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft size={18} />
                    Back to My Quizzes
                </button>

                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <BarChart3
                                size={28}
                                className="text-indigo-600"
                            />
                        </div>

                        <div>
                            <p className="text-sm text-indigo-600 font-medium">
                                Quiz Performance
                            </p>

                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {data.quiz_title || "Quiz"}
                            </h1>

                            <p className="text-gray-500 mt-1">
                                {data.section_name
                                    ? `Your Section: ${data.section_name}`
                                    : "Student performance for this quiz"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Your Score
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {data.my_score ?? 0}
                            {" / "}
                            {data.total_marks ?? 0}
                        </h2>

                        <p className="text-indigo-600 font-semibold mt-1">
                            {Number(
                                data.my_percentage ?? 0
                            ).toFixed(2)}
                            %
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Class Average
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {Number(
                                data.class_average_percentage ?? 0
                            ).toFixed(2)}
                            %
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Completed attempts
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Completed Students
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {data.completed_students ?? 0}
                        </h2>

                        <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                            <Users size={15} />
                            In your section
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <p className="text-sm text-gray-500">
                            Your Rank
                        </p>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            {data.my_rank
                                ? `#${data.my_rank}`
                                : "—"}
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Among completed students
                        </p>
                    </div>

                </div>

                {/* TOP PERFORMER */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
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
                                    : "No completed student yet"}
                            </h2>

                            {topper && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {topper.roll_no || "—"}
                                    {" • "}
                                    {Number(
                                        topper.percentage ?? 0
                                    ).toFixed(2)}
                                    %
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* TOP 5 */}
                <div className="bg-white rounded-2xl shadow-sm border mb-6">
                    <div className="px-6 py-5 border-b">
                        <h2 className="text-xl font-bold text-gray-900">
                            Top 5 Students
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Ranked by percentage in this quiz.
                        </p>
                    </div>

                    {topFive.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No completed attempts yet.
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
                                            Score
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Percentage
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

                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900">
                                                        {
                                                            student.student_name
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-gray-600">
                                                    {student.roll_no ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-4 text-gray-700">
                                                    {
                                                        student.score
                                                    }
                                                    {" / "}
                                                    {
                                                        data.total_marks
                                                    }
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                                        {Number(
                                                            student.percentage ??
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
                </div>

                {/* ALL STUDENTS */}
                <div className="bg-white rounded-2xl shadow-sm border">
                    <div className="px-6 py-5 border-b">
                        <h2 className="text-xl font-bold text-gray-900">
                            All Student Performance
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Performance in this quiz for students in your section.
                        </p>
                    </div>

                    {students.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No students found.
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
                                            Score
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Percentage
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {students.map(
                                        (student, index) => (
                                            <tr
                                                key={
                                                    student.student_id
                                                }
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 font-semibold">
                                                    {student.attempted
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
                                                    {student.attempted
                                                        ? `${student.score} / ${data.total_marks}`
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-4 font-semibold">
                                                    {student.attempted
                                                        ? `${Number(
                                                              student.percentage ??
                                                                  0
                                                          ).toFixed(2)}%`
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            student.attempted
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                                                        {student.attempted
                                                            ? "Completed"
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
                </div>

            </div>
        </div>
    );
};

export default StudentQuizPerformance;
