import { Outlet } from "react-router-dom";

import StudentSidebar from "../components/student/StudentSidebar";
import StudentTopbar from "../components/student/StudentTopbar";

const StudentLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Sidebar */}
            <StudentSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">

                <StudentTopbar />

                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>

            </div>

        </div>
    );
};

export default StudentLayout;