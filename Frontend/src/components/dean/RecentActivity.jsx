import {
    ClipboardList,
    Clock3,
    User,
} from "lucide-react";

export default function RecentActivity({ activities }) {

    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-md p-6">

                <h2 className="text-xl font-bold mb-6">
                    Recent Activity
                </h2>

                <div className="flex flex-col items-center justify-center py-12">

                    <ClipboardList
                        size={60}
                        className="text-gray-300"
                    />

                    <p className="mt-4 text-lg font-medium text-gray-500">
                        No recent activity
                    </p>

                    <p className="text-gray-400 mt-2">
                        Activities will appear here.
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-md p-6">

            <div className="flex justify-between items-center mb-8">

                <h2 className="text-xl font-bold">
                    Recent Activity
                </h2>

                <span className="text-sm text-gray-500">
                    Last {activities.length} Activities
                </span>

            </div>

            <div className="relative">

                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-8">

                    {activities.map((activity, index) => (

                        <div
                            key={index}
                            className="relative flex gap-5"
                        >

                            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 border-4 border-white shadow">

                                <ClipboardList
                                    size={20}
                                    className="text-blue-600"
                                />

                            </div>

                            <div className="flex-1 bg-gray-50 rounded-xl p-5 hover:bg-blue-50 transition">

                                <div className="flex justify-between items-start flex-wrap gap-2">

                                    <div>

                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">

                                            Quiz Created

                                        </span>

                                        <h3 className="mt-3 text-lg font-semibold">

                                            {activity.title}

                                        </h3>

                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500">

                                        <Clock3 size={15} />

                                        {new Date(
                                            activity.created_at
                                        ).toLocaleString("en-IN")}

                                    </div>

                                </div>

                                <div className="flex items-center mt-4 text-gray-600">

                                    <User
                                        size={17}
                                        className="mr-2"
                                    />

                                    Created by

                                    <span className="ml-2 font-semibold">

                                        {activity.teacher}

                                    </span>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}