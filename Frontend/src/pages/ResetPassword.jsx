import { useState } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    GraduationCap,
    Lock,
    Loader2,
    ShieldCheck,
} from "lucide-react";

import { resetPassword } from "../api/authApi";

function ResetPassword() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const params = useParams();

    /*
     * Supports both:
     *
     * /reset-password/:token
     *
     * and:
     *
     * /reset-password?token=...
     */

    const token =
        params.token ||
        searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error(
                "Invalid or missing password reset token."
            );
            return;
        }

        if (!newPassword) {
            toast.error("Please enter a new password.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error(
                "New password must be at least 8 characters long."
            );
            return;
        }

        if (!confirmPassword) {
            toast.error(
                "Please confirm your new password."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(
                "New passwords do not match."
            );
            return;
        }

        try {
            setLoading(true);

            await resetPassword(
                token,
                newPassword
            );

            setSuccess(true);

            toast.success(
                "Password reset successfully."
            );

        } catch (error) {
            console.error(
                "Reset password error:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                "Unable to reset your password."
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

                    {success ? (
                        <SuccessState />
                    ) : (
                        <>
                            <div className="mb-7">

                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">

                                    <ShieldCheck className="h-6 w-6 text-indigo-600" />

                                </div>

                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Create new password
                                </h1>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Choose a strong password for
                                    your account.
                                </p>

                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >

                                {/* New Password */}

                                <PasswordField
                                    id="new-password"
                                    label="New Password"
                                    value={newPassword}
                                    onChange={setNewPassword}
                                    show={showNewPassword}
                                    setShow={
                                        setShowNewPassword
                                    }
                                    disabled={loading}
                                />

                                {/* Confirm Password */}

                                <PasswordField
                                    id="confirm-password"
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={
                                        setConfirmPassword
                                    }
                                    show={
                                        showConfirmPassword
                                    }
                                    setShow={
                                        setShowConfirmPassword
                                    }
                                    disabled={loading}
                                />

                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">

                                    <p className="text-xs leading-5 text-slate-600">
                                        Your password must contain
                                        at least 8 characters.
                                    </p>

                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >

                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-5 w-5" />
                                            Reset Password
                                        </>
                                    )}

                                </button>

                            </form>

                            <div className="mt-7 border-t border-slate-100 pt-6">

                                <Link
                                    to="/login"
                                    className="flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                                >

                                    <ArrowLeft className="h-4 w-4" />

                                    Back to Login

                                </Link>

                            </div>
                        </>
                    )}

                </div>

            </div>

        </div>
    );
}

function PasswordField({
    id,
    label,
    value,
    onChange,
    show,
    setShow,
    disabled,
}) {
    return (
        <div>

            <label
                htmlFor={id}
                className="mb-2 block text-sm font-medium text-slate-700"
            >
                {label}
            </label>

            <div className="relative">

                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                    id={id}
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={`Enter ${label.toLowerCase()}`}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                />

                <button
                    type="button"
                    onClick={() =>
                        setShow((prev) => !prev)
                    }
                    disabled={disabled}
                    aria-label={
                        show
                            ? "Hide password"
                            : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                    {show ? (
                        <EyeOff className="h-5 w-5" />
                    ) : (
                        <Eye className="h-5 w-5" />
                    )}
                </button>

            </div>

        </div>
    );
}

function SuccessState() {
    return (
        <div className="py-5 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">

                <CheckCircle2 className="h-8 w-8 text-emerald-600" />

            </div>

            <h1 className="text-2xl font-bold text-slate-900">
                Password reset successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
                Your password has been updated successfully.
                You can now sign in using your new password.
            </p>

            <Link
                to="/login"
                className="mt-7 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
                Go to Login
            </Link>

        </div>
    );
}

export default ResetPassword;