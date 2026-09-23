
import React from "react";
import { Users } from "lucide-react";

const AssignedStudentsTable = ({
    students = [],
    loading = false,
}) => {
    if (loading) {
        return (
            <div className="border border-gray-200 rounded-2xl bg-white">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />

                        <p className="text-gray-500 text-sm">
                            Loading assigned students...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="border border-gray-200 rounded-2xl bg-white">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Users
                            size={30}
                            className="text-gray-400"
                        />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800">
                        No students found
                    </h3>

                    <p className="text-sm text-gray-500 mt-1 text-center">
                        No students match the current search or
                        section filter.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Horizontal scroll for smaller screens */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                    {/* HEADER */}
                    <thead className="bg-blue-600">
                        <tr>
                            <th className="w-[70px] px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                                #
                            </th>

                            <th className="min-w-[250px] px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                                Student
                            </th>

                            <th className="min-w-[300px] px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                                Email
                            </th>

                            <th className="min-w-[180px] px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                                Roll No
                            </th>

                            <th className="min-w-[180px] px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                                Section
                            </th>
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className="divide-y divide-gray-100">
                        {students.map((student, index) => {
                            const studentName =
                                student.student_name ||
                                student.name ||
                                "—";

                            const studentEmail =
                                student.email ||
                                "—";

                            const rollNo =
                                student.roll_no ||
                                "—";

                            const sectionName =
                                student.section_name ||
                                (student.section_id
                                    ? `Section ${student.section_id}`
                                    : "—");

                            const studentKey =
                                student.student_id ||
                                student.id ||
                                `${studentEmail}-${index}`;

                            return (
                                <tr
                                    key={studentKey}
                                    className="hover:bg-blue-50/60 transition-colors"
                                >
                                    {/* NUMBER */}
                                    <td className="px-6 py-5 align-middle">
                                        <span className="text-sm font-semibold text-gray-500">
                                            {index + 1}
                                        </span>
                                    </td>

                                    {/* STUDENT */}
                                    <td className="px-6 py-5 align-middle">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                <span className="text-base font-bold text-blue-600">
                                                    {studentName
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 whitespace-nowrap">
                                                    {studentName}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* EMAIL */}
                                    <td className="px-6 py-5 align-middle">
                                        <p className="text-sm text-gray-600 whitespace-nowrap">
                                            {studentEmail}
                                        </p>
                                    </td>

                                    {/* ROLL NUMBER */}
                                    <td className="px-6 py-5 align-middle">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium whitespace-nowrap">
                                            {rollNo}
                                        </span>
                                    </td>

                                    {/* SECTION */}
                                    <td className="px-6 py-5 align-middle">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold whitespace-nowrap">
                                            {sectionName}
                                        </span>
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

export default AssignedStudentsTable;

