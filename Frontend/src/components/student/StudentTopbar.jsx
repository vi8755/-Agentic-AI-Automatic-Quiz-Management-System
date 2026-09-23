import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const StudentTopbar = () => {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">

            <div>
                <h2 className="text-lg font-semibold text-slate-800">
                    Student Portal
                </h2>

                <p className="text-xs text-slate-500">
                    Welcome back, {user?.name || "Student"}
                </p>
            </div>

            <button
                className="relative p-2 rounded-lg hover:bg-slate-100 transition"
                title="Notifications"
            >
                <Bell size={20} className="text-slate-600" />

                {/* Notification indicator - future functionality */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

        </header>
    );
};

export default StudentTopbar;