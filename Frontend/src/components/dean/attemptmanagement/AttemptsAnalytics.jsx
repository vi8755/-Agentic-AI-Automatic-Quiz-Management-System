import { useEffect, useMemo, useState } from "react";
import {
    RefreshCw,
    Filter,
    X,
    UserRound,
    Layers3,
    CalendarDays,
    BarChart3,
    Users,
    ClipboardList,
    Percent,
    Trophy,
} from "lucide-react";
import { toast } from "react-toastify";

import {
    getDeanAttemptAnalytics,
    getTeachers,
    getDeanSections,
    getDeanBatches,
} from "../../../services/deanApi";

const AttemptsAnalytics = () => {

    // =====================================================
    // DATA
    // =====================================================

    const [analytics, setAnalytics] = useState(null);
    const [sectionsAnalytics, setSectionsAnalytics] =
        useState([]);

    const [teachers, setTeachers] = useState([]);
    const [sections, setSections] = useState([]);
    const [batches, setBatches] = useState([]);

    // =====================================================
    // FILTERS
    // =====================================================

    const [teacherFilter, setTeacherFilter] =
        useState("");

    const [batchFilter, setBatchFilter] =
        useState("");

    const [yearFilter, setYearFilter] =
        useState("");

    const [semesterFilter, setSemesterFilter] =
        useState("");

    const [sectionFilter, setSectionFilter] =
        useState("");

    // =====================================================
    // LOADING
    // =====================================================

    const [loading, setLoading] =
        useState(true);

    const [filterLoading, setFilterLoading] =
        useState(true);

    // =====================================================
    // LOAD FILTER DATA
    // =====================================================

    useEffect(() => {
        loadFilterData();
    }, []);

    const loadFilterData = async () => {
        try {
            setFilterLoading(true);

            const [
                teachersResponse,
                sectionsResponse,
                batchesResponse,
            ] = await Promise.all([
                getTeachers({
                    page: 1,
                    limit: 100,
                }),
                getDeanSections(),
                getDeanBatches(),
            ]);

            const teacherItems =
                teachersResponse?.items ||
                teachersResponse?.teachers ||
                (
                    Array.isArray(
                        teachersResponse
                    )
                        ? teachersResponse
                        : []
                );

            const sectionItems =
                Array.isArray(
                    sectionsResponse
                )
                    ? sectionsResponse
                    : sectionsResponse?.items ||
                      [];

            const batchItems =
                Array.isArray(
                    batchesResponse
                )
                    ? batchesResponse
                    : batchesResponse?.items ||
                      [];

            setTeachers(teacherItems);

            setSections(sectionItems);

            setBatches(
                batchItems.filter(
                    (item) =>
                        item?.is_active !== false
                )
            );

        } catch (error) {

            console.error(
                "Failed to load attempt filters:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                "Failed to load filter data."
            );

        } finally {
            setFilterLoading(false);
        }
    };

    // =====================================================
    // CASCADING OPTIONS
    // =====================================================

    const availableYears = useMemo(() => {

        const values =
            sections
                .filter((section) => {

                    if (
                        batchFilter &&
                        String(
                            section?.batch_id
                        ) !==
                            String(
                                batchFilter
                            )
                    ) {
                        return false;
                    }

                    return (
                        section?.year !==
                            null &&
                        section?.year !==
                            undefined &&
                        section?.year !== ""
                    );
                })
                .map(
                    (section) =>
                        section.year
                );

        return [
            ...new Set(values),
        ].sort(
            (a, b) =>
                Number(a) -
                Number(b)
        );

    }, [
        sections,
        batchFilter,
    ]);

    const availableSemesters =
        useMemo(() => {

            const values =
                sections
                    .filter((section) => {

                        if (
                            batchFilter &&
                            String(
                                section?.batch_id
                            ) !==
                                String(
                                    batchFilter
                                )
                        ) {
                            return false;
                        }

                        if (
                            yearFilter &&
                            String(
                                section?.year
                            ) !==
                                String(
                                    yearFilter
                                )
                        ) {
                            return false;
                        }

                        return (
                            section?.semester !==
                                null &&
                            section?.semester !==
                                undefined &&
                            section?.semester !==
                                ""
                        );
                    })
                    .map(
                        (section) =>
                            section.semester
                    );

            return [
                ...new Set(values),
            ].sort(
                (a, b) =>
                    Number(a) -
                    Number(b)
            );

        }, [
            sections,
            batchFilter,
            yearFilter,
        ]);

    const filteredSections =
        useMemo(() => {

            return sections.filter(
                (section) => {

                    if (
                        batchFilter &&
                        String(
                            section?.batch_id
                        ) !==
                            String(
                                batchFilter
                            )
                    ) {
                        return false;
                    }

                    if (
                        yearFilter &&
                        String(
                            section?.year
                        ) !==
                            String(
                                yearFilter
                            )
                    ) {
                        return false;
                    }

                    if (
                        semesterFilter &&
                        String(
                            section?.semester
                        ) !==
                            String(
                                semesterFilter
                            )
                    ) {
                        return false;
                    }

                    return true;
                }
            );

        }, [
            sections,
            batchFilter,
            yearFilter,
            semesterFilter,
        ]);

    // =====================================================
    // LOAD ANALYTICS
    // =====================================================

    useEffect(() => {
        loadAnalytics();
    }, [
        teacherFilter,
        batchFilter,
        yearFilter,
        semesterFilter,
        sectionFilter,
    ]);

    const loadAnalytics = async () => {

        try {

            setLoading(true);

            const params = {};

            if (teacherFilter) {
                params.teacher_id =
                    Number(
                        teacherFilter
                    );
            }

            if (batchFilter) {
                params.batch_id =
                    Number(
                        batchFilter
                    );
            }

            if (yearFilter) {
                params.year =
                    Number(
                        yearFilter
                    );
            }

            if (semesterFilter) {
                params.semester =
                    Number(
                        semesterFilter
                    );
            }

            if (sectionFilter) {
                params.section_id =
                    Number(
                        sectionFilter
                    );
            }

            const data =
                await getDeanAttemptAnalytics(
                    params
                );

            setAnalytics(
                data || {}
            );

            setSectionsAnalytics(
                Array.isArray(
                    data?.section_analytics
                )
                    ? data.section_analytics
                    : Array.isArray(
                          data?.sections
                      )
                    ? data.sections
                    : []
            );

        } catch (error) {

            console.error(
                "Failed to load attempts analytics:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                "Failed to load attempts analytics."
            );

            setAnalytics({});
            setSectionsAnalytics([]);

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // FILTER HANDLERS
    // =====================================================

    const handleTeacherChange = (
        event
    ) => {

        setTeacherFilter(
            event.target.value
        );

        setSectionFilter("");

    };

    const handleBatchChange = (
        event
    ) => {

        setBatchFilter(
            event.target.value
        );

        setYearFilter("");
        setSemesterFilter("");
        setSectionFilter("");

    };

    const handleYearChange = (
        event
    ) => {

        setYearFilter(
            event.target.value
        );

        setSemesterFilter("");
        setSectionFilter("");

    };

    const handleSemesterChange = (
        event
    ) => {

        setSemesterFilter(
            event.target.value
        );

        setSectionFilter("");

    };

    const handleSectionChange = (
        event
    ) => {

        setSectionFilter(
            event.target.value
        );

    };

    const clearFilters = () => {

        setTeacherFilter("");
        setBatchFilter("");
        setYearFilter("");
        setSemesterFilter("");
        setSectionFilter("");

    };

    const hasActiveFilters =
        Boolean(
            teacherFilter ||
            batchFilter ||
            yearFilter ||
            semesterFilter ||
            sectionFilter
        );

    const activeFilterCount = [
        teacherFilter,
        batchFilter,
        yearFilter,
        semesterFilter,
        sectionFilter,
    ].filter(Boolean).length;

    // =====================================================
    // DISPLAY HELPERS
    // =====================================================

    const selectedTeacher =
        teachers.find(
            (teacher) =>
                String(
                    teacher.id
                ) ===
                String(
                    teacherFilter
                )
        );

    const selectedBatch =
        batches.find(
            (batch) =>
                String(
                    batch.id
                ) ===
                String(
                    batchFilter
                )
        );

    const selectedSection =
        sections.find(
            (section) =>
                String(
                    section.id
                ) ===
                String(
                    sectionFilter
                )
        );

    const contextLabel =
        [
            selectedTeacher?.name ||
                selectedTeacher?.user_name,

            selectedBatch?.batch_name ||
                selectedBatch?.name,

            yearFilter
                ? `${yearFilter}${
                      Number(
                          yearFilter
                      ) === 1
                          ? "st"
                          : Number(
                                yearFilter
                            ) === 2
                          ? "nd"
                          : Number(
                                yearFilter
                            ) === 3
                          ? "rd"
                          : "th"
                  } Year`
                : null,

            semesterFilter
                ? `Semester ${semesterFilter}`
                : null,

            selectedSection?.section_name
                ? `Section ${selectedSection.section_name}`
                : null,
        ]
            .filter(Boolean)
            .join(" • ") ||
        "All Academic Records";

    // Support both existing snake_case response
    // names and safe defaults.
    const assignments =
        Number(
            analytics?.assignments ??
                analytics?.total_assignments ??
                0
        );

    const attempts =
        Number(
            analytics?.attempts ??
                analytics?.total_attempts ??
                0
        );

    const attemptRate =
        Number(
            analytics?.attempt_rate ??
                analytics?.attempt_percentage ??
                0
        );

    const averageScore =
        Number(
            analytics?.average_score ??
                0
        );

    const averagePercentage =
        Number(
            analytics?.average_percentage ??
                analytics?.average_percent ??
                0
        );

    const highestScore =
        Number(
            analytics?.highest_score ??
                0
        );

    const highestPercentage =
        Number(
            analytics?.highest_percentage ??
                analytics?.highest_percent ??
                0
        );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Attempts Analytics
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor quiz attempts and
                        student performance.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadAnalytics}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-5 py-3 text-sm font-medium text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={17}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />
                    Refresh
                </button>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <Filter size={20} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Filters
                            </h2>

                            <p className="text-xs text-slate-500">
                                Viewing: {contextLabel}
                            </p>
                        </div>

                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={
                                clearFilters
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            <X size={15} />
                            Clear Filters
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                                {activeFilterCount}
                            </span>
                        </button>
                    )}

                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {/* Teacher */}

                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <UserRound size={14} />
                            Teacher
                        </label>

                        <select
                            value={
                                teacherFilter
                            }
                            onChange={
                                handleTeacherChange
                            }
                            disabled={
                                filterLoading
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                        >
                            <option value="">
                                All Teachers
                            </option>

                            {teachers.map(
                                (teacher) => (
                                    <option
                                        key={
                                            teacher.id
                                        }
                                        value={
                                            teacher.id
                                        }
                                    >
                                        {teacher.name ||
                                            teacher.user_name ||
                                            `Teacher #${teacher.id}`}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Batch */}

                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Layers3 size={14} />
                            Batch
                        </label>

                        <select
                            value={
                                batchFilter
                            }
                            onChange={
                                handleBatchChange
                            }
                            disabled={
                                filterLoading
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                        >
                            <option value="">
                                All Batches
                            </option>

                            {batches.map(
                                (batch) => (
                                    <option
                                        key={
                                            batch.id
                                        }
                                        value={
                                            batch.id
                                        }
                                    >
                                        {batch.batch_name ||
                                            batch.name ||
                                            `Batch #${batch.id}`}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Year */}

                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarDays
                                size={14}
                            />
                            Year
                        </label>

                        <select
                            value={
                                yearFilter
                            }
                            onChange={
                                handleYearChange
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        >
                            <option value="">
                                All Years
                            </option>

                            {availableYears.map(
                                (year) => {

                                    const numericYear =
                                        Number(
                                            year
                                        );

                                    const suffix =
                                        numericYear ===
                                        1
                                            ? "st"
                                            : numericYear ===
                                              2
                                            ? "nd"
                                            : numericYear ===
                                              3
                                            ? "rd"
                                            : "th";

                                    return (
                                        <option
                                            key={
                                                year
                                            }
                                            value={
                                                year
                                            }
                                        >
                                            {
                                                numericYear
                                            }
                                            {suffix}{" "}
                                            Year
                                        </option>
                                    );
                                }
                            )}
                        </select>
                    </div>

                    {/* Semester */}

                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarDays
                                size={14}
                            />
                            Semester
                        </label>

                        <select
                            value={
                                semesterFilter
                            }
                            onChange={
                                handleSemesterChange
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        >
                            <option value="">
                                All Semesters
                            </option>

                            {availableSemesters.map(
                                (semester) => (
                                    <option
                                        key={
                                            semester
                                        }
                                        value={
                                            semester
                                        }
                                    >
                                        Semester{" "}
                                        {
                                            semester
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Section */}

                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Layers3 size={14} />
                            Section
                        </label>

                        <select
                            value={
                                sectionFilter
                            }
                            onChange={
                                handleSectionChange
                            }
                            disabled={
                                filterLoading
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                        >
                            <option value="">
                                All Sections
                            </option>

                            {filteredSections.map(
                                (section) => (
                                    <option
                                        key={
                                            section.id
                                        }
                                        value={
                                            section.id
                                        }
                                    >
                                        Section{" "}
                                        {
                                            section.section_name
                                        }
                                        {section.department
                                            ? ` • ${section.department}`
                                            : ""}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Clear */}

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={
                                clearFilters
                            }
                            disabled={
                                !hasActiveFilters
                            }
                            className="h-11 w-full rounded-xl border border-violet-300 bg-white px-4 text-sm font-semibold text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Clear Filters
                        </button>
                    </div>

                </div>

            </section>

            {/* =================================================
                OVERALL PERFORMANCE
            ================================================= */}

            <section>

                <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">
                        Overall Performance
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Performance for{" "}
                        <span className="font-semibold text-slate-700">
                            {contextLabel}
                        </span>
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

                    <KpiCard
                        label="Assignments"
                        value={
                            assignments
                        }
                        icon={
                            <ClipboardList
                                size={20}
                            />
                    }
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <KpiCard
                        label="Attempts"
                        value={
                            attempts
                        }
                        icon={
                            <Users
                                size={20}
                            />
                        }
                        iconClass="bg-indigo-50 text-indigo-600"
                    />

                    <KpiCard
                        label="Attempt Rate"
                        value={`${attemptRate.toFixed(1)}%`}
                        icon={
                            <Percent
                                size={20}
                            />
                        }
                        iconClass="bg-violet-50 text-violet-600"
                    />

                    <KpiCard
                        label="Average Score"
                        value={
                            averageScore
                        }
                        icon={
                            <BarChart3
                                size={20}
                            />
                        }
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <KpiCard
                        label="Average %"
                        value={`${averagePercentage.toFixed(1)}%`}
                        icon={
                            <Percent
                                size={20}
                            />
                        }
                        iconClass="bg-purple-50 text-purple-600"
                    />

                    <KpiCard
                        label="Highest Score"
                        value={
                            highestScore
                        }
                        icon={
                            <Trophy
                                size={20}
                            />
                        }
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <KpiCard
                        label="Highest %"
                        value={`${highestPercentage.toFixed(1)}%`}
                        icon={
                            <Trophy
                                size={20}
                            />
                        }
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                </div>

            </section>

            {/* =================================================
                SECTION ANALYTICS
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-6 py-5">

                    <h2 className="text-xl font-bold text-slate-900">
                        Section Analytics
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Performance and attempt statistics by section.
                    </p>

                </div>

                {loading ? (

                    <div className="flex min-h-[260px] items-center justify-center">

                        <div className="text-center">

                            <RefreshCw
                                size={28}
                                className="mx-auto animate-spin text-violet-600"
                            />

                            <p className="mt-3 text-sm text-slate-500">
                                Loading analytics...
                            </p>

                        </div>

                    </div>

                ) : sectionsAnalytics.length === 0 ? (

                    <div className="p-12 text-center">

                        <BarChart3
                            size={42}
                            className="mx-auto text-slate-300"
                        />

                        <h3 className="mt-4 text-lg font-semibold text-slate-700">
                            No analytics available
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            There are no attempt records for the selected filters.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="bg-slate-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Section
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Students
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Attempts
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Average Score
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Average %
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {sectionsAnalytics.map(
                                    (item, index) => {

                                        const avgScore =
                                            Number(
                                                item?.average_score ??
                                                    0
                                            );

                                        const avgPercentage =
                                            Number(
                                                item?.average_percentage ??
                                                    item?.average_percent ??
                                                    0
                                            );

                                        return (
                                            <tr
                                                key={
                                                    item?.section_id ??
                                                    index
                                                }
                                                className="transition hover:bg-slate-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <div className="font-semibold text-slate-800">
                                                        {
                                                            item?.section_name ||
                                                            "Unknown Section"
                                                        }
                                                    </div>

                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {
                                                        item?.students ??
                                                        item?.student_count ??
                                                        0
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {
                                                        item?.attempts ??
                                                        item?.attempt_count ??
                                                        0
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                                    {
                                                        avgScore
                                                    }
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
                                                        {avgPercentage.toFixed(
                                                            1
                                                        )}
                                                        %
                                                    </span>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>
    );
};

// =====================================================
// KPI CARD
// =====================================================

const KpiCard = ({
    label,
    value,
    icon,
    iconClass,
}) => {

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                    <p className="text-sm text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {value}
                    </p>

                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    {icon}
                </div>

            </div>

        </div>
    );
};

export default AttemptsAnalytics;
