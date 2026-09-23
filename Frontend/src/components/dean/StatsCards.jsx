import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Users,
    GraduationCap,
    Building2,
    ClipboardList,
    BarChart3,
    BookOpen,
    CalendarDays,
    ArrowUpRight,
} from "lucide-react";

import { getDeanBatches } from "../../services/deanApi";


const cards = [

    // =====================================================
    // Teachers
    // =====================================================

    {
        key: "total_teachers",
        title: "Teachers",
        subtitle: "Registered Faculty",
        icon: Users,
        color: "bg-blue-500",
        border: "border-blue-500",
        path: "/dean/teachers",
    },


    // =====================================================
    // Students
    // =====================================================

    {
        key: "total_students",
        title: "Students",
        subtitle: "Enrolled Students",
        icon: GraduationCap,
        color: "bg-green-500",
        border: "border-green-500",
        path: "/dean/students",
    },


    // =====================================================
    // Batches
    // =====================================================

    {
        key: "total_batches",
        title: "Batches",
        subtitle: "Academic Batches",
        icon: CalendarDays,
        color: "bg-cyan-500",
        border: "border-cyan-500",
        path: "/dean/batches",
    },


    // =====================================================
    // Sections
    // =====================================================

    {
        key: "total_sections",
        title: "Sections",
        subtitle: "Academic Sections",
        icon: Building2,
        color: "bg-yellow-500",
        border: "border-yellow-500",
        path: "/dean/sections",
    },


    // =====================================================
    // Subjects
    // =====================================================

    {
        key: "total_subjects",
        title: "Subjects",
        subtitle: "Academic Subjects",
        icon: BookOpen,
        color: "bg-indigo-500",
        border: "border-indigo-500",
        path: "/dean/subjects",
    },


    // =====================================================
    // Quizzes
    // =====================================================

    {
        key: "total_quizzes",
        title: "Quizzes",
        subtitle: "Available Quizzes",
        icon: ClipboardList,
        color: "bg-purple-500",
        border: "border-purple-500",
        path: "/dean/quizzes",
    },


    // =====================================================
    // Attempts
    // =====================================================

    {
        key: "total_attempts",
        title: "Attempts",
        subtitle: "Student Attempts",
        icon: BarChart3,
        color: "bg-red-500",
        border: "border-red-500",
        path: null,
    },

];


export default function StatsCards({ stats }) {

    const navigate = useNavigate();

    const [batchCount, setBatchCount] = useState(0);


    // =====================================================
    // Load Batch Count
    // =====================================================

    useEffect(() => {

        const loadBatchCount = async () => {

            try {

                const batches = await getDeanBatches();

                // Make sure response is an array
                if (Array.isArray(batches)) {

                    setBatchCount(batches.length);

                } else {

                    setBatchCount(0);

                }

            } catch (error) {

                console.error(
                    "Failed to load batch count:",
                    error
                );

                setBatchCount(0);

            }

        };

        loadBatchCount();

    }, []);


    // =====================================================
    // Get Card Value
    // =====================================================

    const getCardValue = (card) => {

        if (card.key === "total_batches") {

            return batchCount;

        }

        return stats?.[card.key] ?? 0;

    };


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {cards.map((card) => {

                const Icon = card.icon;

                const value = getCardValue(card);


                return (

                    <div
                        key={card.key}
                        onClick={() =>
                            card.path &&
                            navigate(card.path)
                        }
                        className={`
                            bg-white
                            rounded-2xl
                            shadow-md
                            border-t-4
                            ${card.border}
                            p-6
                            hover:shadow-2xl
                            hover:-translate-y-2
                            transition-all
                            duration-300
                            ${
                                card.path
                                    ? "cursor-pointer"
                                    : "cursor-default"
                            }
                        `}
                    >

                        {/* =================================================
                            TOP SECTION
                        ================================================= */}

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm text-gray-500">
                                    {card.title}
                                </p>


                                <h2 className="mt-3 text-4xl font-bold">
                                    {value}
                                </h2>

                            </div>


                            {/* Icon */}

                            <div
                                className={`
                                    ${card.color}
                                    flex
                                    h-14
                                    w-14
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    shadow
                                `}
                            >

                                <Icon
                                    className="text-white"
                                    size={28}
                                />

                            </div>

                        </div>


                        {/* =================================================
                            BOTTOM SECTION
                        ================================================= */}

                        <div className="mt-8">

                            <p className="text-sm text-gray-500">
                                {card.subtitle}
                            </p>


                            <div
                                className={`
                                    mt-4
                                    flex
                                    items-center
                                    font-medium
                                    ${
                                        card.path
                                            ? "text-blue-600"
                                            : "text-gray-400"
                                    }
                                `}
                            >

                                <ArrowUpRight
                                    size={18}
                                    className="mr-1"
                                />

                                View Details

                            </div>

                        </div>

                    </div>

                );

            })}

        </div>

    );

}