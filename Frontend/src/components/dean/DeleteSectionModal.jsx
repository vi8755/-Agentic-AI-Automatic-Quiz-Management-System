import React from "react";

const DeleteSectionModal = ({
    section,
    onClose,
    onConfirm,
    loading,
}) => {
    if (!section) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                {/* =========================
                    Header
                ========================= */}
                <div className="border-b px-6 py-5">

                    <div className="flex items-start gap-4">

                        {/* Warning Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m0 3.75h.008M10.29 3.86l-7.1 12.25A1.875 1.875 0 004.82 19h14.36a1.875 1.875 0 001.625-2.89l-7.1-12.25a1.875 1.875 0 00-3.25 0z"
                                />
                            </svg>

                        </div>

                        {/* Title */}
                        <div>

                            <h2 className="text-xl font-semibold text-gray-900">
                                Delete Section?
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                This action cannot be undone.
                            </p>

                        </div>

                    </div>

                </div>


                {/* =========================
                    Body
                ========================= */}
                <div className="px-6 py-5">

                    <p className="text-sm leading-6 text-gray-600">
                        Are you sure you want to permanently delete
                        the section{" "}
                        <span className="font-semibold text-gray-900">
                            "{section.section_name}"
                        </span>
                        ?
                    </p>

                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3">

                        <p className="text-sm text-red-700">
                            Deleting this section may affect students,
                            teachers, assignments, or other related
                            records.
                        </p>

                    </div>

                </div>


                {/* =========================
                    Footer
                ========================= */}
                <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

                    {/* Cancel */}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>


                    {/* Delete */}
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                        {loading ? "Deleting..." : "Delete Section"}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default DeleteSectionModal;