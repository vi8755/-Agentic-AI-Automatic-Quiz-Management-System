const TeacherTableSkeleton = ({ rows = 6 }) => {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-100">
                    <tr>
                        {["Teacher", "Department", "Designation", "Status", "Actions"].map((item) => (
                            <th
                                key={item}
                                className="px-6 py-4 text-left text-sm font-semibold text-gray-600"
                            >
                                {item}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {Array.from({ length: rows }).map((_, index) => (
                        <tr key={index} className="border-t animate-pulse">
                            <td className="px-6 py-5">
                                <div className="h-4 w-40 bg-gray-200 rounded"></div>
                            </td>

                            <td className="px-6 py-5">
                                <div className="h-4 w-28 bg-gray-200 rounded"></div>
                            </td>

                            <td className="px-6 py-5">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </td>

                            <td className="px-6 py-5">
                                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                            </td>

                            <td className="px-6 py-5">
                                <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherTableSkeleton;