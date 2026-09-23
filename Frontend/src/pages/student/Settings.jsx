import { useState } from "react";
import {
    Settings as SettingsIcon,
    User,
    Mail,
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    Bell,
    ClipboardCheck,
    Trophy,
    LogOut,
    Save,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
    changeStudentPassword,
} from "../../api/studentApi";
function Settings() {
    const navigate = useNavigate();

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false);

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [notifications, setNotifications] = useState({
        quizAssignments: true,
        quizResults: true,
        general: true,
    });

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

     const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
        toast.error("Please enter your current password.");
        return;
    }

    if (!passwordData.newPassword) {
        toast.error("Please enter a new password.");
        return;
    }

    if (passwordData.newPassword.length < 8) {
        toast.error(
            "New password must be at least 8 characters."
        );
        return;
    }

    if (
        passwordData.newPassword !==
        passwordData.confirmPassword
    ) {
        toast.error("New passwords do not match.");
        return;
    }

    try {
        await changeStudentPassword(
            passwordData.currentPassword,
            passwordData.newPassword
        );

        toast.success(
            "Password changed successfully."
        );

        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
    } catch (error) {
        toast.error(
            error.response?.data?.detail ||
            "Failed to change password."
        );
    }
};
    const handleNotificationChange = (name) => {
        setNotifications((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const handleLogout = () => {
        /*
         * We will connect this to your existing
         * authentication/logout flow if required.
         */

        toast.success("Logged out successfully.");

        setTimeout(() => {
            navigate("/login");
        }, 500);
    };

    return (
        <div className="w-full px-5 py-6 md:px-8 lg:px-10">

            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <div className="mb-7">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                        <SettingsIcon className="h-6 w-6 text-indigo-600" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            Settings
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 md:text-base">
                            Manage your account, security and
                            notification preferences.
                        </p>
                    </div>
                </div>
            </div>

            {/* =====================================================
                ACCOUNT INFORMATION
            ===================================================== */}

            <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-6 py-5 md:px-7">
                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                            <User className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Account Information
                            </h2>

                            <p className="text-sm text-slate-500">
                                Basic information associated with your
                                student account.
                            </p>
                        </div>

                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:p-7">

                    <SettingInfo
                        icon={User}
                        label="Account Type"
                        value="Student"
                    />

                    <SettingInfo
                        icon={ShieldCheck}
                        label="Account Status"
                        value="Active"
                        valueClassName="text-emerald-600"
                    />

                    <SettingInfo
                        icon={Mail}
                        label="Email"
                        value="Your registered email"
                    />

                    <SettingInfo
                        icon={ShieldCheck}
                        label="Security"
                        value="Password protected"
                    />

                </div>
            </section>

            {/* =====================================================
                SECURITY
            ===================================================== */}

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-6 py-5 md:px-7">
                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                            <Lock className="h-5 w-5 text-violet-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Security
                            </h2>

                            <p className="text-sm text-slate-500">
                                Keep your account secure by using a strong
                                password.
                            </p>
                        </div>

                    </div>
                </div>

                <form
                    onSubmit={handlePasswordSubmit}
                    className="space-y-5 p-6 md:p-7"
                >

                    <PasswordInput
                        label="Current Password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        show={showCurrentPassword}
                        setShow={setShowCurrentPassword}
                    />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <PasswordInput
                            label="New Password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            show={showNewPassword}
                            setShow={setShowNewPassword}
                        />

                        <PasswordInput
                            label="Confirm New Password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            show={showConfirmPassword}
                            setShow={setShowConfirmPassword}
                        />

                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                        <p className="text-xs leading-5 text-slate-600">
                            Use at least 8 characters for your password.
                            A combination of letters, numbers and special
                            characters is recommended.
                        </p>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-5">

                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <Save className="h-4 w-4" />

                            Change Password
                        </button>

                    </div>

                </form>
            </section>

            {/* =====================================================
                NOTIFICATIONS
            ===================================================== */}

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-6 py-5 md:px-7">
                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                            <Bell className="h-5 w-5 text-emerald-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Notifications
                            </h2>

                            <p className="text-sm text-slate-500">
                                Choose which notifications you want to
                                receive.
                            </p>
                        </div>

                    </div>
                </div>

                <div className="divide-y divide-slate-100">

                    <NotificationRow
                        icon={ClipboardCheck}
                        title="Quiz Assignments"
                        description="Receive notifications when a new quiz is assigned to you."
                        checked={notifications.quizAssignments}
                        onChange={() =>
                            handleNotificationChange(
                                "quizAssignments"
                            )
                        }
                    />

                    <NotificationRow
                        icon={Trophy}
                        title="Quiz Results"
                        description="Receive notifications when your quiz result is available."
                        checked={notifications.quizResults}
                        onChange={() =>
                            handleNotificationChange(
                                "quizResults"
                            )
                        }
                    />

                    <NotificationRow
                        icon={Bell}
                        title="General Notifications"
                        description="Receive important updates from your college."
                        checked={notifications.general}
                        onChange={() =>
                            handleNotificationChange("general")
                        }
                    />

                </div>
            </section>

            {/* =====================================================
                DANGER ZONE
            ===================================================== */}

            <section className="rounded-2xl border border-red-200 bg-white shadow-sm">

                <div className="border-b border-red-100 px-6 py-5 md:px-7">
                    <h2 className="text-lg font-semibold text-red-700">
                        Account Actions
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage your current session.
                    </p>
                </div>

                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-7">

                    <div>
                        <p className="font-medium text-slate-900">
                            Sign out of your account
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            You will need to log in again to access your
                            Student Portal.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                        <LogOut className="h-4 w-4" />

                        Logout
                    </button>

                </div>
            </section>

            {/* =====================================================
                FOOTER NOTE
            ===================================================== */}

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-start gap-3">

                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                    <p className="text-xs leading-5 text-slate-500">
                        Your account security is important. Never share
                        your password or login credentials with anyone.
                    </p>

                </div>
            </div>

        </div>
    );
}

/* =============================================================
   ACCOUNT INFO CARD
============================================================= */

function SettingInfo({
    icon: Icon,
    label,
    value,
    valueClassName = "text-slate-900",
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                    <Icon className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {label}
                    </p>

                    <p
                        className={`mt-1 break-words text-sm font-semibold ${valueClassName}`}
                    >
                        {value}
                    </p>
                </div>

            </div>
        </div>
    );
}

/* =============================================================
   PASSWORD INPUT
============================================================= */

function PasswordInput({
    label,
    name,
    value,
    onChange,
    show,
    setShow,
}) {
    return (
        <div>
            <label
                htmlFor={name}
                className="mb-2 block text-sm font-medium text-slate-700"
            >
                {label}
            </label>

            <div className="relative">

                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                    id={name}
                    name={name}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={
                        show
                            ? "Hide password"
                            : "Show password"
                    }
                >
                    {show ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>

            </div>
        </div>
    );
}

/* =============================================================
   NOTIFICATION ROW
============================================================= */

function NotificationRow({
    icon: Icon,
    title,
    description,
    checked,
    onChange,
}) {
    return (
        <div className="flex items-center justify-between gap-5 px-6 py-5 md:px-7">

            <div className="flex min-w-0 items-center gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                    <Icon className="h-5 w-5 text-slate-600" />
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                        {title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                </div>

            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={onChange}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    checked
                        ? "bg-indigo-600"
                        : "bg-slate-300"
                }`}
            >
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        checked
                            ? "left-6"
                            : "left-1"
                    }`}
                />
            </button>

        </div>
    );
}

export default Settings;