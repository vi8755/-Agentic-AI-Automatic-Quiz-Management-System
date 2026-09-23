import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState("");

    const verificationStarted = useRef(false);

    useEffect(() => {
        // Prevent duplicate verification request
        if (verificationStarted.current) {
            return;
        }

        verificationStarted.current = true;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Verification token is missing.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.get(
                    `/auth/verify-email?token=${encodeURIComponent(token)}`
                );

                setStatus("success");

                setMessage(
                    response.data?.message ||
                    "Email verified successfully."
                );
            } catch (error) {
                setStatus("error");

                setMessage(
                    error.response?.data?.detail ||
                    "Email verification failed. The link may be invalid or expired."
                );
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 text-center">

                {/* VERIFYING */}
                {status === "verifying" && (
                    <>
                        <div className="mx-auto mb-5 w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Verifying Email
                        </h1>

                        <p className="text-gray-500 mt-3">
                            Please wait while we verify your email address...
                        </p>
                    </>
                )}

                {/* SUCCESS */}
                {status === "success" && (
                    <>
                        <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                            <span className="text-3xl text-green-600">
                                ✓
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Email Verified!
                        </h1>

                        <p className="text-gray-500 mt-3">
                            {message}
                        </p>

                        <button
                            onClick={() => navigate("/login")}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                        >
                            Go to Login
                        </button>
                    </>
                )}

                {/* ERROR */}
                {status === "error" && (
                    <>
                        <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                            <span className="text-3xl text-red-600">
                                ✕
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Verification Failed
                        </h1>

                        <p className="text-red-500 mt-3">
                            {message}
                        </p>

                        <button
                            onClick={() => navigate("/login")}
                            className="mt-6 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition"
                        >
                            Go to Login
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};

export default VerifyEmail;