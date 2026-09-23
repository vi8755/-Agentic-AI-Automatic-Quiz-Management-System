import React from "react";


const ConfirmModal = ({
        title,
    message,
    confirmText = "Confirm",
    confirmColor = "red",
    loading = false,
    onConfirm,
    onCancel,

}) => {


    return (

        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
        >

            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95"
                onClick={(e)=>e.stopPropagation()}
            >


                <h2 className="text-xl font-bold text-gray-900">
                    {title}
                </h2>


                <p className="text-gray-500 mt-3">
                    {message}
                </p>


                <div className="flex justify-end gap-3 mt-6">


                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg border hover:bg-gray-100"
                    >
                        Cancel
                    </button>


                    <button
    onClick={onConfirm}
    disabled={loading}
    className={`px-5 py-2 rounded-lg text-white transition ${
    loading
        ? "bg-gray-400 cursor-not-allowed"
        : confirmColor === "green"
        ? "bg-green-600 hover:bg-green-700"
        : "bg-red-600 hover:bg-red-700"
}`}
   
>
     {loading
    ? confirmText === "Deactivate"
        ? "Deactivating..."
        : confirmText === "Activate"
            ? "Activating..."
            : confirmText === "Delete"
                ? "Deleting..."
                : "Processing..."
    : confirmText}
</button>


                </div>


            </div>


        </div>

    );

};


export default ConfirmModal;