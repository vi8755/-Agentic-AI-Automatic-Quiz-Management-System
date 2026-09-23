import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    FaArrowLeft,
    FaEye,
    FaUserGraduate,
    FaCheckCircle,
    FaClock,
    FaClipboardList,
    FaExclamationCircle,
} from "react-icons/fa";

import {
    getDescriptiveAssignmentSubmissions,
} from "../../api/teacherApi";

const DescriptiveAssignmentSubmissions = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubmissions();
    }, [assignmentId]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);

            const response =
                await getDescriptiveAssignmentSubmissions(assignmentId);

            setData(response);
        } catch (error) {
            console.error(
                "Failed to load descriptive submissions:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load student submissions"
            );
        } finally {
            setLoading(false);
        }
    };

    const submissions = data?.submissions || [];

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "evaluated":
                return "bg-green-100 text-green-700";

            case "submitted":
                return "bg-blue-100 text-blue-700";

            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "in_progress":
                return "bg-purple-100 text-purple-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getEvaluationStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return "bg-emerald-100 text-emerald-700";

            case "pending":
                return "bg-yellow-100 text-yellow-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        return new Date(date).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

                    <p className="text-gray-500">
                        Loading student submissions...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-10">

            {/* =========================================
                Back Button
            ========================================= */}

            <button
                onClick={() =>
                    navigate("/teacher/descriptive-assignments")
                }
                className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-600"
            >
                <FaArrowLeft />

                Back to Descriptive Assignments
            </button>


            {/* =========================================
                Header
            ========================================= */}

            <div className="mb-8">

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">

                    <div>
                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                <FaClipboardList className="text-xl text-blue-600" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {data?.assignment_title ||
                                        "Descriptive Assignment"}
                                </h1>

                                <p className="mt-1 text-gray-500">
                                    Assignment ID: #{data?.assignment_id}
                                </p>
                            </div>

                        </div>
                    </div>


                    <div className="rounded-xl bg-blue-50 px-5 py-3">
                        <p className="text-sm text-blue-600">
                            Total Questions
                        </p>

                        <p className="text-2xl font-bold text-blue-800">
                            {data?.total_questions ?? 0}
                        </p>
                    </div>

                </div>

            </div>


            {/* =========================================
                Statistics
            ========================================= */}

            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">

                <div className="rounded-xl bg-white p-5 shadow-md">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Total Submissions
                            </p>

                            <h2 className="mt-1 text-3xl font-bold text-gray-900">
                                {submissions.length}
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                            <FaUserGraduate className="text-xl text-blue-600" />
                        </div>

                    </div>

                </div>


                <div className="rounded-xl bg-white p-5 shadow-md">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Evaluated
                            </p>

                            <h2 className="mt-1 text-3xl font-bold text-gray-900">
                                {
                                    submissions.filter(
                                        (submission) =>
                                            submission.evaluation_status?.toLowerCase() ===
                                            "completed"
                                    ).length
                                }
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                            <FaCheckCircle className="text-xl text-green-600" />
                        </div>

                    </div>

                </div>


                <div className="rounded-xl bg-white p-5 shadow-md">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Pending Review
                            </p>

                            <h2 className="mt-1 text-3xl font-bold text-gray-900">
                                {
                                    submissions.filter(
                                        (submission) =>
                                            submission.evaluation_status?.toLowerCase() !==
                                            "completed"
                                    ).length
                                }
                            </h2>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                            <FaClock className="text-xl text-yellow-600" />
                        </div>

                    </div>

                </div>

            </div>


            {/* =========================================
                Empty State
            ========================================= */}

            {submissions.length === 0 ? (

                <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-md">

                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <FaExclamationCircle className="text-2xl text-gray-500" />
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-900">
                        No Submissions Yet
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-gray-500">
                        No students have submitted this descriptive
                        assignment yet.
                    </p>

                </div>

            ) : (

                /* =========================================
                   Submission Table
                ========================================= */

                <div className="overflow-hidden rounded-2xl bg-white shadow-md">

                    <div className="border-b border-gray-100 px-6 py-5">

                        <h2 className="text-xl font-bold text-gray-900">
                            Student Submissions
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Review student answers and AI evaluations.
                        </p>

                    </div>


                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1000px]">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Student
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Roll No
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Evaluation
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Marks
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Submitted
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {submissions.map((submission) => (

                                    <tr
                                        key={submission.submission_id}
                                        className="transition hover:bg-gray-50"
                                    >

                                        {/* Student */}

                                        <td className="px-6 py-5">

                                            <div className="flex items-center gap-3">

                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                                    <FaUserGraduate className="text-blue-600" />
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {submission.student_name}
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        {submission.student_email}
                                                    </p>
                                                </div>

                                            </div>

                                        </td>


                                        {/* Roll Number */}

                                        <td className="px-6 py-5">

                                            <span className="font-medium text-gray-700">
                                                {submission.roll_no || "N/A"}
                                            </span>

                                        </td>


                                        {/* Status */}

                                        <td className="px-6 py-5">

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                                    submission.status
                                                )}`}
                                            >
                                                {submission.status}
                                            </span>

                                        </td>


                                        {/* Evaluation */}

                                        <td className="px-6 py-5">

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getEvaluationStyle(
                                                    submission.evaluation_status
                                                )}`}
                                            >
                                                {submission.evaluation_status}
                                            </span>

                                        </td>


                                        {/* Marks */}

                                        <td className="px-6 py-5">

                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {submission.obtained_marks ??
                                                        0}{" "}
                                                    /{" "}
                                                    {submission.total_marks ??
                                                        0}
                                                </p>

                                                <p className="text-sm text-gray-500">
                                                    {submission.percentage ??
                                                        0}
                                                    %
                                                </p>
                                            </div>

                                        </td>


                                        {/* Submitted */}

                                        <td className="px-6 py-5">

                                            <span className="text-sm text-gray-600">
                                                {formatDate(
                                                    submission.submitted_at
                                                )}
                                            </span>

                                        </td>


                                        {/* Action */}

                                        <td className="px-6 py-5 text-right">

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/teacher/descriptive-submissions/${submission.submission_id}`
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                            >
                                                <FaEye />

                                                View Answer
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

        </div>
    );
};

export default DescriptiveAssignmentSubmissions;