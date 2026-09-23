import { useEffect, useState } from "react";


const SectionModal = ({
    section,
    batches,
    onClose,
    onSubmit,
    loading,
}) => {

    const isEditMode = Boolean(section);


    // =====================================================
    // Form State
    // =====================================================

    const [formData, setFormData] = useState({
        batch_id: "",
        section_name: "",
        department: "",
        year: "",
        semester: "",
    });


    // =====================================================
    // Available Semesters Based On Year
    // =====================================================

    const semesterOptions = {
        1: [1, 2],
        2: [3, 4],
        3: [5, 6],
        4: [7, 8],
    };


    // =====================================================
    // Load Existing Section / Reset Form
    // =====================================================

    useEffect(() => {

        if (section) {

            setFormData({
                batch_id: section.batch_id || "",
                section_name: section.section_name || "",
                department: section.department || "",
                year: section.year || "",
                semester: section.semester || "",
            });

        } else {

            setFormData({
                batch_id: "",
                section_name: "",
                department: "",
                year: "",
                semester: "",
            });

        }

    }, [section]);


    // =====================================================
    // Handle Input Change
    // =====================================================

    const handleChange = (e) => {

        const { name, value } = e.target;


        // -------------------------------------------------
        // Batch Changed
        // -------------------------------------------------

        if (name === "batch_id") {

            const selectedBatch = batches?.find(
                (batch) =>
                    String(batch.id) === String(value)
            );


            setFormData((prev) => ({
                ...prev,

                batch_id: value,

                department:
                    selectedBatch?.department || "",

                // Reset academic values when batch changes
                year: "",
                semester: "",
            }));


            return;
        }


        // -------------------------------------------------
        // Year Changed
        // -------------------------------------------------

        if (name === "year") {

            setFormData((prev) => ({
                ...prev,

                year: value,

                // Reset semester because available
                // semesters depend on year
                semester: "",
            }));


            return;
        }


        // -------------------------------------------------
        // Other Fields
        // -------------------------------------------------

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


        const payload = {
            batch_id: Number(formData.batch_id),
            section_name: formData.section_name.trim(),
            department: formData.department.trim(),
            year: Number(formData.year),
            semester: Number(formData.semester),
        };


        onSubmit(payload);

    };


    // =====================================================
    // Current Semester Options
    // =====================================================

    const availableSemesters =
        semesterOptions[formData.year] || [];


    // =====================================================
    // Render
    // =====================================================

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">


                {/* =================================================
                    Header
                ================================================= */}

                <div className="flex items-center justify-between border-b px-6 py-4">

                    <div>

                        <h2 className="text-xl font-semibold text-gray-900">

                            {isEditMode
                                ? "Edit Section"
                                : "Add Section"
                            }

                        </h2>


                        <p className="mt-1 text-sm text-gray-500">

                            {isEditMode
                                ? "Update section information."
                                : "Create a new college section."
                            }

                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="text-2xl leading-none text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed"
                    >

                        ×

                    </button>

                </div>


                {/* =================================================
                    Form
                ================================================= */}

                <form onSubmit={handleSubmit}>

                    <div className="space-y-4 px-6 py-5">


                        {/* =================================================
                            Batch
                        ================================================= */}

                        <div>

                            <label className="mb-1 block text-sm font-medium text-gray-700">

                                Batch

                            </label>


                            <select
                                name="batch_id"
                                value={formData.batch_id}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full rounded-lg border px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            >

                                <option value="">
                                    Select Batch
                                </option>


                                {batches?.map((batch) => (

                                    <option
                                        key={batch.id}
                                        value={batch.id}
                                    >

                                        {batch.batch_name}
                                        {" - "}
                                        {batch.department}

                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* =================================================
                            Section Name
                        ================================================= */}

                        <div>

                            <label className="mb-1 block text-sm font-medium text-gray-700">

                                Section Name

                            </label>


                            <input
                                type="text"
                                name="section_name"
                                value={formData.section_name}
                                onChange={handleChange}
                                placeholder="e.g. A"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border px-4 py-2 uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />

                        </div>


                        {/* =================================================
                            Department
                        ================================================= */}

                        <div>

                            <label className="mb-1 block text-sm font-medium text-gray-700">

                                Department

                            </label>


                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                readOnly
                                placeholder="Select a batch first"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border bg-gray-50 px-4 py-2 uppercase text-gray-600 outline-none"
                            />


                            <p className="mt-1 text-xs text-gray-400">

                                Department is automatically taken from the selected batch.

                            </p>

                        </div>


                        {/* =================================================
                            Year
                        ================================================= */}

                        <div>

                            <label className="mb-1 block text-sm font-medium text-gray-700">

                                Year

                            </label>


                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                required
                                disabled={
                                    loading ||
                                    !formData.batch_id
                                }
                                className="w-full rounded-lg border px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            >

                                <option value="">
                                    Select Year
                                </option>


                                <option value="1">
                                    Year 1
                                </option>


                                <option value="2">
                                    Year 2
                                </option>


                                <option value="3">
                                    Year 3
                                </option>


                                <option value="4">
                                    Year 4
                                </option>

                            </select>

                        </div>


                        {/* =================================================
                            Semester
                        ================================================= */}

                        <div>

                            <label className="mb-1 block text-sm font-medium text-gray-700">

                                Semester

                            </label>


                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                required
                                disabled={
                                    loading ||
                                    !formData.year
                                }
                                className="w-full rounded-lg border px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            >

                                <option value="">
                                    Select Semester
                                </option>


                                {availableSemesters.map(
                                    (semester) => (

                                        <option
                                            key={semester}
                                            value={semester}
                                        >

                                            Semester {semester}

                                        </option>

                                    )
                                )}

                            </select>

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
                            className="rounded-lg border px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            Cancel

                        </button>


                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !formData.batch_id ||
                                !formData.year ||
                                !formData.semester
                            }
                            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >

                            {loading

                                ? isEditMode
                                    ? "Updating..."
                                    : "Creating..."

                                : isEditMode
                                    ? "Update Section"
                                    : "Create Section"

                            }

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};


export default SectionModal;