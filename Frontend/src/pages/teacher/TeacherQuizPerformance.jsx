import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Trophy,
    Users,
    Target,
    Download,
    BarChart3,
    Brain,
    BookOpen,
    AlertTriangle,
    HelpCircle,
    Lightbulb,
} from "lucide-react";

import {
    getTeacherQuizPerformance,
    exportTeacherQuizPerformance,
} from "../../api/teacherApi";

const TeacherQuizPerformance = () => {

    const { quizId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const loadPerformance = async () => {

            try {

                setLoading(true);
                setError("");

                const result =
                    await getTeacherQuizPerformance(
                        quizId
                    );

                setData(result);

            } catch (err) {

                console.error(
                    "Failed to load quiz performance:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Failed to load performance."
                );

            } finally {

                setLoading(false);

            }
        };

        loadPerformance();

    }, [quizId]);

    if (loading) {

        return (
            <div className="p-10 text-center">
                Loading performance...
            </div>
        );
    }

    if (error) {

        return (
            <div className="p-10 text-center text-red-600">
                {error}
            </div>
        );
    }

    if (!data) {
        return null;
    }

     const {
    quiz,
    statistics,
    topper,
    top_5,
    students,

    class_performance,
    topic_performance,
    question_performance,
    most_missed_questions,
    students_needing_attention,
    ai_class_analysis,
    teaching_recommendations,
} = data;

    const handleDownloadExcel = async () => {

    try {

        const response =
            await exportTeacherQuizPerformance(
                quizId
            );

        const blob = new Blob(
            [response.data],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
        );

        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `${quiz.title}_performance.xlsx`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
            url
        );

    } catch (error) {

        console.error(
            "Failed to download Excel:",
            error
        );

        alert(
            "Failed to download Excel report."
        );
    }
};

    return (
        <div className="space-y-8">

            {/* HEADER */}

            <div className="flex items-center justify-between">

                <div>

                    <button
                        onClick={() =>
                            navigate("/teacher/quizzes")
                        }
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-4"
                    >
                        <ArrowLeft size={18} />
                        Back to My Quizzes
                    </button>

                    <h1 className="text-3xl font-bold text-gray-800">
                        {quiz.title}
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Quiz Performance
                    </p>

                </div>

                <button
    onClick={handleDownloadExcel}
    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
>
    <Download size={18} />
    Download Excel
</button>

            </div>

            {/* STATISTICS */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                <div className="bg-white rounded-2xl p-6 shadow-sm border">

                    <Users className="text-indigo-600 mb-3" />

                    <p className="text-gray-500">
                        Total Attempts
                    </p>

                    <h2 className="text-3xl font-bold">
                        {statistics.attempts}
                    </h2>

                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border">

                    <Target className="text-violet-600 mb-3" />

                    <p className="text-gray-500">
                        Average Score
                    </p>

                    <h2 className="text-3xl font-bold">
                        {statistics.average_percentage}%
                    </h2>

                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border">

                    <Trophy className="text-yellow-500 mb-3" />

                    <p className="text-gray-500">
                        Highest Percentage
                    </p>

                    <h2 className="text-3xl font-bold">
                        {statistics.highest_percentage}%
                    </h2>

                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border">

                    <Target className="text-red-500 mb-3" />

                    <p className="text-gray-500">
                        Lowest Percentage
                    </p>

                    <h2 className="text-3xl font-bold">
                        {statistics.lowest_percentage}%
                    </h2>

                </div>

            </div>

            {/* TOPPER */}

            {topper && (

                <div className="bg-gradient-to-r from-yellow-50 to-white border border-yellow-200 rounded-2xl p-8">

                    <div className="flex items-center gap-3 mb-5">

                        <Trophy
                            className="text-yellow-500"
                            size={30}
                        />

                        <h2 className="text-2xl font-bold">
                            Quiz Topper
                        </h2>

                    </div>

                    <div className="grid md:grid-cols-4 gap-6">

                        <div>
                            <p className="text-sm text-gray-500">
                                Student
                            </p>

                            <p className="font-bold text-lg">
                                {topper.student_name}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                Roll No
                            </p>

                            <p className="font-semibold">
                                {topper.roll_no}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                Score
                            </p>

                            <p className="font-bold">
                                {topper.score} / {topper.total_marks}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                Percentage
                            </p>

                            <p className="font-bold text-yellow-600">
                                {topper.percentage}%
                            </p>
                        </div>

                    </div>

                </div>

            )}

            {/* TOP 5 */}

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

                <div className="p-6 border-b">

                    <h2 className="text-xl font-bold">
                        Top 5 Students
                    </h2>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-4 text-left">
                                    Rank
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Student
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Roll No
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Section
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Score
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Percentage
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {top_5.map(
                                (student) => (

                                    <tr
                                        key={
                                            student.assignment_id
                                        }
                                        className="border-t"
                                    >

                                        <td className="px-5 py-4 font-bold">
                                            {student.rank}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.student_name}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.roll_no}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.section}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.score} /{" "}
                                            {student.total_marks}
                                        </td>

                                        <td className="px-5 py-4 font-semibold">
                                            {student.percentage}%
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* ALL STUDENTS */}

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

                <div className="p-6 border-b">

                    <h2 className="text-xl font-bold">
                        All Student Performance
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Complete performance details for this quiz.
                    </p>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-4 text-left">
                                    Rank
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Student
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Roll No
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Email
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Section
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Score
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Percentage
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {students.map(
                                (student) => (

                                    <tr
                                        key={
                                            student.assignment_id
                                        }
                                        className="border-t hover:bg-gray-50"
                                    >

                                        <td className="px-5 py-4">
                                            {student.rank}
                                        </td>

                                        <td className="px-5 py-4 font-medium">
                                            {student.student_name}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.roll_no}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.email}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.section}
                                        </td>

                                        <td className="px-5 py-4">
                                            {student.score} /{" "}
                                            {student.total_marks}
                                        </td>

                                        <td className="px-5 py-4 font-semibold">
                                            {student.percentage}%
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>
                        {/* =================================================
                CLASS PERFORMANCE
            ================================================= */}

            <section className="bg-white rounded-2xl border shadow-sm p-6">

                <div className="flex items-center gap-3 mb-6">

                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <BarChart3
                            size={22}
                            className="text-indigo-600"
                        />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Class Performance
                        </h2>

                        <p className="text-sm text-gray-500">
                            Overall performance distribution for this quiz.
                        </p>
                    </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                    <div className="rounded-xl bg-indigo-50 p-5">
                        <p className="text-sm text-gray-500">
                            Average Score
                        </p>

                        <p className="text-3xl font-bold text-indigo-700 mt-2">
                            {class_performance?.average_percentage ?? 0}%
                        </p>
                    </div>


                    <div className="rounded-xl bg-green-50 p-5">
                        <p className="text-sm text-gray-500">
                            Highest Score
                        </p>

                        <p className="text-3xl font-bold text-green-700 mt-2">
                            {class_performance?.highest_percentage ?? 0}%
                        </p>
                    </div>


                    <div className="rounded-xl bg-red-50 p-5">
                        <p className="text-sm text-gray-500">
                            Lowest Score
                        </p>

                        <p className="text-3xl font-bold text-red-700 mt-2">
                            {class_performance?.lowest_percentage ?? 0}%
                        </p>
                    </div>

                </div>


                <div className="space-y-4">

                    {[
                        ["90_100", "90–100%"],
                        ["80_89", "80–89%"],
                        ["70_79", "70–79%"],
                        ["60_69", "60–69%"],
                        ["below_60", "Below 60%"],
                    ].map(([key, label]) => {

                        const count =
                            class_performance?.distribution?.[key] ?? 0;

                        const total =
                            statistics?.attempts ?? 0;

                        const percentage =
                            total > 0
                                ? Math.round(
                                    (count / total) * 100
                                )
                                : 0;

                        return (
                            <div key={key}>

                                <div className="flex justify-between text-sm mb-1">

                                    <span className="font-medium text-gray-700">
                                        {label}
                                    </span>

                                    <span className="text-gray-500">
                                        {count} students
                                    </span>

                                </div>

                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{
                                            width: `${percentage}%`,
                                        }}
                                    />

                                </div>

                            </div>
                        );
                    })}

                </div>

            </section>


            {/* =================================================
                AI CLASS PERFORMANCE ANALYSIS
            ================================================= */}

            <section className="bg-white rounded-2xl border shadow-sm p-6">

                <div className="flex items-center gap-3 mb-6">

                    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Brain
                            size={22}
                            className="text-purple-600"
                        />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            AI Class Performance Analysis
                        </h2>

                        <p className="text-sm text-gray-500">
                            AI-generated insights based on student performance.
                        </p>
                    </div>

                </div>


                <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-6">

                    <p className="text-gray-700 leading-7">
                        {ai_class_analysis?.summary ||
                            "No class analysis is available yet."}
                    </p>

                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Strengths */}

                    <div className="border border-green-100 bg-green-50 rounded-xl p-5">

                        <h3 className="font-semibold text-gray-900 mb-4">
                            💪 Common Strengths
                        </h3>

                        {ai_class_analysis?.common_strengths?.length > 0 ? (

                            <ul className="space-y-3">

                                {ai_class_analysis.common_strengths.map(
                                    (item, index) => (

                                        <li
                                            key={index}
                                            className="text-sm text-gray-700"
                                        >
                                            • {item.strength}
                                        </li>

                                    )
                                )}

                            </ul>

                        ) : (

                            <p className="text-sm text-gray-500">
                                No common strengths identified yet.
                            </p>

                        )}

                    </div>


                    {/* Weak Topics */}

                    <div className="border border-red-100 bg-red-50 rounded-xl p-5">

                        <h3 className="font-semibold text-gray-900 mb-4">
                            ⚠️ Common Weak Topics
                        </h3>

                        {ai_class_analysis?.common_weak_topics?.length > 0 ? (

                            <ul className="space-y-3">

                                {ai_class_analysis.common_weak_topics.map(
                                    (item, index) => (

                                        <li
                                            key={index}
                                            className="text-sm text-gray-700"
                                        >
                                            • {item.topic}
                                        </li>

                                    )
                                )}

                            </ul>

                        ) : (

                            <p className="text-sm text-gray-500">
                                No common weak topics identified yet.
                            </p>

                        )}

                    </div>


                    {/* Mistakes */}

                    <div className="border border-orange-100 bg-orange-50 rounded-xl p-5">

                        <h3 className="font-semibold text-gray-900 mb-4">
                            🧩 Common Mistake Patterns
                        </h3>

                        {ai_class_analysis?.common_mistakes?.length > 0 ? (

                            <ul className="space-y-3">

                                {ai_class_analysis.common_mistakes.map(
                                    (item, index) => (

                                        <li
                                            key={index}
                                            className="text-sm text-gray-700"
                                        >
                                            • {item.pattern}
                                        </li>

                                    )
                                )}

                            </ul>

                        ) : (

                            <p className="text-sm text-gray-500">
                                No common mistake patterns identified yet.
                            </p>

                        )}

                    </div>

                </div>

            </section>


            {/* =================================================
                TOPIC PERFORMANCE
            ================================================= */}

            <section className="bg-white rounded-2xl border shadow-sm p-6">

                <div className="flex items-center gap-3 mb-6">

                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                        <BookOpen
                            size={22}
                            className="text-blue-600"
                        />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Topic-wise Performance
                        </h2>

                        <p className="text-sm text-gray-500">
                            Accuracy across quiz topics.
                        </p>
                    </div>

                </div>


                {topic_performance?.length > 0 ? (

                    <div className="space-y-5">

                        {topic_performance.map(
                            (topic, index) => (

                                <div key={index}>

                                    <div className="flex justify-between mb-2">

                                        <span className="font-medium text-gray-700">
                                            {topic.topic}
                                        </span>

                                        <span className="font-semibold text-gray-900">
                                            {topic.accuracy}%
                                        </span>

                                    </div>

                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                                        <div
                                            className={`h-full rounded-full ${
                                                topic.accuracy < 50
                                                    ? "bg-red-500"
                                                    : topic.accuracy < 70
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                            }`}
                                            style={{
                                                width: `${Math.min(
                                                    topic.accuracy,
                                                    100
                                                )}%`,
                                            }}
                                        />

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <p className="text-gray-500">
                        Topic data is not available for this quiz.
                    </p>

                )}

            </section>


            {/* =================================================
                QUESTION ANALYSIS
            ================================================= */}

            <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">

                <div className="p-6 border-b">

                    <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                            <HelpCircle
                                size={22}
                                className="text-orange-600"
                            />
                        </div>

                        <div>

                            <h2 className="text-xl font-bold text-gray-900">
                                Question-wise Analysis
                            </h2>

                            <p className="text-sm text-gray-500">
                                Identify questions that caused the most difficulty.
                            </p>

                        </div>

                    </div>

                </div>


                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-4 text-left">
                                    Question
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Topic
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Correct
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Incorrect
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Accuracy
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {question_performance?.map(
                                (question) => (

                                    <tr
                                        key={question.question_id}
                                        className="border-t"
                                    >

                                        <td className="px-5 py-4">

                                            <div className="max-w-xl text-sm text-gray-700">
                                                Q{question.question_number}.{" "}
                                                {question.question}
                                            </div>

                                        </td>

                                        <td className="px-5 py-4 text-sm">
                                            {question.topic}
                                        </td>

                                        <td className="px-5 py-4 text-green-600 font-semibold">
                                            {question.correct_count}
                                        </td>

                                        <td className="px-5 py-4 text-red-600 font-semibold">
                                            {question.incorrect_count}
                                        </td>

                                        <td className="px-5 py-4 font-bold">
                                            {question.accuracy}%
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* =================================================
                MOST MISSED QUESTIONS
            ================================================= */}

            <section className="bg-white rounded-2xl border shadow-sm p-6">

                <div className="flex items-center gap-3 mb-5">

                    <AlertTriangle
                        className="text-red-600"
                        size={24}
                    />

                    <div>

                        <h2 className="text-xl font-bold text-gray-900">
                            Most-Missed Questions
                        </h2>

                        <p className="text-sm text-gray-500">
                            Questions with the lowest class accuracy.
                        </p>

                    </div>

                </div>


                <div className="space-y-3">

                    {most_missed_questions?.map(
                        (question) => (

                            <div
                                key={question.question_id}
                                className="border border-red-100 bg-red-50 rounded-xl p-4"
                            >

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <p className="font-semibold text-gray-900">
                                            Question {question.question_number}
                                        </p>

                                        <p className="text-sm text-gray-600 mt-1">
                                            {question.question}
                                        </p>

                                    </div>

                                    <span className="shrink-0 font-bold text-red-600">
                                        {question.accuracy}%
                                    </span>

                                </div>

                            </div>

                        )
                    )}

                </div>

            </section>


            {/* =================================================
                STUDENTS NEEDING ATTENTION
            ================================================= */}

            <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">

                <div className="p-6 border-b">

                    <div className="flex items-center gap-3">

                        <Users
                            className="text-red-600"
                            size={24}
                        />

                        <div>

                            <h2 className="text-xl font-bold text-gray-900">
                                Students Needing Attention
                            </h2>

                            <p className="text-sm text-gray-500">
                                Students who scored below 50% in this quiz.
                            </p>

                        </div>

                    </div>

                </div>


                {students_needing_attention?.length > 0 ? (

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-5 py-4 text-left">
                                        Student
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Roll No
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Section
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Score
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {students_needing_attention.map(
                                    (student) => (

                                        <tr
                                            key={student.student_id}
                                            className="border-t"
                                        >

                                            <td className="px-5 py-4 font-medium">
                                                {student.student_name}
                                            </td>

                                            <td className="px-5 py-4">
                                                {student.roll_no}
                                            </td>

                                            <td className="px-5 py-4">
                                                {student.section}
                                            </td>

                                            <td className="px-5 py-4 font-bold text-red-600">
                                                {student.percentage}%
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <div className="p-8 text-center">

                        <p className="text-green-600 font-medium">
                            No students currently require attention.
                        </p>

                    </div>

                )}

            </section>


            {/* =================================================
                TEACHING RECOMMENDATIONS
            ================================================= */}

            <section className="bg-white rounded-2xl border shadow-sm p-6">

                <div className="flex items-center gap-3 mb-6">

                    <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center">
                        <Lightbulb
                            size={22}
                            className="text-yellow-600"
                        />
                    </div>

                    <div>

                        <h2 className="text-xl font-bold text-gray-900">
                            AI Teaching Recommendations
                        </h2>

                        <p className="text-sm text-gray-500">
                            Suggested actions based on class performance.
                        </p>

                    </div>

                </div>


                <div className="space-y-3">

                    {teaching_recommendations?.map(
                        (recommendation, index) => (

                            <div
                                key={index}
                                className="flex gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-4"
                            >

                                <div className="w-7 h-7 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center font-semibold shrink-0">
                                    {index + 1}
                                </div>

                                <p className="text-gray-700 leading-6">
                                    {recommendation}
                                </p>

                            </div>

                        )
                    )}

                </div>

            </section>

        </div>
    );
};

export default TeacherQuizPerformance;