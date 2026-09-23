import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
    getDeanSections,
    getDeanBatches,
    createDeanSection,
    updateDeanSection,
    updateDeanSectionStatus,
    deleteDeanSection,

} from "../../services/deanApi";

import SectionFilters from "../../components/dean/SectionFilters";
import SectionTable from "../../components/dean/SectionTable";
import SectionModal from "../../components/dean/SectionModal";
import DeleteSectionModal from "../../components/dean/DeleteSectionModal";
import EmptyState from "../../components/dean/EmptyState";


const SectionManagement = () => {

    // =====================================================
    // Sections
    // =====================================================

    const [sections, setSections] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);


    // =====================================================
    // Filters
    // =====================================================

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");


    // =====================================================
    // Section Modal
    // =====================================================

    const [showModal, setShowModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);


    // =====================================================
    // Delete Modal
    // =====================================================

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);


    // =====================================================
    // Status Loading
    // =====================================================

    const [statusLoadingId, setStatusLoadingId] = useState(null);


    // =====================================================
    // Load Sections
    // =====================================================

    useEffect(() => {
        loadSections();
    }, []);


     const loadSections = async () => {
    try {
        setLoading(true);

        const [sectionsData, batchesData] = await Promise.all([
            getDeanSections(),
            getDeanBatches(),
        ]);

        setSections(sectionsData);

        setBatches(
            batchesData.filter((batch) => batch.is_active)
        );
    } catch (error) {
        console.error(error);

        toast.error(
            error.response?.data?.detail ||
            "Failed to load sections."
        );
    } finally {
        setLoading(false);
    }
};


    // =====================================================
    // Filter Sections
    // =====================================================

    const filteredSections = useMemo(() => {

        return sections.filter((section) => {

            const searchValue =
                search.toLowerCase().trim();


            const matchesSearch =
                !searchValue ||
                section.section_name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                section.department
                    ?.toLowerCase()
                    .includes(searchValue);


            const matchesDepartment =
                !department ||
                section.department
                    ?.toLowerCase()
                    .includes(
                        department
                            .toLowerCase()
                            .trim()
                    );


            const matchesYear =
                !year ||
                String(section.year) ===
                    String(year).trim();


            const matchesSemester =
                !semester ||
                String(section.semester) ===
                    String(semester).trim();


            return (
                matchesSearch &&
                matchesDepartment &&
                matchesYear &&
                matchesSemester
            );

        });

    }, [
        sections,
        search,
        department,
        year,
        semester,
    ]);


    // =====================================================
    // Open Create Modal
    // =====================================================

    const handleAddSection = () => {

        setSelectedSection(null);
        setShowModal(true);

    };


    // =====================================================
    // Open Edit Modal
    // =====================================================

    const handleEdit = (section) => {

        setSelectedSection(section);
        setShowModal(true);

    };


    // =====================================================
    // Close Section Modal
    // =====================================================

    const handleCloseModal = () => {

        if (submitLoading) return;

        setShowModal(false);
        setSelectedSection(null);

    };


    // =====================================================
    // Create / Update Section
    // =====================================================

    const handleSubmit = async (sectionData) => {

        try {

            setSubmitLoading(true);

            if (selectedSection) {

                await updateDeanSection(
                    selectedSection.id,
                    sectionData
                );

                toast.success(
                    "Section updated successfully."
                );

            } else {

                await createDeanSection(
                    sectionData
                );

                toast.success(
                    "Section created successfully."
                );

            }


            setShowModal(false);
            setSelectedSection(null);

            await loadSections();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to save section."
            );

        } finally {

            setSubmitLoading(false);

        }

    };


    // =====================================================
    // Activate / Deactivate Section
    // =====================================================

    const handleToggleStatus = async (
        sectionId,
        is_active
    ) => {

        try {

            setStatusLoadingId(sectionId);

            await updateDeanSectionStatus(
                sectionId,
                is_active
            );


            toast.success(
                is_active
                    ? "Section activated successfully."
                    : "Section deactivated successfully."
            );


            await loadSections();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to update section status."
            );

        } finally {

            setStatusLoadingId(null);

        }

    };


    // =====================================================
    // Open Delete Modal
    // =====================================================

    const handleDelete = (section) => {

        setSectionToDelete(section);
        setShowDeleteModal(true);

    };


    // =====================================================
    // Close Delete Modal
    // =====================================================

    const handleCloseDeleteModal = () => {

        if (deleteLoading) return;

        setShowDeleteModal(false);
        setSectionToDelete(null);

    };


    // =====================================================
    // Confirm Delete
    // =====================================================

    const handleConfirmDelete = async () => {

        if (!sectionToDelete) return;


        try {

            setDeleteLoading(true);

            await deleteDeanSection(
                sectionToDelete.id
            );


            toast.success(
                "Section deleted successfully."
            );


            setShowDeleteModal(false);
            setSectionToDelete(null);


            await loadSections();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Failed to delete section."
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
        setYear("");
        setSemester("");

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

                {/* Left Side */}

                <div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Section Management
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Manage college sections, departments,
                        years, and semesters.
                    </p>

                </div>


                {/* Right Side */}

                <div className="mt-4 flex gap-3 md:mt-0">

                    <button
                        onClick={handleAddSection}
                        className="rounded-lg bg-green-600 px-5 py-2 font-medium text-white transition hover:bg-green-700"
                    >
                        + Add Section
                    </button>


                    <button
                        onClick={loadSections}
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

            <SectionFilters
                search={search}
                setSearch={setSearch}
                department={department}
                setDepartment={setDepartment}
                year={year}
                setYear={setYear}
                semester={semester}
                setSemester={setSemester}
            />


            {/* =================================================
                SECTION COUNT
            ================================================= */}

            {!loading && sections.length > 0 && (

                <div className="mb-4 text-sm text-gray-500">

                    Showing{" "}

                    <span className="font-semibold text-gray-700">
                        {filteredSections.length}
                    </span>

                    {" "}of{" "}

                    <span className="font-semibold text-gray-700">
                        {sections.length}
                    </span>

                    {" "}sections

                </div>

            )}


            {/* =================================================
                SECTION TABLE
            ================================================= */}

            {loading ? (

                <div className="rounded-xl border bg-white p-10 text-center shadow-sm">

                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                    <p className="text-gray-500">
                        Loading sections...
                    </p>

                </div>

            ) : filteredSections.length === 0 ? (

                <EmptyState
                    title="No Sections Found"
                    message={
                        sections.length === 0
                            ? "No sections have been created yet."
                            : "Try adjusting your search or filters."
                    }
                    buttonText={
                        sections.length === 0
                            ? "Add Section"
                            : "Clear Filters"
                    }
                    onButtonClick={
                        sections.length === 0
                            ? handleAddSection
                            : clearFilters
                    }
                />

            ) : (

                <SectionTable
                    sections={filteredSections}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    statusLoadingId={statusLoadingId}
                />

            )}


            {/* =================================================
                CREATE / EDIT SECTION MODAL
            ================================================= */}

            {showModal && (

                <SectionModal
                    section={selectedSection}
                    batches={batches}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    loading={submitLoading}
                />

            )}


            {/* =================================================
                DELETE CONFIRMATION MODAL
            ================================================= */}

            {showDeleteModal && (

                <DeleteSectionModal
                    section={sectionToDelete}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDelete}
                    loading={deleteLoading}
                />

            )}

        </div>

    );

};

export default SectionManagement;