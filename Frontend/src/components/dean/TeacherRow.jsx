const TeacherRow = ({
    teacher,
    onView,
    onAssignSections,
}) => {

    return (

        <tr className="border-t hover:bg-gray-50 transition">

            {/* =================================================
                Teacher
            ================================================= */}

            <td className="px-6 py-4">

                <div className="font-semibold">
                    {teacher.name}
                </div>

                <div className="text-sm text-gray-500">
                    {teacher.email}
                </div>

            </td>

            {/* =================================================
                Employee ID
            ================================================= */}

            <td className="px-6 py-4">
                {teacher.employee_id}
            </td>

            {/* =================================================
                Department
            ================================================= */}

            <td className="px-6 py-4">
                {teacher.department}
            </td>

            {/* =================================================
                Designation
            ================================================= */}

            <td className="px-6 py-4">
                {teacher.designation}
            </td>

            {/* =================================================
                Sections
            ================================================= */}

            <td className="px-6 py-4">

                {teacher.sections?.length > 0
                    ? teacher.sections.join(", ")
                    : "Not Assigned"}

            </td>

            {/* =================================================
                Status
            ================================================= */}

            <td className="px-6 py-4">

                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                        teacher.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {teacher.status}
                </span>

            </td>

            {/* =================================================
                Actions
            ================================================= */}

            <td className="px-6 py-4">

                <div className="flex items-center justify-center gap-3">

                    {/* View */}

                    <button
                        onClick={() => onView(teacher)}
                        className="text-blue-600 hover:text-blue-800 font-medium transition"
                    >
                        View
                    </button>

                    {/* Assign Sections */}

                    <button
                        onClick={() =>
                            onAssignSections(teacher)
                        }
                        className="text-purple-600 hover:text-purple-800 font-medium transition"
                    >
                        Assign
                    </button>

                </div>

            </td>

        </tr>

    );

};

export default TeacherRow;