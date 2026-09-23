import { useState } from "react";
import { useNavigate, Link,useLocation, } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    LogIn,
    Loader2,
} from "lucide-react";

import {
    loginUser,
    getCurrentUser,
} from "../../api/authApi";

import { useAuth } from "../../context/AuthContext";

function LoginForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuthData } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            toast.error("Please enter your email.");
            return;
        }

        if (!password) {
            toast.error("Please enter your password.");
            return;
        }

        try {
            setLoading(true);

            // ==========================================
            // 1. Login
            // ==========================================

            const response = await loginUser(
                trimmedEmail,
                password
            );

            // ==========================================
            // 2. Store token
            // ==========================================

            localStorage.setItem(
                "token",
                response.access_token
            );

            // ==========================================
            // 3. Get authenticated user
            // ==========================================

            const currentUser = await getCurrentUser();

            // ==========================================
            // 4. Update AuthContext
            // ==========================================

            setAuthData(
                response.access_token,
                currentUser
            );

            toast.success("Login successful!");

            // ==========================================
            // 5. Role-based redirect
            // ==========================================

             // ==========================================
// 5. Redirect after login
// ==========================================

const from = location.state?.from;

// If user came from a protected page,
// return them to that page after login.
if (from) {
    navigate(
        from.pathname +
        (from.search || "") +
        (from.hash || ""),
        {
            replace: true,
        }
    );

    return;
}

// Otherwise use normal role-based redirect.
if (currentUser.role === "DEAN") {
    navigate("/dean/dashboard", {
        replace: true,
    });
} else if (currentUser.role === "TEACHER") {
    navigate("/teacher/dashboard", {
        replace: true,
    });
} else if (currentUser.role === "STUDENT") {
    navigate("/student/dashboard", {
        replace: true,
    });
} else {
    navigate("/", {
        replace: true,
    });
}

        } catch (error) {
            console.error("Login error:", error);

            const message =
                error?.response?.data?.detail ||
                error?.message ||
                "Invalid email or password.";

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5"
        >

            {/* ==========================================
                EMAIL
            ========================================== */}

            <div>
                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    Email Address
                </label>

                <div className="relative">

                    <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                </div>
            </div>

            {/* ==========================================
                PASSWORD
            ========================================== */}

            <div>

                <div className="mb-2 flex items-center justify-between">

                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Password
                    </label>

                    <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                    >
                        Forgot Password?
                    </Link>

                </div>

                <div className="relative">

                    <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        id="password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(
                                (prev) => !prev
                            )
                        }
                        disabled={loading}
                        aria-label={
                            showPassword
                                ? "Hide password"
                                : "Show password"
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>

                </div>
            </div>

            {/* ==========================================
                LOGIN BUTTON
            ========================================== */}

            <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
            >

                {loading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing in...
                    </>
                ) : (
                    <>
                        <LogIn className="h-5 w-5" />
                        Sign In
                    </>
                )}

            </button>

        </form>
    );
}

export default LoginForm;