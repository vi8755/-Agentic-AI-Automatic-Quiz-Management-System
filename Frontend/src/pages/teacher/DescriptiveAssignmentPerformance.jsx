import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Trophy,
    Medal,
    Users,
    Award,
    Loader2,
    Download,
} from "lucide-react";
import { toast } from "react-toastify";

import {
    getDescriptiveAssignmentSubmissions,
    downloadDescriptiveAssignmentSubmissions,
} from "../../api/teacherApi";

const DescriptiveAssignmentPerformance = () => {

    const navigate = useNavigate();

    const { assignmentId } = useParams();

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    // =========================================================
    // LOAD PERFORMANCE DATA
    // =========================================================

    useEffect(() => {
        loadPerformance();
    }, [assignmentId]);

    const loadPerformance = async () => {

        try {

            setLoading(true);

            const response =
                await getDescriptiveAssignmentSubmissions(
                    assignmentId
                );

            setData(response);

        } catch (error) {

            console.error(
                "Failed to load performance:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                "Failed to load performance."
            );

        } finally {

            setLoading(false);

        }
    };

    // =========================================================
    // PERFORMANCE DATA
    // =========================================================

    const students = useMemo(() => {

        const submissions =
            Array.isArray(data?.submissions)
                ? data.submissions
                : [];

        return submissions
            .map((student) => {

                const percentage =
                    Number(
                        student.percentage ?? 0
                    );

                return {
                    ...student,
                    percentage:
                        Number.isFinite(
                            percentage
                        )
                            ? percentage
                            : 0,
                };

            })
            .sort(
                (a, b) =>
                    b.percentage -
                    a.percentage
            );

    }, [data]);
    const [downloadingExcel, setDownloadingExcel] =
    useState(false);

const handleDownloadExcel = async () => {

    try {

        setDownloadingExcel(true);

        const response =
            await downloadDescriptiveAssignmentSubmissions(
                assignmentId
            );

        const blob = new Blob(
            [response.data],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
        );

        const url =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `descriptive_assignment_${assignmentId}_submissions.xlsx`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);

        toast.success(
            "Excel file downloaded successfully."
        );

    } catch (error) {

        console.error(
            "Excel download failed:",
            error
        );

        toast.error(
            error?.response?.data?.detail ||
            "Failed to download Excel file."
        );

    } finally {

        setDownloadingExcel(false);

    }
};

    // =========================================================
    // COMPLETED STUDENTS
    // =========================================================

    const evaluatedStudents =
        useMemo(() => {

            return students.filter(
                (student) =>
                    String(
                        student.evaluation_status ||
                        ""
                    ).toLowerCase() ===
                    "completed"
            );

        }, [students]);

    // =========================================================
    // TOP STUDENT
    // =========================================================

    const topper =
        evaluatedStudents[0] || null;

    // =========================================================
    // TOP 5
    // =========================================================

    const topFive =
        evaluatedStudents.slice(0, 5);

    // =========================================================
    // AVERAGE
    // =========================================================

    const averagePercentage =
        evaluatedStudents.length > 0
            ? evaluatedStudents.reduce(
                  (sum, student) =>
                      sum +
                      Number(
                          student.percentage || 0
                      ),
                  0
              ) /
              evaluatedStudents.length
            : 0;

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">

                <div className="text-center">

                    <Loader2
                        size={40}
                        className="mx-auto text-purple-600 animate-spin"
                    />

                    <p className="mt-3 text-gray-500">
                        Loading performance...
                    </p>

                </div>

            </div>
        );

    }

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            <div className="max-w-7xl mx-auto">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

                    <div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/teacher/descriptive-assignments/${assignmentId}/submissions`
                                )
                            }
                            className="inline-flex items-center gap-2 text-purple-600 font-semibold mb-4 hover:text-purple-800"
                        >
                            <ArrowLeft size={18} />

                            Back to Submissions
                        </button>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Assignment Performance
                        </h1>

                        <p className="text-gray-500 mt-1">
                            {data?.assignment_title ||
                                "Descriptive Assignment"}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={handleDownloadExcel}
                        disabled={downloadingExcel}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloadingExcel ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Preparing Excel...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Download Excel
                            </>
                        )}
                    </button>

                </div>

                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

                    {/* Top Performer */}

                    <div className="bg-white rounded-2xl shadow-sm p-6 border">

                        <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">

                                <Trophy
                                    size={24}
                                    className="text-yellow-600"
                                />

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Top Performer
                                </p>

                                <p className="text-lg font-bold text-gray-900">

                                    {topper
                                        ? topper.student_name
                                        : "—"}

                                </p>

                            </div>

                        </div>

                        <p className="text-2xl font-bold text-purple-600 mt-5">

                            {topper
                                ? `${Number(
                                      topper.percentage
                                  ).toFixed(2)}%`
                                : "—"}

                        </p>

                    </div>

                    {/* Top 5 */}

                    <div className="bg-white rounded-2xl shadow-sm p-6 border">

                        <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">

                                <Award
                                    size={24}
                                    className="text-purple-600"
                                />

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Top Students
                                </p>

                                <p className="text-lg font-bold text-gray-900">
                                    Top {Math.min(
                                        5,
                                        evaluatedStudents.length
                                    )}
                                </p>

                            </div>

                        </div>

                        <p className="text-2xl font-bold text-purple-600 mt-5">
                            {Math.min(5, evaluatedStudents.length)}
                        </p>

                    </div>

                    {/* Average */}

                    <div className="bg-white rounded-2xl shadow-sm p-6 border">

                        <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">

                                <Users
                                    size={24}
                                    className="text-blue-600"
                                />

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Average Performance
                                </p>

                                <p className="text-lg font-bold text-gray-900">
                                    All Evaluated Students
                                </p>

                            </div>

                        </div>

                        <p className="text-2xl font-bold text-blue-600 mt-5">
                            {averagePercentage.toFixed(2)}%
                        </p>

                    </div>

                </div>

                {/* =================================================
                    TOP 5
                ================================================= */}

                <div className="bg-white rounded-2xl shadow-sm border mb-8">

                    <div className="px-6 py-5 border-b">

                        <h2 className="text-xl font-bold text-gray-900">
                            Top 5 Students
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Ranked by percentage
                        </p>

                    </div>

                    {topFive.length === 0 ? (

                        <div className="p-10 text-center text-gray-500">
                            No evaluated students yet.
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
                                            Marks
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Percentage
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y">

                                    {topFive.map(
                                        (
                                            student,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    student.submission_id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-2 font-bold">

                                                        {index ===
                                                        0 ? (
                                                            <Trophy
                                                                size={
                                                                    20
                                                                }
                                                                className="text-yellow-500"
                                                            />
                                                        ) : (
                                                            <Medal
                                                                size={
                                                                    20
                                                                }
                                                                className="text-purple-500"
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
                                                    {
                                                        student.roll_no ||
                                                        "—"
                                                    }
                                                </td>

                                                <td className="px-6 py-4 font-semibold">
                                                    {
                                                        student.obtained_marks ??
                                                        0
                                                    }
                                                    {" / "}
                                                    {
                                                        student.total_marks ??
                                                        0
                                                    }
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">

                                                        {Number(
                                                            student.percentage ||
                                                                0
                                                        ).toFixed(
                                                            2
                                                        )}
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

                {/* =================================================
                    ALL STUDENTS
                ================================================= */}

                <div className="bg-white rounded-2xl shadow-sm border">

                    <div className="px-6 py-5 border-b">

                        <h2 className="text-xl font-bold text-gray-900">
                            Student Performance
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Complete performance of all assigned students
                        </p>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-blue-600 text-white">

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
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                        Evaluation
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                        Marks
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                        Percentage
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {(() => {
                                    const evaluatedRankMap = new Map(
                                        evaluatedStudents.map(
                                            (student, evaluatedIndex) => [
                                                student.submission_id,
                                                evaluatedIndex + 1,
                                            ]
                                        )
                                    );

                                    return students.map((student) => {
                                        const evaluated =
                                            String(
                                                student.evaluation_status ||
                                                ""
                                            ).toLowerCase() ===
                                            "completed";

                                        const rank = evaluated
                                            ? evaluatedRankMap.get(
                                                  student.submission_id
                                              )
                                            : null;

                                        return (
                                            <tr
                                                key={
                                                    student.submission_id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4 font-semibold">
                                                    {evaluated && rank
                                                        ? `#${rank}`
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-4">

                                                    <p className="font-semibold text-gray-900">
                                                        {
                                                            student.student_name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        {
                                                            student.student_email
                                                        }
                                                    </p>

                                                </td>

                                                <td className="px-6 py-4">
                                                    {
                                                        student.roll_no ||
                                                        "—"
                                                    }
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                                                        {
                                                            student.status ||
                                                            "—"
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            evaluated
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                                                        {
                                                            student.evaluation_status ||
                                                            "Pending"
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 font-semibold">

                                                    {
                                                        student.obtained_marks ??
                                                        0
                                                    }

                                                    {" / "}

                                                    {
                                                        student.total_marks ??
                                                        0
                                                    }

                                                </td>

                                                <td className="px-6 py-4">

                                                    {evaluated
                                                        ? `${Number(
                                                              student.percentage ||
                                                                  0
                                                          ).toFixed(
                                                              2
                                                          )}%`
                                                        : "—"}

                                                </td>

                                            </tr>
                                        );
                                    });
                                })()}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default DescriptiveAssignmentPerformance;