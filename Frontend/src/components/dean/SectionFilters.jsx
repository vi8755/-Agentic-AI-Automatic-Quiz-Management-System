const SectionFilters = ({
    search,
    setSearch,
    department,
    setDepartment,
    year,
    setYear,
    semester,
    setSemester,
}) => {
    return (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

            {/* Search */}
            <input
                type="text"
                placeholder="Search section..."
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {/* Department */}
            <input
                type="text"
                placeholder="Department"
                value={department}
                onChange={(e) =>
                    setDepartment(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {/* Year */}
            <input
                type="text"
                placeholder="Year"
                value={year}
                onChange={(e) =>
                    setYear(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {/* Semester */}
            <input
                type="text"
                placeholder="Semester"
                value={semester}
                onChange={(e) =>
                    setSemester(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

        </div>
    );
};

export default SectionFilters;