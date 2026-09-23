import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ArrowLeft,
    GraduationCap,
    Mail,
    Send,
    Loader2,
    ShieldCheck,
} from "lucide-react";

import { forgotPassword } from "../api/authApi";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            toast.error("Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            await forgotPassword(trimmedEmail);

            setSubmitted(true);

            toast.success(
                "If an account exists, a reset link has been sent."
            );

        } catch (error) {
            console.error(
                "Forgot password error:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                "Unable to process your request."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">

            <div className="w-full max-w-md">

                {/* Logo */}

                <div className="mb-8 flex items-center justify-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600">

                        <GraduationCap className="h-6 w-6 text-white" />

                    </div>

                    <div>

                        <p className="text-xs font-medium text-slate-500">
                            AI Training Platform
                        </p>

                        <p className="font-bold text-slate-900">
                            Agentic AI Quiz System
                        </p>

                    </div>

                </div>

                {/* Card */}

                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">

                    <div className="mb-7">

                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">

                            <ShieldCheck className="h-6 w-6 text-indigo-600" />

                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Forgot your password?
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Enter your registered email address and
                            we'll send you a password reset link.
                        </p>

                    </div>

                    {submitted ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">

                            <div className="flex gap-3">

                                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                                <div>

                                    <p className="text-sm font-semibold text-emerald-800">
                                        Check your email
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                                        If an account with that email
                                        exists, a password reset link
                                        has been sent.
                                    </p>

                                </div>

                            </div>

                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >

                            <div>

                                <label
                                    htmlFor="forgot-email"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Email Address
                                </label>

                                <div className="relative">

                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="forgot-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(
                                                e.target.value
                                            )
                                        }
                                        disabled={loading}
                                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                                    />

                                </div>

                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >

                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Send Reset Link
                                    </>
                                )}

                            </button>

                        </form>
                    )}

                    {/* Back to Login */}

                    <div className="mt-7 border-t border-slate-100 pt-6">

                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                        >

                            <ArrowLeft className="h-4 w-4" />

                            Back to Login

                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default ForgotPassword;