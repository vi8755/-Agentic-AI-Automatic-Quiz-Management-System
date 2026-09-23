import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
    getQuizAssignments,
    exportQuizAssignments,
    assignQuizToSection,
    getTeacherSections,
} from "../../api/teacherApi";

const QuizAssignments = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const { quizId } = useParams();

    const [assignments, setAssignments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const [sections, setSections] = useState([]);

    // ========================================================
    // ASSIGNMENT FORM
    // ========================================================

    const [assignForm, setAssignForm] = useState({
        section_id: "",
        start_time: "",
        due_date: "",
    });

    const [assignLoading, setAssignLoading] = useState(false);

    // ========================================================
    // STATISTICS
    // ========================================================

    const totalAssigned = assignments.length;

    const filteredAssignments = assignments.filter(
        (assignment) =>
            assignment.student_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            assignment.roll_no.includes(searchTerm)
    );

    const completed = assignments.filter(
        (a) => a.status === "Completed"
    ).length;

    const pending = assignments.filter(
        (a) => a.status !== "Completed"
    ).length;

    // ========================================================
    // LOAD ASSIGNMENTS
    // ========================================================

    useEffect(() => {
        fetchAssignments();
    }, [quizId]);

    const fetchAssignments = async () => {
        try {
            const data = await getQuizAssignments(quizId);

            setAssignments(data);
        } catch (error) {
            console.error(error);

            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // LOAD TEACHER SECTIONS
    // ========================================================

    const fetchSections = async () => {
        try {
            const data = await getTeacherSections();

            setSections(data);
        } catch (error) {
            console.error(error);

            toast.error("Failed to load sections.");
        }
    };

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {
        return <p>Loading assignments...</p>;
    }

    // ========================================================
    // EXPORT EXCEL
    // ========================================================

    const handleExportExcel = async () => {
        try {
            const blob = await exportQuizAssignments(quizId);

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = "Quiz_Assignment_Report.xlsx";

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

            toast.success(
                "Excel report downloaded successfully."
            );
        } catch (error) {
            console.error("Export Error:", error);

            toast.error(
                error.response?.data?.detail ||
                    "Failed to export Excel report."
            );
        }
    };

    // ========================================================
    // OPEN ASSIGN MODAL
    // ========================================================

    const openAssignModal = async () => {
        await fetchSections();

        setShowAssignModal(true);
    };

    // ========================================================
    // CLOSE ASSIGN MODAL
    // ========================================================

    const closeAssignModal = () => {
        setShowAssignModal(false);

        setAssignForm({
            section_id: "",
            start_time: "",
            due_date: "",
        });
    };

    // ========================================================
    // FORM CHANGE
    // ========================================================

    const handleAssignChange = (e) => {
        const { name, value } = e.target;

        setAssignForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ========================================================
    // ASSIGN QUIZ
    // ========================================================

    const handleAssignQuiz = async () => {
        if (!assignForm.section_id) {
            toast.error("Please select a section.");
            return;
        }

        if (!assignForm.start_time) {
            toast.error("Please select quiz start date and time.");
            return;
        }

        if (!assignForm.due_date) {
            toast.error("Please select a due date.");
            return;
        }

        // ----------------------------------------------------
        // Validate start time < due date
        // ----------------------------------------------------

        const startDate = new Date(assignForm.start_time);
        const dueDate = new Date(assignForm.due_date);

        if (dueDate <= startDate) {
            toast.error(
                "Due date/time must be after quiz start date/time."
            );
            return;
        }

        try {
            setAssignLoading(true);

            // ------------------------------------------------
            // Send:
            //
            // section_id
            // start_time
            // due_date
            // ------------------------------------------------

            await assignQuizToSection(
                quizId,
                {
                    section_id: Number(assignForm.section_id),

                    // Convert datetime-local into ISO format
                    start_time: new Date(
                        assignForm.start_time
                    ).toISOString(),

                    due_date: new Date(
                        assignForm.due_date
                    ).toISOString(),
                }
            );

            toast.success(
                "Quiz assigned successfully."
            );

            closeAssignModal();

            fetchAssignments();
        } catch (error) {
            console.error("Assign Error:", error);
            console.error(
                "Response:",
                error.response
            );

            toast.error(
                error.response?.data?.detail ||
                    error.response?.data?.message ||
                    "Assignment failed."
            );
        } finally {
            setAssignLoading(false);
        }
    };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div>

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="flex justify-between items-start mb-8">

                <div>
                    <h1 className="text-4xl font-bold mb-2">
                        Quiz Assignments
                    </h1>

                    <p className="text-gray-500">
                        Manage students assigned to this quiz.
                    </p>
                </div>

                <div className="flex gap-3">

                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                        Export Excel
                    </button>

                    <button
                        onClick={openAssignModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                    >
                        + Assign Quiz
                    </button>

                </div>

            </div>

            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <div className="bg-white rounded-xl shadow p-6">
                    <p className="text-gray-500">
                        Assigned
                    </p>

                    <h2 className="text-3xl font-bold">
                        {totalAssigned}
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <p className="text-gray-500">
                        Completed
                    </p>

                    <h2 className="text-3xl font-bold text-green-600">
                        {completed}
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <p className="text-gray-500">
                        Pending
                    </p>

                    <h2 className="text-3xl font-bold text-yellow-600">
                        {pending}
                    </h2>
                </div>

            </div>

            {/* ==================================================
                ASSIGNMENT TABLE
            ================================================== */}

            <div className="bg-white rounded-xl shadow overflow-hidden">

                <div className="mb-6 p-4">

                    <input
                        type="text"
                        placeholder="Search by student name or roll number..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                        className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead className="bg-gray-100">

                            <tr>

                                <th className="text-left px-6 py-4">
                                    Student
                                </th>

                                <th className="text-left px-6 py-4">
                                    Roll No
                                </th>

                                <th className="text-center px-6 py-4">
                                    Assigned
                                </th>

                                <th className="text-center px-6 py-4">
                                    Start Time
                                </th>

                                <th className="text-center px-6 py-4">
                                    Due Date
                                </th>

                                <th className="text-center px-6 py-4">
                                    Status
                                </th>

                                <th className="text-center px-6 py-4">
                                    Score
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredAssignments.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="text-center py-10 text-gray-500"
                                    >
                                        No assignments found.
                                    </td>

                                </tr>

                            ) : (

                                filteredAssignments.map(
                                    (assignment) => (

                                        <tr
                                            key={
                                                assignment.assignment_id
                                            }
                                            className="border-t hover:bg-gray-50"
                                        >

                                            <td className="px-6 py-4">

                                                <div className="font-semibold">
                                                    {
                                                        assignment.student_name
                                                    }
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    {
                                                        assignment.email
                                                    }
                                                </div>

                                            </td>

                                            <td className="px-6 py-4">
                                                {assignment.roll_no}
                                            </td>

                                            <td className="text-center">

                                                {assignment.assigned_at
                                                    ? new Date(
                                                        assignment.assigned_at
                                                    ).toLocaleDateString()
                                                    : "--"}

                                            </td>

                                            <td className="text-center">

                                                {assignment.start_time
                                                    ? new Date(
                                                        assignment.start_time
                                                    ).toLocaleString()
                                                    : "--"}

                                            </td>

                                            <td className="text-center">

                                                {assignment.due_date
                                                    ? new Date(
                                                        assignment.due_date
                                                    ).toLocaleString()
                                                    : "--"}

                                            </td>

                                            <td className="text-center">

                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        assignment.status ===
                                                        "Completed"
                                                            ? "bg-green-100 text-green-700"
                                                            : assignment.status ===
                                                              "Assigned"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {
                                                        assignment.status
                                                    }
                                                </span>

                                            </td>

                                            <td className="text-center">

                                                {assignment.score ??
                                                    "--"}

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* ==================================================
                ASSIGN QUIZ MODAL
            ================================================== */}

            {showAssignModal && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

                        <h2 className="text-2xl font-bold mb-6">
                            Assign Quiz
                        </h2>

                        {/* ======================================
                            SECTION
                        ====================================== */}

                        <div className="mb-4">

                            <label className="block text-sm font-medium mb-2">
                                Section
                            </label>

                            <select
                                name="section_id"
                                value={assignForm.section_id}
                                onChange={handleAssignChange}
                                className="w-full border rounded-lg px-3 py-2"
                            >

                                <option value="">
                                    Select Section
                                </option>

                                {sections.map((section) => (

                                    <option
                                        key={
                                            section.teacher_section_id
                                        }
                                        value={
                                            section.section_id
                                        }
                                    >
                                        {section.section_name}
                                        {" - "}
                                        {section.subject_name}
                                    </option>

                                ))}

                            </select>

                        </div>

                        {/* ======================================
                            START DATE & TIME
                        ====================================== */}

                        <div className="mb-4">

                            <label className="block text-sm font-medium mb-2">
                                Quiz Start Date & Time
                            </label>

                            <input
                                type="datetime-local"
                                name="start_time"
                                value={assignForm.start_time}
                                onChange={handleAssignChange}
                                min={
                                    new Date()
                                        .toISOString()
                                        .slice(0, 16)
                                }
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                            <p className="text-xs text-gray-500 mt-1">
                                Students can open the quiz link before
                                this time, but the quiz will start only
                                at the scheduled time.
                            </p>

                        </div>

                        {/* ======================================
                            DUE DATE
                        ====================================== */}

                        <div className="mb-6">

                            <label className="block text-sm font-medium mb-2">
                                Due Date & Time
                            </label>

                            <input
                                type="datetime-local"
                                name="due_date"
                                value={assignForm.due_date}
                                onChange={handleAssignChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                        </div>

                        {/* ======================================
                            BUTTONS
                        ====================================== */}

                        <div className="flex justify-end gap-3">

                            <button
                                onClick={closeAssignModal}
                                disabled={assignLoading}
                                className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleAssignQuiz}
                                disabled={assignLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                            >

                                {assignLoading
                                    ? "Assigning..."
                                    : "Assign Quiz"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default QuizAssignments;