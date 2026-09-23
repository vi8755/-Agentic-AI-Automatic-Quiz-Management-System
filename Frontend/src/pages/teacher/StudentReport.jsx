import { useEffect, useState } from "react";
import {  useNavigate,useParams } from "react-router-dom";
import { getStudentReport } from "../../api/teacherApi";
import ReactMarkdown from "react-markdown";
import QuestionReportCard from "../../components/teacher/QuestionReportCard";
import { FaArrowLeft } from "react-icons/fa";
import SectionCard from "../../components/teacher/SectionCard";
function StudentReport() {

    const { responseId } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {

        try {

            const data = await getStudentReport(responseId);

            setReport(data);

        } catch (err) {

            console.error(err);

            setError("Failed to load report.");

        } finally {

            setLoading(false);

        }

    };
    const minutes = Math.floor(report?.time_taken_seconds / 60 || 0);

const seconds = report?.time_taken_seconds % 60 || 0;

const submittedDate = report?.submitted_at
    ? new Date(report.submitted_at).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
      })
    : "-";
    const progress = Math.min(report?.percentage || 0, 100);
    const extractSection = (title) => {

    if (!report?.feedback) return "";

    const regex = new RegExp(
        `## ${title}\\n([\\s\\S]*?)(?=\\n## |$)`
    );

    const match = report.feedback.match(regex);

    return match ? match[1].trim() : "";

};

    if (loading) {
        return (
            <div className="p-6 text-center">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-600">
                {error}
            </div>
        );
    }

    return (

         <div className="max-w-7xl mx-auto p-6">

    {/* Back Button */}

    <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
    >
        <FaArrowLeft />
        Back to Reports
    </button>

    {/* Page Title */}

    <div className="mb-8">

        <h1 className="text-4xl font-bold text-gray-800">
            Student Report
        </h1>

        <p className="text-gray-500 mt-2">
            Detailed performance analysis
        </p>

    </div>
            
 <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">

    {/* Left */}

    <div className="flex items-center gap-5">

        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">

            {report.student_name
                ?.split(" ")
                .map(name => name[0])
                .join("")
                .slice(0, 2)}

        </div>

        <div>

            <h2 className="text-3xl font-bold text-gray-800">
                {report.student_name}
            </h2>

            <p className="text-gray-500 mt-1">
                {report.student_email}
            </p>

            <p className="text-blue-600 font-semibold mt-3">
                {report.quiz_title}
            </p>

            <p className="text-sm text-gray-500 mt-2">
                Submitted:
                <span className="ml-2 font-medium">
                    {submittedDate}
                </span>
            </p>

        </div>

    </div>

    {/* Right */}

    <div className="mt-6 lg:mt-0">

        <span
            className={`px-5 py-3 rounded-full font-bold text-lg ${
                report.percentage >= 40
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
            }`}
        >
            {report.percentage >= 40
                ? "PASSED"
                : "FAILED"}
        </span>

    </div>

</div>
{/* Statistics */}

<div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-8">

    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

        <p className="text-sm text-gray-500">
            Score
        </p>

        <h3 className="text-3xl font-bold text-blue-700 mt-2">
            {report.score}/{report.total_questions}
        </h3>

    </div>

    <div className="bg-green-50 border border-green-200 rounded-xl p-5">

        <p className="text-sm text-gray-500">
            Percentage
        </p>

        <h3 className="text-3xl font-bold text-green-700 mt-2">
            {report.percentage}%
        </h3>

    </div>

    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">

        <p className="text-sm text-gray-500">
            Time Taken
        </p>

        <h3 className="text-3xl font-bold text-orange-700 mt-2">
            {minutes}m {seconds}s
        </h3>

    </div>

    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">

        <p className="text-sm text-gray-500">
            Submitted
        </p>

        <h3 className="text-lg font-bold text-purple-700 mt-2">
            {submittedDate}
        </h3>

    </div>

</div>
<div className="bg-white rounded-xl shadow border mt-8 p-6">

    <h2 className="text-2xl font-bold mb-6">
        Performance Overview
    </h2>

    <div className="w-full bg-gray-200 rounded-full h-5">

        <div
            className={`h-5 rounded-full transition-all duration-700 ${
                report.percentage >= 40
                    ? "bg-green-500"
                    : "bg-red-500"
            }`}
            style={{
                width: `${progress}%`,
            }}
        />

    </div>

    <div className="flex justify-between mt-2 text-sm text-gray-600">

        <span>0%</span>

        <span className="font-semibold">
            {report.percentage}%
        </span>

        <span>100%</span>

    </div>

</div>
<div className="grid md:grid-cols-3 gap-5 mt-6">

    <div className="bg-green-50 rounded-xl p-5 border">

        <p className="text-gray-500">
            Score
        </p>

        <h3 className="text-3xl font-bold text-green-700 mt-2">
            {report.score}/{report.total_questions}
        </h3>

    </div>

    <div className="bg-blue-50 rounded-xl p-5 border">

        <p className="text-gray-500">
            Time Taken
        </p>

        <h3 className="text-3xl font-bold text-blue-700 mt-2">
            {minutes}m {seconds}s
        </h3>

    </div>

    <div className="bg-purple-50 rounded-xl p-5 border">

        <p className="text-gray-500">
            Status
        </p>

        <h3
            className={`text-3xl font-bold mt-2 ${
                report.percentage >= 40
                    ? "text-green-700"
                    : "text-red-700"
            }`}
        >
            {report.percentage >= 40
                ? "PASSED"
                : "FAILED"}
        </h3>

    </div>

</div>
            <div className="mt-8 bg-white rounded-xl shadow border p-6">

    <h2 className="text-3xl font-bold mb-8">
        🤖 AI Performance Analysis
    </h2>

    <div className="space-y-6">

        <SectionCard
            title="📋 Performance Summary"
            content={extractSection("Performance Summary")}
        />

        <SectionCard
            title="💪 Strengths"
            content={extractSection("Strengths")}
        />

        <SectionCard
            title="⚠ Weak Areas"
            content={extractSection("Weak Areas")}
        />

        <SectionCard
            title="📚 Improvement Plan"
            content={extractSection("Improvement Plan")}
        />

        <SectionCard
            title="🎯 Recommended Learning"
            content={extractSection("Recommended Learning")}
        />

    </div>

</div>
<div className="mt-8">

    <h2 className="text-2xl font-bold mb-6">
        Question Review
    </h2>

    {report.questions.map((question) => (

        <QuestionReportCard
            key={question.question_no}
            question={question}
        />

    ))}

</div>

        </div>

    );

}

export default StudentReport;