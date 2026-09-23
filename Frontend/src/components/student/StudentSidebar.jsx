import {
    LayoutDashboard,
    ClipboardList,
    History,
    BarChart3,
    User,
    Settings,
    LogOut,
    FileText,
    
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const StudentSidebar = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const navigation = [
        {
            name: "Dashboard",
            path: "/student/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "My Quizzes",
            path: "/student/quizzes",
            icon: ClipboardList,
        },
     {
    name: "Descriptive Assignments",
    path: "/student/descriptive-assignments",
    icon: FileText,
},
        {
            name: "Quiz History",
            path: "/student/history",
            icon: History,
        },
        {
            name: "All Quiz Performance",
            path: "/student/performance",
            icon: BarChart3,
        },
        {
    name: "All Descriptive Performance",
    path: "/student/descriptive-performance",
    icon: BarChart3,
},
        {
            name: "My Profile",
            path: "/student/profile",
            icon: User,
        },
        {
            name: "Settings",
            path: "/student/settings",
            icon: Settings,
        },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">

            {/* Logo */}
            <div className="px-6 py-6 border-b border-slate-800">
                <h1 className="text-xl font-bold">
                    Student Portal
                </h1>

                <p className="text-xs text-slate-400 mt-1">
                    College Management System
                </p>
            </div>

            {/* Student Info */}
            <div className="px-5 py-5 border-b border-slate-800">
                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>

                    <div className="min-w-0">
                        <p className="font-medium truncate">
                            {user?.name || "Student"}
                        </p>

                        <p className="text-xs text-slate-400">
                            Student
                        </p>
                    </div>

                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 space-y-1">

                {navigation.map((item) => {

                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                                    isActive
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`
                            }
                        >
                            <Icon size={18} />

                            <span>
                                {item.name}
                            </span>
                        </NavLink>
                    );
                })}

            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-slate-800">

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition"
                >
                    <LogOut size={18} />

                    <span>
                        Logout
                    </span>
                </button>

            </div>

        </aside>
    );
};

export default StudentSidebar;