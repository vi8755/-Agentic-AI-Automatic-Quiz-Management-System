import { useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    ClipboardList,
    FileQuestion,
    Users,
    CheckCircle2,
    Filter,
    X,
    UserRound,
    Layers3,
} from "lucide-react";

import {
    getDeanQuizzes,
    getDeanQuiz,
    getTeachers,
    getDeanSections,
    getDeanTeacherSections,
    getDeanBatches,
} from "../../../services/deanApi";

import QuizDetailsModal from "./QuizDetailsModal";
import QuizTable from "./QuizTable";

const QuizManagement = () => {
    // =====================================================
    // Quiz State
    // =====================================================

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // Filter State
    // =====================================================

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    // Academic hierarchy:
    // Batch -> Year -> Semester -> Section
    const [batch, setBatch] = useState("");
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");

    // Existing teacher/section filters
    const [teacherFilter, setTeacherFilter] = useState("");
    const [sectionFilter, setSectionFilter] = useState("");

    // =====================================================
    // Teacher / Section / Batch Data
    // =====================================================

    const [teachers, setTeachers] = useState([]);
    const [sections, setSections] = useState([]);
    const [teacherSections, setTeacherSections] = useState([]);
    const [batches, setBatches] = useState([]);

    const [teachersLoading, setTeachersLoading] = useState(false);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [batchesLoading, setBatchesLoading] = useState(false);

    // =====================================================
    // UI
    // =====================================================

    const [showFilters, setShowFilters] = useState(true);

    // =====================================================
    // Quiz Details Modal
    // =====================================================

    const [isQuizDetailsOpen, setIsQuizDetailsOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizDetailsLoading, setQuizDetailsLoading] = useState(false);
    const [quizDetailsError, setQuizDetailsError] = useState("");

    // =====================================================
    // Pagination
    // =====================================================

    const [page, setPage] = useState(1);
    const limit = 10;

    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // =====================================================
    // Load Teachers + Sections + Batches
    // =====================================================

    useEffect(() => {
        loadFilterData();
    }, []);

    const loadFilterData = async () => {
        try {
            setTeachersLoading(true);
            setSectionsLoading(true);
            setBatchesLoading(true);
            setError("");

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
                (Array.isArray(teachersResponse)
                    ? teachersResponse
                    : []);

            const sectionItems =
                Array.isArray(sectionsResponse)
                    ? sectionsResponse
                    : sectionsResponse?.items || [];

            const batchItems =
                Array.isArray(batchesResponse)
                    ? batchesResponse
                    : batchesResponse?.items || [];

            setTeachers(teacherItems);
            setSections(sectionItems);
            setTeacherSections(sectionItems);

            setBatches(
                batchItems.filter(
                    (item) => item?.is_active !== false
                )
            );
        } catch (error) {
            console.error(
                "Failed to load quiz filters:",
                error
            );

            setError(
                error?.response?.data?.detail ||
                    "Failed to load filter data."
            );
        } finally {
            setTeachersLoading(false);
            setSectionsLoading(false);
            setBatchesLoading(false);
        }
    };

    // =====================================================
    // Load Sections for Selected Teacher
    // =====================================================

    useEffect(() => {
        if (!teacherFilter) {
            setTeacherSections(sections);
            return;
        }

        loadTeacherSections(teacherFilter);
    }, [teacherFilter, sections]);

    const loadTeacherSections = async (teacherId) => {
        try {
            setSectionsLoading(true);

            const data =
                await getDeanTeacherSections(teacherId);

            setTeacherSections(
                Array.isArray(data)
                    ? data
                    : data?.items || []
            );
        } catch (error) {
            console.error(
                "Failed to load teacher sections:",
                error
            );

            setTeacherSections([]);
        } finally {
            setSectionsLoading(false);
        }
    };

    // =====================================================
    // Cascading Academic Filter Options
    // =====================================================

    const availableYears = useMemo(() => {
        const values = sections
            .filter((item) => {
                if (
                    batch &&
                    String(item?.batch_id) !== String(batch)
                ) {
                    return false;
                }

                return (
                    item?.year !== null &&
                    item?.year !== undefined &&
                    item?.year !== ""
                );
            })
            .map((item) => item.year);

        return [...new Set(values)].sort(
            (a, b) => Number(a) - Number(b)
        );
    }, [sections, batch]);

    const availableSemesters = useMemo(() => {
        const values = sections
            .filter((item) => {
                if (
                    batch &&
                    String(item?.batch_id) !== String(batch)
                ) {
                    return false;
                }

                if (
                    year &&
                    String(item?.year) !== String(year)
                ) {
                    return false;
                }

                return (
                    item?.semester !== null &&
                    item?.semester !== undefined &&
                    item?.semester !== ""
                );
            })
            .map((item) => item.semester);

        return [...new Set(values)].sort(
            (a, b) => Number(a) - Number(b)
        );
    }, [sections, batch, year]);

    const filteredTeacherSections = useMemo(() => {
        return teacherSections.filter((item) => {
            if (
                batch &&
                String(item?.batch_id) !== String(batch)
            ) {
                return false;
            }

            if (
                year &&
                String(item?.year) !== String(year)
            ) {
                return false;
            }

            if (
                semester &&
                String(item?.semester) !== String(semester)
            ) {
                return false;
            }

            return true;
        });
    }, [
        teacherSections,
        batch,
        year,
        semester,
    ]);

    // =====================================================
    // Load Quizzes
    // =====================================================

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (status) {
                params.status = status;
            }

            if (teacherFilter) {
                params.teacher_id =
                    Number(teacherFilter);
            }

            if (batch) {
                params.batch_id = Number(batch);
            }

            if (year) {
                params.year = Number(year);
            }

            if (semester) {
                params.semester = Number(semester);
            }

            if (sectionFilter) {
                params.section_id =
                    Number(sectionFilter);
            }

            const data =
                await getDeanQuizzes(params);

            setQuizzes(data?.items || []);
            setTotal(data?.total || 0);
            setTotalPages(data?.total_pages || 1);
        } catch (error) {
            console.error(
                "Failed to load Dean quizzes:",
                error
            );

            setError(
                error?.response?.data?.detail ||
                    "Failed to load quizzes."
            );

            setQuizzes([]);
            setTotal(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // Fetch when filters/page change
    // =====================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            loadQuizzes();
        }, 250);

        return () => clearTimeout(timer);
    }, [
        page,
        search,
        status,
        teacherFilter,
        batch,
        year,
        semester,
        sectionFilter,
    ]);

    // =====================================================
    // Teacher Filter
    // =====================================================

    const handleTeacherChange = (event) => {
        const value = event.target.value;

        setTeacherFilter(value);
        setSectionFilter("");
        setPage(1);
    };

    // =====================================================
    // Batch Filter
    // =====================================================

    const handleBatchChange = (event) => {
        const value = event.target.value;

        setBatch(value);

        // Reset dependent academic filters.
        setYear("");
        setSemester("");
        setSectionFilter("");

        setPage(1);
    };

    // =====================================================
    // Year Filter
    // =====================================================

    const handleYearChange = (event) => {
        const value = event.target.value;

        setYear(value);

        // Semester and section depend on year.
        setSemester("");
        setSectionFilter("");

        setPage(1);
    };

    // =====================================================
    // Semester Filter
    // =====================================================

    const handleSemesterChange = (event) => {
        const value = event.target.value;

        setSemester(value);

        // Section depends on semester.
        setSectionFilter("");

        setPage(1);
    };

    // =====================================================
    // Section Filter
    // =====================================================

    const handleSectionChange = (event) => {
        setSectionFilter(event.target.value);
        setPage(1);
    };

    // =====================================================
    // Status Filter
    // =====================================================

    const handleStatusChange = (event) => {
        setStatus(event.target.value);
        setPage(1);
    };

    // =====================================================
    // Clear Filters
    // =====================================================

    const clearFilters = () => {
        setSearch("");
        setStatus("");

        setTeacherFilter("");

        setBatch("");
        setYear("");
        setSemester("");

        setSectionFilter("");

        setTeacherSections(sections);

        setPage(1);
    };

    const hasActiveFilters = Boolean(
        search ||
            status ||
            teacherFilter ||
            batch ||
            year ||
            semester ||
            sectionFilter
    );

    const activeFilterCount = [
        search,
        status,
        teacherFilter,
        batch,
        year,
        semester,
        sectionFilter,
    ].filter(Boolean).length;

    // =====================================================
    // View Quiz
    // =====================================================

    const handleViewQuiz = async (quiz) => {
        try {
            setSelectedQuiz(null);
            setQuizDetailsError("");
            setIsQuizDetailsOpen(true);
            setQuizDetailsLoading(true);

            const data =
                await getDeanQuiz(quiz.id);

            setSelectedQuiz(data);
        } catch (error) {
            console.error(
                "Failed to load quiz details:",
                error
            );

            setQuizDetailsError(
                error?.response?.data?.detail ||
                    "Failed to load quiz details."
            );
        } finally {
            setQuizDetailsLoading(false);
        }
    };

    // =====================================================
    // Close Quiz Details
    // =====================================================

    const handleCloseQuizDetails = () => {
        if (quizDetailsLoading) {
            return;
        }

        setIsQuizDetailsOpen(false);
        setSelectedQuiz(null);
        setQuizDetailsError("");
    };

    // =====================================================
    // Refresh
    // =====================================================

    const handleRefresh = () => {
        loadQuizzes();
    };

    // =====================================================
    // Pagination
    // =====================================================

    const handlePrevious = () => {
        if (page > 1) {
            setPage((previous) => previous - 1);
        }
    };

    const handleNext = () => {
        if (page < totalPages) {
            setPage((previous) => previous + 1);
        }
    };

    // =====================================================
    // Statistics
    // =====================================================

    const publishedCount = quizzes.filter(
        (quiz) =>
            quiz.status?.toLowerCase() ===
            "published"
    ).length;

    const draftCount = quizzes.filter(
        (quiz) =>
            quiz.status?.toLowerCase() ===
            "draft"
    ).length;

    const assignmentCount = quizzes.reduce(
        (sum, quiz) =>
            sum +
            Number(
                quiz.assignment_count || 0
            ),
        0
    );

    // =====================================================
    // Render
    // =====================================================

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <ClipboardList size={22} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Quiz Management
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage quizzes, assignments
                                and student attempts.
                            </p>
                        </div>

                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                STATISTICS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* Total */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Quizzes
                            </p>

                            <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                {total}
                            </h3>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <ClipboardList size={21} />
                        </div>

                    </div>
                </div>

                {/* Published */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Published
                            </p>

                            <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                {publishedCount}
                            </h3>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <CheckCircle2 size={21} />
                        </div>

                    </div>
                </div>

                {/* Draft */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Draft
                            </p>

                            <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                {draftCount}
                            </h3>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                            <FileQuestion size={21} />
                        </div>

                    </div>
                </div>

                {/* Assignments */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Assignments
                            </p>

                            <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                {assignmentCount}
                            </h3>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                            <Users size={21} />
                        </div>

                    </div>
                </div>

            </div>

            {/* =================================================
                FILTER BAR
            ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="flex flex-col gap-4">

                    {/* Search + Filter Button */}

                    <div className="flex flex-col gap-3 lg:flex-row">

                        {/* Search */}

                        <div className="relative flex-1">

                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) => {
                                    setSearch(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                                placeholder="Search quiz title or teacher..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                        {/* Filter Button */}

                        <button
                            type="button"
                            onClick={() =>
                                setShowFilters(
                                    (previous) =>
                                        !previous
                                )
                            }
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                                showFilters
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >

                            <Filter size={17} />

                            Filters

                            {hasActiveFilters && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}

                        </button>

                    </div>

                    {/* Advanced Filters */}

                    {showFilters && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

                                {/* Teacher */}

                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <UserRound size={14} />
                                        Teacher
                                    </label>

                                    <select
                                        value={teacherFilter}
                                        onChange={
                                            handleTeacherChange
                                        }
                                        disabled={
                                            teachersLoading
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
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
                                        value={batch}
                                        onChange={
                                            handleBatchChange
                                        }
                                        disabled={
                                            batchesLoading
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                    >
                                        <option value="">
                                            All Batches
                                        </option>

                                        {batches.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item.id
                                                    }
                                                    value={
                                                        item.id
                                                    }
                                                >
                                                    {item.batch_name ||
                                                        item.name ||
                                                        `Batch #${item.id}`}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Year */}

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Year
                                    </label>

                                    <select
                                        value={year}
                                        onChange={
                                            handleYearChange
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            All Years
                                        </option>

                                        {availableYears.map(
                                            (item) => {
                                                const numericYear =
                                                    Number(item);

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
                                                            item
                                                        }
                                                        value={
                                                            item
                                                        }
                                                    >
                                                        {numericYear}
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
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Semester
                                    </label>

                                    <select
                                        value={semester}
                                        onChange={
                                            handleSemesterChange
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            All Semesters
                                        </option>

                                        {availableSemesters.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item
                                                    }
                                                    value={
                                                        item
                                                    }
                                                >
                                                    Semester{" "}
                                                    {item}
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
                                        value={sectionFilter}
                                        onChange={
                                            handleSectionChange
                                        }
                                        disabled={
                                            sectionsLoading
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                    >
                                        <option value="">
                                            {teacherFilter
                                                ? "All Teacher Sections"
                                                : "All Sections"}
                                        </option>

                                        {filteredTeacherSections.map(
                                            (sectionItem) => (
                                                <option
                                                    key={
                                                        sectionItem.id
                                                    }
                                                    value={
                                                        sectionItem.id
                                                    }
                                                >
                                                    {
                                                        sectionItem.section_name
                                                    }

                                                    {sectionItem.department
                                                        ? ` • ${sectionItem.department}`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Status */}

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </label>

                                    <select
                                        value={status}
                                        onChange={
                                            handleStatusChange
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            All Status
                                        </option>

                                        <option value="Published">
                                            Published
                                        </option>

                                        <option value="Draft">
                                            Draft
                                        </option>
                                    </select>
                                </div>

                            </div>

                            {/* Active Filter Summary */}

                            {hasActiveFilters && (
                                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="text-xs text-slate-500">
                                        {activeFilterCount}{" "}
                                        filter
                                        {activeFilterCount !==
                                        1
                                            ? "s"
                                            : ""}{" "}
                                        applied
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                                    >
                                        <X size={15} />
                                        Clear Filters
                                    </button>

                                </div>
                            )}

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* =================================================
                QUIZ TABLE
            ================================================= */}

            <QuizTable
                quizzes={quizzes}
                loading={loading}
                onRefresh={loadQuizzes}
                onView={handleViewQuiz}
            />

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading && total > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-sm text-slate-500">
                        Page{" "}
                        <span className="font-semibold text-slate-700">
                            {page}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-700">
                            {totalPages}
                        </span>{" "}
                        ·{" "}
                        <span className="font-semibold text-slate-700">
                            {total}
                        </span>{" "}
                        quizzes
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            onClick={
                                handlePrevious
                            }
                            disabled={page === 1}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={
                                page === totalPages
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>

                    </div>

                </div>
            )}

            {/* =================================================
                QUIZ DETAILS MODAL
            ================================================= */}

            <QuizDetailsModal
                isOpen={isQuizDetailsOpen}
                onClose={handleCloseQuizDetails}
                quiz={selectedQuiz}
                loading={quizDetailsLoading}
                error={quizDetailsError}
            />

        </div>
    );
};

export default QuizManagement;
