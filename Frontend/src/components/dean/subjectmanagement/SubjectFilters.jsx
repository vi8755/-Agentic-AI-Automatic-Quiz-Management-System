
import { Search, X } from "lucide-react";

const SubjectFilters = ({
    search,
    setSearch,
    department,
    setDepartment,
    semester,
    setSemester,
    status,
    setStatus,
}) => {

    const hasFilters =
        search ||
        department ||
        semester ||
        status;


    const handleClear = () => {
        setSearch("");
        setDepartment("");
        setSemester("");
        setStatus("");
    };


    return (

        <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="flex-1">

                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Search Subject
                    </label>

                    <div className="relative">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search by code, name or department..."
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                    </div>

                </div>


                {/* =================================================
                    DEPARTMENT
                ================================================= */}

                <div className="w-full lg:w-48">

                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Department
                    </label>

                    <select
                        value={department}
                        onChange={(e) =>
                            setDepartment(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >

                        <option value="">
                            All Departments
                        </option>

                        <option value="CSE">
                            CSE
                        </option>

                        <option value="ECE">
                            ECE
                        </option>

                        <option value="ME">
                            ME
                        </option>

                        <option value="CE">
                            CE
                        </option>

                        <option value="EE">
                            EE
                        </option>

                    </select>

                </div>


                {/* =================================================
                    SEMESTER
                ================================================= */}

                <div className="w-full lg:w-40">

                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Semester
                    </label>

                    <select
                        value={semester}
                        onChange={(e) =>
                            setSemester(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >

                        <option value="">
                            All Semesters
                        </option>

                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                        <option value="5">Semester 5</option>
                        <option value="6">Semester 6</option>
                        <option value="7">Semester 7</option>
                        <option value="8">Semester 8</option>

                    </select>

                </div>


                {/* =================================================
                    STATUS
                ================================================= */}

                <div className="w-full lg:w-40">

                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Status
                    </label>

                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>

                    </select>

                </div>


                {/* =================================================
                    CLEAR FILTERS
                ================================================= */}

                {hasFilters && (

                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                    >

                        <X size={16} />

                        Clear

                    </button>

                )}

            </div>

        </div>

    );

};

export default SubjectFilters;
