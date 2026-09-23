import { useState } from "react";
import {
    Eye,
    Trash2,
    Loader2,
} from "lucide-react";

import { deleteDeanQuiz } from "../../../services/deanApi";
import DeleteQuizModal from "./DeleteQuizModal";

const QuizActions = ({
    quiz,
    onRefresh,
    onView,
}) => {

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState("");


    // =====================================================
    // VIEW QUIZ
    // =====================================================

    const handleViewClick = () => {

        if (!quiz?.id) {
            return;
        }

        if (onView) {
            onView(quiz);
        }
    };


    // =====================================================
    // DELETE
    // =====================================================

    const handleDeleteClick = () => {

        setError("");

        setShowDeleteModal(true);
    };


    // =====================================================
    // CONFIRM DELETE
    // =====================================================

    const handleConfirmDelete = async () => {

        if (!quiz?.id) {
            return;
        }

        try {

            setDeleting(true);

            setError("");

            await deleteDeanQuiz(
                quiz.id
            );

            setShowDeleteModal(false);

            if (onRefresh) {
                await onRefresh();
            }

        } catch (error) {

            console.error(
                "Failed to delete quiz:",
                error
            );

            setError(
                error?.response?.data?.detail ||
                "Failed to delete quiz."
            );

        } finally {

            setDeleting(false);
        }
    };


    return (
        <>
            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <div className="flex items-center justify-end gap-2">

                {/* =================================================
                    VIEW
                ================================================= */}

                <button
                    type="button"
                    onClick={handleViewClick}
                    title="View Quiz"
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700"
                >

                    <Eye size={17} />

                    <span>
                        View
                    </span>

                </button>


                {/* =================================================
                    DELETE
                ================================================= */}

                <button
                    type="button"
                    onClick={handleDeleteClick}
                    title="Delete Quiz"
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    {deleting ? (
                        <Loader2
                            size={17}
                            className="animate-spin"
                        />
                    ) : (
                        <Trash2 size={17} />
                    )}

                    <span>
                        Delete
                    </span>

                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-xl">
                    {error}
                </div>
            )}


            {/* =================================================
                DELETE MODAL
            ================================================= */}

            <DeleteQuizModal
                isOpen={showDeleteModal}
                onClose={() => {
                    if (!deleting) {
                        setShowDeleteModal(false);
                    }
                }}
                onConfirm={handleConfirmDelete}
                quiz={quiz}
                deleting={deleting}
            />

        </>
    );
};

export default QuizActions;