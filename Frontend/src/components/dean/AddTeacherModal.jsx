
import { useEffect, useState } from "react";
import {
    getDeanSections,
    getDeanSubjects,
} from "../../services/deanApi";

const AddTeacherModal = ({
    onClose,
    onSubmit,
    loading = false,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        employee_id: "",
        department: "",
        designation: "",
        phone: "",
        section_id: "",
        subject_id: "",
        academic_year: "",
    });

    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const [error, setError] = useState("");

    // ---------------------------------
    // Load Sections & Subjects
    // ---------------------------------

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);

                const [sectionsData, subjectsData] =
                    await Promise.all([
                        getDeanSections(),
                        getDeanSubjects(),
                    ]);

                setSections(sectionsData);
                setSubjects(subjectsData);

            } catch (error) {
                console.error(error);
                setError(
                    "Failed to load sections and subjects."
                );
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, []);

    // ---------------------------------
    // Handle Input Change
    // ---------------------------------

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ---------------------------------
    // Submit
    // ---------------------------------

    const handleSubmit = (e) => {
        e.preventDefault();

        setError("");

        if (!formData.section_id) {
            setError("Please select a section.");
            return;
        }

        if (!formData.subject_id) {
            setError("Please select a subject.");
            return;
        }

        if (!formData.academic_year.trim()) {
            setError("Please enter academic year.");
            return;
        }

        onSubmit({
            ...formData,
            section_id: Number(formData.section_id),
            subject_id: Number(formData.subject_id),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Add Teacher 
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Create a teacher account and assign an academic section.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="text-2xl text-gray-400 hover:text-gray-700"
                    >
                        ×
                    </button>

                </div>

                {/* Body */}
                <form
                    onSubmit={handleSubmit}
                    className="max-h-[75vh] overflow-y-auto px-6 py-5"
                >

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {loadingData ? (
                        <div className="py-10 text-center text-gray-500">
                            Loading sections and subjects...
                        </div>
                    ) : (
                        <div className="space-y-5">

                            {/* Name */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter teacher name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="teacher@example.com"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter password"
                                />
                            </div>

                            {/* Employee ID */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Employee ID
                                </label>

                                <input
                                    type="text"
                                    name="employee_id"
                                    value={formData.employee_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="EMP101"
                                />
                            </div>

                            {/* Department */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Department
                                </label>

                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Computer Science"
                                />
                            </div>

                            {/* Designation */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Designation
                                </label>

                                <input
                                    type="text"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Assistant Professor"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Phone
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="9876543210"
                                />
                            </div>

                            {/* Section + Subject */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                {/* Section */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Section
                                    </label>

                                    <select
                                        name="section_id"
                                        value={formData.section_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            Select Section
                                        </option>

                                        {sections.map((section) => (
                                            <option
                                                key={section.id}
                                                value={section.id}
                                            >
                                                {section.section_name}
                                                {" - "}
                                                {section.department}
                                                {" - Sem "}
                                                {section.semester}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Subject
                                    </label>

                                    <select
                                        name="subject_id"
                                        value={formData.subject_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            Select Subject
                                        </option>

                                        {subjects.map((subject) => (
                                            <option
                                                key={subject.id}
                                                value={subject.id}
                                            >
                                                {subject.subject_name}
                                                {" ("}
                                                {subject.subject_code}
                                                {")"}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            {/* Academic Year */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Academic Year
                                </label>

                                <input
                                    type="text"
                                    name="academic_year"
                                    value={formData.academic_year}
                                    onChange={handleChange}
                                    required
                                    placeholder="2026-27"
                                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-6 flex justify-end gap-3 border-t pt-4">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border px-5 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || loadingData}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Creating..."
                                : "Create Teacher"}
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddTeacherModal;