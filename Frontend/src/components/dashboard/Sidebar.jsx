import { NavLink } from "react-router-dom";
import {
         FaBookOpen,
    FaChartBar,
    FaChartLine,
    FaClipboardList,
    FaCog,
    FaGraduationCap,
    FaSignOutAlt,
    FaUsers,
    FaLayerGroup,
    FaCalendarAlt,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
    const { user, logout } = useAuth();

    // =====================================================
    // Role
    // =====================================================

    const role = user?.role?.toUpperCase();


    // =====================================================
    // Teacher Menu
    // =====================================================

    const teacherMenuItems = [
        {
            name: "Dashboard",
            path: "/teacher/dashboard",
            icon: FaChartBar,
        },
        {
    name: "Descriptive Assignments",
    path: "/teacher/descriptive-assignments",
    icon: FaBookOpen,
},
        {
            name: "My Quizzes",
            path: "/teacher/quizzes",
            icon: FaClipboardList,
        },
        {
    name: "Descriptive Analysis",
    path: "/teacher/descriptive-analysis",
    icon: FaChartLine,
},
        {
            name: "Analytics",
            path: "/teacher/analytics",
            icon: FaBookOpen,
        },
        {
            name: "Settings",
            path: "/teacher/settings",
            icon: FaCog,
        },
    ];


    // =====================================================
    // Dean Menu
    // =====================================================

    const deanMenuItems = [
        {
            name: "Dashboard",
            path: "/dean/dashboard",
            icon: FaChartBar,
        },
        {
            name: "Teachers",
            path: "/dean/teachers",
            icon: FaUsers,
        },
        {
    name: "Batches",
    path: "/dean/batches",
    icon: FaCalendarAlt,
},
        {
            name: "Sections",
            path: "/dean/sections",
            icon: FaLayerGroup,
        },
        {
            name: "Subjects",
            path: "/dean/subjects",
            icon: FaBookOpen,
        },

         {
        name: "Quizzes",
        path: "/dean/quizzes",
        icon: FaClipboardList,
    },
    {
    name: "Attempts",
    path: "/dean/attempts",
    icon: FaChartBar,
},
{
        name: "Analytics",
        path: "/dean/analytics",
        icon: FaChartBar,
    },
    ];


    // =====================================================
    // Select Menu According To Role
    // =====================================================

    const menuItems =
        role === "DEAN"
            ? deanMenuItems
            : teacherMenuItems;


    // =====================================================
    // Render
    // =====================================================

    return (

        <aside className="flex min-h-screen w-72 flex-col bg-slate-900 text-white">

            {/* =================================================
                Logo
            ================================================= */}

            <div className="border-b border-slate-800 px-6 py-8">

                <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">

                        <FaGraduationCap className="text-2xl" />

                    </div>

                    <div>

                        <h2 className="text-xl font-bold">
                            Agentic Quiz
                        </h2>

                        <p className="text-sm text-slate-400">
                            Management System
                        </p>

                    </div>

                </div>

            </div>


            {/* =================================================
                User Information
            ================================================= */}

            <div className="border-b border-slate-800 px-6 py-6">

                <h3 className="text-lg font-semibold">
                    {user?.name || "User"}
                </h3>

                <p className="text-sm text-slate-400">
                    {user?.role || "User"}
                </p>

            </div>


            {/* =================================================
                Navigation
            ================================================= */}

            <nav className="flex-1 px-4 py-6">

                {menuItems.map((item) => {

                    const Icon = item.icon;

                    return (

                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `mb-2 flex items-center gap-4 rounded-xl px-4 py-3 transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`
                            }
                        >

                            <Icon />

                            <span>
                                {item.name}
                            </span>

                        </NavLink>

                    );

                })}

            </nav>


            {/* =================================================
                Logout
            ================================================= */}

            <div className="border-t border-slate-800 p-4">

                <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 py-3 transition-all hover:bg-red-700"
                >

                    <FaSignOutAlt />

                    Logout

                </button>

            </div>

        </aside>

    );
};

export default Sidebar;