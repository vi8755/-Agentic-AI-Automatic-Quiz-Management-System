const TeacherFilters = ({
    search,
    setSearch,
    department,
    setDepartment,
    designation,
    setDesignation,
    status,
    setStatus,
}) => {
    return (
        <div className="bg-white rounded-xl shadow p-5 mb-6">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Search */}

                <input
                    type="text"
                    placeholder="Search teacher..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    className="border rounded-lg px-4 py-2 w-full"
                />

                {/* Department */}

                <input
                    type="text"
                    placeholder="Department"
                    value={department}
                    onChange={(e) =>
                        setDepartment(e.target.value)
                    }
                    className="border rounded-lg px-4 py-2 w-full"
                />

                {/* Designation */}

                <input
                    type="text"
                    placeholder="Designation"
                    value={designation}
                    onChange={(e) =>
                        setDesignation(e.target.value)
                    }
                    className="border rounded-lg px-4 py-2 w-full"
                />

                {/* Status */}

                <select
                    value={status}
                    onChange={(e) =>
                        setStatus(e.target.value)
                    }
                    className="border rounded-lg px-4 py-2"
                >

                    <option value="">All Status</option>

                    <option value="Active">
                        Active
                    </option>

                    <option value="Inactive">
                        Inactive
                    </option>

                </select>

            </div>

        </div>
    );
};

export default TeacherFilters;