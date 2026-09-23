
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
    getDeanSubjects,
    createDeanSubject,
    updateDeanSubject,
    updateDeanSubjectStatus,
    deleteDeanSubject,
} from "../../../services/deanApi";

import SubjectFilters from "./SubjectFilters";
import SubjectTable from "./SubjectTable";
import SubjectModal from "./SubjectModal";
import DeleteSubjectModal from "./DeleteSubjectModal";
import EmptyState from "../EmptyState";


const SubjectManagement = () => {

    // =====================================================
    // Subjects
    // =====================================================

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);


    // =====================================================
    // Filters
    // =====================================================

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [status, setStatus] = useState("");
    const [semester, setSemester] = useState("");


    // =====================================================
    // Subject Modal
    // =====================================================

    const [showModal, setShowModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);


    // =====================================================
    // Delete Modal
    // =====================================================

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);


    // =====================================================
    // Status Loading
    // =====================================================

    const [statusLoadingId, setStatusLoadingId] = useState(null);
 


    // =====================================================
    // Load Subjects
    // =====================================================

    useEffect(() => {
        loadSubjects();
    }, []);


    const loadSubjects = async () => {

        try {

            setLoading(true);

            const data = await getDeanSubjects();

            setSubjects(data);

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to load subjects."
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // Filter Subjects
    // =====================================================

    const filteredSubjects = useMemo(() => {

        return subjects.filter((subject) => {

            const searchValue =
                search.toLowerCase().trim();


            const matchesSearch =
                !searchValue ||
                subject.subject_name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                subject.subject_code
                    ?.toLowerCase()
                    .includes(searchValue) ||
                subject.department
                    ?.toLowerCase()
                    .includes(searchValue);


            const matchesDepartment =
    !department ||
    subject.department
        ?.toLowerCase()
        .includes(
            department
                .toLowerCase()
                .trim()
        );


const matchesSemester =
    !semester ||
    String(subject.semester) ===
        String(semester).trim();


const matchesStatus =
    !status ||
    (status === "active"
        ? subject.is_active === true
        : subject.is_active === false);


            return (
                   matchesSearch &&
    matchesDepartment &&
    matchesSemester &&
    matchesStatus

            );

        });

    }, [
         subjects,
    search,
    department,
    semester,
    status,


    ]);


    // =====================================================
    // Open Create Modal
    // =====================================================

    const handleAddSubject = () => {

        setSelectedSubject(null);
        setShowModal(true);

    };


    // =====================================================
    // Open Edit Modal
    // =====================================================

    const handleEdit = (subject) => {

        setSelectedSubject(subject);
        setShowModal(true);

    };


    // =====================================================
    // Close Subject Modal
    // =====================================================

    const handleCloseModal = () => {

        if (submitLoading) return;

        setShowModal(false);
        setSelectedSubject(null);

    };


    // =====================================================
    // Create / Update Subject
    // =====================================================

    const handleSubmit = async (subjectData) => {

        try {

            setSubmitLoading(true);

            if (selectedSubject) {

                await updateDeanSubject(
                    selectedSubject.id,
                    subjectData
                );

                toast.success(
                    "Subject updated successfully."
                );

            } else {

                await createDeanSubject(
                    subjectData
                );

                toast.success(
                    "Subject created successfully."
                );

            }


            setShowModal(false);
            setSelectedSubject(null);

            await loadSubjects();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to save subject."
            );

        } finally {

            setSubmitLoading(false);

        }

    };


    // =====================================================
    // Activate / Deactivate Subject
    // =====================================================

    const handleToggleStatus = async (
        subjectId,
        is_active
    ) => {

        try {

            setStatusLoadingId(subjectId);

            await updateDeanSubjectStatus(
                subjectId,
                is_active
            );


            toast.success(
                is_active
                    ? "Subject activated successfully."
                    : "Subject deactivated successfully."
            );


            await loadSubjects();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to update subject status."
            );

        } finally {

            setStatusLoadingId(null);

        }

    };


    // =====================================================
    // Open Delete Modal
    // =====================================================

    const handleDelete = (subject) => {

        setSubjectToDelete(subject);
        setShowDeleteModal(true);

    };


    // =====================================================
    // Close Delete Modal
    // =====================================================

    const handleCloseDeleteModal = () => {

        if (deleteLoading) return;

        setShowDeleteModal(false);
        setSubjectToDelete(null);

    };


    // =====================================================
    // Confirm Delete
    // =====================================================

    const handleConfirmDelete = async () => {

        if (!subjectToDelete) return;


        try {

            setDeleteLoading(true);

            await deleteDeanSubject(
                subjectToDelete.id
            );


            toast.success(
                "Subject deleted successfully."
            );


            setShowDeleteModal(false);
            setSubjectToDelete(null);


            await loadSubjects();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to delete subject."
            );

        } finally {

            setDeleteLoading(false);

        }

    };


    // =====================================================
    // Clear Filters
    // =====================================================

    const clearFilters = () => {

         setSearch("");
    setDepartment("");
    setSemester("");
    setStatus("");


    };


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="p-6">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Subject Management
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Manage college subjects, departments,
                        and subject status.
                    </p>

                </div>


                <div className="mt-4 flex gap-3 md:mt-0">

                    <button
                        onClick={handleAddSubject}
                        className="rounded-lg bg-green-600 px-5 py-2 font-medium text-white transition hover:bg-green-700"
                    >
                        + Add Subject
                    </button>


                    <button
                        onClick={loadSubjects}
                        disabled={loading}
                        className={`flex items-center gap-2 rounded-lg px-5 py-2 transition ${
                            loading
                                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >

                        {loading
                            ? "Refreshing..."
                            : "🔄 Refresh"}

                    </button>

                </div>

            </div>


            {/* =================================================
                FILTERS
            ================================================= */}

            <SubjectFilters
                search={search}
    setSearch={setSearch}
    department={department}
    setDepartment={setDepartment}
    semester={semester}
    setSemester={setSemester}
    status={status}
    setStatus={setStatus}

               

            />


            {/* =================================================
                SUBJECT COUNT
            ================================================= */}

            {!loading && subjects.length > 0 && (

                <div className="mb-4 text-sm text-gray-500">

                    Showing{" "}

                    <span className="font-semibold text-gray-700">
                        {filteredSubjects.length}
                    </span>

                    {" "}of{" "}

                    <span className="font-semibold text-gray-700">
                        {subjects.length}
                    </span>

                    {" "}subjects

                </div>

            )}


            {/* =================================================
                SUBJECT TABLE
            ================================================= */}

            {loading ? (

                <div className="rounded-xl border bg-white p-10 text-center shadow-sm">

                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                    <p className="text-gray-500">
                        Loading subjects...
                    </p>

                </div>

            ) : filteredSubjects.length === 0 ? (

                <EmptyState
                    title="No Subjects Found"
                    message={
                        subjects.length === 0
                            ? "No subjects have been created yet."
                            : "Try adjusting your search or filters."
                    }
                    buttonText={
                        subjects.length === 0
                            ? "Add Subject"
                            : "Clear Filters"
                    }
                    onButtonClick={
                        subjects.length === 0
                            ? handleAddSubject
                            : clearFilters
                    }
                />

            ) : (

                <SubjectTable
                    subjects={filteredSubjects}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    statusLoadingId={statusLoadingId}
                />

            )}


            {/* =================================================
                CREATE / EDIT SUBJECT MODAL
            ================================================= */}

            {showModal && (

                <SubjectModal
                    subject={selectedSubject}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    loading={submitLoading}
                />

            )}


            {/* =================================================
                DELETE CONFIRMATION MODAL
            ================================================= */}

            {showDeleteModal && (

                <DeleteSubjectModal
                    subject={subjectToDelete}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDelete}
                    loading={deleteLoading}
                />

            )}

        </div>

    );

};

export default SubjectManagement;
