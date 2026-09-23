import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SubjectModal = ({
    subject,
    onClose,
    onSubmit,
    loading,
}) => {

    // =====================================================
    // Form State
    // =====================================================

    const [formData, setFormData] = useState({
        subject_code: "",
        subject_name: "",
        department: "",
        semester: "",
    });


    // =====================================================
    // Error State
    // =====================================================

    const [errors, setErrors] = useState({});


    // =====================================================
    // Edit Mode
    // =====================================================

    const isEditMode = Boolean(subject);


    // =====================================================
    // Load Subject Data For Edit
    // =====================================================

    useEffect(() => {

        if (subject) {

            setFormData({
                subject_code:
                    subject.subject_code || "",

                subject_name:
                    subject.subject_name || "",

                department:
                    subject.department || "",

                semester:
                    subject.semester
                        ? String(subject.semester)
                        : "",
            });

        } else {

            setFormData({
                subject_code: "",
                subject_name: "",
                department: "",
                semester: "",
            });

        }

        setErrors({});

    }, [subject]);


    // =====================================================
    // Handle Input Change
    // =====================================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));


        // Clear field error when user starts typing

        if (errors[name]) {

            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));

        }

    };


    // =====================================================
    // Validate Form
    // =====================================================

    const validateForm = () => {

        const newErrors = {};


        // Subject Code

        if (!formData.subject_code.trim()) {

            newErrors.subject_code =
                "Subject code is required.";

        } else if (
            formData.subject_code.trim().length < 2
        ) {

            newErrors.subject_code =
                "Subject code must be at least 2 characters.";

        }


        // Subject Name

        if (!formData.subject_name.trim()) {

            newErrors.subject_name =
                "Subject name is required.";

        }


        // Department

        if (!formData.department.trim()) {

            newErrors.department =
                "Department is required.";

        }


        // Semester

        if (!formData.semester) {

            newErrors.semester =
                "Please select a semester.";

        }


        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;

    };


    // =====================================================
    // Submit
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (loading) return;


        const isValid = validateForm();

        if (!isValid) return;


        const payload = {
            subject_code:
                formData.subject_code.trim(),

            subject_name:
                formData.subject_name.trim(),

            department:
                formData.department.trim(),

            semester:
                Number(formData.semester),
        };


        await onSubmit(payload);

    };


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="flex items-center justify-between border-b px-6 py-4">

                    <div>

                        <h2 className="text-xl font-semibold text-gray-900">

                            {isEditMode
                                ? "Edit Subject"
                                : "Add Subject"}

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            {isEditMode
                                ? "Update subject information."
                                : "Create a new college subject."}

                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
                    >

                        <X size={20} />

                    </button>

                </div>


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-6"
                >


                    {/* =================================================
                        SUBJECT CODE
                    ================================================= */}

                    <div>

                        <label className="mb-1.5 block text-sm font-medium text-gray-700">

                            Subject Code

                            <span className="ml-1 text-red-500">
                                *
                            </span>

                        </label>

                        <input
                            type="text"
                            name="subject_code"
                            value={formData.subject_code}
                            onChange={handleChange}
                            placeholder="e.g. CSE301"
                            disabled={loading}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm uppercase outline-none transition ${
                                errors.subject_code
                                    ? "border-red-500 focus:ring-2 focus:ring-red-100"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            }`}
                        />

                        {errors.subject_code && (

                            <p className="mt-1 text-xs text-red-500">
                                {errors.subject_code}
                            </p>

                        )}

                    </div>


                    {/* =================================================
                        SUBJECT NAME
                    ================================================= */}

                    <div>

                        <label className="mb-1.5 block text-sm font-medium text-gray-700">

                            Subject Name

                            <span className="ml-1 text-red-500">
                                *
                            </span>

                        </label>

                        <input
                            type="text"
                            name="subject_name"
                            value={formData.subject_name}
                            onChange={handleChange}
                            placeholder="e.g. Database Management System"
                            disabled={loading}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                                errors.subject_name
                                    ? "border-red-500 focus:ring-2 focus:ring-red-100"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            }`}
                        />

                        {errors.subject_name && (

                            <p className="mt-1 text-xs text-red-500">
                                {errors.subject_name}
                            </p>

                        )}

                    </div>


                    {/* =================================================
                        DEPARTMENT
                    ================================================= */}

                    <div>

                        <label className="mb-1.5 block text-sm font-medium text-gray-700">

                            Department

                            <span className="ml-1 text-red-500">
                                *
                            </span>

                        </label>

                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            disabled={loading}
                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition ${
                                errors.department
                                    ? "border-red-500 focus:ring-2 focus:ring-red-100"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            }`}
                        >

                            <option value="">
                                Select Department
                            </option>

                            <option value="CSE">
                                Computer Science & Engineering
                            </option>

                            <option value="ECE">
                                Electronics & Communication Engineering
                            </option>

                            <option value="ME">
                                Mechanical Engineering
                            </option>

                            <option value="CE">
                                Civil Engineering
                            </option>

                            <option value="EE">
                                Electrical Engineering
                            </option>

                        </select>

                        {errors.department && (

                            <p className="mt-1 text-xs text-red-500">
                                {errors.department}
                            </p>

                        )}

                    </div>


                    {/* =================================================
                        SEMESTER
                    ================================================= */}

                    <div>

                        <label className="mb-1.5 block text-sm font-medium text-gray-700">

                            Semester

                            <span className="ml-1 text-red-500">
                                *
                            </span>

                        </label>

                        <select
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            disabled={loading}
                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition ${
                                errors.semester
                                    ? "border-red-500 focus:ring-2 focus:ring-red-100"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            }`}
                        >

                            <option value="">
                                Select Semester
                            </option>

                            <option value="1">
                                Semester 1
                            </option>

                            <option value="2">
                                Semester 2
                            </option>

                            <option value="3">
                                Semester 3
                            </option>

                            <option value="4">
                                Semester 4
                            </option>

                            <option value="5">
                                Semester 5
                            </option>

                            <option value="6">
                                Semester 6
                            </option>

                            <option value="7">
                                Semester 7
                            </option>

                            <option value="8">
                                Semester 8
                            </option>

                        </select>

                        {errors.semester && (

                            <p className="mt-1 text-xs text-red-500">
                                {errors.semester}
                            </p>

                        )}

                    </div>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="flex justify-end gap-3 border-t pt-5">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex min-w-[130px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition ${
                                loading
                                    ? "cursor-not-allowed bg-gray-400"
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
                        >

                            {loading ? (

                                <>

                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                    {isEditMode
                                        ? "Updating..."
                                        : "Creating..."}

                                </>

                            ) : (

                                isEditMode
                                    ? "Update Subject"
                                    : "Create Subject"

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};

export default SubjectModal;