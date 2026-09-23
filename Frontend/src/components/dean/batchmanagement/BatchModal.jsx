import { useEffect, useState } from "react";
import { X, CalendarDays } from "lucide-react";


const BatchModal = ({
    batch,
    onClose,
    onSubmit,
    loading,
}) => {

    const isEditMode = Boolean(batch);


    const [formData, setFormData] = useState({
        batch_name: "",
        department: "",
        start_year: "",
        end_year: "",
    });


    // =====================================================
    // Load Existing Batch For Edit
    // =====================================================

    useEffect(() => {

        if (batch) {

            setFormData({
                batch_name: batch.batch_name || "",
                department: batch.department || "",
                start_year: batch.start_year || "",
                end_year: batch.end_year || "",
            });

        } else {

            setFormData({
                batch_name: "",
                department: "",
                start_year: "",
                end_year: "",
            });

        }

    }, [batch]);


    // =====================================================
    // Handle Input Change
    // =====================================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

    };


    // =====================================================
    // Submit
    // =====================================================

    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit({
            batch_name: formData.batch_name.trim(),
            department: formData.department.trim(),
            start_year: Number(formData.start_year),
            end_year: Number(formData.end_year),
        });

    };


    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">


                {/* =================================================
                    Header
                ================================================= */}

                <div className="flex items-center justify-between border-b px-6 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white">

                            <CalendarDays size={24} />

                        </div>

                        <div>

                            <h2 className="text-xl font-bold text-gray-900">

                                {isEditMode
                                    ? "Edit Batch"
                                    : "Add Batch"
                                }

                            </h2>

                            <p className="mt-1 text-sm text-gray-500">

                                {isEditMode
                                    ? "Update academic batch information."
                                    : "Create a new academic batch."
                                }

                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <X size={22} />

                    </button>

                </div>


                {/* =================================================
                    Form
                ================================================= */}

                <form onSubmit={handleSubmit}>

                    <div className="space-y-5 px-6 py-6">


                        {/* =================================================
                            Batch Name
                        ================================================= */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Batch Name

                            </label>

                            <input
                                type="text"
                                name="batch_name"
                                value={formData.batch_name}
                                onChange={handleChange}
                                placeholder="e.g. 2026-30"
                                required
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
                            />

                            <p className="mt-1 text-xs text-gray-400">

                                Example: 2026-30

                            </p>

                        </div>


                        {/* =================================================
                            Department
                        ================================================= */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">

                                Department

                            </label>

                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="e.g. CSE"
                                required
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 uppercase outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
                            />

                        </div>


                        {/* =================================================
                            Start / End Year
                        ================================================= */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">


                            {/* Start Year */}

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    Start Year

                                </label>

                                <input
                                    type="number"
                                    name="start_year"
                                    value={formData.start_year}
                                    onChange={handleChange}
                                    placeholder="e.g. 2026"
                                    min="2000"
                                    max="2100"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
                                />

                            </div>


                            {/* End Year */}

                            <div>

                                <label className="mb-2 block text-sm font-semibold text-gray-700">

                                    End Year

                                </label>

                                <input
                                    type="number"
                                    name="end_year"
                                    value={formData.end_year}
                                    onChange={handleChange}
                                    placeholder="e.g. 2030"
                                    min="2000"
                                    max="2100"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-100"
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        Footer
                    ================================================= */}

                    <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">


                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border border-gray-200 bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            Cancel

                        </button>


                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >

                            {loading
                                ? isEditMode
                                    ? "Updating..."
                                    : "Creating..."
                                : isEditMode
                                    ? "Update Batch"
                                    : "Create Batch"
                            }

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};


export default BatchModal;