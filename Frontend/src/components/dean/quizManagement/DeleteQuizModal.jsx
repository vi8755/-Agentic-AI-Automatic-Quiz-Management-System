import {
    X,
    Trash2,
    AlertTriangle,
    Loader2,
} from "lucide-react";

const DeleteQuizModal = ({
    isOpen,
    onClose,
    onConfirm,
    quiz,
    deleting = false,
}) => {
    if (!isOpen || !quiz) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">

            {/* Modal */}
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                            <Trash2 size={20} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Delete Quiz
                            </h2>

                            <p className="text-xs text-slate-500">
                                This action cannot be undone
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>

                </div>


                {/* Content */}
                <div className="px-6 py-6">

                    <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

                        <AlertTriangle
                            size={20}
                            className="mt-0.5 shrink-0 text-red-600"
                        />

                        <div>

                            <p className="text-sm font-semibold text-red-800">
                                Are you sure you want to delete this quiz?
                            </p>

                            <p className="mt-1 text-sm leading-5 text-red-700">
                                The quiz and its associated data may be
                                permanently removed.
                            </p>

                        </div>

                    </div>


                    {/* Quiz Information */}
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Quiz
                        </p>

                        <p className="mt-1 truncate text-base font-semibold text-slate-800">
                            {quiz.title || "Untitled Quiz"}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">

                            <div>
                                <p className="text-xs text-slate-400">
                                    Teacher
                                </p>

                                <p className="mt-0.5 truncate font-medium text-slate-700">
                                    {quiz.teacher_name || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-400">
                                    Questions
                                </p>

                                <p className="mt-0.5 font-medium text-slate-700">
                                    {quiz.total_questions ?? 0}
                                </p>
                            </div>

                        </div>

                    </div>

                </div>


                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        {deleting ? (
                            <>
                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />

                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={17} />

                                Delete Quiz
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
};

export default DeleteQuizModal;