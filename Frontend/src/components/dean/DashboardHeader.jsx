import { CalendarDays, RefreshCw } from "lucide-react";

export default function DashboardHeader({ onRefresh }) {
    const hour = new Date().getHours();

    let greeting = "Good Evening";

    if (hour < 12) {
        greeting = "Good Morning";
    } else if (hour < 17) {
        greeting = "Good Afternoon";
    }

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">

            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 p-8">

                <div>

                    <h1 className="text-4xl font-bold">
                        👋 {greeting}, Dean
                    </h1>

                    <p className="mt-2 text-blue-100 text-lg">
                        Welcome back! Here's today's college overview.
                    </p>

                    <div className="flex items-center gap-2 mt-5 text-blue-100">

                        <CalendarDays size={18} />

                        <span>{today}</span>

                    </div>

                </div>

                <button
                    onClick={onRefresh}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
                >
                    <RefreshCw size={18} />

                    Refresh Dashboard
                </button>

            </div>

        </div>
    );
}