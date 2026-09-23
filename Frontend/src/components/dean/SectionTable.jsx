import SectionRow from "./SectionRow";

const SectionTable = ({
    sections,
    onEdit,
    onToggleStatus,
    onDelete,
    statusLoadingId,
}) => {
    return (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">

            <table className="w-full">

                <thead className="bg-gray-100">
                    <tr>

                        {/* Section ID */}
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            ID
                        </th>

                        {/* Section */}
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Section
                        </th>

                        {/* Batch */}
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Batch
                        </th>

                        {/* Department */}
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Department
                        </th>

                        {/* Year */}
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Year
                        </th>

                        {/* Semester */}
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Semester
                        </th>

                        {/* Status */}
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            Status
                        </th>

                        {/* Actions */}
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                            Actions
                        </th>

                    </tr>
                </thead>

                <tbody className="divide-y">

                    {sections.map((section) => (

                        <SectionRow
                            key={section.id}
                            section={section}
                            onEdit={onEdit}
                            onToggleStatus={onToggleStatus}
                            onDelete={onDelete}
                            statusLoadingId={statusLoadingId}
                        />

                    ))}

                </tbody>

            </table>

        </div>
    );
};

export default SectionTable;