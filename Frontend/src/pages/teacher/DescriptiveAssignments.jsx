
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Filter,
    Eye,
    ClipboardList,
    CheckCircle,
    Clock,
    X,
    Users,
    Send,
    Loader2,
    Award,
        FileText,
} from "lucide-react";
import { toast } from "react-toastify";

import AssignedStudentsTable from "./AssignedStudentsTable";

import {
    getTeacherDescriptiveAssignments,
    getTeacherDescriptiveSections,
    assignDescriptiveAssignment,
    publishDescriptiveAssignment,
    getDescriptiveAssignmentAssignedStudents,
} from "../../api/teacherApi";

const DescriptiveAssignments = () => {
    const navigate = useNavigate();

    // =========================================================
    // ASSIGNMENTS
    // =========================================================

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [sectionFilter, setSectionFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // =========================================================
    // ASSIGN MODAL
    // =========================================================

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const [teacherSections, setTeacherSections] = useState([]);
    const [selectedSectionIds, setSelectedSectionIds] = useState([]);

    const [loadingSections, setLoadingSections] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // =========================================================
    // PUBLISH
    // =========================================================

    const [publishingAssignmentId, setPublishingAssignmentId] =
        useState(null);

    // =========================================================
    // ASSIGNED STUDENTS MODAL
    // =========================================================

    const [showStudentsModal, setShowStudentsModal] = useState(false);

    const [studentsAssignment, setStudentsAssignment] = useState(null);

    const [assignedStudents, setAssignedStudents] = useState([]);

    const [studentsLoading, setStudentsLoading] = useState(false);

    const [studentSearch, setStudentSearch] = useState("");

    const [studentSectionFilter, setStudentSectionFilter] =
        useState("all");

    const [totalAssignedStudents, setTotalAssignedStudents] =
        useState(0);

    // =========================================================
    // LOAD ASSIGNMENTS
    // =========================================================

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            setLoading(true);

            const data =
                await getTeacherDescriptiveAssignments();

            console.log(
                "Teacher descriptive assignments:",
                data
            );

            let assignmentList = [];

            if (Array.isArray(data)) {
                assignmentList = data;
            } else if (Array.isArray(data?.assignments)) {
                assignmentList = data.assignments;
            } else if (Array.isArray(data?.items)) {
                assignmentList = data.items;
            }

            setAssignments(assignmentList);
        } catch (error) {
            console.error(
                "Failed to load descriptive assignments:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load assignments."
            );

            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // SECTION FILTER OPTIONS
    // =========================================================

    const sectionOptions = useMemo(() => {
        const map = new Map();

        assignments.forEach((assignment) => {
            const sections = Array.isArray(assignment.sections)
                ? assignment.sections
                : [];

            sections.forEach((section) => {
                if (
                    section?.id !== undefined &&
                    section?.id !== null
                ) {
                    map.set(
                        section.id,
                        section.name ||
                            section.section_name ||
                            `Section ${section.id}`
                    );
                }
            });
        });

        return Array.from(map.entries()).map(([id, name]) => ({
            id,
            name,
        }));
    }, [assignments]);

    // =========================================================
    // FILTER ASSIGNMENTS
    // =========================================================

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const searchText = search.toLowerCase().trim();

            const title = String(
                assignment.title || ""
            ).toLowerCase();

            const assignmentId = String(
                assignment.id ?? ""
            );

            const matchesSearch =
                !searchText ||
                title.includes(searchText) ||
                assignmentId.includes(searchText);

            const assignmentStatus = String(
                assignment.status || ""
            ).toLowerCase();

            const matchesStatus =
                statusFilter === "all" ||
                assignmentStatus ===
                    statusFilter.toLowerCase();

            const sections = Array.isArray(
                assignment.sections
            )
                ? assignment.sections
                : [];

            const matchesSection =
                sectionFilter === "all" ||
                sections.some(
                    (section) =>
                        String(section.id) ===
                        String(sectionFilter)
                );

            return (
                matchesSearch &&
                matchesStatus &&
                matchesSection
            );
        });
    }, [
        assignments,
        search,
        sectionFilter,
        statusFilter,
    ]);

    // =========================================================
    // CLEAR FILTERS
    // =========================================================

    const clearFilters = () => {
        setSearch("");
        setSectionFilter("all");
        setStatusFilter("all");
    };

    const hasFilters =
        Boolean(search) ||
        sectionFilter !== "all" ||
        statusFilter !== "all";

    // =========================================================
    // STATISTICS
    // =========================================================

    const total = assignments.length;

    const published = assignments.filter(
        (assignment) =>
            String(
                assignment.status || ""
            ).toLowerCase() === "published"
    ).length;

    const drafts = assignments.filter(
        (assignment) =>
            String(
                assignment.status || ""
            ).toLowerCase() === "draft"
    ).length;

    // =========================================================
    // DATE FORMATTER
    // =========================================================

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleDateString("en-IN");
    };

    // =========================================================
    // PUBLISH ASSIGNMENT
    // =========================================================

    const handlePublishAssignment = async (assignment) => {
        if (!assignment) {
            return;
        }

        const assignmentSections = Array.isArray(
            assignment.sections
        )
            ? assignment.sections
            : [];

        if (assignmentSections.length === 0) {
            toast.warning(
                "Please assign this assignment to at least one section before publishing."
            );

            openAssignModal(assignment);
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to publish "${assignment.title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setPublishingAssignmentId(assignment.id);

            const sectionIds = assignmentSections
                .map((section) => section.id)
                .filter(
                    (id) =>
                        id !== undefined &&
                        id !== null
                );

            if (sectionIds.length === 0) {
                toast.warning(
                    "No valid sections found for this assignment."
                );

                return;
            }

            const response =
                await publishDescriptiveAssignment(
                    assignment.id,
                    sectionIds
                );

            toast.success(
                response?.message ||
                    "Assignment published successfully."
            );

            await loadAssignments();
        } catch (error) {
            console.error(
                "Failed to publish assignment:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to publish assignment."
            );
        } finally {
            setPublishingAssignmentId(null);
        }
    };

    // =========================================================
    // OPEN ASSIGN MODAL
    // =========================================================

    const openAssignModal = async (assignment) => {
        setSelectedAssignment(assignment);
        setSelectedSectionIds([]);
        setShowAssignModal(true);

        try {
            setLoadingSections(true);

            const data =
                await getTeacherDescriptiveSections();

            let sections = [];

            if (Array.isArray(data)) {
                sections = data;
            } else if (
                Array.isArray(data?.sections)
            ) {
                sections = data.sections;
            }

            setTeacherSections(sections);
        } catch (error) {
            console.error(
                "Failed to load teacher sections:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load your sections."
            );

            setTeacherSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    // =========================================================
    // CLOSE ASSIGN MODAL
    // =========================================================

    const closeAssignModal = () => {
        if (assigning) {
            return;
        }

        setShowAssignModal(false);
        setSelectedAssignment(null);
        setSelectedSectionIds([]);
    };

    // =========================================================
    // TOGGLE SECTION
    // =========================================================

    const toggleSection = (sectionId) => {
        setSelectedSectionIds((previous) => {
            if (previous.includes(sectionId)) {
                return previous.filter(
                    (id) => id !== sectionId
                );
            }

            return [...previous, sectionId];
        });
    };

    // =========================================================
    // SELECT ALL SECTIONS
    // =========================================================

    const selectAllSections = () => {
        if (
            selectedSectionIds.length ===
            teacherSections.length
        ) {
            setSelectedSectionIds([]);
            return;
        }

        setSelectedSectionIds(
            teacherSections
                .map((section) => section.id)
                .filter(
                    (id) =>
                        id !== undefined &&
                        id !== null
                )
        );
    };

    // =========================================================
    // ASSIGN ASSIGNMENT
    // =========================================================

    const handleAssignAssignment = async () => {
        if (!selectedAssignment) {
            return;
        }

        if (selectedSectionIds.length === 0) {
            toast.warning(
                "Please select at least one section."
            );

            return;
        }

        try {
            setAssigning(true);

            const response =
                await assignDescriptiveAssignment(
                    selectedAssignment.id,
                    {
                        section_ids:
                            selectedSectionIds,
                    }
                );

            toast.success(
                response?.message ||
                    "Assignment assigned successfully."
            );

            closeAssignModal();

            await loadAssignments();
        } catch (error) {
            console.error(
                "Failed to assign assignment:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to assign assignment."
            );
        } finally {
            setAssigning(false);
        }
    };

    // =========================================================
    // LOAD ASSIGNED STUDENTS
    // =========================================================

    const loadAssignedStudents = async (
        assignment,
        searchValue = "",
        sectionValue = "all"
    ) => {
        if (!assignment) {
            return;
        }

        try {
            setStudentsLoading(true);

            const params = {
                search:
                    searchValue?.trim() || undefined,

                section_id:
                    sectionValue !== "all"
                        ? sectionValue
                        : undefined,
            };

            const data =
                await getDescriptiveAssignmentAssignedStudents(
                    assignment.id,
                    params
                );

            console.log(
                "Assigned students response:",
                data
            );

            const students = Array.isArray(
                data?.students
            )
                ? data.students
                : Array.isArray(data)
                ? data
                : [];

            setAssignedStudents(students);

            setTotalAssignedStudents(
                data?.total_students ??
                    data?.total ??
                    students.length
            );
        } catch (error) {
            console.error(
                "Failed to load assigned students:",
                error
            );

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to load assigned students."
            );

            setAssignedStudents([]);
            setTotalAssignedStudents(0);
        } finally {
            setStudentsLoading(false);
        }
    };

    // =========================================================
    // OPEN STUDENTS MODAL
    // =========================================================

    const openStudentsModal = async (assignment) => {
        setStudentsAssignment(assignment);
        setAssignedStudents([]);
        setStudentSearch("");
        setStudentSectionFilter("all");
        setTotalAssignedStudents(0);
        setShowStudentsModal(true);

        await loadAssignedStudents(
            assignment,
            "",
            "all"
        );
    };

    // =========================================================
    // CLOSE STUDENTS MODAL
    // =========================================================

    const closeStudentsModal = () => {
        if (studentsLoading) {
            return;
        }

        setShowStudentsModal(false);
        setStudentsAssignment(null);
        setAssignedStudents([]);
        setStudentSearch("");
        setStudentSectionFilter("all");
        setTotalAssignedStudents(0);
    };

    // =========================================================
    // SEARCH STUDENTS
    // =========================================================

    const handleStudentSearch = async (value) => {
        setStudentSearch(value);

        if (!studentsAssignment) {
            return;
        }

        await loadAssignedStudents(
            studentsAssignment,
            value,
            studentSectionFilter
        );
    };

    // =========================================================
    // FILTER STUDENTS BY SECTION
    // =========================================================

    const handleStudentSectionFilter = async (
        value
    ) => {
        setStudentSectionFilter(value);

        if (!studentsAssignment) {
            return;
        }

        await loadAssignedStudents(
            studentsAssignment,
            studentSearch,
            value
        );
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Descriptive Assignments
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Create, manage and review
                            descriptive assignments.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/teacher/descriptive-assignments/create"
                            )
                        }
                        className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
                    >
                        <Plus size={20} />
                        Create Manually
                    </button>

                     <button
    type="button"
    onClick={() =>
        navigate(
            "/teacher/descriptive-assignments/create-pdf"
        )
    }
    className="flex items-center justify-center gap-2 border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition"
