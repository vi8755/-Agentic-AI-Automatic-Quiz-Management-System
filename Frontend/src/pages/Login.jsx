import {
    GraduationCap,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import { useLocation } from "react-router-dom";

import LoginForm from "../components/common/LoginForm";

function Login() {
    const location = useLocation();

const redirectTo = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : null;
    return (
        <div className="min-h-screen bg-slate-50">

            <div className="grid min-h-screen lg:grid-cols-2">

                {/* ==========================================
                    LEFT BRANDING PANEL
                ========================================== */}

                <div className="relative hidden overflow-hidden bg-indigo-600 lg:flex">

                    {/* Decorative shapes */}

                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />

                    <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10" />

                    <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

                        {/* Logo */}

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">

                                <GraduationCap className="h-6 w-6 text-white" />

                            </div>

                            <div>

                                <p className="text-sm font-semibold text-indigo-100">
                                    AI Training Platform
                                </p>

                                <p className="text-lg font-bold text-white">
                                    Agentic AI Quiz System
                                </p>

                            </div>

                        </div>

                        {/* Main content */}

                        <div className="max-w-lg">

                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-50 backdrop-blur-sm">

                                <Sparkles className="h-4 w-4" />

                                Intelligent Quiz Management

                            </div>

                            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">

                                Smarter learning.
                                <br />

                                Better assessment.

                            </h1>

                            <p className="mt-6 max-w-md text-base leading-7 text-indigo-100">

                                Create, manage and evaluate AI-powered
                                quizzes through one intelligent academic
                                platform.

                            </p>

                        </div>

                        {/* Security */}

                        <div className="flex items-center gap-3 text-sm text-indigo-100">

                            <ShieldCheck className="h-5 w-5" />

                            Secure role-based access

                        </div>

                    </div>

                </div>

                {/* ==========================================
                    RIGHT LOGIN PANEL
                ========================================== */}

                <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">

                    <div className="w-full max-w-md">

                        {/* Mobile logo */}

                        <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">

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

                        {/* Login Card */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">

                            {/* Header */}

                            <div className="mb-8">

                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">

                                    <ShieldCheck className="h-6 w-6 text-indigo-600" />

                                </div>

                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">

                                    Welcome back

                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">

                                    Sign in to access your dashboard
                                    and continue your work.

                                </p>

                            </div>

                             <LoginForm redirectTo={redirectTo} />

                        </div>

                        {/* Footer */}

                        <p className="mt-6 text-center text-xs text-slate-400">

                            © {new Date().getFullYear()} Agentic AI Quiz
                            Management System

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;