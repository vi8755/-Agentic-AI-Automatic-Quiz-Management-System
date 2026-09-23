import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    FaBook,
    FaClipboardList,
    FaCheckCircle,
    FaClock,
    FaRobot,
    FaBrain,
    FaFilePdf,
} from "react-icons/fa";

import DashboardCard from "../../components/dashboard/DashboardCard";
import { getTeacherDashboard } from "../../api/teacherApi";
import { useNavigate } from "react-router-dom";


const TeacherDashboard = () => {

    const [dashboard, setDashboard] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const navigate = useNavigate();


    // =====================================================
    // FETCH DASHBOARD
    // =====================================================

    useEffect(() => {
        fetchDashboard();
    }, []);


    const fetchDashboard = async () => {

        try {

            const data =
                await getTeacherDashboard();

            setDashboard(data);

        } catch (error) {

            console.error(error);

            toast.error(
                "Failed to load dashboard"
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <p>
                Loading dashboard...
            </p>
        );

    }


    // =====================================================
    // DASHBOARD
    // =====================================================

    return (

        <div>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8">

                <h1 className="text-6xl font-bold text-red-600">
                    Teacher Dashboard
                </h1>

                <p className="text-gray-500 mt-2">
                    Welcome back! Here's an overview of
                    your quizzes and assignments.
                </p>

            </div>


            {/* =================================================
                DASHBOARD STATISTICS
            ================================================= */}

            <div
                className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-4
                    gap-6
                "
            >

                <DashboardCard
                    title="Total Quizzes"
                    value={
                        dashboard.total_quizzes
                    }
                    icon={FaBook}
                    bgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />


                <DashboardCard
                    title="Assignments"
                    value={
                        dashboard.total_assignments
                    }
                    icon={FaClipboardList}
                    bgColor="bg-green-100"
                    iconColor="text-green-600"
                />


                <DashboardCard
                    title="Completed"
                    value={
                        dashboard.completed_assignments
                    }
                    icon={FaCheckCircle}
                    bgColor="bg-emerald-100"
                    iconColor="text-emerald-600"
                />


                <DashboardCard
                    title="Pending"
                    value={
                        dashboard.pending_assignments
                    }
                    icon={FaClock}
                    bgColor="bg-yellow-100"
                    iconColor="text-yellow-600"
                />

            </div>


            {/* =================================================
                QUIZ GENERATORS
            ================================================= */}

            <div
                className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-3
                    gap-6
                    mt-6
                "
            >

                {/* =================================================
                    1. PDF QUIZ GENERATOR
                ================================================= */}

                <div
                    onClick={() =>
                        navigate(
                            "/teacher/ai-quiz"
                        )
                    }
                    className="
                        bg-white
                        rounded-xl
                        shadow-md
                        p-6
                        cursor-pointer
                        hover:shadow-xl
                        hover:-translate-y-1
                        transition
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <div>

                            <h2 className="text-xl font-semibold">
                                AI Quiz Generator
                            </h2>

                            <p className="text-gray-500 mt-2">
                                Upload PDF & Generate Quiz
                            </p>

                        </div>


                        <FaRobot
                            className="
                                text-4xl
                                text-red-600
                            "
                        />

                    </div>

                </div>


                {/* =================================================
                    2. TOPIC QUIZ GENERATOR
                ================================================= */}

                <div
                    onClick={() =>
                        navigate(
                            "/teacher/topic-quiz"
                        )
                    }
                    className="
                        bg-white
                        rounded-xl
                        shadow-md
                        p-6
                        cursor-pointer
                        hover:shadow-xl
                        hover:-translate-y-1
                        transition
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <div>

                            <h2 className="text-xl font-semibold">
                                Topic Quiz Generator
                            </h2>

                            <p className="text-gray-500 mt-2">
                                Generate Quiz from Topic
                            </p>

                        </div>


                        <FaBrain
                            className="
                                text-4xl
                                text-red-600
                            "
                        />

                    </div>

                </div>


                {/* =================================================
                    3. QUESTION BANK → QUIZ
                ================================================= */}

                <div
                    onClick={() =>
                        navigate(
                            "/teacher/question-bank-quiz"
                        )
                    }
                    className="
                        bg-white
                        rounded-xl
                        shadow-md
                        p-6
                        cursor-pointer
                        hover:shadow-xl
                        hover:-translate-y-1
                        transition
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <div>

                            <h2 className="text-xl font-semibold">
                                Question Bank → Quiz
                            </h2>

                            <p className="text-gray-500 mt-2">
                                Upload Question Bank PDF
                                & Generate Quiz
                            </p>

                        </div>


                        <FaFilePdf
                            className="
                                text-4xl
                                text-purple-600
                            "
                        />

                    </div>

                </div>

            </div>

        </div>

    );
};


export default TeacherDashboard;