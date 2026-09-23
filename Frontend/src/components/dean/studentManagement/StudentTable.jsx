import {
User,
Mail,
Hash,
Building2,
GraduationCap,
BookOpen,
MoreVertical,
} from "lucide-react";

const StudentTable = ({ students = [] }) => {
return ( <div> <div className="overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200"> <thead className="bg-gray-50"> <tr> <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
Student </th>

 
          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Roll No.
          </th>

          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Section
          </th>

          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Department
          </th>

          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Semester
          </th>

          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            Status
          </th>

          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100 bg-white">
        {students.map((student) => (
          <tr
            key={student.id}
            className="transition-colors hover:bg-gray-50"
          >
            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                  {student.name?.charAt(0)?.toUpperCase() || "S"}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                    <p className="truncate text-sm font-semibold text-gray-900">
                      {student.name || "—"}
                    </p>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                    <p className="truncate text-xs text-gray-500">
                      {student.email || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </td>

            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />

                <span className="text-sm font-medium text-gray-700">
                  {student.roll_no || "—"}
                </span>
              </div>
            </td>

            <td className="whitespace-nowrap px-6 py-4">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <BookOpen className="h-3.5 w-3.5" />

                Section {student.section_name || "—"}
              </span>
            </td>

            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />

                <span className="text-sm font-medium text-gray-700">
                  {student.department || "—"}
                </span>
              </div>
            </td>

            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-700">
                  Semester {student.semester ?? "—"}
                </span>
              </div>
            </td>

            <td className="whitespace-nowrap px-6 py-4">
              {student.is_active ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Inactive
                </span>
              )}
            </td>

            <td className="whitespace-nowrap px-6 py-4 text-right">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                title="Student actions"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {students.length === 0 && (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <User className="h-6 w-6 text-gray-400" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-900">
        No students match your filters
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Try changing your search or filter options.
      </p>
    </div>
  )}
</div>
 

);
};

export default StudentTable;
