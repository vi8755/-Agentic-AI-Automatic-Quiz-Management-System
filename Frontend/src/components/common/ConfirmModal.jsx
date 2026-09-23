import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

                <div className="flex items-center gap-3 mb-5">

                    <div className="bg-red-100 p-3 rounded-full">
                        <FaExclamationTriangle
                            className="text-red-600"
                            size={22}
                        />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {title}
                        </h2>
                    </div>

                </div>

                <p className="text-gray-600 leading-7">
                    {message}
                </p>

                <div className="flex justify-end gap-3 mt-8">

                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg border hover:bg-gray-100"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
                    >
                        {confirmText}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default ConfirmModal;