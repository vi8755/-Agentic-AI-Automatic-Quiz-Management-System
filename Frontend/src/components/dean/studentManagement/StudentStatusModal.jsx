import { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

const StudentStatusModal = ({
  isOpen,
  onClose,
  student,
  onConfirm,
  submitting = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen || !student) {
    return null;
  }

  const isCurrentlyActive = Boolean(student.is_active);
  const newStatus = !isCurrentlyActive;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);

      await onConfirm(student.id, newStatus);
    } catch (error) {
      console.error("Failed to update student status:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = submitting || isProcessing;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isCurrentlyActive
                  ? "bg-red-50"
                  : "bg-green-50"
              }`}
            >
              {isCurrentlyActive ? (
                <ShieldOff className="h-5 w-5 text-red-600" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isCurrentlyActive
                  ? "Deactivate Student"
                  : "Activate Student"}
              </h2>

              <p className="text-xs text-gray-500">
                Change student account status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">

          {/* Student Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {student.name
                  ?.charAt(0)
                  ?.toUpperCase() || "S"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {student.name || "Unknown Student"}
                </p>

                <p className="truncate text-xs text-gray-500">
                  {student.email || "No email"}
                </p>

                {student.roll_no && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Roll No: {student.roll_no}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
            <span className="text-sm font-medium text-gray-600">
              Current Status
            </span>

            {isCurrentlyActive ? (
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
          </div>

          {/* Message */}
          <div
            className={`mt-4 rounded-xl border p-4 ${
              isCurrentlyActive
                ? "border-red-100 bg-red-50"
                : "border-green-100 bg-green-50"
            }`}
          >
            <div className="flex gap-3">

              {isCurrentlyActive ? (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              )}

              <div>
                <p
                  className={`text-sm font-semibold ${
                    isCurrentlyActive
                      ? "text-red-800"
                      : "text-green-800"
                  }`}
                >
                  {isCurrentlyActive
                    ? "Deactivate this student?"
                    : "Activate this student?"}
                </p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    isCurrentlyActive
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {isCurrentlyActive
                    ? "The student will no longer be able to use their active account until it is activated again."
                    : "The student will regain access to their active account."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
              isCurrentlyActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                {isCurrentlyActive
                  ? "Deactivating..."
                  : "Activating..."}
              </>
            ) : (
              <>
                {isCurrentlyActive ? (
                  <ShieldOff className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}

                {isCurrentlyActive
                  ? "Deactivate Student"
                  : "Activate Student"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentStatusModal;