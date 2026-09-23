import { useEffect, useState } from "react";
import ConfirmModal from "../ConfirmModal";
import {
    Plus,
    RefreshCw,
    Search,
    CalendarDays,
    Pencil,
    Trash2,
    Power,
} from "lucide-react";

import {
    getDeanBatches,
    createDeanBatch,
    updateDeanBatch,
    updateDeanBatchStatus,
    deleteDeanBatch,
} from "../../../services/deanApi";

import BatchModal from "./BatchModal";


export default function BatchManagement() {

    // =====================================================
    // State
    // =====================================================

    const [batches, setBatches] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [selectedBatch, setSelectedBatch] = useState(null);

    const [submitLoading, setSubmitLoading] = useState(false);

    const [actionLoading, setActionLoading] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    batch: null,
});


    // =====================================================
    // Load Batches
    // =====================================================

    const loadBatches = async () => {

        try {

            setLoading(true);

            setError("");

            const data = await getDeanBatches();

            if (Array.isArray(data)) {

                setBatches(data);

            } else {

                setBatches([]);

            }

        } catch (error) {

            console.error(
                "Failed to load batches:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Failed to load batches."
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // Initial Load
    // =====================================================

    useEffect(() => {

        loadBatches();

    }, []);


    // =====================================================
    // Search
    // =====================================================

    const filteredBatches = batches.filter((batch) => {

        const searchText = search.toLowerCase().trim();

        return (

            batch.batch_name
                ?.toLowerCase()
                .includes(searchText)

            ||

            batch.department
                ?.toLowerCase()
                .includes(searchText)

        );

    });


    // =====================================================
    // Open Create Modal
    // =====================================================

    const handleAddBatch = () => {

        setSelectedBatch(null);

        setShowModal(true);

        setError("");

    };


    // =====================================================
    // Open Edit Modal
    // =====================================================

    const handleEditBatch = (batch) => {

        setSelectedBatch(batch);

        setShowModal(true);

        setError("");

    };


    // =====================================================
    // Close Modal
    // =====================================================

    const handleCloseModal = () => {

        if (submitLoading) {
            return;
        }

        setShowModal(false);

        setSelectedBatch(null);

    };


    // =====================================================
    // Create / Update Batch
    // =====================================================

    const handleSubmitBatch = async (batchData) => {

        try {

            setSubmitLoading(true);

            setError("");


            if (selectedBatch) {

                // -------------------------------------------------
                // Update
                // -------------------------------------------------

                await updateDeanBatch(
                    selectedBatch.id,
                    batchData
                );

            } else {

                // -------------------------------------------------
                // Create
                // -------------------------------------------------

                await createDeanBatch(batchData);

            }


            setShowModal(false);

            setSelectedBatch(null);

            await loadBatches();

        } catch (error) {

            console.error(
                "Failed to save batch:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Failed to save batch."
            );

        } finally {

            setSubmitLoading(false);

        }

    };
    const getErrorMessage = (error, fallbackMessage) => {

    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => item?.msg || "Validation error")
            .join(", ");
    }

    return fallbackMessage;
};


    // =====================================================
    // Toggle Batch Status
    // =====================================================

     const handleToggleStatus = (batch) => {

    setConfirmModal({
        open: true,
        type: batch.is_active
            ? "deactivate"
            : "activate",
        batch,
    });

};


    // =====================================================
    // Delete Batch
    // =====================================================

     const handleDeleteBatch = (batch) => {

    setConfirmModal({
        open: true,
        type: "delete",
        batch,
    });

};
const handleConfirmAction = async () => {

    const { type, batch } = confirmModal;

    if (!batch) {
        return;
    }


    try {

        setActionLoading(
            `${type}-${batch.id}`
        );

        setError("");


        // =================================================
        // Activate / Deactivate
        // =================================================

        if (
            type === "activate" ||
            type === "deactivate"
        ) {

            await updateDeanBatchStatus(
                batch.id,
                type === "activate"
            );

        }


        // =================================================
        // Delete
        // =================================================

        if (type === "delete") {

            await deleteDeanBatch(
                batch.id
            );

        }


        // =================================================
        // Close Confirmation Modal
        // =================================================

        setConfirmModal({
            open: false,
            type: null,
            batch: null,
        });


        // =================================================
        // Refresh List
        // =================================================

        await loadBatches();


    } catch (error) {

        console.error(
            `Failed to ${type} batch:`,
            error
        );


        setError(
            getErrorMessage(
                error,
                `Failed to ${type} batch.`
            )
        );

    } finally {

        setActionLoading(null);

    }

};
const handleCancelConfirmation = () => {

    if (actionLoading !== null) {
        return;
    }

    setConfirmModal({
        open: false,
        type: null,
        batch: null,
    });

};


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="space-y-6 p-6">


            {/* =================================================
                Header
            ================================================= */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-white shadow">

                            <CalendarDays size={26} />

                        </div>

                        <div>

                            <h1 className="text-2xl font-bold text-gray-900">

                                Batch Management

                            </h1>

                            <p className="mt-1 text-sm text-gray-500">

                                Manage academic batches.

                            </p>

                        </div>

                    </div>

                </div>


                {/* Add Batch */}

                <button
                    type="button"
                    onClick={handleAddBatch}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow transition hover:bg-blue-700"
                >

                    <Plus size={20} />

                    Add Batch

                </button>

            </div>


            {/* =================================================
                Search + Refresh
            ================================================= */}

            <div className="flex flex-col gap-3 sm:flex-row">

                <div className="relative flex-1">

                    <Search
                        size={20}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search by batch or department..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>


                <button
                    type="button"
                    onClick={loadBatches}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    <RefreshCw
                        size={18}
                        className={loading ? "animate-spin" : ""}
                    />

                    Refresh

                </button>

            </div>


            {/* =================================================
                Error
            ================================================= */}

            {error && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

                    {error}

                </div>

            )}


            {/* =================================================
                Batch Count
            ================================================= */}

            <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-5 py-4">

                <p className="text-sm text-gray-600">

                    Total Batches

                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">

                    {batches.length}

                </p>

            </div>


            {/* =================================================
                Batch Table
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                {loading ? (

                    <div className="flex h-48 items-center justify-center">

                        <div className="text-gray-500">

                            Loading batches...

                        </div>

                    </div>

                ) : filteredBatches.length === 0 ? (

                    <div className="flex h-48 flex-col items-center justify-center px-6 text-center">

                        <CalendarDays
                            size={40}
                            className="text-gray-300"
                        />

                        <h3 className="mt-3 text-lg font-semibold text-gray-700">

                            No batches found

                        </h3>

                        <p className="mt-1 text-sm text-gray-500">

                            {search
                                ? "Try a different search."
                                : "Create your first academic batch."
                            }

                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full text-left">

                            <thead className="border-b bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Batch
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Department
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Start Year
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        End Year
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {filteredBatches.map((batch) => (

                                    <tr
                                        key={batch.id}
                                        className="transition hover:bg-gray-50"
                                    >

                                        {/* Batch */}

                                        <td className="px-6 py-4">

                                            <div className="font-semibold text-gray-900">

                                                {batch.batch_name}

                                            </div>

                                        </td>


                                        {/* Department */}

                                        <td className="px-6 py-4 text-gray-600">

                                            {batch.department}

                                        </td>


                                        {/* Start Year */}

                                        <td className="px-6 py-4 text-gray-600">

                                            {batch.start_year}

                                        </td>


                                        {/* End Year */}

                                        <td className="px-6 py-4 text-gray-600">

                                            {batch.end_year}

                                        </td>


                                        {/* Status */}

                                        <td className="px-6 py-4">

                                            <span
                                                className={`
                                                    inline-flex
                                                    rounded-full
                                                    px-3
                                                    py-1
                                                    text-xs
                                                    font-semibold
                                                    ${
                                                        batch.is_active
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-600"
                                                    }
                                                `}
                                            >

                                                {batch.is_active
                                                    ? "Active"
                                                    : "Inactive"
                                                }

                                            </span>

                                        </td>


                                         {/* =================================================
    Actions
================================================= */}

<td className="px-6 py-4">

    <div className="flex items-center gap-2">

        {/* =================================================
            Edit
        ================================================= */}

        <button
    type="button"
    onClick={() => handleEditBatch(batch)}
    disabled={actionLoading !== null}
    title="Edit Batch"
    className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700"
>
    <Pencil
        size={20}
        color="white"
        strokeWidth={2.5}
    />
</button>


        {/* =================================================
            Activate / Deactivate
        ================================================= */}

        <button
            type="button"
            onClick={() => handleToggleStatus(batch)}
            disabled={actionLoading !== null}
            title={
                batch.is_active
                    ? "Deactivate Batch"
                    : "Activate Batch"
            }
            className={`
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                shadow-sm
                transition
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${
                    batch.is_active
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-green-600 text-white hover:bg-green-700"
                }
            `}
        >

            {actionLoading === `status-${batch.id}` ? (

                <RefreshCw
                    size={18}
                    strokeWidth={2.5}
                    className="animate-spin"
                />

            ) : (

                <Power
                    size={18}
                    strokeWidth={2.5}
                />

            )}

        </button>


        {/* =================================================
            Delete
        ================================================= */}

        <button
            type="button"
            onClick={() => handleDeleteBatch(batch)}
            disabled={actionLoading !== null}
            title="Delete Batch"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >

            {actionLoading === `delete-${batch.id}` ? (

                <RefreshCw
                    size={18}
                    strokeWidth={2.5}
                    className="animate-spin"
                />

            ) : (

                <Trash2
                    size={18}
                    strokeWidth={2.5}
                />

            )}

        </button>

    </div>

</td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                Batch Modal
            ================================================= */}

            {showModal && (

                <BatchModal
                    batch={selectedBatch}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitBatch}
                    loading={submitLoading}
                />

            )}
            {confirmModal.open && (

    <ConfirmModal
        title={
            confirmModal.type === "delete"
                ? "Delete Batch"
                : confirmModal.type === "deactivate"
                    ? "Deactivate Batch"
                    : "Activate Batch"
        }

        message={
            confirmModal.type === "delete"
                ? `Are you sure you want to delete batch "${confirmModal.batch?.batch_name}"?`
                : confirmModal.type === "deactivate"
                    ? `Are you sure you want to deactivate batch "${confirmModal.batch?.batch_name}"?`
                    : `Are you sure you want to activate batch "${confirmModal.batch?.batch_name}"?`
        }

        confirmText={
            confirmModal.type === "delete"
                ? "Delete"
                : confirmModal.type === "deactivate"
                    ? "Deactivate"
                    : "Activate"
        }

        confirmColor={
            confirmModal.type === "activate"
                ? "green"
                : "red"
        }

        loading={
            actionLoading !== null
        }

        onConfirm={handleConfirmAction}

        onCancel={handleCancelConfirmation}
    />

)}

        </div>

    );

}