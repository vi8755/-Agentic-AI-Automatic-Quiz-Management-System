import { useEffect, useMemo, useState } from "react";
import {
    X,
    UserPlus,
    User,
    Mail,
    Hash,
    Lock,
    BookOpen,
    Building2,
    GraduationCap,
    Layers,
} from "lucide-react";

const AddStudentModal = ({
    isOpen,
    onClose,
    onSubmit,
    sections = [],
    submitting = false,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        roll_no: "",
        password: "",
        section_id: "",
    });

    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: "",
                email: "",
                roll_no: "",
                password: "",
                section_id: "",
            });

            setFormError("");
        }
    }, [isOpen]);

    const selectedSection = useMemo(() => {
        return sections.find(
            (section) =>
                String(section.id) === String(formData.section_id)
        );
    }, [sections, formData.section_id]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (formError) {
            setFormError("");
        }
    };
    const isValidEmail = (email) => {
    const value = email.trim();

    const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    return emailRegex.test(value);
};

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.name.trim()) {
            setFormError("Student name is required.");
            return;
        }

        if (!formData.email.trim()) {
            setFormError("Student email is required.");
            return;
        }
        if (!isValidEmail(formData.email)) {
    setFormError(
        "Please enter a valid email address, e.g. student@gmail.com."
    );
    return;
}

        if (!formData.roll_no.trim()) {
            setFormError("Roll number is required.");
            return;
        }

        if (!formData.password) {
            setFormError("Password is required.");
            return;
        }

        if (!formData.section_id) {
            setFormError("Please select a section.");
            return;
        }

        try {
            // Student stores section_id.
            // Batch, department, year and semester are derived
            // from the selected section on the backend.
            await onSubmit({
                name: formData.name.trim(),
                email: formData.email.trim(),
                roll_no: formData.roll_no.trim(),
                password: formData.password,
                section_id: Number(formData.section_id),
            });
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                "Failed to create student.";

            setFormError(
                Array.isArray(message)
                    ? message[0]?.msg || "Invalid student data."
                    : message
            );
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                className="absolute inset-0"
                onClick={submitting ? undefined : onClose}
            />

            <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                            <UserPlus className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Add Student
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Create a new student account.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 p-6">
                        {formError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {formError}
                            </div>
                        )}

                        {/* =========================
                            Basic Information
                        ========================= */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                Basic Information
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Enter the student's personal and login information.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Student Name
                                </label>

                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter student name"
                                        disabled={submitting}
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Email
                                </label>

                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="student@example.com"
                                        disabled={submitting}
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Roll Number
                                </label>

                                <div className="relative">
                                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="text"
                                        name="roll_no"
                                        value={formData.roll_no}
                                        onChange={handleChange}
                                        placeholder="Enter roll number"
                                        disabled={submitting}
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Password
                                </label>

                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        disabled={submitting}
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* =========================
                            Academic Information
                        ========================= */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Academic Information
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Select the student's section. Batch, department,
                                year and semester are determined by the section.
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Section
                            </label>

                            <div className="relative">
                                <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                <select
                                    name="section_id"
                                    value={formData.section_id}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                >
                                    <option value="">
                                        {sections.length > 0
                                            ? "Select section"
                                            : "No sections available"}
                                    </option>

                                    {sections.map((section) => (
                                        <option
                                            key={section.id}
                                            value={section.id}
                                        >
                                            Section {section.section_name}
                                            {" — "}
                                            {section.batch_name || "No batch"}
                                            {" — Year "}
                                            {section.year}
                                            {" — Semester "}
                                            {section.semester}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {sections.length === 0 && (
                                <p className="mt-2 text-xs text-red-500">
                                    No sections were loaded. Please refresh the
                                    page and try again.
                                </p>
                            )}
                        </div>

                        {/* =========================
                            Derived Academic Details
                        ========================= */}
                        {selectedSection && (
                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-indigo-600" />

                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            Selected Academic Details
                                        </h4>

                                        <p className="text-xs text-gray-500">
                                            These values come from the selected section.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl bg-white p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <Layers className="h-4 w-4" />
                                            Batch
                                        </div>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {selectedSection.batch_name || "—"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-white p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <Building2 className="h-4 w-4" />
                                            Department
                                        </div>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {selectedSection.department || "—"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-white p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <GraduationCap className="h-4 w-4" />
                                            Year
                                        </div>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {selectedSection.year
                                                ? `Year ${selectedSection.year}`
                                                : "—"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-white p-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <BookOpen className="h-4 w-4" />
                                            Semester
                                        </div>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {selectedSection.semester
                                                ? `Semester ${selectedSection.semester}`
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting || sections.length === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Create Student
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;