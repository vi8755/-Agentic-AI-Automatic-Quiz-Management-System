import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex">

            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">

                <Outlet />

            </main>

        </div>
    );
};

export default DashboardLayout;