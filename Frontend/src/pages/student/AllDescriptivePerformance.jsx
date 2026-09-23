import { useEffect, useMemo, useState } from "react";
import { BarChart3, Trophy, Medal, Users, Loader2, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { getStudentDescriptivePerformance } from "../../api/studentApi";

const AllDescriptivePerformance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStudentDescriptivePerformance()
            .then(setData)
            .catch((error) => toast.error(
                error?.response?.data?.detail || "Unable to load descriptive performance."
            ))
            .finally(() => setLoading(false));
    }, []);

    const students = useMemo(() => Array.isArray(data?.students) ? data.students : [], [data]);
    const ranked = useMemo(
        () => students.filter(s => Number(s.attempts || 0) > 0),
        [students]
    );
    const topFive = ranked.slice(0, 5);
    const topper = data?.topper || topFive[0];

    if (loading) return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl p-12 text-center">
                <Loader2 size={42} className="mx-auto text-purple-600 animate-spin" />
                <p className="mt-4 text-gray-500">Loading all descriptive performance...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                            <BarChart3 size={28} className="text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                All Descriptive Performance
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Your overall performance across all evaluated descriptive assignments.
                            </p>
                            <p className="text-sm text-purple-600 mt-1 font-medium">
                                Your position is calculated among students in your section.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        ["Your Average", `${Number(data?.my_average_percentage || 0).toFixed(2)}%`, "Across evaluated assignments"],
                        ["Your Rank", data?.my_rank ? `#${data.my_rank}` : "—", "Among evaluated students"],
                        ["Section Average", `${Number(data?.section_average_percentage || 0).toFixed(2)}%`, "Overall descriptive average"],
                        ["Completed Assignments", data?.my_attempts ?? 0, "Your evaluated submissions"],
                    ].map(([title, value, sub]) => (
                        <div key={title} className="bg-white rounded-2xl shadow-sm p-6">
                            <p className="text-sm text-gray-500">{title}</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-2">{value}</h2>
                            <p className="text-gray-500 text-sm mt-1">{sub}</p>
                        </div>
                    ))}
                </div>

                <section className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Trophy size={28} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Top Performer</p>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {topper?.student_name || "No evaluated data yet"}
                            </h2>
                            {topper && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {topper.roll_no || "—"} • {Number(topper.average_percentage || 0).toFixed(2)}%
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border">
                    <div className="px-6 py-5 border-b">
                        <h2 className="text-xl font-bold text-gray-900">Top 5 Students</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Ranked by average percentage across evaluated descriptive assignments.
                        </p>
                    </div>
                    {topFive.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No evaluated data available.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Rank</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Roll No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Assignments</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Average</th>
                                </tr></thead>
                                <tbody className="divide-y">
                                    {topFive.map((s, i) => (
                                        <tr key={s.student_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold flex items-center gap-2">
                                                {i === 0 ? <Trophy size={18} className="text-yellow-500" /> : <Medal size={18} className="text-purple-500" />}
                                                #{i + 1}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">{s.student_name}</td>
                                            <td className="px-6 py-4 text-gray-600">{s.roll_no || "—"}</td>
                                            <td className="px-6 py-4">{s.attempts}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                                    {Number(s.average_percentage || 0).toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="bg-white rounded-2xl shadow-sm border">
                    <div className="px-6 py-5 border-b flex items-center gap-3">
                        <Users size={22} className="text-purple-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">All Student Performance</h2>
                            <p className="text-sm text-gray-500 mt-1">Overall descriptive performance in your section.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-purple-600 text-white"><tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold">Student</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold">Roll No</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold">Assignments</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold">Average %</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold">Status</th>
                            </tr></thead>
                            <tbody className="divide-y">
                                {students.map(s => (
                                    <tr key={s.student_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold">{s.rank ? `#${s.rank}` : "—"}</td>
                                        <td className="px-6 py-4 font-semibold">{s.student_name}</td>
                                        <td className="px-6 py-4 text-gray-600">{s.roll_no || "—"}</td>
                                        <td className="px-6 py-4">{s.attempts}</td>
                                        <td className="px-6 py-4 font-semibold">
                                            {s.attempts ? `${Number(s.average_percentage || 0).toFixed(2)}%` : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.attempts ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                {s.attempts ? "Evaluated" : "Not Evaluated"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {Array.isArray(data?.assignments) && data.assignments.length > 0 && (
                    <section className="bg-white rounded-2xl shadow-sm border">
                        <div className="px-6 py-5 border-b flex items-center gap-3">
                            <FileText size={22} className="text-purple-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Assignment-wise Performance</h2>
                                <p className="text-sm text-gray-500 mt-1">Your score in each evaluated descriptive assignment.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Assignment</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Score</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Percentage</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Submitted</th>
                                </tr></thead>
                                <tbody className="divide-y">
                                    {data.assignments.map(a => (
                                        <tr key={a.assignment_id}>
                                            <td className="px-6 py-4 font-semibold">{a.title}</td>
                                            <td className="px-6 py-4">{a.score} / {a.total_marks}</td>
                                            <td className="px-6 py-4 font-semibold text-purple-600">{Number(a.percentage || 0).toFixed(2)}%</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("en-IN") : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default AllDescriptivePerformance;
