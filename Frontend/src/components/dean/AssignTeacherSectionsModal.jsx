import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    X,
    Users,
    BookOpen,
    Calendar,
    Loader2,
    Trash2,
} from "lucide-react";

import {
    getTeacherAssignments,
    assignTeacherSections,
    removeTeacherSectionAssignment,
    getDeanSections,
    getDeanSubjects,
} from "../../services/deanApi";


const AssignTeacherSectionsModal = ({
    teacher,
    onClose,
    onSaved,
}) => {

    // =====================================================
    // Data
    // =====================================================

    const [assignments, setAssignments] = useState([]);

    const [sections, setSections] = useState([]);

    const [subjects, setSubjects] = useState([]);


    // =====================================================
    // Loading
    // =====================================================

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [removingId, setRemovingId] = useState(null);


    // =====================================================
    // Form
    // =====================================================

    const [subjectId, setSubjectId] = useState("");

    const [selectedSections, setSelectedSections] = useState([]);

    const [academicYear, setAcademicYear] = useState("");


    // =====================================================
    // Load Data
    // =====================================================

    useEffect(() => {
        loadData();
    }, [teacher]);


    const loadData = async () => {

        try {

            setLoading(true);

            const [
                assignmentData,
                sectionData,
                subjectData,
            ] = await Promise.all([
                getTeacherAssignments(teacher.id),
                getDeanSections(),
                getDeanSubjects(),
            ]);


            // -------------------------------------------------
            // Assignments
            // -------------------------------------------------

            setAssignments(
                Array.isArray(assignmentData)
                    ? assignmentData
                    : []
            );


            // -------------------------------------------------
            // Sections
            // -------------------------------------------------

            const loadedSections = Array.isArray(sectionData)
                ? sectionData
                : sectionData?.items || [];

            setSections(loadedSections);


            // -------------------------------------------------
            // Subjects
            // -------------------------------------------------

            setSubjects(
                Array.isArray(subjectData)
                    ? subjectData
                    : subjectData?.items || []
            );

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to load teacher assignments."
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // Get Selected Batch
    // =====================================================

    const getSelectedBatchId = () => {

        if (selectedSections.length === 0) {
            return null;
        }

        const selectedSection = sections.find(
            (section) =>
                Number(section.id) ===
                Number(selectedSections[0])
        );

        if (!selectedSection) {
            return null;
        }

        return selectedSection.batch_id
            ? Number(selectedSection.batch_id)
            : null;
    };


    // =====================================================
    // Get Selected Academic Year
    // =====================================================

    const getSelectedAcademicYear = () => {

        if (selectedSections.length === 0) {
            return "";
        }

        const selectedSection = sections.find(
            (section) =>
                Number(section.id) ===
                Number(selectedSections[0])
        );

        if (!selectedSection) {
            return "";
        }

        return (
            selectedSection.batch_name ||
            ""
        );
    };


    // =====================================================
    // Toggle Section
    // =====================================================

    const toggleSection = (sectionId) => {

        const numericSectionId = Number(sectionId);

        setSelectedSections((prev) => {

            // -------------------------------------------------
            // Remove section if already selected
            // -------------------------------------------------

            if (prev.includes(numericSectionId)) {

                const updatedSections = prev.filter(
                    (id) =>
                        id !== numericSectionId
                );

                // Update academic year
                if (updatedSections.length === 0) {

                    setAcademicYear("");

                } else {

                    const firstSection = sections.find(
                        (section) =>
                            Number(section.id) ===
                            Number(updatedSections[0])
                    );

                    setAcademicYear(
                        firstSection?.batch_name || ""
                    );
                }

                return updatedSections;
            }


            // -------------------------------------------------
            // Find section being selected
            // -------------------------------------------------

            const sectionToAdd = sections.find(
                (section) =>
                    Number(section.id) ===
                    numericSectionId
            );

            if (!sectionToAdd) {
                return prev;
            }


            // -------------------------------------------------
            // Current selected batch
            // -------------------------------------------------

            const currentBatchId =
                getSelectedBatchId();


            const newBatchId =
                sectionToAdd.batch_id
                    ? Number(sectionToAdd.batch_id)
                    : null;


            // -------------------------------------------------
            // Prevent different batches
            // -------------------------------------------------

            if (
                currentBatchId !== null &&
                newBatchId !== null &&
                currentBatchId !== newBatchId
            ) {

                toast.error(
                    "You can only select sections from the same batch."
                );

                return prev;
            }


            // -------------------------------------------------
            // If selected sections have a batch but
            // new section doesn't
            // -------------------------------------------------

            if (
                currentBatchId !== null &&
                newBatchId === null
            ) {

                toast.error(
                    "This section does not have a valid batch."
                );

                return prev;
            }


            // -------------------------------------------------
            // If new section has a batch but existing
            // selection doesn't
            // -------------------------------------------------

            if (
                currentBatchId === null &&
                prev.length > 0 &&
                newBatchId !== null
            ) {

                const firstSelectedSection =
                    sections.find(
                        (section) =>
                            Number(section.id) ===
                            Number(prev[0])
                    );

                if (
                    firstSelectedSection &&
                    !firstSelectedSection.batch_id
                ) {

                    toast.error(
                        "Selected sections must belong to the same batch."
                    );

                    return prev;
                }
            }


            // -------------------------------------------------
            // Add section
            // -------------------------------------------------

            const updatedSections = [
                ...prev,
                numericSectionId,
            ];


            // -------------------------------------------------
            // Automatically set academic year
            // -------------------------------------------------

            setAcademicYear(
                sectionToAdd.batch_name || ""
            );


            return updatedSections;

        });
    };


    // =====================================================
    // Submit
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        // -------------------------------------------------
        // Subject validation
        // -------------------------------------------------

        if (!subjectId) {

            toast.error(
                "Please select a subject."
            );

            return;
        }


        // -------------------------------------------------
        // Section validation
        // -------------------------------------------------

        if (selectedSections.length === 0) {

            toast.error(
                "Please select at least one section."
            );

            return;
        }


        // -------------------------------------------------
        // Batch validation
        // -------------------------------------------------

        const selectedSectionObjects =
            sections.filter(
                (section) =>
                    selectedSections.includes(
                        Number(section.id)
                    )
            );


        if (
            selectedSectionObjects.length !==
            selectedSections.length
        ) {

            toast.error(
                "One or more selected sections could not be found."
            );

            return;
        }


        const batchIds = [
            ...new Set(
                selectedSectionObjects.map(
                    (section) =>
                        section.batch_id
                            ? Number(section.batch_id)
                            : null
                )
            ),
        ];


        if (
            batchIds.length !== 1 ||
            batchIds[0] === null
        ) {

            toast.error(
                "All selected sections must belong to the same valid batch."
            );

            return;
        }


        // -------------------------------------------------
        // Academic year validation
        // -------------------------------------------------

        const selectedBatchName =
            selectedSectionObjects[0]?.batch_name;


        if (!selectedBatchName) {

            toast.error(
                "Selected section does not have a valid academic year."
            );

            return;
        }


        try {

            setSaving(true);


            await assignTeacherSections(
                teacher.id,
                {
                    subject_id: Number(subjectId),

                    section_ids:
                        selectedSections.map(Number),

                    academic_year:
                        selectedBatchName,
                }
            );


            toast.success(
                "Sections assigned successfully."
            );


            // -------------------------------------------------
            // Reset form
            // -------------------------------------------------

            setSubjectId("");

            setSelectedSections([]);

            setAcademicYear("");


            // -------------------------------------------------
            // Reload assignments
            // -------------------------------------------------

            await loadData();


            if (onSaved) {
                await onSaved();
            }

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to assign sections."
            );

        } finally {

            setSaving(false);

        }
    };


    // =====================================================
    // Remove Assignment
    // =====================================================

    const handleRemove = async (assignmentId) => {

        try {

            setRemovingId(assignmentId);


            await removeTeacherSectionAssignment(
                teacher.id,
                assignmentId
            );


            toast.success(
                "Section assignment removed."
            );


            await loadData();


            if (onSaved) {
                await onSaved();
            }

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to remove assignment."
            );

        } finally {

            setRemovingId(null);

        }
    };


    // =====================================================
    // Close on Escape
    // =====================================================

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key === "Escape") {
                onClose();
            }

        };


        window.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [onClose]);


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">


                {/* =================================================
                    Header
                ================================================= */}

                <div className="flex items-center justify-between border-b px-6 py-5">

                    <div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">

                                <Users
                                    size={21}
                                    className="text-purple-600"
                                />

                            </div>


                            <div>

                                <h2 className="text-xl font-bold text-gray-800">
                                    Assign Sections
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Manage teacher section assignments
                                </p>

                            </div>

                        </div>

                    </div>


                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={22} />
                    </button>

                </div>


                {/* =================================================
                    Body
                ================================================= */}

                <div className="flex-1 overflow-y-auto p-6">


                    {/* =================================================
                        Teacher Info
                    ================================================= */}

                    <div className="mb-6 rounded-xl bg-gray-50 p-4">

                        <h3 className="font-semibold text-gray-800">
                            {teacher.name}
                        </h3>


                        <div className="mt-1 text-sm text-gray-500">

                            {teacher.employee_id}

                            {" • "}

                            {teacher.department}

                        </div>

                    </div>


                    {loading ? (

                        <div className="flex items-center justify-center py-12">

                            <Loader2
                                className="animate-spin text-purple-600"
                                size={30}
                            />

                            <span className="ml-3 text-gray-500">
                                Loading assignments...
                            </span>

                        </div>

                    ) : (

                        <>


                            {/* =================================================
                                Current Assignments
                            ================================================= */}

                            <div className="mb-8">

                                <div className="mb-3 flex items-center gap-2">

                                    <BookOpen
                                        size={18}
                                        className="text-gray-600"
                                    />

                                    <h3 className="font-semibold text-gray-800">
                                        Current Assignments
                                    </h3>

                                </div>


                                {assignments.length === 0 ? (

                                    <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">

                                        No section assignments found.

                                    </div>

                                ) : (

                                    <div className="space-y-3">

                                        {assignments.map(
                                            (assignment) => (

                                                <div
                                                    key={assignment.id}
                                                    className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
                                                >

                                                    <div className="min-w-0">

                                                        <div className="font-medium text-gray-800">

                                                            {
                                                                assignment.subject_name
                                                            }

                                                        </div>


                                                        <div className="mt-2 flex flex-wrap gap-2 text-sm">

                                                            <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">

                                                                Section{" "}

                                                                {
                                                                    assignment.section_name
                                                                }

                                                            </span>


                                                            <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-700">

                                                                {
                                                                    assignment.academic_year
                                                                }

                                                            </span>


                                                            {assignment.year && (

                                                                <span className="rounded-md bg-purple-50 px-2 py-1 text-purple-700">

                                                                    Year{" "}

                                                                    {
                                                                        assignment.year
                                                                    }

                                                                </span>

                                                            )}


                                                            {assignment.semester && (

                                                                <span className="rounded-md bg-green-50 px-2 py-1 text-green-700">

                                                                    Semester{" "}

                                                                    {
                                                                        assignment.semester
                                                                    }

                                                                </span>

                                                            )}

                                                        </div>


                                                        {assignment.department && (

                                                            <div className="mt-2 text-xs text-gray-500">

                                                                {assignment.department}

                                                            </div>

                                                        )}

                                                    </div>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemove(
                                                                assignment.id
                                                            )
                                                        }
                                                        disabled={
                                                            removingId ===
                                                            assignment.id
                                                        }
                                                        className="ml-4 shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Remove assignment"
                                                    >

                                                        {removingId ===
                                                        assignment.id ? (

                                                            <Loader2
                                                                size={18}
                                                                className="animate-spin"
                                                            />

                                                        ) : (

                                                            <Trash2
                                                                size={18}
                                                            />

                                                        )}

                                                    </button>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                Add New Assignment
                            ================================================= */}

                            <form onSubmit={handleSubmit}>

                                <div className="mb-4">

                                    <h3 className="mb-4 font-semibold text-gray-800">
                                        Add New Assignment
                                    </h3>

                                </div>


                                {/* =================================================
                                    Subject
                                ================================================= */}

                                <div className="mb-5">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">

                                        Subject

                                    </label>


                                    <select
                                        value={subjectId}
                                        onChange={(e) =>
                                            setSubjectId(
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                    >

                                        <option value="">
                                            Select Subject
                                        </option>


                                        {subjects.map(
                                            (subject) => (

                                                <option
                                                    key={subject.id}
                                                    value={subject.id}
                                                >

                                                    {
                                                        subject.subject_name
                                                    }

                                                    {" ("}

                                                    {
                                                        subject.subject_code
                                                    }

                                                    {")"}

                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                {/* =================================================
                                    Sections
                                ================================================= */}

                                <div className="mb-5">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">

                                        Sections

                                    </label>


                                    {sections.length === 0 ? (

                                        <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">

                                            No active sections available.

                                        </div>

                                    ) : (

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">

                                            {sections.map(
                                                (section) => {

                                                    const sectionId =
                                                        Number(
                                                            section.id
                                                        );


                                                    const selected =
                                                        selectedSections.includes(
                                                            sectionId
                                                        );


                                                    const selectedBatchId =
                                                        getSelectedBatchId();


                                                    const sectionBatchId =
                                                        section.batch_id
                                                            ? Number(
                                                                section.batch_id
                                                            )
                                                            : null;


                                                    const differentBatch =
                                                        selectedSections.length >
                                                            0 &&
                                                        selectedBatchId !== null &&
                                                        sectionBatchId !== null &&
                                                        selectedBatchId !==
                                                            sectionBatchId;


                                                    return (

                                                        <button
                                                            key={
                                                                section.id
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                toggleSection(
                                                                    sectionId
                                                                )
                                                            }
                                                            className={`rounded-xl border p-4 text-left transition ${
                                                                selected
                                                                    ? "border-purple-600 bg-purple-50 text-purple-700"
                                                                    : differentBatch
                                                                    ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                                                    : "border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-gray-50"
                                                            }`}
                                                        >

                                                            <div className="flex items-start justify-between">

                                                                <div className="font-semibold">

                                                                    Section{" "}

                                                                    {
                                                                        section.section_name
                                                                    }

                                                                </div>


                                                                {selected && (

                                                                    <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-semibold text-white">

                                                                        Selected

                                                                    </span>

                                                                )}

                                                            </div>


                                                            {section.department && (

                                                                <div className="mt-2 text-xs text-gray-500">

                                                                    {
                                                                        section.department
                                                                    }

                                                                </div>

                                                            )}


                                                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">

                                                                <span>
                                                                    Batch:
                                                                </span>

                                                                <span className="font-medium text-gray-700">

                                                                    {
                                                                        section.batch_name ||
                                                                        "N/A"
                                                                    }

                                                                </span>

                                                            </div>


                                                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">

                                                                <span>
                                                                    Year:
                                                                </span>

                                                                <span className="font-medium text-gray-700">

                                                                    {
                                                                        section.year ??
                                                                        "N/A"
                                                                    }

                                                                </span>


                                                                <span>
                                                                    •
                                                                </span>


                                                                <span>
                                                                    Semester:
                                                                </span>

                                                                <span className="font-medium text-gray-700">

                                                                    {
                                                                        section.semester ??
                                                                        "N/A"
                                                                    }

                                                                </span>

                                                            </div>


                                                            {differentBatch && (

                                                                <div className="mt-2 text-[11px] font-medium text-red-500">

                                                                    Different batch

                                                                </div>

                                                            )}

                                                        </button>

                                                    );

                                                }
                                            )}

                                        </div>

                                    )}

                                </div>


                                {/* =================================================
                                    Academic Year
                                ================================================= */}

                                <div className="mb-2">

                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">

                                        <Calendar size={16} />

                                        Academic Year

                                    </label>


                                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">

                                        <span className="font-medium text-gray-700">

                                            {academicYear || "Select a section"}

                                        </span>

                                    </div>


                                    <p className="mt-1 text-xs text-gray-500">

                                        Academic year is automatically taken from the selected section's batch.

                                    </p>

                                </div>


                                {/* =================================================
                                    Footer
                                ================================================= */}

                                <div className="mt-6 flex justify-end gap-3 border-t pt-5">

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={saving}
                                        className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                    >

                                        Cancel

                                    </button>


                                    <button
                                        type="submit"
                                        disabled={
                                            saving ||
                                            !subjectId ||
                                            selectedSections.length === 0
                                        }
                                        className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >

                                        {saving && (

                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />

                                        )}


                                        {saving
                                            ? "Assigning..."
                                            : "Assign Sections"}

                                    </button>

                                </div>

                            </form>

                        </>

                    )}

                </div>

            </div>

        </div>

    );
};


export default AssignTeacherSectionsModal;