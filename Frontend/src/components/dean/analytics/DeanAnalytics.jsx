import { useEffect, useState } from "react";
import {
    FaChartBar,
    FaUsers,
    FaChalkboardTeacher,
    FaLayerGroup,
    FaBookOpen,
    FaClipboardList,
    FaPercentage,
    FaTrophy,
    FaSyncAlt,
    FaGraduationCap,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { getDeanAnalytics } from "../../../services/deanApi";

const DeanAnalytics = () => {
    // ============================================================
    // STATE
    // ============================================================

    const [analytics, setAnalytics] = useState({
        summary: {
            total_students: 0,
            active_students: 0,
            inactive_students: 0,

            total_teachers: 0,
            active_teachers: 0,
            inactive_teachers: 0,

            total_sections: 0,
            active_sections: 0,
            inactive_sections: 0,

            total_subjects: 0,
            active_subjects: 0,
            inactive_subjects: 0,

            total_quizzes: 0,
            total_assignments: 0,
            total_attempts: 0,

            attempt_rate: 0,
            average_score: 0,
            highest_score: 0,
        },

        sections: [],
        teachers: [],
        subjects: [],
        quiz_activity: [],
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ============================================================
    // LOAD ANALYTICS
    // ============================================================

    const loadAnalytics = async () => {
        try {
            setRefreshing(true);

            const data = await getDeanAnalytics();

            setAnalytics({
                summary: {
                    total_students:
                        data?.summary?.total_students || 0,

                    active_students:
                        data?.summary?.active_students || 0,

                    inactive_students:
                        data?.summary?.inactive_students || 0,

                    total_teachers:
                        data?.summary?.total_teachers || 0,

                    active_teachers:
                        data?.summary?.active_teachers || 0,

                    inactive_teachers:
                        data?.summary?.inactive_teachers || 0,

                    total_sections:
                        data?.summary?.total_sections || 0,

                    active_sections:
                        data?.summary?.active_sections || 0,

                    inactive_sections:
                        data?.summary?.inactive_sections || 0,

                    total_subjects:
                        data?.summary?.total_subjects || 0,

                    active_subjects:
                        data?.summary?.active_subjects || 0,

                    inactive_subjects:
                        data?.summary?.inactive_subjects || 0,

                    total_quizzes:
                        data?.summary?.total_quizzes || 0,

                    total_assignments:
                        data?.summary?.total_assignments || 0,

                    total_attempts:
                        data?.summary?.total_attempts || 0,

                    attempt_rate:
                        data?.summary?.attempt_rate || 0,

                    average_score:
                        data?.summary?.average_score || 0,

                    highest_score:
                        data?.summary?.highest_score || 0,
                },

                sections: Array.isArray(data?.sections)
                    ? data.sections
                    : [],

                teachers: Array.isArray(data?.teachers)
                    ? data.teachers
                    : [],

                subjects: Array.isArray(data?.subjects)
                    ? data.subjects
                    : [],

                quiz_activity: Array.isArray(
                    data?.quiz_activity
                )
                    ? data.quiz_activity
                    : [],
            });
        } catch (error) {
            console.error(
                "Failed to load Dean analytics:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load Dean analytics."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        loadAnalytics();
    }, []);

    // ============================================================
    // SUMMARY CARD
    // ============================================================

    const SummaryCard = ({
        title,
        value,
        subtitle,
        icon: Icon,
    }) => {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            {title}
                        </p>

                        <h3 className="mt-2 text-3xl font-bold text-gray-800">
                            {value}
                        </h3>

                        {subtitle && (
                            <p className="mt-2 text-xs text-gray-400">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="text-xl" />
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                    <p className="mt-4 text-gray-500">
                        Loading Dean analytics...
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="space-y-8">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Dean Analytics
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Overview of students, teachers, sections,
                        quizzes and academic performance.
                    </p>
                </div>

                <button
                    onClick={loadAnalytics}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FaSyncAlt
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Refresh
                </button>
            </div>

            {/* ==================================================
                OVERVIEW
            ================================================== */}

            <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                    System Overview
                </h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                    <SummaryCard
                        title="Total Students"
                        value={
                            analytics.summary.total_students
                        }
                        subtitle={`${analytics.summary.active_students} active`}
                        icon={FaUsers}
                    />

                    <SummaryCard
                        title="Total Teachers"
                        value={
                            analytics.summary.total_teachers
                        }
                        subtitle={`${analytics.summary.active_teachers} active`}
                        icon={FaChalkboardTeacher}
                    />

                    <SummaryCard
                        title="Total Sections"
                        value={
                            analytics.summary.total_sections
                        }
                        subtitle={`${analytics.summary.active_sections} active`}
                        icon={FaLayerGroup}
                    />

                    <SummaryCard
                        title="Total Subjects"
                        value={
                            analytics.summary.total_subjects
                        }
                        subtitle={`${analytics.summary.active_subjects} active`}
                        icon={FaBookOpen}
                    />
                </div>
            </div>

            {/* ==================================================
                QUIZ OVERVIEW
            ================================================== */}

            <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                    Quiz Overview
                </h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">

                    <SummaryCard
                        title="Total Quizzes"
                        value={
                            analytics.summary.total_quizzes
                        }
                        icon={FaClipboardList}
                    />

                    <SummaryCard
                        title="Assignments"
                        value={
                            analytics.summary.total_assignments
                        }
                        icon={FaClipboardList}
                    />

                    <SummaryCard
                        title="Attempts"
                        value={
                            analytics.summary.total_attempts
                        }
                        icon={FaUsers}
                    />

                    <SummaryCard
                        title="Attempt Rate"
                        value={
                            analytics.summary.attempt_rate
                        }
                        subtitle="Overall completion rate"
                        icon={FaPercentage}
                    />

                    <SummaryCard
                        title="Average Score"
                        value={
                            analytics.summary.average_score
                        }
                        subtitle={`Highest: ${analytics.summary.highest_score}`}
                        icon={FaTrophy}
                    />
                </div>
            </div>

            {/* ==================================================
                SECTION ANALYTICS
            ================================================== */}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <FaLayerGroup className="text-blue-600" />

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Section Analytics
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Student and quiz performance by section.
                            </p>
                        </div>
                    </div>
                </div>

                {analytics.sections.length === 0 ? (
                    <div className="p-10 text-center">
                        <FaLayerGroup className="mx-auto text-4xl text-gray-300" />

                        <p className="mt-4 font-medium text-gray-500">
                            No section analytics available.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">

                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Section
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Department
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Students
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Active
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Assignments
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Attempts
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Attempt Rate
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Average
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Highest
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {analytics.sections.map(
                                    (section) => (
                                        <tr
                                            key={
                                                section.section_id
                                            }
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 font-semibold text-gray-800">
                                                {
                                                    section.section_name
                                                }
                                            </td>

                                            <td className="px-6 py-4 text-gray-500">
                                                {
                                                    section.department ||
                                                    "-"
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    section.total_students
                                                }
                                            </td>

                                            <td className="px-6 py-4 text-green-600">
                                                {
                                                    section.active_students
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    section.total_assignments
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-medium text-blue-600">
                                                {
                                                    section.total_attempts
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    section.attempt_rate
                                                }%
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    section.average_score
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-semibold">
                                                {
                                                    section.highest_score
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ==================================================
                TEACHER ANALYTICS
            ================================================== */}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <FaChalkboardTeacher className="text-blue-600" />

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Teacher Analytics
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Quiz creation and student engagement by teacher.
                            </p>
                        </div>
                    </div>
                </div>

                {analytics.teachers.length === 0 ? (
                    <div className="p-10 text-center">
                        <FaChalkboardTeacher className="mx-auto text-4xl text-gray-300" />

                        <p className="mt-4 font-medium text-gray-500">
                            No teacher analytics available.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">

                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Teacher
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Quizzes
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Assignments
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Attempts
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Attempt Rate
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Average
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Highest
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {analytics.teachers.map(
                                    (teacher) => (
                                        <tr
                                            key={
                                                teacher.teacher_id
                                            }
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {
                                                            teacher.teacher_name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-gray-400">
                                                        {
                                                            teacher.email
                                                        }
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        teacher.is_active
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {teacher.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    teacher.total_quizzes
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    teacher.total_assignments
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-medium text-blue-600">
                                                {
                                                    teacher.total_attempts
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    teacher.attempt_rate
                                                }%
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    teacher.average_score
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-semibold">
                                                {
                                                    teacher.highest_score
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ==================================================
                SUBJECT ANALYTICS
            ================================================== */}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <FaBookOpen className="text-blue-600" />

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Subject Analytics
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Quiz and performance statistics by subject.
                            </p>
                        </div>
                    </div>
                </div>

                {analytics.subjects.length === 0 ? (
                    <div className="p-10 text-center">
                        <FaBookOpen className="mx-auto text-4xl text-gray-300" />

                        <p className="mt-4 font-medium text-gray-500">
                            No subject analytics available.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">

                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Subject Code
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Subject
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Department
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Semester
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Quizzes
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Assignments
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Attempts
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Average
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {analytics.subjects.map(
                                    (subject) => (
                                        <tr
                                            key={
                                                subject.subject_id
                                            }
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 font-semibold text-blue-600">
                                                {
                                                    subject.subject_code
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-gray-800">
                                                {
                                                    subject.subject_name
                                                }
                                            </td>

                                            <td className="px-6 py-4 text-gray-500">
                                                {
                                                    subject.department ||
                                                    "-"
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    subject.semester
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    subject.total_quizzes
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    subject.total_assignments
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-medium text-blue-600">
                                                {
                                                    subject.total_attempts
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    subject.average_score
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ==================================================
                QUIZ ACTIVITY
            ================================================== */}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <FaClipboardList className="text-blue-600" />

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Quiz Activity
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Recent quiz activity and performance.
                            </p>
                        </div>
                    </div>
                </div>

                {analytics.quiz_activity.length === 0 ? (
                    <div className="p-10 text-center">
                        <FaClipboardList className="mx-auto text-4xl text-gray-300" />

                        <p className="mt-4 font-medium text-gray-500">
                            No quiz activity available.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">

                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Quiz
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Teacher
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Assignments
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Attempts
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Attempt Rate
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Average
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Highest
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {analytics.quiz_activity.map(
                                    (quiz) => (
                                        <tr
                                            key={
                                                quiz.quiz_id
                                            }
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                        <FaClipboardList />
                                                    </div>

                                                    <span className="font-semibold text-gray-800">
                                                        {
                                                            quiz.title
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {
                                                    quiz.teacher_name ||
                                                    "-"
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    quiz.total_assignments
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-medium text-blue-600">
                                                {
                                                    quiz.total_attempts
                                                }
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    quiz.attempt_rate
                                                }%
                                            </td>

                                            <td className="px-6 py-4">
                                                {
                                                    quiz.average_score
                                                }
                                            </td>

                                            <td className="px-6 py-4 font-semibold">
                                                {
                                                    quiz.highest_score
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ==================================================
                FINAL PERFORMANCE SUMMARY
            ================================================== */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <FaGraduationCap className="text-xl" />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Academic Performance
                            </h3>

                            <p className="text-sm text-gray-500">
                                Overall student quiz performance across the system.
                            </p>
                        </div>

                    </div>

                    <div className="text-left md:text-right">

                        <p className="text-sm text-gray-500">
                            Highest Score
                        </p>

                        <p className="text-2xl font-bold text-blue-600">
                            {
                                analytics.summary.highest_score
                            }
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default DeanAnalytics;