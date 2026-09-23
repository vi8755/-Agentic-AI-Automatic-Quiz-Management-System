import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    getTeacherAnalytics,
    getQuizPerformance,
    getSectionPerformance,
    getRecentQuizzes,
} from "../../api/teacherApi";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";
import {
    FaChartLine,
    FaTrophy,
    FaArrowDown,
    FaCheckCircle,
} from "react-icons/fa";
 
const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quizPerformance, setQuizPerformance] = useState([]);
    const [sectionPerformance, setSectionPerformance] = useState([]);
    const [recentQuizzes, setRecentQuizzes] = useState([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
    try {
         const [analyticsData, quizData, sectionData, recentData,] = await Promise.all([
    getTeacherAnalytics(),
    getQuizPerformance(),
    getSectionPerformance(),
    getRecentQuizzes(),
]);

setAnalytics(analyticsData);
setQuizPerformance(quizData);
setSectionPerformance(sectionData);
setRecentQuizzes(recentData);

    } catch (error) {
        toast.error("Failed to load analytics.");
    } finally {
        setLoading(false);
    }
};

 if (loading) {
    return <div>Loading...</div>;
}

if (!analytics) {
    return (
        <div className="text-center py-10">
            Failed to load analytics.
        </div>
    );
}
    return (
        <div className="space-y-8">
             <div>
    <h1 className="text-4xl font-bold text-slate-800">
        Teacher Analytics Dashboard
    </h1>

    <p className="text-slate-500 mt-2">
        Monitor quiz performance, student completion and section-wise insights.
    </p>
</div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                 <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
    <div className="flex justify-between items-center">

        <div>
            <p className="text-blue-100">
                Average Score
            </p>

            <h2 className="text-4xl font-bold mt-2">
                {analytics.average_score.toFixed(2)}
            </h2>
        </div>

        <FaChartLine size={34} />
    </div>
</div>

                <div className="bg-linear-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
    <div className="flex justify-between items-center">

        <div>
            <p className="text-green-100">
                Highest Score
            </p>

            <h2 className="text-4xl font-bold mt-2">
                {analytics.highest_score}
            </h2>
        </div>

        <FaTrophy size={34} />
    </div>
</div>
  
  <div className="bg-linear-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
    <div className="flex justify-between items-center">

        <div>
            <p className="text-orange-100">
                Lowest Score
            </p>

            <h2 className="text-4xl font-bold mt-2">
                {analytics.lowest_score}
            </h2>
        </div>

        <FaArrowDown size={34} />
    </div>
</div>

                <div className="bg-linear-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
    <div className="flex justify-between items-center">

        <div>
            <p className="text-purple-100">
                Completion Rate
            </p>

            <h2 className="text-4xl font-bold mt-2">
                {analytics.completion_percentage.toFixed(2)}%
            </h2>
        </div>

        <FaCheckCircle size={34} />
    </div>
</div>

            </div>
                <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-xl font-semibold mb-6">
        Quiz Performance
    </h2>

    <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quizPerformance}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
    dataKey="title"
    angle={-20}
    textAnchor="end"
    height={70}
/>

                <YAxis />

                <Tooltip
    contentStyle={{
        borderRadius: "10px",
        border: "1px solid #ddd",
    }}
/>
<Legend />
                <Bar
    dataKey="average_score"
    name="Average Score"
    fill="#2563eb"
    radius={[4, 4, 0, 0]}
/>

<Bar
    dataKey="attempts"
    name="Attempts"
    fill="#10b981"
    radius={[4, 4, 0, 0]}
/>
            </BarChart>
        </ResponsiveContainer>
    </div>
</div>

<div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
    <h2 className="text-xl font-semibold mb-6">
        Section Performance
    </h2>

    <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectionPerformance}>
                <CartesianGrid strokeDasharray="3 3" />


                <XAxis dataKey="section_name" />

                    <YAxis />
 

                <Tooltip
    contentStyle={{
        borderRadius: "12px",
        border: "none",
        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    }}
/>

                <Legend />

                <Bar
                    dataKey="average_score"
                    name="Average Score"
                    fill="#2563eb"
                    radius={[0, 6, 6, 0]}
                />

                <Bar
                    dataKey="students"
                    name="Students"
                    fill="#10b981"
                    radius={[0, 6, 6, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    </div>
</div>
<div className="bg-white rounded-3xl shadow-lg p-8">
    <h2 className="text-2xl font-bold mb-6">
        Recent Quiz Activity
    </h2>

    <div className="space-y-4">
        {recentQuizzes.map((quiz) => (
            <div
                key={quiz.id}
                className="flex justify-between items-center border rounded-xl p-4 hover:bg-gray-50"
            >
                <div>
                    <h3 className="font-semibold">
                        {quiz.title}
                    </h3>

                    <p className="text-sm text-gray-500">
                        {quiz.questions} Questions
                    </p>
                </div>

                <span className="text-gray-400">
                    {new Date(
                        quiz.created_at
                    ).toLocaleDateString()}
                </span>
            </div>
        ))}
    </div>
</div>

        </div>
    );
};

export default Analytics;