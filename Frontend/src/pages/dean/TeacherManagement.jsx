import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    getTeachers,
    updateTeacherStatus,
    deleteTeacher,
    registerTeacher,
} from "../../services/deanApi";

import TeacherTable from "../../components/dean/TeacherTable";
import TeacherFilters from "../../components/dean/TeacherFilters";
import Pagination from "../../components/dean/Pagination";
import TeacherProfileModal from "../../components/dean/TeacherProfileModal";
import ConfirmModal from "../../components/dean/ConfirmModal";
import TeacherTableSkeleton from "../../components/dean/TeacherTableSkeleton";
import EmptyState from "../../components/dean/EmptyState";
import AddTeacherModal from "../../components/dean/AddTeacherModal";
import AssignTeacherSectionsModal from "../../components/dean/AssignTeacherSectionsModal";

const TeacherManagement = () => {

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [department, setDepartment] = useState("");
    const [designation, setDesignation] = useState("");
    const [status, setStatus] = useState("");

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // =====================================================
    // Selected Teacher
    // =====================================================

    const [selectedTeacher, setSelectedTeacher] = useState(null);

    // =====================================================
    // Status Modal
    // =====================================================

    const [showConfirm, setShowConfirm] = useState(false);
    const [teacherAction, setTeacherAction] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);

    // =====================================================
    // Delete Teacher
    // =====================================================

    const [deleteTeacherData, setDeleteTeacherData] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // =====================================================
    // Add Teacher
    // =====================================================

    const [showAddTeacher, setShowAddTeacher] = useState(false);
    const [addTeacherLoading, setAddTeacherLoading] = useState(false);

    // =====================================================
    // Assign Sections
    // =====================================================

    const [assignTeacher, setAssignTeacher] = useState(null);

    // =====================================================
    // Load Teachers
    // =====================================================

    useEffect(() => {
        loadTeachers();
    }, [
        debouncedSearch,
        department,
        designation,
        status,
        page,
    ]);

    // =====================================================
    // Search Debounce
    // =====================================================

    useEffect(() => {

        const timer = setTimeout(() => {

            setDebouncedSearch(search);
            setPage(1);

        }, 500);

        return () => clearTimeout(timer);

    }, [search]);

    // =====================================================
    // Get Teachers
    // =====================================================

    const loadTeachers = async () => {

        try {

            setLoading(true);

            const data = await getTeachers({
                search: debouncedSearch,
                department,
                designation,
                status,
                page,
                limit,
            });

            setTeachers(data.items);
            setTotalPages(data.total_pages);

        } catch (err) {

            console.error(err);

            toast.error(
                err.response?.data?.detail ||
                "Failed to load teachers."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // View Teacher
    // =====================================================

    const handleView = (teacher) => {
        setSelectedTeacher(teacher);
    };

    // =====================================================
    // Close Profile
    // =====================================================

    const handleClose = () => {
        setSelectedTeacher(null);
    };

    // =====================================================
    // Status Change
    // =====================================================

    const handleStatusChange = (teacher) => {

        setTeacherAction(teacher);
        setShowConfirm(true);

    };

    // =====================================================
    // Delete Teacher
    // =====================================================

    const handleDeleteClick = (teacher) => {

        setDeleteTeacherData(teacher);

    };

    // =====================================================
    // Assign Sections
    // =====================================================

    const handleAssignSections = (teacher) => {

        setAssignTeacher(teacher);

    };

    // =====================================================
    // Close Assign Sections Modal
    // =====================================================

    const handleCloseAssignSections = () => {

        setAssignTeacher(null);

    };

    // =====================================================
    // Assignment Saved
    // =====================================================

    const handleAssignmentSaved = async () => {

        setAssignTeacher(null);

        await loadTeachers();

        toast.success(
            "Teacher section assignments updated successfully."
        );

    };

    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="p-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">

                {/* Left Side */}

                <div>

                    <h1 className="text-3xl font-bold">
                        Teacher Management
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Manage teachers, update status, and monitor faculty information.
                    </p>

                </div>

                {/* Right Side */}

                <div className="mt-4 flex gap-3 md:mt-0">

                    <button
                        onClick={() => setShowAddTeacher(true)}
                        className="rounded-lg bg-green-600 px-5 py-2 font-medium text-white transition hover:bg-green-700"
                    >
                        + Add Teacher
                    </button>

                    <button
                        onClick={loadTeachers}
                        disabled={loading}
                        className={`flex items-center gap-2 rounded-lg px-5 py-2 transition ${
                            loading
                                ? "cursor-not-allowed bg-gray-300"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        {loading
                            ? "Refreshing..."
                            : "🔄 Refresh"
                        }
                    </button>

                </div>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <TeacherFilters
                search={search}
                setSearch={setSearch}

                department={department}
                setDepartment={setDepartment}

                designation={designation}
                setDesignation={setDesignation}

                status={status}
                setStatus={setStatus}
            />

            {/* =================================================
                TEACHER TABLE
            ================================================= */}

            {loading ? (

                <TeacherTableSkeleton />

            ) : teachers.length === 0 ? (

                <EmptyState
                    title="No Teachers Found"
                    message="Try adjusting your search or filters."
                    buttonText="Clear Filters"
                    onButtonClick={() => {

                        setSearch("");
                        setDepartment("");
                        setDesignation("");
                        setStatus("");
                        setPage(1);

                    }}
                />

            ) : (

                <TeacherTable
                    teachers={teachers}
                    onView={handleView}
                    onAssignSections={handleAssignSections}
                />

            )}

            {/* =================================================
                PAGINATION
            ================================================= */}

            <Pagination
                page={page}
                totalPages={totalPages}
                setPage={setPage}
            />

            {/* =================================================
                TEACHER PROFILE MODAL
            ================================================= */}

            <TeacherProfileModal
                teacher={selectedTeacher}
                onClose={handleClose}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteClick}
            />

            {/* =================================================
                STATUS CONFIRM MODAL
            ================================================= */}

            {showConfirm && teacherAction && (

                <ConfirmModal

                    title={
                        teacherAction.status === "Active"
                            ? "Deactivate Teacher"
                            : "Activate Teacher"
                    }

                    message={`Are you sure you want to ${
                        teacherAction.status === "Active"
                            ? "deactivate"
                            : "activate"
                    } ${teacherAction.name}?`}

                    confirmText={
                        teacherAction.status === "Active"
                            ? "Deactivate"
                            : "Activate"
                    }

                    loading={statusLoading}

                    onCancel={() => {

                        setShowConfirm(false);
                        setTeacherAction(null);

                    }}

                    onConfirm={async () => {

                        try {

                            setStatusLoading(true);

                            await updateTeacherStatus(
                                teacherAction.id,
                                teacherAction.status !== "Active"
                            );

                            setSelectedTeacher((prev) =>
                                prev
                                    ? {
                                          ...prev,
                                          status:
                                              teacherAction.status === "Active"
                                                  ? "Inactive"
                                                  : "Active",
                                      }
                                    : prev
                            );

                            await loadTeachers();

                            toast.success(
                                teacherAction.status === "Active"
                                    ? "Teacher deactivated successfully."
                                    : "Teacher activated successfully."
                            );

                            setShowConfirm(false);
                            setTeacherAction(null);

                        } catch (error) {

                            console.error(error);

                            toast.error(
                                error.response?.data?.detail ||
                                "Failed to update teacher status."
                            );

                        } finally {

                            setStatusLoading(false);

                        }

                    }}

                />

            )}

            {/* =================================================
                DELETE TEACHER MODAL
            ================================================= */}

            {deleteTeacherData && (

                <ConfirmModal

                    title="Delete Teacher"

                    message={`Are you sure you want to delete ${deleteTeacherData.name}? This action cannot be undone.`}

                    confirmText={
                        deleteLoading
                            ? "Deleting..."
                            : "Delete"
                    }

                    confirmColor="red"

                    loading={deleteLoading}

                    onCancel={() =>
                        setDeleteTeacherData(null)
                    }

                    onConfirm={async () => {

                        try {

                            setDeleteLoading(true);

                            await deleteTeacher(
                                deleteTeacherData.id
                            );

                            toast.success(
                                "Teacher deleted successfully."
                            );

                            setDeleteTeacherData(null);
                            setSelectedTeacher(null);

                            await loadTeachers();

                        } catch (error) {

                            console.error(error);

                            toast.error(
                                error.response?.data?.detail ||
                                "Failed to delete teacher."
                            );

                        } finally {

                            setDeleteLoading(false);

                        }

                    }}

                />

            )}

            {/* =================================================
                ADD TEACHER MODAL
            ================================================= */}

            {showAddTeacher && (

                <AddTeacherModal

                    onClose={() =>
                        setShowAddTeacher(false)
                    }

                    onSubmit={async (teacherData) => {

                        try {

                            setAddTeacherLoading(true);

                            await registerTeacher(
                                teacherData
                            );

                            toast.success(
                                "Teacher created successfully."
                            );

                            setShowAddTeacher(false);

                            await loadTeachers();

                        } catch (error) {

                            console.error(error);

                            toast.error(
                                error.response?.data?.detail ||
                                "Failed to create teacher."
                            );

                        } finally {

                            setAddTeacherLoading(false);

                        }

                    }}

                    loading={addTeacherLoading}

                />

            )}

            {/* =================================================
                ASSIGN TEACHER SECTIONS MODAL
            ================================================= */}

            {assignTeacher && (

                <AssignTeacherSectionsModal

                    teacher={assignTeacher}

                    onClose={handleCloseAssignSections}

                    onSaved={handleAssignmentSaved}

                />

            )}

        </div>

    );

};

export default TeacherManagement;