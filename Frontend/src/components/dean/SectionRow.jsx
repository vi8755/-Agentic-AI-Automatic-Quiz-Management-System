const SectionRow = ({
    section,
    onEdit,
    onToggleStatus,
    onDelete,
}) => {
    return (
        <tr>
            {/* Section ID */}
            <td className="px-6 py-4">
                <div className="font-medium text-gray-900">
                    {section.id}
                </div>
            </td>

            {/* Section */}
            <td className="px-6 py-4">
                <div className="font-medium text-gray-900">
                    {section.section_name}
                </div>
            </td>

            {/* Batch */}
            <td className="px-6 py-4 text-gray-600">
                {section.batch_name || "-"}
            </td>

            {/* Department */}
            <td className="px-6 py-4 text-gray-600">
                {section.department}
            </td>

            {/* Year */}
            <td className="px-6 py-4 text-gray-600">
                {section.year}
            </td>

            {/* Semester */}
            <td className="px-6 py-4 text-gray-600">
                {section.semester}
            </td>

            {/* Status */}
            <td className="px-6 py-4">
                {section.is_active ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        Active
                    </span>
                ) : (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                        Inactive
                    </span>
                )}
            </td>

            {/* Actions */}
            <td className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-center gap-2">

                    {/* Edit */}
                    <button
                        type="button"
                        onClick={() => onEdit(section)}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                    >
                        Edit
                    </button>

                    {/* Activate / Deactivate */}
                    <button
                        type="button"
                        onClick={() =>
                            onToggleStatus(
                                section.id,
                                !section.is_active
                            )
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            section.is_active
                                ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                    >
                        {section.is_active
                            ? "Deactivate"
                            : "Activate"}
                    </button>

                    {/* Delete */}
                    <button
                        type="button"
                        onClick={() => onDelete(section)}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                        Delete
                    </button>

                </div>
            </td>
        </tr>
    );
};

export default SectionRow;