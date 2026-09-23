import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
    Trophy,
    Medal,
    Users,
    Award,
    Loader2,
    Filter,
    ClipboardList,
} from "lucide-react";

import {
    getDescriptiveAnalytics,
    getTeacherSections,
} from "../../api/teacherApi";

const DescriptiveAnalysis = () => {
    const [analytics, setAnalytics] = useState(null);
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState("");
    const [loading, setLoading] = useState(true);
    const [sectionsLoading, setSectionsLoading] = useState(true);

    useEffect(() => {
        loadSections();
    }, []);

    useEffect(() => {
        loadAnalytics();
    }, [selectedSection]);

    const loadSections = async () => {
        try {
            setSectionsLoading(true);

            const data = await getTeacherSections();

            const sectionList = Array.isArray(data)
                ? data
                : Array.isArray(data?.sections)
                ? data.sections
                : [];

            const uniqueSections = Array.from(
                new Map(
                    sectionList
                        .filter(
                            (section) =>
                                section?.section_id !== undefined &&
                                section?.section_id !== null
                        )
                        .map((section) => [
                            String(section.section_id),
                            section,
                        ])
                ).values()
            );

            setSections(uniqueSections);
        } catch (error) {
            console.error(
                "Failed to load teacher sections:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load sections."
            );

            setSections([]);
        } finally {
            setSectionsLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const sectionId = selectedSection
                ? Number(selectedSection)
                : null;

            const data = await getDescriptiveAnalytics(
                sectionId
            );

            setAnalytics(data);
        } catch (error) {
            console.error(
                "Failed to load descriptive analytics:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load descriptive analytics."
            );

            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    const students = useMemo(() => {
        const list = Array.isArray(
            analytics?.students
        )
            ? analytics.students
            : [];

        return [...list].sort(
            (a, b) =>
                Number(b.average_percentage ?? 0) -
                Number(a.average_percentage ?? 0)
        );
    }, [analytics]);

    const evaluatedStudents = useMemo(
        () =>
            students.filter(
                (student) =>
                    Number(
                        student.evaluated_submissions ?? 0
                    ) > 0
            ),
        [students]
    );

    const topFive = evaluatedStudents.slice(0, 5);
    const topper = topFive[0] || null;

    const selectedSectionLabel = selectedSection
        ? sections.find(
              (section) =>
                  String(section.section_id) ===
                  String(selectedSection)
          )
        : null;

    const sectionLabel = selectedSectionLabel
        ? `${
              selectedSectionLabel.section_name ||
              `Section ${selectedSectionLabel.section_id}`
          }${
              selectedSectionLabel.department
                  ? ` — ${selectedSectionLabel.department}`
                  : ""
          }`
        : "All Sections";

    if (loading && !analytics) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <Loader2
                            size={40}
                            className="mx-auto text-purple-600 animate-spin"
                        />

                        <p className="mt-4 text-gray-500">
                            Loading descriptive analysis...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-7">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Descriptive Analysis
                            </h1>

                            <p className="text-gray-500 mt-1">
                                Student performance for descriptive assignments.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Filter size={17} />
                            <span className="font-medium">
                                {sectionLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION FILTER */}
                <div className="bg-white rounded-2xl shadow-sm p-5 mb-7">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter size={18} />

                        <h2 className="font-semibold text-gray-900">
                            Filter Performance
                        </h2>
                    </div>

                    <select
                        value={selectedSection}
                        onChange={(event) =>
                            setSelectedSection(
                                event.target.value
                            )
                        }
                        disabled={sectionsLoading}
                        className="w-full md:max-w-xl border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    >
                        <option value="">
                            Overall — All Sections
                        </option>

                        {sections.map((section) => (
                            <option
                                key={section.section_id}
                                value={section.section_id}
                            >
                                {section.section_name ||
                                    `Section ${section.section_id}`}
                                {section.department
                                    ? ` — ${section.department}`
                                    : ""}
                                {section.year
                                    ? ` — Year ${section.year}`
                                    : ""}
                                {section.semester
                                    ? ` — Sem ${section.semester}`
                                    : ""}
                            </option>
                        ))}
                    </select>
                </div>

                {/* SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-7">

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-gray-500">
                                    Descriptive Assignments
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {analytics?.total_assignments ?? 0}
                                </h2>
                            </div>

                            <div className="p-3 bg-purple-100 rounded-xl">
                                <ClipboardList className="text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-gray-500">
                                    Evaluated Students
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {evaluatedStudents.length}
                                </h2>
                            </div>

                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-gray-500">
                                    Average Performance
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {Number(
                                        analytics?.average_percentage ?? 0
                                    ).toFixed(2)}
                                    %
                                </h2>
                            </div>

                            <div className="p-3 bg-green-100 rounded-xl">
                                <Award className="text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-gray-500">
                                    Evaluated Submissions
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {analytics?.evaluated_submissions ?? 0}
                                </h2>
                            </div>

                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <Medal className="text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TOP PERFORMER */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-7">
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
                                    : "No evaluated student yet"}
                            </h2>

                            {topper && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {topper.roll_no || "—"}
                                    {" • "}
                                    {Number(
                                        topper.average_percentage ?? 0
                                    ).toFixed(2)}
                                    %
                                    {topper.section_name
                                        ? ` • ${topper.section_name}`
                                        : ""}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* TOP 5 */}
                <div className="bg-white rounded-2xl shadow-sm border mb-7">
                    <div className="px-6 py-5 border-b">
                        <h2 className="text-xl font-bold text-gray-900">
                            Top 5 Students
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Ranked by average descriptive-assignment percentage.
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
                                            Section
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                            Evaluated
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
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-bold">
                                                        {index === 0 ? (
                                                            <Trophy
                                                                size={20}
                                                                className="text-yellow-500"
                                                            />
                                                        ) : (
                                                            <Medal
                                                                size={20}
                                                                className="text-purple-500"
                                                            />
                                                        )}

                                                        #{index + 1}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">
                                                        {
                                                            student.student_name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        {
                                                            student.email
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4 text-gray-600">
                                                    {student.roll_no ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-4 text-gray-600">
                                                    {student.section_name ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-4 text-gray-600">
                                                    {
                                                        student.evaluated_submissions
                                                    }
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                                        {Number(
                                                            student.average_percentage ??
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
                            {sectionLabel} — students with descriptive-assignment performance.
                        </p>
                    </div>

                    {students.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No descriptive student data found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-purple-600 text-white">
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
                                            Section
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Evaluated
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Average
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {students.map(
                                        (student, index) => {
                                            const evaluated =
                                                Number(
                                                    student.evaluated_submissions ??
                                                        0
                                                ) > 0;

                                            return (
                                                <tr
                                                    key={
                                                        student.student_id
                                                    }
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 font-semibold">
                                                        {evaluated
                                                            ? `#${index + 1}`
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
                                                                student.email
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
                                                        {
                                                            student.section_name ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {
                                                            student.evaluated_submissions ??
                                                            0
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4 font-semibold">
                                                        {evaluated
                                                            ? `${Number(
                                                                  student.average_percentage ??
                                                                      0
                                                              ).toFixed(2)}%`
                                                            : "—"}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                evaluated
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                        >
                                                            {evaluated
                                                                ? "Evaluated"
                                                                : "Pending"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }
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

export default DescriptiveAnalysis;
