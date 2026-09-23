import {
X,
Trash2,
AlertTriangle,
Loader2,
Mail,
Hash,
} from "lucide-react";

const DeleteStudentModal = ({
isOpen,
onClose,
onConfirm,
student,
submitting = false,
}) => {
if (!isOpen || !student) {
return null;
}

const handleClose = () => {
if (submitting) {
return;
}

 
onClose();
 

};

return ( <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"> <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
{/* Header */} <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5"> <div className="flex items-center gap-3"> <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50"> <Trash2 className="h-5 w-5 text-red-600" /> </div>

 
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Delete Student
          </h2>

          <p className="text-xs text-gray-500">
            Permanent account deletion
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClose}
        disabled={submitting}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    {/* Content */}
    <div className="px-6 py-6">
      {/* Warning */}
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              This action cannot be undone.
            </p>

            <p className="mt-1 text-xs leading-5 text-red-700">
              Deleting this student will permanently remove
              the student account and associated student
              record.
            </p>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
            {student.name?.charAt(0)?.toUpperCase() || "S"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {student.name || "Unknown Student"}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-400" />

                <span className="text-xs text-gray-500">
                  {student.email || "No email"}
                </span>
              </div>

              {student.roll_no && (
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-gray-400" />

                  <span className="text-xs text-gray-500">
                    {student.roll_no}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Text */}
      <p className="mt-5 text-sm leading-6 text-gray-600">
        Are you sure you want to permanently delete{" "}
        <span className="font-semibold text-gray-900">
          {student.name}
        </span>
        ? Please confirm this action.
      </p>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
      <button
        type="button"
        onClick={handleClose}
        disabled={submitting}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Delete Student
          </>
        )}
      </button>
    </div>
  </div>
</div>
 

);
};

export default DeleteStudentModal;
