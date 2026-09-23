import { Edit3, Power, Trash2 } from "lucide-react";

const StudentActionMenu = ({
  student,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <div className="w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
      {/* Edit */}
      <button
        type="button"
        onClick={() => onEdit(student)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <Edit3 className="h-4 w-4 text-indigo-600" />

        <span>Edit Student</span>
      </button>

      {/* Activate / Deactivate */}
      <button
        type="button"
        onClick={() => onToggleStatus(student)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <Power
          className={`h-4 w-4 ${
            student.is_active
              ? "text-orange-500"
              : "text-green-600"
          }`}
        />

        <span>
          {student.is_active
            ? "Deactivate Student"
            : "Activate Student"}
        </span>
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(student)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />

        <span>Delete Student</span>
      </button>
    </div>
  );
};

export default StudentActionMenu;