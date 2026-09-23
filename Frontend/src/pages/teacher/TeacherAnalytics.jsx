import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line,
} from "recharts";

import {
    FaBook,
    FaUsers,
    FaClipboardCheck,
    FaChartLine,
    FaFilter,
    FaTrophy,
    FaMedal,
    FaUserGraduate,
} from "react-icons/fa";

import DashboardCard from "../../components/dashboard/DashboardCard";

import {
    getTeacherAnalytics,
    getQuizPerformance,
    getTeacherSections,
    getStudentPerformance,
} from "../../api/teacherApi";


const TeacherAnalytics = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [analytics, setAnalytics] = useState(null);

    const [quizPerformance, setQuizPerformance] =
        useState([]);

    const [studentPerformance, setStudentPerformance] =
        useState({
            topper: null,
            top_students: [],
            students: [],
        });

    const [sections, setSections] =
        useState([]);

    // Empty string = Overall / All Sections
    const [selectedSection, setSelectedSection] =
        useState("");

    const [loading, setLoading] =
        useState(true);


    // =====================================================
    // LOAD TEACHER SECTIONS
    // =====================================================

    useEffect(() => {

        loadSections();

    }, []);


    const loadSections = async () => {

        try {

            const data =
                await getTeacherSections();

            // A teacher may have the same section
            // for multiple subjects. Keep each section
            // only once in the filter.
            const uniqueSections = Array.from(
                new Map(
                    (data || []).map(
                        (item) => [
                            item.section_id,
                            item,
                        ]
                    )
                ).values()
            );

            setSections(uniqueSections);

        } catch (error) {

            console.error(
                "Failed to load teacher sections:",
                error
            );

            toast.error(
                "Failed to load sections"
            );

        }

    };


    // =====================================================
    // LOAD ANALYTICS
    // =====================================================

    useEffect(() => {

        fetchAnalytics();

    }, [selectedSection]);


    const fetchAnalytics = async () => {

        try {

            setLoading(true);

            // Empty string means Overall / All Sections
            const sectionId =
                selectedSection || null;


            const [
                analyticsData,
                quizData,
                studentData,
            ] = await Promise.all([

                getTeacherAnalytics(
                    sectionId
                ),

                getQuizPerformance(
                    sectionId
                ),

                getStudentPerformance(
                    sectionId
                ),

            ]);


            setAnalytics(
                analyticsData
            );

            setStudentPerformance(
                studentData || {
                    topper: null,
                    top_students: [],
                    students: [],
                }
            );


            // Create a short title only for
            // the X-axis. Full quiz title remains
            // available for Tooltip.
            const formattedQuizData =
                (quizData || []).map(
                    (item) => ({

                        ...item,

                        short_title:
                            item.quiz_title &&
                            item.quiz_title.length > 22
                                ? item.quiz_title.substring(
                                    0,
                                    22
                                ) + "..."
                                : item.quiz_title || "Quiz",

                    })
                );


            setQuizPerformance(
                formattedQuizData
            );


        } catch (error) {

            console.error(
                "Failed to load analytics:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to load analytics"
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // SELECTED SECTION LABEL
    // =====================================================

    const selectedSectionData =
        sections.find(
            (section) =>
                section.section_id ===
                Number(selectedSection)
        );


    const selectedSectionLabel =
        selectedSectionData
            ? selectedSectionData.section_name
            : "All Sections";


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="p-6">

                <p className="text-gray-500">
                    Loading analytics...
                </p>

            </div>

        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="space-y-8">


            {/* =================================================
                HEADER
            ================================================= */}

            <div>

                <h1 className="text-4xl font-bold text-gray-800">
                    Teacher Analytics
                </h1>

                <p className="text-gray-500 mt-2">
                    Track quiz performance and student progress.
                </p>

            </div>


            {/* =================================================
                SECTION FILTER
            ================================================= */}

            <div className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                p-5
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
            ">

                <div>

                    <div className="
                        flex
                        items-center
                        gap-3
                    ">

                        <div className="
                            w-10
                            h-10
                            rounded-xl
                            bg-indigo-100
                            text-indigo-600
                            flex
                            items-center
                            justify-center
                        ">

                            <FaFilter />

                        </div>

                        <div>

                            <h2 className="
                                text-lg
                                font-bold
                                text-gray-900
                            ">
                                Analytics Filter
                            </h2>

                            <p className="
                                text-sm
                                text-gray-500
                                mt-1
                            ">
                                Currently viewing: {selectedSectionLabel}
                            </p>

                        </div>

                    </div>

                </div>


                <div className="w-full md:w-80">

                    <label className="
                        block
                        text-sm
                        font-medium
                        text-gray-700
                        mb-2
                    ">
                        Select Section
                    </label>

                    <select
                        value={selectedSection}
                        onChange={(event) => {

                            const value =
                                event.target.value;

                            setSelectedSection(
                                value
                                    ? Number(value)
                                    : ""
                            );

                        }}
                        className="
                            w-full
                            h-11
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            px-4
                            text-sm
                            text-gray-700
                            outline-none
                            focus:border-indigo-500
                            focus:ring-2
                            focus:ring-indigo-100
                        "
                    >

                        <option value="">
                            Overall — All Sections
                        </option>


                        {sections.map(
                            (section) => (

                                <option
                                    key={
                                        section.section_id
                                    }
                                    value={
                                        section.section_id
                                    }
                                >
                                    {section.section_name}
                                    {" — "}
                                    {section.department}
                                    {" — Year "}
                                    {section.year}
                                    {" — Sem "}
                                    {section.semester}
                                </option>

                            )
                        )}

                    </select>

                </div>

            </div>


            {/* =================================================
                KPI CARDS
            ================================================= */}

            <div className="
                grid
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-4
                gap-6
            ">


                <DashboardCard
                    title="Total Quizzes"
                    value={
                        analytics?.total_quizzes ?? 0
                    }
                    icon={FaBook}
                    bgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />


                <DashboardCard
                    title="Students"
                    value={
                        analytics?.total_students ?? 0
                    }
                    icon={FaUsers}
                    bgColor="bg-green-100"
                    iconColor="text-green-600"
                />


                <DashboardCard
                    title="Attempts"
                    value={
                        analytics?.total_attempts ?? 0
                    }
                    icon={FaClipboardCheck}
                    bgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />


                <DashboardCard
                    title="Average Score"
                    value={
                        analytics?.average_score ?? 0
                    }
                    icon={FaChartLine}
                    bgColor="bg-yellow-100"
                    iconColor="text-yellow-600"
                />


            </div>


            {/* =================================================
                QUIZ ANALYTICS
            ================================================= */}

            <div className="
                grid
                grid-cols-1
                xl:grid-cols-2
                gap-6
            ">


                {/* =================================================
                    QUIZ AVERAGE SCORE
                ================================================= */}

                <div className="
                    bg-white
                    rounded-2xl
                    shadow-sm
                    border
                    p-6
                ">

                    <div className="mb-6">

                        <h2 className="
                            text-xl
                            font-bold
                            text-gray-900
                        ">
                            Quiz-wise Performance
                        </h2>

                        <p className="
                            text-sm
                            text-gray-500
                            mt-1
                        ">
                            Average score across your quizzes
                            {" — "}
                            {selectedSectionLabel}
                        </p>

                    </div>


                    <div className="h-80">

                        {quizPerformance.length === 0 ? (

                            <div className="
                                h-full
                                flex
                                items-center
                                justify-center
                                text-gray-400
                            ">

                                No quiz performance data available.

                            </div>

                        ) : (

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >

                                <BarChart
                                    data={quizPerformance}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 0,
                                        bottom: 60,
                                    }}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="short_title"
                                        angle={-25}
                                        textAnchor="end"
                                        interval={0}
                                        height={80}
                                    />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(
                                            value,
                                            name
                                        ) => [
                                            value,
                                            name ===
                                                "average_score"
                                                ? "Average Score"
                                                : name,
                                        ]}
                                        labelFormatter={(
                                            label,
                                            payload
                                        ) =>
                                            payload?.[0]
                                                ?.payload
                                                ?.quiz_title ||
                                            label
                                        }
                                    />

                                    <Bar
                                        dataKey="average_score"
                                        name="Average Score"
                                        radius={[
                                            6,
                                            6,
                                            0,
                                            0,
                                        ]}
                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        )}

                    </div>

                </div>


                {/* =================================================
                    QUIZ ATTEMPTS
                ================================================= */}

                <div className="
                    bg-white
                    rounded-2xl
                    shadow-sm
                    border
                    p-6
                ">

                    <div className="mb-6">

                        <h2 className="
                            text-xl
                            font-bold
                            text-gray-900
                        ">
                            Quiz Attempts
                        </h2>

                        <p className="
                            text-sm
                            text-gray-500
                            mt-1
                        ">
                            Student attempts for each quiz
                            {" — "}
                            {selectedSectionLabel}
                        </p>

                    </div>


                    <div className="h-80">

                        {quizPerformance.length === 0 ? (

                            <div className="
                                h-full
                                flex
                                items-center
                                justify-center
                                text-gray-400
                            ">

                                No attempt data available.

                            </div>

                        ) : (

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >

                                <LineChart
                                    data={quizPerformance}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 0,
                                        bottom: 60,
                                    }}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="short_title"
                                        angle={-25}
                                        textAnchor="end"
                                        interval={0}
                                        height={80}
                                    />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(
                                            value,
                                            name
                                        ) => [
                                            value,
                                            name === "attempts"
                                                ? "Attempts"
                                                : name,
                                        ]}
                                        labelFormatter={(
                                            label,
                                            payload
                                        ) =>
                                            payload?.[0]
                                                ?.payload
                                                ?.quiz_title ||
                                            label
                                        }
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="attempts"
                                        name="Attempts"
                                        strokeWidth={3}
                                        dot={{
                                            r: 5,
                                        }}
                                        activeDot={{
                                            r: 7,
                                        }}
                                    />

                                </LineChart>

                            </ResponsiveContainer>

                        )}

                    </div>

                </div>


            </div>


            {/* =================================================
                OVERALL PERFORMANCE
            ================================================= */}

            <div className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                p-6
            ">

                <div className="mb-6">

                    <h2 className="
                        text-xl
                        font-bold
                        text-gray-900
                    ">
                        Overall Performance
                    </h2>

                    <p className="
                        text-sm
                        text-gray-500
                        mt-1
                    ">
                        Overall quiz performance summary — {selectedSectionLabel}
                    </p>

                </div>


                {/* SCORE SUMMARY */}
                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    gap-5
                ">

                    {/* Average Score */}
                    <div className="
                        rounded-2xl
                        border
                        border-blue-100
                        bg-blue-50
                        p-5
                    ">

                        <p className="text-sm font-medium text-gray-600">
                            Average Score
                        </p>

                        <div className="flex items-end gap-2 mt-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {analytics?.average_score ?? 0}
                            </span>
                            <span className="text-sm text-gray-500 mb-1">
                                avg
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            Average score from completed quiz attempts.
                        </p>

                    </div>


                    {/* Highest Score */}
                    <div className="
                        rounded-2xl
                        border
                        border-green-100
                        bg-green-50
                        p-5
                    ">

                        <p className="text-sm font-medium text-gray-600">
                            Highest Score
                        </p>

                        <div className="flex items-end gap-2 mt-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {analytics?.highest_score ?? 0}
                            </span>
                            <span className="text-sm text-gray-500 mb-1">
                                highest
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            Best score recorded among completed attempts.
                        </p>

                    </div>


                    {/* Lowest Score */}
                    <div className="
                        rounded-2xl
                        border
                        border-orange-100
                        bg-orange-50
                        p-5
                    ">

                        <p className="text-sm font-medium text-gray-600">
                            Lowest Score
                        </p>

                        <div className="flex items-end gap-2 mt-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {analytics?.lowest_score ?? 0}
                            </span>
                            <span className="text-sm text-gray-500 mb-1">
                                lowest
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            Lowest score recorded among completed attempts.
                        </p>

                    </div>

                </div>


                {/* SCORE RANGE */}
                <div className="
                    mt-6
                    rounded-2xl
                    border
                    border-gray-100
                    bg-gray-50
                    p-5
                ">

                    <div className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-2
                        mb-4
                    ">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Score Overview
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Score range from the lowest to the highest completed attempt.
                            </p>
                        </div>

                        <div className="text-sm text-gray-500">
                            {analytics?.lowest_score ?? 0} — {analytics?.highest_score ?? 0}
                        </div>

                    </div>

                    <div className="relative pt-2 pb-7">

                        <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                style={{
                                    width: `${Math.min(
                                        Math.max(
                                            Number(analytics?.highest_score ?? 0),
                                            0
                                        ),
                                        100
                                    )}%`,
                                }}
                            />
                        </div>

                        <div
                            className="absolute top-0"
                            style={{
                                left: `${Math.min(
                                    Math.max(
                                        Number(analytics?.average_score ?? 0),
                                        0
                                    ),
                                    100
                                )}%`,
                                transform: "translateX(-50%)",
                            }}
                        >
                            <div className="w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                        </div>

                        <div className="
                            absolute
                            left-0
                            right-0
                            top-7
                            flex
                            justify-between
                            text-xs
                            text-gray-400
                        ">
                            <span>0</span>
                            <span>25</span>
                            <span>50</span>
                            <span>75</span>
                            <span>100</span>
                        </div>

                    </div>

                    <div className="flex flex-wrap gap-5 text-sm text-gray-600">

                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-600" />
                            <span>
                                Average: <strong className="text-gray-900">
                                    {analytics?.average_score ?? 0}
                                </strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-300" />
                            <span>
                                Range: <strong className="text-gray-900">
                                    {analytics?.lowest_score ?? 0} - {analytics?.highest_score ?? 0}
                                </strong>
                            </span>
                        </div>

                    </div>

                </div>


                {/* COMPLETION RATE */}
                <div className="
                    mt-6
                    rounded-2xl
                    border
                    border-gray-100
                    p-5
                ">

                    <div className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-2
                        mb-3
                    ">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Assignment Completion
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Percentage of assigned quizzes completed by students.
                            </p>
                        </div>

                        <span className="text-2xl font-bold text-gray-900">
                            {analytics?.completion_percentage ?? 0}%
                        </span>

                    </div>

                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                            style={{
                                width: `${Math.min(
                                    Math.max(
                                        Number(analytics?.completion_percentage ?? 0),
                                        0
                                    ),
                                    100
                                )}%`,
                            }}
                        />
                    </div>

                    <div className="
                        flex
                        justify-between
                        text-xs
                        text-gray-400
                        mt-2
                    ">
                        <span>0%</span>
                        <span>100%</span>
                    </div>

                </div>

            </div>

            {/* =================================================
                TOP PERFORMER + TOP 5
            ================================================= */}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* TOP PERFORMER */}
                <div className="
                    xl:col-span-1
                    bg-white
                    rounded-2xl
                    shadow-sm
                    border
                    p-6
                ">

                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                            <FaTrophy />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Top Performer
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Highest average percentage — {selectedSectionLabel}
                            </p>
                        </div>
                    </div>

                    {studentPerformance.topper ? (
                        <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 p-6 text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-2xl">
                                <FaTrophy />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mt-4">
                                {studentPerformance.topper.student_name}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Roll No: {studentPerformance.topper.roll_no || "—"}
                            </p>

                            <p className="text-sm text-gray-500">
                                Section: {studentPerformance.topper.section_name || "—"}
                            </p>

                            <div className="mt-5">
                                <span className="text-4xl font-bold text-gray-900">
                                    {studentPerformance.topper.average_percentage}%
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                    Average percentage
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                                <div className="rounded-xl bg-white/80 p-3">
                                    <p className="text-gray-500">Attempts</p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {studentPerformance.topper.attempts}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/80 p-3">
                                    <p className="text-gray-500">Avg Score</p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {studentPerformance.topper.average_score}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                            <FaUserGraduate className="text-3xl mb-3" />
                            <p>No completed student attempts yet.</p>
                        </div>
                    )}

                </div>


                {/* TOP 5 */}
                <div className="
                    xl:col-span-2
                    bg-white
                    rounded-2xl
                    shadow-sm
                    border
                    p-6
                ">

                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <FaMedal />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Top 5 Students
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Student ranking by average percentage — {selectedSectionLabel}
                            </p>
                        </div>
                    </div>

                    {studentPerformance.top_students.length === 0 ? (
                        <div className="h-64 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                            <FaUserGraduate className="text-3xl mb-3" />
                            <p>No completed student attempts yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {studentPerformance.top_students.map((student, index) => (
                                <div
                                    key={student.student_id}
                                    className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4 hover:bg-gray-50 transition"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                                        #{index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {student.student_name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Roll No: {student.roll_no || "—"} · Section: {student.section_name || "—"}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            {student.average_percentage}%
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {student.attempts} attempt{student.attempts === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>

            </div>


            {/* =================================================
                ALL STUDENT PERFORMANCE
            ================================================= */}

            <div className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                p-6
            ">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Student Performance
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            All students with completed quiz attempts — {selectedSectionLabel}
                        </p>
                    </div>

                    <div className="text-sm text-gray-500">
                        {studentPerformance.students.length} student{studentPerformance.students.length === 1 ? "" : "s"}
                    </div>
                </div>

                {studentPerformance.students.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        No student performance data available.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-gray-500">
                                    <th className="px-4 py-3 font-medium">Rank</th>
                                    <th className="px-4 py-3 font-medium">Student</th>
                                    <th className="px-4 py-3 font-medium">Roll No</th>
                                    <th className="px-4 py-3 font-medium">Section</th>
                                    <th className="px-4 py-3 font-medium">Attempts</th>
                                    <th className="px-4 py-3 font-medium">Avg Score</th>
                                    <th className="px-4 py-3 font-medium">Avg %</th>
                                </tr>
                            </thead>

                            <tbody>
                                {studentPerformance.students.map((student, index) => (
                                    <tr
                                        key={student.student_id}
                                        className="border-b border-gray-50 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-4 font-semibold text-gray-700">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-gray-900">
                                            {student.student_name}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {student.roll_no || "—"}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {student.section_name || "—"}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {student.attempts}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {student.average_score}
                                        </td>
                                        <td className="px-4 py-4 font-bold text-gray-900">
                                            {student.average_percentage}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>


        </div>

    );

};


export default TeacherAnalytics;
