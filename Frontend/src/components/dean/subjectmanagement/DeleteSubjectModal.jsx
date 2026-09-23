import { AlertTriangle, X, Trash2 } from "lucide-react";

const DeleteSubjectModal = ({
    subject,
    onClose,
    onConfirm,
    loading,
}) => {

    if (!subject) return null;


    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="flex items-center justify-between border-b px-6 py-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">

                            <AlertTriangle
                                size={20}
                                className="text-red-600"
                            />

                        </div>

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                Delete Subject
                            </h2>

                            <p className="text-sm text-gray-500">
                                This action cannot be undone.
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
                    >

                        <X size={20} />

                    </button>

                </div>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="px-6 py-5">

                    <p className="text-sm leading-6 text-gray-600">

                        Are you sure you want to permanently delete this
                        subject?

                    </p>


                    {/* =================================================
                        SUBJECT DETAILS
                    ================================================= */}

                    <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">

                        <div className="flex items-center justify-between gap-4">

                            <div>

                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Subject
                                </p>

                                <p className="mt-1 font-semibold text-gray-900">
                                    {subject.subject_name}
                                </p>

                            </div>


                            <div>

                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Code
                                </p>

                                <p className="mt-1 font-semibold text-red-700">
                                    {subject.subject_code}
                                </p>

                            </div>

                        </div>


                        <div className="mt-3 flex items-center justify-between border-t border-red-100 pt-3">

                            <span className="text-sm text-gray-600">
                                Department
                            </span>

                            <span className="text-sm font-medium text-gray-800">
                                {subject.department}
                            </span>

                        </div>


                        <div className="mt-2 flex items-center justify-between">

                            <span className="text-sm text-gray-600">
                                Semester
                            </span>

                            <span className="text-sm font-medium text-gray-800">
                                Semester {subject.semester}
                            </span>

                        </div>

                    </div>


                    <p className="mt-4 text-xs text-gray-500">

                        Deleting a subject may affect related teacher
                        assignments or other records.

                    </p>

                </div>


                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex min-w-[130px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition ${
                            loading
                                ? "cursor-not-allowed bg-gray-400"
                                : "bg-red-600 hover:bg-red-700"
                        }`}
                    >

                        {loading ? (

                            <>

                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                Deleting...

                            </>

                        ) : (

                            <>

                                <Trash2 size={16} />

                                Delete Subject

                            </>

                        )}

                    </button>

                </div>

            </div>

        </div>

    );

};

export default DeleteSubjectModal;