>
    <FileText size={20} />
    Create from PDF
</button>
                    
                </div>
                

                {/* STATISTICS */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-gray-500">
                                    Total Assignments
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {total}
                                </h2>
                            </div>

                            <div className="p-3 bg-blue-100 rounded-xl">
                                <ClipboardList className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-gray-500">
                                    Published
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {published}
                                </h2>
                            </div>

                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-gray-500">
                                    Drafts
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {drafts}
                                </h2>
                            </div>

                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <Clock className="text-yellow-600" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* FILTERS */}

                <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">

                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} />

                        <h2 className="font-semibold">
                            Filter Assignments
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-3.5 text-gray-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search assignment..."
                                className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <select
                            value={sectionFilter}
                            onChange={(e) =>
                                setSectionFilter(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">
                                All Sections
                            </option>

                            {sectionOptions.map(
                                (section) => (
                                    <option
                                        key={section.id}
                                        value={section.id}
                                    >
                                        {section.name}
                                    </option>
                                )
                            )}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">
                                All Status
                            </option>

                            <option value="published">
                                Published
                            </option>

                            <option value="draft">
                                Draft
                            </option>
                        </select>

                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={!hasFilters}
                            className="flex items-center justify-center gap-2 border rounded-xl px-4 py-3 hover:bg-gray-50 disabled:opacity-40"
                        >
                            <X size={18} />
                            Clear Filters
                        </button>

                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-semibold text-gray-800">
                            {filteredAssignments.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-gray-800">
                            {total}
                        </span>{" "}
                        assignments
                    </div>
                </div>

                {/* ASSIGNMENT LIST */}

                {loading ? (
                    <div className="bg-white rounded-2xl p-12 text-center">
                        <Loader2
                            className="mx-auto animate-spin text-purple-600 mb-3"
                            size={30}
                        />

                        Loading assignments...
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center">
                        <ClipboardList
                            size={45}
                            className="mx-auto text-gray-300 mb-4"
                        />

                        <h3 className="text-lg font-semibold">
                            {assignments.length === 0
                                ? "No descriptive assignments yet"
                                : "No assignments found"}
                        </h3>

                        <p className="text-gray-500 mt-1">
                            {assignments.length === 0
                                ? "Create your first descriptive assignment."
                                : "Try changing your filters."}
                        </p>

                        {assignments.length === 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/teacher/descriptive-assignments/create"
                                    )
                                }
                                className="mt-5 inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-purple-700"
                            >
                                <Plus size={18} />
                                Create Assignment
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">

                        {filteredAssignments.map(
                            (assignment) => {
                                const assignmentStatus =
                                    String(
                                        assignment.status ||
                                            ""
                                    ).toLowerCase();

                                const assignmentSections =
                                    Array.isArray(
                                        assignment.sections
                                    )
                                        ? assignment.sections
                                        : [];

                                return (
                                    <div
                                        key={assignment.id}
                                        className="bg-white rounded-2xl shadow-sm p-6"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                                            {/* ASSIGNMENT INFO */}

                                            <div className="flex gap-4">

                                                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <ClipboardList
                                                        className="text-blue-600"
                                                        size={26}
                                                    />
                                                </div>

                                                <div>

                                                    <div className="flex items-center gap-3 flex-wrap">

                                                        <h2 className="text-xl font-bold">
                                                            {
                                                                assignment.title
                                                            }
                                                        </h2>

                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                assignmentStatus ===
                                                                "published"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                        >
                                                            {assignment.status ||
                                                                "Draft"}
                                                        </span>

                                                    </div>

                                                    <p className="text-gray-500 mt-1">
                                                        Assignment ID: #
                                                        {
                                                            assignment.id
                                                        }
                                                    </p>

                                                    <div className="flex items-center gap-2 flex-wrap mt-3">

                                                        <Users
                                                            size={16}
                                                            className="text-gray-400"
                                                        />

                                                        {assignmentSections.length ===
                                                        0 ? (
                                                            <span className="text-sm text-gray-400">
                                                                Not assigned
                                                            </span>
                                                        ) : (
                                                            assignmentSections.map(
                                                                (
                                                                    section
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            section.id
                                                                        }
                                                                        className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                                                                    >
                                                                        {section.name ||
                                                                            section.section_name ||
                                                                            `Section ${section.id}`}
                                                                    </span>
                                                                )
                                                            )
                                                        )}

                                                    </div>
                                                </div>
                                            </div>

                                            {/* BUTTONS */}

                                            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">

                                                {assignmentStatus ===
                                                    "draft" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePublishAssignment(
                                                                assignment
                                                            )
                                                        }
                                                        disabled={
                                                            publishingAssignmentId ===
                                                            assignment.id
                                                        }
                                                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {publishingAssignmentId ===
                                                        assignment.id ? (
                                                            <>
                                                                <Loader2
                                                                    size={
                                                                        18
                                                                    }
                                                                    className="animate-spin"
                                                                />
                                                                Publishing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                                Publish
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {assignmentStatus ===
                                                    "draft" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openAssignModal(
                                                                assignment
                                                            )
                                                        }
                                                        className="flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-purple-700 transition"
                                                    >
                                                        <Send
                                                            size={18}
                                                        />
                                                        Assign
                                                    </button>
                                                )}

                                                {assignmentStatus ===
                                                    "published" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openStudentsModal(
                                                                assignment
                                                            )
                                                        }
                                                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
                                                    >
                                                        <Users
                                                            size={18}
                                                        />
                                                        View Students
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/teacher/descriptive-assignments/${assignment.id}/submissions`
                                                        )
                                                    }
                                                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-purple-700 transition"
                                                >
                                                    <Eye size={18} />
                                                    View Submissions
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/teacher/descriptive-assignments/${assignment.id}`
                                                        )
                                                    }
                                                    className="flex items-center justify-center gap-2 border-2 border-purple-600 text-purple-600 px-5 py-3 rounded-xl font-medium hover:bg-purple-50 transition"
                                                >
                                                    <ClipboardList
                                                        size={18}
                                                    />
                                                    View Assignment
                                                </button>
                                                {/* Performance */}

<button
    type="button"
    onClick={() =>
        navigate(
            `/teacher/descriptive-assignments/${assignment.id}/performance`
        )
    }
    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
>
    <Award size={18} />
    Performance
</button>

                                            </div>
                                        </div>

                                        {/* BOTTOM INFORMATION */}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t">

                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">
                                                    Subject
                                                </p>

                                                <p className="font-semibold mt-1">
                                                    {assignment.subject_id ||
                                                        "—"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">
                                                    Due Date
                                                </p>

                                                <p className="font-semibold mt-1">
                                                    {formatDate(
                                                        assignment.due_date
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">
                                                    Created
                                                </p>

                                                <p className="font-semibold mt-1">
                                                    {formatDate(
                                                        assignment.created_at
                                                    )}
                                                </p>
                                            </div>

                                        </div>
                                    </div>
                                );
                            }
                        )}

                    </div>
                )}
            </div>

            {/* =========================================================
                ASSIGN ASSIGNMENT MODAL
            ========================================================== */}

            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between px-6 py-5 border-b">

                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Assign Assignment
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Select the sections that should
                                    receive this assignment.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeAssignModal}
                                disabled={assigning}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="px-6 pt-5">

                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">

                                <p className="text-xs text-purple-600 font-semibold uppercase">
                                    Assignment
                                </p>

                                <p className="font-bold text-gray-900 mt-1">
                                    {selectedAssignment?.title}
                                </p>

                                <p className="text-sm text-gray-500 mt-1">
                                    Assignment #
                                    {selectedAssignment?.id}
                                </p>

                            </div>

                        </div>

                        <div className="px-6 py-5">

                            <div className="flex items-center justify-between mb-3">

                                <h3 className="font-semibold text-gray-900">
                                    Select Sections
                                </h3>

                                {!loadingSections &&
                                    teacherSections.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={
                                                selectAllSections
                                            }
                                            disabled={assigning}
                                            className="text-sm text-purple-600 font-medium hover:text-purple-700"
                                        >
                                            {selectedSectionIds.length ===
                                            teacherSections.length
                                                ? "Unselect All"
                                                : "Select All"}
                                        </button>
                                    )}

                            </div>

                            {loadingSections ? (
                                <div className="py-10 text-center">

                                    <Loader2
                                        size={28}
                                        className="mx-auto animate-spin text-purple-600 mb-3"
                                    />

                                    <p className="text-gray-500">
                                        Loading sections...
                                    </p>

                                </div>
                            ) : teacherSections.length === 0 ? (
                                <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5 text-center">

                                    <Users
                                        size={32}
                                        className="mx-auto text-yellow-600 mb-2"
                                    />

                                    <p className="font-semibold text-gray-800">
                                        No sections found
                                    </p>

                                    <p className="text-sm text-gray-500 mt-1">
                                        You are not assigned to
                                        any section.
                                    </p>

                                </div>
                            ) : (
                                <div className="space-y-3">

                                    {teacherSections.map(
                                        (section) => {
                                            const isSelected =
                                                selectedSectionIds.includes(
                                                    section.id
                                                );

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        section.id
                                                    }
                                                    onClick={() =>
                                                        toggleSection(
                                                            section.id
                                                        )
                                                    }
                                                    disabled={
                                                        assigning
                                                    }
                                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${
                                                        isSelected
                                                            ? "border-purple-500 bg-purple-50"
                                                            : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                                                    }`}
                                                >

                                                    <div
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                                                            isSelected
                                                                ? "bg-purple-600 border-purple-600"
                                                                : "border-gray-300"
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <CheckCircle
                                                                size={
                                                                    15
                                                                }
                                                                className="text-white"
                                                            />
                                                        )}
                                                    </div>

                                                    <div>

                                                        <p className="font-semibold text-gray-900">
                                                            {section.name ||
                                                                section.section_name ||
                                                                `Section ${section.id}`}
                                                        </p>

                                                        {section.department && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {
                                                                    section.department
                                                                }
                                                            </p>
                                                        )}

                                                    </div>

                                                </button>
                                            );
                                        }
                                    )}

                                </div>
                            )}

                        </div>

                        {selectedSectionIds.length > 0 && (
                            <div className="px-6 pb-4">

                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                                    Students belonging to the
                                    selected section(s) will
                                    receive this assignment.
                                </div>

                            </div>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-5 border-t bg-gray-50 rounded-b-2xl">

                            <button
                                type="button"
                                onClick={closeAssignModal}
                                disabled={assigning}
                                className="px-5 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-white disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleAssignAssignment
                                }
                                disabled={
                                    assigning ||
                                    loadingSections ||
                                    selectedSectionIds.length ===
                                        0
                                }
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {assigning ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Assign Assignment
                                    </>
                                )}
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* =========================================================
                ASSIGNED STUDENTS MODAL
            ========================================================== */}

            {showStudentsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

                        {/* MODAL HEADER */}

                        <div className="flex items-center justify-between px-7 py-5 border-b shrink-0">

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Assigned Students
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Students who actually received
                                    this assignment.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeStudentsModal
                                }
                                disabled={studentsLoading}
                                className="w-11 h-11 flex items-center justify-center rounded-xl border-2 border-purple-500 text-purple-600 hover:bg-purple-50 transition disabled:opacity-50"
                            >
                                <X size={22} />
                            </button>

                        </div>

                        {/* ASSIGNMENT SUMMARY */}

                        <div className="px-7 pt-5 shrink-0">

                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">

                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                                    <div>

                                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">
                                            Assignment
                                        </p>

                                        <p className="text-xl font-bold text-gray-900 mt-1">
                                            {
                                                studentsAssignment?.title
                                            }
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Assignment #
                                            {
                                                studentsAssignment?.id
                                            }
                                        </p>

                                    </div>

                                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-blue-100">

                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Users
                                                size={20}
                                                className="text-blue-600"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Total Students
                                            </p>

                                            <p className="text-xl font-bold text-gray-900">
                                                {
                                                    totalAssignedStudents
                                                }
                                            </p>
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* SEARCH + FILTER */}

                        <div className="px-7 py-5 border-b shrink-0">

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                <div className="relative">

                                    <Search
                                        size={19}
                                        className="absolute left-4 top-3.5 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        value={
                                            studentSearch
                                        }
                                        onChange={(e) =>
                                            handleStudentSearch(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search name, email or roll number..."
                                        className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />

                                </div>

                                <select
                                    value={
                                        studentSectionFilter
                                    }
                                    onChange={(e) =>
                                        handleStudentSectionFilter(
                                            e.target.value
                                        )
                                    }
                                    className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">
                                        All Sections
                                    </option>

                                    {(
                                        studentsAssignment?.sections ||
                                        []
                                    ).map(
                                        (section) => (
                                            <option
                                                key={
                                                    section.id
                                                }
                                                value={
                                                    section.id
                                                }
                                            >
                                                {section.name ||
                                                    section.section_name ||
                                                    `Section ${section.id}`}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            <div className="mt-3 text-sm text-gray-500">
                                Showing{" "}
                                <span className="font-semibold text-gray-900">
                                    {
                                        assignedStudents.length
                                    }
                                </span>{" "}
                                students
                            </div>

                        </div>

                        {/* TABLE */}

                        <div className="flex-1 overflow-y-auto px-7 py-5 min-h-0">

                            <AssignedStudentsTable
                                students={
                                    assignedStudents
                                }
                                loading={
                                    studentsLoading
                                }
                            />

                        </div>

                        {/* FOOTER */}

                        <div className="flex justify-end px-7 py-4 border-t bg-gray-50 shrink-0">

                            <button
                                type="button"
                                onClick={
                                    closeStudentsModal
                                }
                                disabled={studentsLoading}
                                className="px-7 py-3 rounded-xl border-2 border-purple-500 text-purple-600 font-semibold hover:bg-purple-50 transition disabled:opacity-50"
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default DescriptiveAssignments;

