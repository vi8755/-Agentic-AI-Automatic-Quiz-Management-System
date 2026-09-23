import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    Upload,
    Calendar,
    Users,
    CheckCircle,
    Save,
    Loader2,
    X,
} from "lucide-react";
import { toast } from "react-toastify";

import {
     getTeacherDescriptiveSections,
    uploadDescriptiveQuestionPdf,
    createTeacherDescriptiveAssignment,
    publishDescriptiveAssignment,
} from "../../../api/teacherApi";


const CreatePdfAssignment = () => {
    const navigate = useNavigate();

    // =========================================================
    // SECTIONS
    // =========================================================

    const [sections, setSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);

    // =========================================================
    // FORM
    // =========================================================

    const [formData, setFormData] = useState({
        title: "",
        subject_id: "",
        instructions: "",
        due_date: "",
        duration_value: "",
        duration_unit: "minutes",
        section_ids: [],
    });

    // =========================================================
    // PDF
    // =========================================================

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadedPdf, setUploadedPdf] = useState(null);

    // =========================================================
    // CREATE
    // =========================================================

    const [saving, setSaving] = useState(false);

    // =========================================================
    // LOAD SECTIONS
    // =========================================================

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        try {
            setLoadingSections(true);

            const data = await getTeacherDescriptiveSections();

            setSections(
                Array.isArray(data)
                    ? data
                    : data?.sections || []
            );
        } catch (error) {
            console.error(
                "Failed to load teacher sections:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load sections."
            );

            setSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================================================
    // SECTION SELECTION
    // =========================================================

    const toggleSection = (sectionId) => {
        setFormData((prev) => {
            const exists =
                prev.section_ids.includes(sectionId);

            return {
                ...prev,
                section_ids: exists
                    ? prev.section_ids.filter(
                          (id) => id !== sectionId
                      )
                    : [...prev.section_ids, sectionId],
            };
        });
    };

    const selectAllSections = () => {
        setFormData((prev) => ({
            ...prev,
            section_ids: sections
                .map((section) => section.id)
                .filter(
                    (id) =>
                        id !== undefined &&
                        id !== null
                ),
        }));
    };

    const clearSections = () => {
        setFormData((prev) => ({
            ...prev,
            section_ids: [],
        }));
    };

    // =========================================================
    // FILE SELECTION
    // =========================================================

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            toast.error("Only PDF files are allowed.");

            e.target.value = "";
            return;
        }

        setSelectedFile(file);
        setUploadedPdf(null);
    };

    // =========================================================
    // REMOVE SELECTED FILE
    // =========================================================

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setUploadedPdf(null);
    };

    // =========================================================
    // UPLOAD PDF
    // =========================================================

    const handleUploadPdf = async () => {
        if (!selectedFile) {
            toast.warning(
                "Please select a Question PDF first."
            );
            return;
        }

        try {
            setUploadingPdf(true);

            const formData = new FormData();

            formData.append("file", selectedFile);

            const response =
                await uploadDescriptiveQuestionPdf(
                    formData
                );

            console.log(
                "Question PDF uploaded:",
                response
            );

            setUploadedPdf({
                file_name:
                    response?.file_name ||
                    selectedFile.name,

                file_url: response?.file_url,
            });

            toast.success(
                "Question PDF uploaded successfully."
            );
        } catch (error) {
            console.error(
                "Question PDF upload error:",
                error?.response?.data || error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to upload Question PDF."
            );

            setUploadedPdf(null);
        } finally {
            setUploadingPdf(false);
        }
    };

    // =========================================================
    // VALIDATION
    // =========================================================

    const validate = () => {
    if (!formData.title.trim()) {
        toast.error(
            "Assignment title is required."
        );
        return false;
    }

    if (!formData.subject_id) {
        toast.error(
            "Subject ID is required."
        );
        return false;
    }

    if (!uploadedPdf?.file_url) {
        toast.error(
            "Please upload the Question PDF."
        );
        return false;
    }

    // =========================================
    // DURATION VALIDATION
    // =========================================

    if (
        !formData.duration_value ||
        Number(formData.duration_value) <= 0
    ) {
        toast.error(
            "Please enter a valid exam duration."
        );
        return false;
    }

    if (
        !["minutes", "hours", "days"].includes(
            formData.duration_unit
        )
    ) {
        toast.error(
            "Please select a valid duration unit."
        );
        return false;
    }

    // =========================================
    // SECTION VALIDATION
    // =========================================

    if (formData.section_ids.length === 0) {
        toast.error(
            "Please select at least one section."
        );
        return false;
    }

    return true;
};

    // =========================================================
    // CREATE PDF ASSIGNMENT
    // =========================================================

     const handleCreateAssignment = async () => {
        
    if (!validate()) {
        return;
    }
    let durationMinutes;

if (formData.duration_unit === "minutes") {
    durationMinutes = Number(formData.duration_value);
} else if (formData.duration_unit === "hours") {
    durationMinutes =
        Number(formData.duration_value) * 60;
} else if (formData.duration_unit === "days") {
    durationMinutes =
        Number(formData.duration_value) * 24 * 60;
}

    try {
        setSaving(true);

        // =====================================================
        // STEP 1: CREATE PDF ASSIGNMENT AS DRAFT
        // =====================================================

        const payload = {
    title: formData.title.trim(),

    subject_id: Number(
        formData.subject_id
    ),

    instructions:
        formData.instructions?.trim() ||
        null,

    due_date: formData.due_date
        ? new Date(
              formData.due_date
          ).toISOString()
        : null,


    duration_minutes: durationMinutes,
    assignment_type: "PDF",

    question_pdf_url:
        uploadedPdf.file_url,

    question_pdf_name:
        uploadedPdf.file_name,

    // IMPORTANT
    section_ids: formData.section_ids,

    // IMPORTANT
    academic_year: "2026-27",

    questions: [],
};

        console.log(
            "Creating PDF assignment:",
            payload
        );

        const assignment =
            await createTeacherDescriptiveAssignment(
                payload
            );

        console.log(
            "PDF assignment created:",
            assignment
        );

        // =====================================================
        // STEP 2: ASSIGN TO SELECTED SECTIONS
        // =====================================================

        await publishDescriptiveAssignment(
            assignment.id,
            {
                section_ids:
                    formData.section_ids,
            }
        );

        // =====================================================
        // SUCCESS
        // =====================================================

        toast.success(
            "PDF descriptive assignment created and published successfully."
        );

        navigate(
            "/teacher/descriptive-assignments"
        );

    } catch (error) {
        console.error(
            "Create PDF descriptive assignment error:",
            error?.response?.data || error
        );

        toast.error(
            error?.response?.data?.detail ||
                "Failed to create PDF assignment."
        );

    } finally {
        setSaving(false);
    }
};

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/teacher/descriptive-assignments"
                                )
                            }
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Create Assignment from PDF
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Upload a Question PDF and let the
                            system extract the questions
                            automatically.
                        </p>
                    </div>
                </div>

                {/* =====================================================
                    BASIC INFORMATION
                ====================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <FileText className="text-purple-600" />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                Assignment Information
                            </h2>

                            <p className="text-sm text-gray-500">
                                Basic details of the PDF assignment
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* TITLE */}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Assignment Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Java OOP PDF Assignment"
                                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        {/* SUBJECT */}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Subject ID
                            </label>

                            <input
                                type="number"
                                name="subject_id"
                                value={formData.subject_id}
                                onChange={handleChange}
                                placeholder="Subject ID"
                                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        {/* INSTRUCTIONS */}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">
                                Instructions
                            </label>

                            <textarea
                                name="instructions"
                                value={
                                    formData.instructions
                                }
                                onChange={handleChange}
                                rows={4}
                                placeholder="Write instructions for students..."
                                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        {/* DUE DATE */}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Due Date
                            </label>

                            <div className="relative">
                                <Calendar
                                    size={18}
                                    className="absolute left-3 top-3.5 text-gray-400"
                                />

                                <input
                                    type="datetime-local"
                                    name="due_date"
                                    value={
                                        formData.due_date
                                    }
                                    onChange={handleChange}
                                    className="w-full border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                        {/* DURATION */}
 {/* DURATION */}

<div>
    <label className="block text-sm font-medium mb-2">
        Exam Duration
    </label>

    <div className="flex gap-3">
        <input
            type="number"
            name="duration_value"
            value={formData.duration_value}
            onChange={handleChange}
            min="1"
            placeholder="e.g. 60"
            className="flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
        />

        <select
            name="duration_unit"
            value={formData.duration_unit}
            onChange={handleChange}
            className="w-36 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
        >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
        </select>
    </div>

    <p className="mt-1 text-xs text-gray-500">
        Choose how long students have to complete the examination.
    </p>
</div>

                    </div>
                </div>

                {/* =====================================================
                    QUESTION PDF
                ====================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <Upload className="text-red-600" />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                Question PDF
                            </h2>

                            <p className="text-sm text-gray-500">
                                Upload the PDF containing the
                                assignment questions.
                            </p>
                        </div>
                    </div>

                    {/* UPLOAD AREA */}

                    {!selectedFile ? (
                        <label className="block cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-purple-400 hover:bg-purple-50/30 transition">

                                <Upload
                                    size={42}
                                    className="mx-auto text-gray-400 mb-4"
                                />

                                <p className="font-semibold text-gray-800">
                                    Click to upload Question PDF
                                </p>

                                <p className="text-sm text-gray-500 mt-1">
                                    PDF files only
                                </p>

                                <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={
                                        handleFileChange
                                    }
                                    className="hidden"
                                />
                            </div>
                        </label>
                    ) : (
                        <div className="border rounded-2xl p-5">

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                                <div className="flex items-center gap-4">

                                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                        <FileText
                                            className="text-red-600"
                                            size={24}
                                        />
                                    </div>

                                    <div>
                                        <p className="font-semibold text-gray-900 break-all">
                                            {selectedFile.name}
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            {(
                                                selectedFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{" "}
                                            MB
                                        </p>
                                    </div>
                                </div>

                                {!uploadedPdf && (
                                    <button
                                        type="button"
                                        onClick={
                                            removeSelectedFile
                                        }
                                        disabled={
                                            uploadingPdf
                                        }
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* UPLOAD BUTTON */}

                            {!uploadedPdf && (
                                <button
                                    type="button"
                                    onClick={
                                        handleUploadPdf
                                    }
                                    disabled={
                                        uploadingPdf
                                    }
                                    className="mt-5 w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingPdf ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                            Uploading PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Upload
                                                size={18}
                                            />
                                            Upload Question PDF
                                        </>
                                    )}
                                </button>
                            )}

                            {/* UPLOAD SUCCESS */}

                            {uploadedPdf && (
                                <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">

                                    <div className="flex items-start gap-3">

                                        <CheckCircle
                                            className="text-green-600 mt-0.5 shrink-0"
                                            size={20}
                                        />

                                        <div>
                                            <p className="font-semibold text-green-800">
                                                PDF uploaded successfully
                                            </p>

                                            <p className="text-sm text-green-700 mt-1">
                                                The Question PDF is ready.
                                                Questions will be extracted
                                                when the assignment is created.
                                            </p>
                                        </div>

                                    </div>

                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* =====================================================
                    SECTIONS
                ====================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                    <div className="flex justify-between items-start mb-5">

                        <div className="flex items-center gap-3">

                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="text-blue-600" />
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold">
                                    Assign to Sections
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Select the sections that should
                                    receive this assignment.
                                </p>
                            </div>

                        </div>

                        <div className="flex gap-3">

                            <button
                                type="button"
                                onClick={
                                    selectAllSections
                                }
                                disabled={
                                    loadingSections ||
                                    sections.length === 0
                                }
                                className="text-sm text-purple-600 font-medium hover:text-purple-700 disabled:opacity-40"
                            >
                                Select All
                            </button>

                            <button
                                type="button"
                                onClick={
                                    clearSections
                                }
                                disabled={
                                    formData.section_ids
                                        .length === 0
                                }
                                className="text-sm text-gray-500 font-medium hover:text-gray-700 disabled:opacity-40"
                            >
                                Clear
                            </button>

                        </div>
                    </div>

                    {loadingSections ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2
                                className="animate-spin text-purple-600"
                            />
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No sections assigned to you.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                            {sections.map(
                                (section) => {
                                    const selected =
                                        formData.section_ids.includes(
                                            section.id
                                        );

                                    return (
                                        <button
                                            key={section.id}
                                            type="button"
                                            onClick={() =>
                                                toggleSection(
                                                    section.id
                                                )
                                            }
                                            className={`text-left border-2 rounded-xl p-4 transition ${
                                                selected
                                                    ? "border-purple-600 bg-purple-50"
                                                    : "border-gray-200 hover:border-purple-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">

                                                <div>
                                                    <p className="font-semibold">
                                                        {section.name ||
                                                            section.section_name ||
                                                            `Section ${section.id}`}
                                                    </p>

                                                    {section.department && (
                                                        <p className="text-sm text-gray-500">
                                                            {
                                                                section.department
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                        selected
                                                            ? "bg-purple-600 border-purple-600"
                                                            : "border-gray-300"
                                                    }`}
                                                >
                                                    {selected && (
                                                        <span className="text-white text-xs">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>

                                            </div>
                                        </button>
                                    );
                                }
                            )}

                        </div>
                    )}

                    {formData.section_ids.length >
                        0 && (
                        <div className="mt-4 bg-purple-50 text-purple-700 px-4 py-3 rounded-xl text-sm">
                            {formData.section_ids.length}{" "}
                            section(s) selected
                        </div>
                    )}
                </div>

                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row justify-end gap-3">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/teacher/descriptive-assignments"
                            )
                        }
                        disabled={saving}
                        className="flex items-center justify-center gap-2 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={
                            handleCreateAssignment
                        }
                        disabled={
                            saving ||
                            uploadingPdf ||
                            !uploadedPdf
                        }
                        className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="animate-spin"
                                />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Create PDF Assignment
                            </>
                        )}
                    </button>

                </div>

            </div>
        </div>
    );
};

export default CreatePdfAssignment;