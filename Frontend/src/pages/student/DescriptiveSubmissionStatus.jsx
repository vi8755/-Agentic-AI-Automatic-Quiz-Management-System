import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    CheckCircle,
    Loader2,
    AlertCircle,
    ArrowLeft,
    FileText,
} from "lucide-react";
import { toast } from "react-toastify";

import {
    getStudentDescriptiveSubmission,
} from "../../api/studentApi";


const DescriptiveSubmissionStatus = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("Pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =========================================================
    // CHECK EVALUATION STATUS
    // =========================================================

    useEffect(() => {
        if (!assignmentId) {
            setError("Invalid assignment ID.");
            setLoading(false);
            return;
        }

        let intervalId;

        const checkStatus = async () => {
            try {
                const data =
                    await getStudentDescriptiveSubmission(
                        assignmentId
                    );

                console.log(
                    "DESCRIPTIVE SUBMISSION STATUS:",
                    data
                );

                const evaluationStatus =
                    data?.evaluation_status ||
                    data?.status ||
                    "Pending";

                setStatus(evaluationStatus);
                setLoading(false);

                // =================================================
                // EVALUATION COMPLETED
                // =================================================

                if (
                    evaluationStatus.toLowerCase() ===
                        "completed" ||
                    evaluationStatus.toLowerCase() ===
                        "evaluated"
                ) {
                    clearInterval(intervalId);
                }

                // =================================================
                // EVALUATION FAILED
                // =================================================

                if (
                    evaluationStatus.toLowerCase() ===
                    "failed"
                ) {
                    clearInterval(intervalId);
                }

            } catch (err) {
                console.error(
                    "Failed to check evaluation status:",
                    err
                );

                const message =
                    err?.response?.data?.detail ||
                    "Unable to check evaluation status.";

                setError(message);
                setLoading(false);

                clearInterval(intervalId);
            }
        };


        // First check immediately
        checkStatus();


        // Then check every 5 seconds
        intervalId = setInterval(
            checkStatus,
            5000
        );


        return () => {
            clearInterval(intervalId);
        };

    }, [assignmentId]);


    // =========================================================
    // NORMALIZE STATUS
    // =========================================================

    const normalizedStatus =
        status?.toLowerCase();


    const isCompleted =
        normalizedStatus === "completed" ||
        normalizedStatus === "evaluated";


    const isFailed =
        normalizedStatus === "failed";


    const isProcessing =
        normalizedStatus === "processing";


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">

                <div className="max-w-3xl mx-auto">

                    <button
                        onClick={() =>
                            navigate(
                                "/student/dashboard"
                            )
                        }
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft size={18} />

                        Back to Dashboard
                    </button>


                    <div className="bg-white rounded-2xl shadow-sm p-10 text-center">

                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">

                            <AlertCircle
                                size={32}
                                className="text-red-600"
                            />

                        </div>


                        <h2 className="text-xl font-bold text-gray-900">
                            Unable to Check Evaluation
                        </h2>


                        <p className="text-gray-500 mt-2">
                            {error}
                        </p>


                        <button
                            onClick={() =>
                                window.location.reload()
                            }
                            className="mt-6 px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                        >
                            Try Again
                        </button>

                    </div>

                </div>

            </div>
        );
    }


    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            <div className="max-w-3xl mx-auto">

                {/* BACK */}

                <button
                    onClick={() =>
                        navigate(
                            "/student/dashboard"
                        )
                    }
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <ArrowLeft size={18} />

                    Back to Dashboard
                </button>


                {/* CARD */}

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

                    {/* HEADER */}

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 md:p-10 text-white text-center">

                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">

                            <FileText size={32} />

                        </div>


                        <h1 className="text-2xl md:text-3xl font-bold mt-5">
                            Assignment Submitted Successfully
                        </h1>


                        <p className="text-purple-100 mt-2">
                            Assignment #{assignmentId}
                        </p>

                    </div>


                    {/* STATUS */}

                    <div className="p-8 md:p-10 text-center">

                        {isCompleted ? (

                            <>
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">

                                    <CheckCircle
                                        size={42}
                                        className="text-green-600"
                                    />

                                </div>


                                <h2 className="text-2xl font-bold text-gray-900 mt-6">
                                    Evaluation Completed
                                </h2>


                                <p className="text-gray-500 mt-2">
                                    Your assignment has been evaluated successfully.
                                </p>


                                <button
                                    onClick={() =>
                                        navigate(
                                            `/student/descriptive-assignments/${assignmentId}/result`
                                        )
                                    }
                                    className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                                >
                                    <CheckCircle size={19} />

                                    View Result
                                </button>
                            </>

                        ) : isFailed ? (

                            <>
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">

                                    <AlertCircle
                                        size={42}
                                        className="text-red-600"
                                    />

                                </div>


                                <h2 className="text-2xl font-bold text-gray-900 mt-6">
                                    Evaluation Failed
                                </h2>


                                <p className="text-gray-500 mt-2">
                                    We were unable to evaluate your assignment.
                                </p>


                                <button
                                    onClick={() =>
                                        navigate(
                                            "/student/dashboard"
                                        )
                                    }
                                    className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                                >
                                    <ArrowLeft size={19} />

                                    Back to Dashboard
                                </button>
                            </>

                        ) : (

                            <>
                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">

                                    <Loader2
                                        size={42}
                                        className="text-purple-600 animate-spin"
                                    />

                                </div>


                                <h2 className="text-2xl font-bold text-gray-900 mt-6">
                                    {isProcessing
                                        ? "Evaluation in Progress"
                                        : "Evaluation Pending"}
                                </h2>


                                <p className="text-gray-500 mt-2 max-w-lg mx-auto">
                                    Your assignment has been submitted successfully.
                                    Our AI evaluation system is processing your answers.
                                </p>


                                <div className="mt-7 bg-purple-50 border border-purple-100 rounded-xl p-4">

                                    <p className="text-sm text-purple-700 font-medium">
                                        Current Status
                                    </p>

                                    <p className="text-lg font-bold text-purple-800 mt-1">
                                        {status}
                                    </p>

                                </div>


                                <p className="text-xs text-gray-400 mt-5">
                                    This page automatically checks the evaluation status.
                                    Please keep this page open.
                                </p>

                            </>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
};


export default DescriptiveSubmissionStatus;