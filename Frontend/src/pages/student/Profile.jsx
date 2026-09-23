import { useEffect, useMemo, useState } from "react";
import {
    User,
    Mail,
    GraduationCap,
    Building2,
    Layers3,
    CalendarDays,
    BookOpen,
    ShieldCheck,
    Hash,
    Loader2,
    AlertCircle,
} from "lucide-react";

import { getMyStudentProfile } from "../../api/studentApi";

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getMyStudentProfile();

                setProfile(data);
            } catch (err) {
                console.error("Failed to load student profile:", err);

                setError(
                    err?.response?.data?.detail ||
                        "Unable to load your profile."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const initials = useMemo(() => {
        if (!profile?.name) return "S";

        return profile.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0].toUpperCase())
            .join("");
    }, [profile]);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />

                    <p className="text-slate-500 text-sm">
                        Loading your profile...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900">
                        Unable to load profile
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <p className="text-slate-500">
                    No profile information found.
                </p>
            </div>
        );
    }

    const studentName = profile.name || "Student";
    const email = profile.email || "Not available";
    const rollNo = profile.roll_no || "Not available";
    const sectionName =
        profile.section_name ||
        profile.section?.section_name ||
        "Not assigned";

    const department =
        profile.department ||
        profile.section?.department ||
        "Not available";

    const year =
        profile.year ||
        profile.section?.year ||
        "Not available";

    const semester =
        profile.semester ||
        profile.section?.semester ||
        "Not available";

    const isActive =
        profile.is_active !== undefined
            ? profile.is_active
            : true;

    return (
        <div className="w-full px-5 py-6 md:px-8 lg:px-10">
            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                        <User className="h-6 w-6 text-indigo-600" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            My Profile
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 md:text-base">
                            View your personal and academic information.
                        </p>
                    </div>
                </div>

                {/* Status */}
                <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                        isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    <ShieldCheck className="h-4 w-4" />

                    {isActive
                        ? "Active Student"
                        : "Inactive Student"}
                </div>
            </div>

     

            {/* =====================================================
    PROFILE SUMMARY
===================================================== */}

<div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {/* Cover */}
    <div className="h-28 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 md:h-32" />

    {/* Profile information */}
    <div className="relative px-6 pb-6 md:px-8">
        {/* Avatar */}
        <div className="absolute -top-10 left-6 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-indigo-600 text-2xl font-bold text-white shadow-md md:left-8">
            {initials}
        </div>

        {/* Student information */}
        <div className="pt-14">
            <h2 className="text-2xl font-bold leading-tight text-slate-900">
                {studentName}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {email}
                </span>

                <span className="hidden text-slate-300 sm:inline">
                    •
                </span>

                <span className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4" />
                    {rollNo}
                </span>
            </div>
        </div>
    </div>
</div>

            {/* =====================================================
                PERSONAL INFORMATION
            ===================================================== */}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5 md:px-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                            <User className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Personal Information
                            </h2>

                            <p className="text-sm text-slate-500">
                                Your basic student information.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:p-7">
                    <InfoCard
                        icon={User}
                        label="Full Name"
                        value={studentName}
                    />

                    <InfoCard
                        icon={Mail}
                        label="Email Address"
                        value={email}
                    />

                    <InfoCard
                        icon={Hash}
                        label="Roll Number"
                        value={rollNo}
                    />

                    <InfoCard
                        icon={ShieldCheck}
                        label="Account Status"
                        value={isActive ? "Active" : "Inactive"}
                        valueClassName={
                            isActive
                                ? "text-emerald-600"
                                : "text-red-600"
                        }
                    />
                </div>
            </div>

            {/* =====================================================
                ACADEMIC INFORMATION
            ===================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5 md:px-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                            <GraduationCap className="h-5 w-5 text-violet-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Academic Information
                            </h2>

                            <p className="text-sm text-slate-500">
                                Your current academic details.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:p-7">
                    <InfoCard
                        icon={Building2}
                        label="Department"
                        value={department}
                    />

                    <InfoCard
                        icon={Layers3}
                        label="Section"
                        value={sectionName}
                    />

                    <InfoCard
                        icon={CalendarDays}
                        label="Academic Year"
                        value={year}
                    />

                    <InfoCard
                        icon={BookOpen}
                        label="Semester"
                        value={semester}
                    />
                </div>
            </div>

            {/* =====================================================
                FOOTER NOTE
            ===================================================== */}

            <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 px-5 py-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

                    <div>
                        <p className="text-sm font-medium text-slate-800">
                            Profile information
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Your profile information is managed by the
                            college administration. Contact your
                            administrator if any information needs to be
                            corrected.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =============================================================
   REUSABLE INFO CARD
============================================================= */

function InfoCard({
    icon: Icon,
    label,
    value,
    valueClassName = "text-slate-900",
}) {
    return (
        <div className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30">
            <div className="flex items-start gap-4">
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

export default Profile;