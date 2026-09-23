import {
    Users,
    GraduationCap,
    Building2,
    FileText,
    ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

const actions = [
    {
        title: "Teacher Management",
        description:
            "Manage teachers, departments and assignments.",
        icon: Users,
        color: "bg-blue-500",
        link: "/dean/teachers",
    },
    {
        title: "Student Management",
        description:
            "Manage students, sections and enrollments.",
        icon: GraduationCap,
        color: "bg-green-500",
        link: "/dean/students",
    },
    {
        title: "Section Management",
        description:
            "Organize academic sections efficiently.",
        icon: Building2,
        color: "bg-yellow-500",
        link: "/dean/sections",
    },
    {
        title: "Reports",
        description:
            "View analytics and export reports.",
        icon: FileText,
        color: "bg-purple-500",
        link: "/dean/reports",
    },
];

export default function QuickActions() {
    return (
        <div className="bg-white rounded-2xl shadow-md p-6">

            <div className="flex justify-between items-center mb-6">

                <h2 className="text-xl font-bold">

                    Quick Actions

                </h2>

                <span className="text-sm text-gray-500">

                    4 Shortcuts

                </span>

            </div>

            <div className="grid gap-5">

                {actions.map((action) => {

                    const Icon = action.icon;

                    return (

                        <Link
                            key={action.title}
                            to={action.link}
                            className="
                                group
                                flex
                                items-center
                                justify-between
                                rounded-xl
                                border
                                p-5
                                hover:shadow-lg
                                hover:-translate-y-1
                                transition-all
                                duration-300
                            "
                        >

                            <div className="flex items-center gap-4">

                                <div
                                    className={`
                                        ${action.color}
                                        w-14
                                        h-14
                                        rounded-xl
                                        flex
                                        items-center
                                        justify-center
                                        text-white
                                    `}
                                >

                                    <Icon size={28} />

                                </div>

                                <div>

                                    <h3 className="font-semibold text-lg">

                                        {action.title}

                                    </h3>

                                    <p className="text-gray-500 text-sm mt-1">

                                        {action.description}

                                    </p>

                                </div>

                            </div>

                            <ArrowRight
                                className="
                                    text-gray-400
                                    group-hover:translate-x-2
                                    transition-transform
                                "
                            />

                        </Link>

                    );

                })}

            </div>

        </div>
    );
}