import {
    Edit,
    Trash2,
    Power,
} from "lucide-react";

const SubjectTable = ({
    subjects,
    onEdit,
    onToggleStatus,
    onDelete,
    statusLoadingId,
}) => {

    return (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="overflow-x-auto">

                <table className="w-full text-left">

                    {/* =================================================
                        TABLE HEADER
                    ================================================= */}

                    <thead className="border-b bg-gray-50">

                        <tr>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Subject Code
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Subject Name
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Department
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Semester
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </th>

                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Actions
                            </th>

                        </tr>

                    </thead>


                    {/* =================================================
                        TABLE BODY
                    ================================================= */}

                    <tbody className="divide-y divide-gray-100">

                        {subjects.map((subject) => {

                            const isStatusLoading =
                                statusLoadingId === subject.id;


                            return (

                                <tr
                                    key={subject.id}
                                    className="transition hover:bg-gray-50"
                                >

                                    {/* =================================================
                                        SUBJECT CODE
                                    ================================================= */}

                                    <td className="whitespace-nowrap px-6 py-4">

                                        <span className="font-semibold text-gray-900">
                                            {subject.subject_code}
                                        </span>

                                    </td>


                                    {/* =================================================
                                        SUBJECT NAME
                                    ================================================= */}

                                    <td className="px-6 py-4">

                                        <span className="font-medium text-gray-800">
                                            {subject.subject_name}
                                        </span>

                                    </td>


                                    {/* =================================================
                                        DEPARTMENT
                                    ================================================= */}

                                    <td className="whitespace-nowrap px-6 py-4">

                                        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                            {subject.department}
                                        </span>

                                    </td>


                                    {/* =================================================
                                        SEMESTER
                                    ================================================= */}

                                    <td className="whitespace-nowrap px-6 py-4">

                                        <span className="text-sm text-gray-700">
                                            Semester {subject.semester}
                                        </span>

                                    </td>


                                    {/* =================================================
                                        STATUS
                                    ================================================= */}

                                    <td className="whitespace-nowrap px-6 py-4">

                                        {subject.is_active ? (

                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                                <span className="h-2 w-2 rounded-full bg-green-500" />

                                                Active

                                            </span>

                                        ) : (

                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">

                                                <span className="h-2 w-2 rounded-full bg-red-500" />

                                                Inactive

                                            </span>

                                        )}

                                    </td>


                                    {/* =================================================
                                        ACTIONS
                                    ================================================= */}

                                    <td className="px-6 py-4">

                                        <div className="flex items-center justify-end gap-2">


                                            {/* EDIT */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onEdit(subject)
                                                }
                                                title="Edit Subject"
                                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                            >

                                                <Edit size={17} />

                                            </button>


                                            {/* ACTIVATE / DEACTIVATE */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onToggleStatus(
                                                        subject.id,
                                                        !subject.is_active
                                                    )
                                                }
                                                disabled={isStatusLoading}
                                                title={
                                                    subject.is_active
                                                        ? "Deactivate Subject"
                                                        : "Activate Subject"
                                                }
                                                className={`rounded-lg p-2 transition ${
                                                    isStatusLoading
                                                        ? "cursor-not-allowed text-gray-400"
                                                        : subject.is_active
                                                            ? "text-orange-600 hover:bg-orange-50"
                                                            : "text-green-600 hover:bg-green-50"
                                                }`}
                                            >

                                                {isStatusLoading ? (

                                                    <div className="h-[17px] w-[17px] animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />

                                                ) : (

                                                    <Power size={17} />

                                                )}

                                            </button>


                                            {/* DELETE */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onDelete(subject)
                                                }
                                                title="Delete Subject"
                                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                            >

                                                <Trash2 size={17} />

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default SubjectTable;