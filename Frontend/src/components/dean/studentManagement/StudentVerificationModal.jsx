import React from "react";
import { Mail } from "lucide-react";
const StudentVerificationModal = ({
    isOpen,
    student,
    loading = false,
    onClose,
    onConfirm,
}) => {
    if (!isOpen || !student) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                {/* Header */}

                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                        <Mail className="h-5 w-5 text-orange-600" />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            Resend Verification Email
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Send a new verification link to this
                            student's email address?
                        </p>
                    </div>
                </div>

                {/* Student */}

                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">
                        {student.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        {student.email}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        Roll No: {student.roll_no}
                    </p>
                </div>

                {/* Actions */}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        {loading
                            ? "Sending..."
                            : "Resend Verification"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentVerificationModal;