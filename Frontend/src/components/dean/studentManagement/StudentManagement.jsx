import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Users,
  UserPlus,
  Search,
  Upload,
  Download,
  RefreshCw,
  GraduationCap,
  Building2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Mail,
  Hash,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  getDeanStudents,
  getDeanSections,
  getDeanBatches,
  createDeanStudent,
  updateDeanStudent,
  updateDeanStudentStatus,
  deleteDeanStudent,
  uploadDeanStudentsExcel,
  downloadDeanStudentTemplate,
  resendDeanStudentVerification,
} from "../../../services/deanApi";

import AddStudentModal from "./AddStudentModal";
import EditStudentModal from "./EditStudentModal";
import StudentStatusModal from "./StudentStatusModal";
import DeleteStudentModal from "./DeleteStudentModal";
import StudentVerificationModal from "./StudentVerificationModal";
const StudentManagement = () => {
  // =========================================
  // State
  // =========================================

  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showFilters, setShowFilters] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingStudent, setUpdatingStudent] = useState(false);

  const [statusStudent, setStatusStudent] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [deleteStudentData, setDeleteStudentData] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [resendingVerification, setResendingVerification] =
    useState(false);

const [verificationStudent, setVerificationStudent] =
    useState(null);

  // =========================================
  // Fetch Students
  // =========================================

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDeanStudents();

      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        setStudents(data?.students || data?.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);

      const errorMessage =
        err?.response?.data?.detail ||
        "Failed to load students. Please try again.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // Fetch Sections
  // =========================================

  const fetchSections = async () => {
    try {
      setSectionsLoading(true);

      const data = await getDeanSections();

      if (Array.isArray(data)) {
        setSections(data);
      } else {
        setSections(data?.sections || data?.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch sections:", err);

      toast.error(
        err?.response?.data?.detail ||
          "Failed to load sections."
      );
    } finally {
      setSectionsLoading(false);
    }
  };

  // =========================================
  // Fetch Batches
  // =========================================

  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);

      const data = await getDeanBatches();

      if (Array.isArray(data)) {
        setBatches(data);
      } else {
        setBatches(data?.batches || data?.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);

      toast.error(
        err?.response?.data?.detail ||
          "Failed to load batches."
      );
    } finally {
      setBatchesLoading(false);
    }
  };

  // =========================================
  // Initial Load
  // =========================================

  useEffect(() => {
    fetchStudents();
    fetchSections();
    fetchBatches();
  }, []);

  // =========================================
  // Create Student
  // =========================================

  const handleCreateStudent = async (studentData) => {
    try {
      setCreatingStudent(true);

      await createDeanStudent(studentData);

      toast.success("Student created successfully.");

      setShowAddModal(false);

      await fetchStudents();
    } catch (err) {
      console.error("Failed to create student:", err);

      const errorMessage =
        err?.response?.data?.detail ||
        "Failed to create student.";

      toast.error(
        Array.isArray(errorMessage)
          ? errorMessage[0]?.msg ||
              "Invalid student data."
          : errorMessage
      );

      throw err;
    } finally {
      setCreatingStudent(false);
    }
  };

  // =========================================
  // Update Student
  // =========================================

  const handleUpdateStudent = async (studentData) => {
    if (!editingStudent) return;

    try {
      setUpdatingStudent(true);

      await updateDeanStudent(
        editingStudent.id,
        studentData
      );

      toast.success("Student updated successfully.");
      setIsEditModalOpen(false);
      setEditingStudent(null);

      await fetchStudents();
    } catch (err) {
      console.error("Failed to update student:", err);

      const errorMessage =
        err?.response?.data?.detail ||
        "Failed to update student.";

      toast.error(
        Array.isArray(errorMessage)
          ? errorMessage[0]?.msg ||
              "Invalid student data."
          : errorMessage
      );
    } finally {
      setUpdatingStudent(false);
    }
  };

  // =========================================
  // Update Student Status
  // =========================================

  const handleStatusChange = async () => {
    if (!statusStudent) return;

    try {
      setUpdatingStatus(true);

      const newStatus = !statusStudent.is_active;

      await updateDeanStudentStatus(
        statusStudent.id,
        newStatus
      );

      toast.success(
        newStatus
          ? "Student activated successfully."
          : "Student deactivated successfully."
      );

      setStatusStudent(null);

      await fetchStudents();
    } catch (err) {
      console.error(
        "Failed to update student status:",
        err
      );

      toast.error(
        err?.response?.data?.detail ||
          "Failed to update student status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // =========================================
  // Delete Student
  // =========================================

  const handleDeleteStudent = async () => {
    if (!deleteStudentData) return;

    try {
      setDeletingStudent(true);

      await deleteDeanStudent(
        deleteStudentData.id
      );

      toast.success("Student deleted successfully.");

      setDeleteStudentData(null);

      await fetchStudents();
    } catch (err) {
      console.error(
        "Failed to delete student:",
        err
      );

      toast.error(
        err?.response?.data?.detail ||
          "Failed to delete student."
      );
    } finally {
      setDeletingStudent(false);
    }
  };
  // =========================================
// Resend Email Verification
// =========================================

const handleResendVerification = async () => {
    if (!verificationStudent) return;

    try {
        setResendingVerification(true);

        const response =
            await resendDeanStudentVerification(
                verificationStudent.id
            );

        toast.success(
            response?.message ||
                "Verification email sent successfully."
        );

        setVerificationStudent(null);

        await fetchStudents();
    } catch (err) {
        console.error(
            "Failed to resend verification email:",
            err
        );

        const errorMessage =
            err?.response?.data?.detail ||
            "Failed to send verification email.";

        toast.error(errorMessage);
    } finally {
        setResendingVerification(false);
    }
};

  // =========================================
  // Excel Upload
  // =========================================

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingExcel(true);

      const response =
        await uploadDeanStudentsExcel(file);

      toast.success(
        response?.message ||
          "Students uploaded successfully."
      );

      await fetchStudents();
    } catch (err) {
      console.error(
        "Failed to upload students:",
        err
      );

      toast.error(
        err?.response?.data?.detail ||
          "Failed to upload students."
      );
    } finally {
      setUploadingExcel(false);

      event.target.value = "";
    }
  };
const handleEditStudent = (student) => {
  setEditingStudent(student);
  setIsEditModalOpen(true);
};
  // =========================================
  // Download Template
  // =========================================

  const handleDownloadTemplate = async () => {
    try {
      const blob =
        await downloadDeanStudentTemplate();

      const url = window.URL.createObjectURL(
        new Blob([blob])
      );

      const link =
        document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        "student_template.xlsx"
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        "Student template downloaded."
      );
    } catch (err) {
      console.error(
        "Failed to download template:",
        err
      );

      toast.error(
        "Failed to download student template."
      );
    }
  };

 
  // =========================================
  // Filter Options
  // =========================================

  const batchOptions = useMemo(() => {
    return [...batches]
      .filter((batch) => batch?.id != null)
      .sort((a, b) =>
        String(a.batch_name || "").localeCompare(
          String(b.batch_name || ""),
          undefined,
          { numeric: true }
        )
      );
  }, [batches]);

  const departmentOptions = useMemo(() => {
    const source = batchFilter
      ? batches.filter(
          (batch) => String(batch.id) === String(batchFilter)
        )
      : students;

    return [
      ...new Set(
        source
          .map((item) => item.department)
          .filter(Boolean)
      ),
    ].sort();
  }, [batches, students, batchFilter]);

  const sectionOptionsSource = useMemo(() => {
    return sections.filter((section) => {
      const matchesBatch =
        !batchFilter ||
        String(section.batch_id) === String(batchFilter);

      const matchesDepartment =
        !departmentFilter ||
        String(section.department || "").toLowerCase() ===
          String(departmentFilter).toLowerCase();

      const matchesYear =
        !yearFilter ||
        String(section.year) === String(yearFilter);

      const matchesSemester =
        !semesterFilter ||
        String(section.semester) === String(semesterFilter);

      return (
        matchesBatch &&
        matchesDepartment &&
        matchesYear &&
        matchesSemester
      );
    });
  }, [
    sections,
    batchFilter,
    departmentFilter,
    yearFilter,
    semesterFilter,
  ]);

  const yearOptions = useMemo(() => {
    const source = sections.filter((section) => {
      const matchesBatch =
        !batchFilter ||
        String(section.batch_id) === String(batchFilter);

      const matchesDepartment =
        !departmentFilter ||
        String(section.department || "").toLowerCase() ===
          String(departmentFilter).toLowerCase();

      return matchesBatch && matchesDepartment;
    });

    return [...new Set(source.map((section) => section.year).filter(Boolean))].sort(
      (a, b) => Number(a) - Number(b)
    );
  }, [sections, batchFilter, departmentFilter]);

  const semesterOptions = useMemo(() => {
    const source = sections.filter((section) => {
      const matchesBatch =
        !batchFilter ||
        String(section.batch_id) === String(batchFilter);

      const matchesDepartment =
        !departmentFilter ||
        String(section.department || "").toLowerCase() ===
          String(departmentFilter).toLowerCase();

      const matchesYear =
        !yearFilter ||
        String(section.year) === String(yearFilter);

      return matchesBatch && matchesDepartment && matchesYear;
    });

    return [
      ...new Set(
        source.map((section) => section.semester).filter(Boolean)
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [sections, batchFilter, departmentFilter, yearFilter]);

  // =========================================
  // Section Name Helper
  // =========================================

  const getSectionName = (section) => {
    return (
      section?.name ||
      section?.section_name ||
      section?.section ||
      section?.code ||
      "Unknown"
    );
  };

  const sectionOptions = useMemo(() => {
    const uniqueSections = new Map();

    sectionOptionsSource.forEach((section) => {
      const name = getSectionName(section);

      if (!uniqueSections.has(section.id)) {
        uniqueSections.set(section.id, {
          id: section.id,
          name,
          batchName: section.batch_name,
          department: section.department,
          year: section.year,
          semester: section.semester,
        });
      }
    });

    return [...uniqueSections.values()].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), undefined, {
        numeric: true,
      })
    );
  }, [sectionOptionsSource]);

  // =========================================
  // Filter Change Handlers
  // =========================================

  const handleBatchFilterChange = (value) => {
    setBatchFilter(value);

    if (!value) {
      setDepartmentFilter("");
    } else {
      const selectedBatch = batches.find(
        (batch) => String(batch.id) === String(value)
      );

      setDepartmentFilter(selectedBatch?.department || "");
    }

    setYearFilter("");
    setSemesterFilter("");
    setSectionFilter("");
  };

  const handleDepartmentFilterChange = (value) => {
    setDepartmentFilter(value);
    setYearFilter("");
    setSemesterFilter("");
    setSectionFilter("");
  };

  const handleYearFilterChange = (value) => {
    setYearFilter(value);
    setSemesterFilter("");
    setSectionFilter("");
  };

  const handleSemesterFilterChange = (value) => {
    setSemesterFilter(value);
    setSectionFilter("");
  };

  // =========================================
  // Filter Students
  // =========================================

  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !searchValue ||
        student.name?.toLowerCase().includes(searchValue) ||
        student.email?.toLowerCase().includes(searchValue) ||
        student.roll_no?.toLowerCase().includes(searchValue) ||
        student.department?.toLowerCase().includes(searchValue) ||
        student.batch_name?.toLowerCase().includes(searchValue) ||
        String(student.year || "").toLowerCase().includes(searchValue) ||
        String(student.semester || "").toLowerCase().includes(searchValue) ||
        student.section_name?.toLowerCase().includes(searchValue);

      const matchesBatch =
        !batchFilter ||
        String(student.batch_id) === String(batchFilter);

      const matchesDepartment =
        !departmentFilter ||
        String(student.department || "").toLowerCase() ===
          String(departmentFilter).toLowerCase();

      const matchesYear =
        !yearFilter ||
        String(student.year) === String(yearFilter);

      const matchesSemester =
        !semesterFilter ||
        String(student.semester) === String(semesterFilter);

      const matchesSection =
        !sectionFilter ||
        String(student.section_id) === String(sectionFilter);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && student.is_active) ||
        (statusFilter === "inactive" && !student.is_active);
      const matchesVerification =
  !verificationFilter ||
  (verificationFilter === "verified" && student.email_verified) ||
  (verificationFilter === "not_verified" && !student.email_verified);

      return (
          matchesSearch &&
  matchesBatch &&
  matchesDepartment &&
  matchesYear &&
  matchesSemester &&
  matchesSection &&
  matchesStatus &&
  matchesVerification
      );
    });
  }, [
    students,
    search,
    batchFilter,
    departmentFilter,
    yearFilter,
    semesterFilter,
    sectionFilter,
    statusFilter,
    verificationFilter,
  ]);
  // =========================================
// Filtered Statistics
// =========================================

const totalStudents = filteredStudents.length;

const activeStudents = filteredStudents.filter(
    (student) => student.is_active
).length;

const inactiveStudents = filteredStudents.filter(
    (student) => !student.is_active
).length;

const verifiedStudents = filteredStudents.filter(
    (student) => student.email_verified
).length;

const notVerifiedStudents =
    filteredStudents.filter(
        (student) => !student.email_verified
    ).length;

const departments = new Set(
    filteredStudents
        .map((student) => student.department)
        .filter(Boolean)
).size;

  // =========================================
  // Pagination
  // =========================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length /
        itemsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const paginatedStudents =
    filteredStudents.slice(
      startIndex,
      endIndex
    );

  // =========================================
  // Reset Page
  // =========================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    batchFilter,
    departmentFilter,
    yearFilter,
    semesterFilter,
    sectionFilter,
    statusFilter,
    verificationFilter,
  ]);

  // =========================================
  // Clear Filters
  // =========================================

  const clearFilters = () => {
    setSearch("");
    setBatchFilter("");
    setDepartmentFilter("");
    setYearFilter("");
    setSemesterFilter("");
    setSectionFilter("");
    setStatusFilter("");
    setVerificationFilter("");
    setCurrentPage(1);
  };
  // =========================================
// Export Filtered Students to Excel
// =========================================

const handleExportStudents = () => {
  if (!filteredStudents.length) {
    toast.warning("No students available to export.");
    return;
  }

  try {
    const exportData = filteredStudents.map((student) => ({
      "Student ID": student.id ?? "",
      "Name": student.name ?? "",
      "Email": student.email ?? "",
      "Roll No": student.roll_no ?? "",
      "Batch": student.batch_name ?? "",
      "Department": student.department ?? "",
      "Year": student.year ?? "",
      "Semester": student.semester ?? "",
      "Section": student.section_name ?? "",
      "Email Verification": student.email_verified
        ? "Verified"
        : "Not Verified",
      "Account Status": student.is_active
        ? "Active"
        : "Inactive",
      "Created At": student.created_at
        ? new Date(student.created_at).toLocaleString()
        : "",
    }));

    const worksheet =
      XLSX.utils.json_to_sheet(exportData);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Students"
    );

    // =========================================
    // Column Widths
    // =========================================

    worksheet["!cols"] = [
      { wch: 12 }, // Student ID
      { wch: 24 }, // Name
      { wch: 32 }, // Email
      { wch: 18 }, // Roll No
      { wch: 16 }, // Batch
      { wch: 18 }, // Department
      { wch: 10 }, // Year
      { wch: 12 }, // Semester
      { wch: 14 }, // Section
      { wch: 20 }, // Verification
      { wch: 16 }, // Status
      { wch: 24 }, // Created At
    ];

    // =========================================
    // Filename
    // =========================================

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `students_export_${date}.xlsx`
    );

    toast.success(
      `${filteredStudents.length} student${
        filteredStudents.length === 1 ? "" : "s"
      } exported successfully.`
    );
  } catch (err) {
    console.error(
      "Failed to export students:",
      err
    );

    toast.error(
      "Failed to export students to Excel."
    );
  }
};

  const hasActiveFilters =
    search ||
    batchFilter ||
    departmentFilter ||
    yearFilter ||
    semesterFilter ||
    sectionFilter ||
    statusFilter ||
    verificationFilter;

  // =========================================
  // Render
  // =========================================

  return (
    <div className="space-y-6">
      {/* =========================================
          Page Header
      ========================================= */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Student Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage students, accounts, sections,
            and enrollment details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 ${
              uploadingExcel
                ? "cursor-not-allowed opacity-60"
                : ""
            }`}
          >
            <Upload className="h-4 w-4" />

            {uploadingExcel
              ? "Uploading..."
              : "Upload Excel"}

            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={uploadingExcel}
              onChange={handleExcelUpload}
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Template
          </button>
        <button
  type="button"
  onClick={handleExportStudents}
  disabled={!filteredStudents.length}
  className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 shadow-sm transition hover:border-green-300 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
>
  <Download className="h-4 w-4" />
  Export Excel ({filteredStudents.length})
</button>

          <button
            type="button"
            onClick={() =>
              setShowAddModal(true)
            }
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* =========================================
          Statistics
      ========================================= */}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Students
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Students
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {activeStudents}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Inactive Students
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {inactiveStudents}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Departments */}
<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">
        Departments
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {departments}
      </p>
    </div>

    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
      <Building2 className="h-5 w-5 text-blue-600" />
    </div>
  </div>
</div>

{/* Verified Students */}
<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">
        Verified Students
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {verifiedStudents}
      </p>
    </div>

    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    </div>
  </div>
</div>

{/* Not Verified */}
<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">
        Not Verified
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {notVerifiedStudents}
      </p>
    </div>

    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
      <Mail className="h-5 w-5 text-orange-600" />
    </div>
  </div>
</div>
</div>

      {/* =========================================
          Main Student Section
      ========================================= */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}

        <div className="border-b border-gray-200 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                All Students
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View and manage all registered
                students.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search */}

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search students..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter */}

              <button
                type="button"
                onClick={() =>
                  setShowFilters(
                    (previous) =>
                      !previous
                  )
                }
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                  showFilters ||
                  hasActiveFilters
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />

                Filters

                {hasActiveFilters && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                    {
                      [
                        search,
                        batchFilter,
                        departmentFilter,
                        yearFilter,
                        semesterFilter,
                        sectionFilter,
                        statusFilter,
                        verificationFilter
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </button>

              {/* Refresh */}

               <button
  type="button"
  onClick={fetchStudents}
  disabled={loading}
  title="Refresh students"
  aria-label="Refresh students"
  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
>
  <RefreshCw
    size={17}
    strokeWidth={2.2}
    className={loading ? "animate-spin" : ""}
  />
</button>
            </div>
          </div>

          {/* Filters */}

          {showFilters && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {/* Batch */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Batch
                  </label>

                  <select
                    value={batchFilter}
                    onChange={(event) =>
                      handleBatchFilterChange(event.target.value)
                    }
                    disabled={batchesLoading}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                  >
                    <option value="">All Batches</option>
                    {batchOptions.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </label>

                  <select
                    value={departmentFilter}
                    onChange={(event) =>
                      handleDepartmentFilterChange(event.target.value)
                    }
                    disabled={Boolean(batchFilter) || batchesLoading}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                  >
                    <option value="">All Departments</option>
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>

                  {batchFilter && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      Department is determined by the selected batch.
                    </p>
                  )}
                </div>

                {/* Year */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Year
                  </label>

                  <select
                    value={yearFilter}
                    onChange={(event) =>
                      handleYearFilterChange(event.target.value)
                    }
                    disabled={sectionsLoading || yearOptions.length === 0}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                  >
                    <option value="">All Years</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Semester
                  </label>

                  <select
                    value={semesterFilter}
                    onChange={(event) =>
                      handleSemesterFilterChange(event.target.value)
                    }
                    disabled={sectionsLoading || semesterOptions.length === 0}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                  >
                    <option value="">All Semesters</option>
                    {semesterOptions.map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Section
                  </label>

                  <select
                    value={sectionFilter}
                    onChange={(event) =>
                      setSectionFilter(event.target.value)
                    }
                    disabled={sectionsLoading || sectionOptions.length === 0}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                  >
                    <option value="">All Sections</option>
                    {sectionOptions.map((section) => (
                      <option key={section.id} value={section.id}>
                        Section {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {/* Verification Status */}
<div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
    Verification
  </label>

  <select
    value={verificationFilter}
    onChange={(event) =>
      setVerificationFilter(event.target.value)
    }
    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
  >
    <option value="">All Verification</option>
    <option value="verified">Verified</option>
    <option value="not_verified">Not Verified</option>
  </select>
</div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    <span className="font-semibold text-gray-700">
                      {
                        filteredStudents.length
                      }
                    </span>{" "}
                    matching student
                    {filteredStudents.length !==
                    1
                      ? "s"
                      : ""}
                  </p>
 

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading */}

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-700">
                Loading students...
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Please wait while we fetch
                student records.
              </p>
            </div>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="flex min-h-[300px] items-center justify-center p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-900">
                Unable to load students
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchStudents}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}

        {!loading &&
          !error &&
          filteredStudents.length === 0 && (
            <div className="flex min-h-[300px] items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  {hasActiveFilters ? (
                    <Search className="h-7 w-7 text-gray-400" />
                  ) : (
                    <GraduationCap className="h-7 w-7 text-gray-400" />
                  )}
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-900">
                  {hasActiveFilters
                    ? "No matching students"
                    : "No students found"}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {hasActiveFilters
                    ? "Try changing your search or filters."
                    : "There are currently no students registered in the system."}
                </p>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddModal(
                        true
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Student
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Student Table */}

        {!loading &&
          !error &&
          filteredStudents.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1400px] w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Student
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Roll No.
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Batch
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Section
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Department
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Year
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Semester
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
  Verification
</th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedStudents.map(
                      (student) => (
                        <tr
                          key={student.id}
                          className="transition hover:bg-gray-50"
                        >
                          {/* Student */}

                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                {student.name
                                  ?.split(
                                    " "
                                  )
                                  .map(
                                    (word) =>
                                      word.charAt(
                                        0
                                      )
                                  )
                                  .join("")
                                  .slice(
                                    0,
                                    2
                                  )
                                  .toUpperCase() ||
                                  "S"}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {student.name ||
                                    "—"}
                                </p>

                                <div className="mt-1 flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5 text-gray-400" />

                                  <p className="text-xs text-gray-500">
                                    {student.email ||
                                      "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Roll */}

                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-gray-400" />

                              <span className="text-sm font-medium text-gray-700">
                                {student.roll_no ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          {/* Batch */}

                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                              {student.batch_name || "—"}
                            </span>
                          </td>

                          {/* Section */}

                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                              <BookOpen className="h-3.5 w-3.5" />

                              Section{" "}
                              {student.section_name ||
                                student.section ||
                                "—"}
                            </span>
                          </td>

                          {/* Department */}

                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />

                              <span className="text-sm font-medium text-gray-700">
                                {student.department ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          {/* Year */}

                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                Year {student.year ?? "—"}
                              </span>
                            </div>
                          </td>

                          {/* Semester */}

                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-gray-400" />

                              <span className="text-sm text-gray-700">
                                Semester{" "}
                                {student.semester ??
                                  "—"}
                              </span>
                            </div>
                          </td>
{/* Verification */}
<td className="whitespace-nowrap px-6 py-4">
  {student.email_verified ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
      Not Verified
    </span>
  )}
</td>
                          {/* Status */}

                          <td className="whitespace-nowrap px-6 py-4">
                            {student.is_active ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Actions */}

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit */}
 <button
  type="button"
  onClick={() => handleEditStudent(student)}
  title="Edit student"
  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800 hover:shadow-sm"
>
  <Pencil className="h-3.5 w-3.5" />
  Edit
</button>

                              {/* Activate / Deactivate */}

                               <button
  type="button"
  onClick={() => setStatusStudent(student)}
  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all duration-200 ${
    student.is_active
      ? "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 hover:shadow-sm"
      : "border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 hover:shadow-sm"
  }`}
  title={
    student.is_active
      ? "Deactivate student"
      : "Activate student"
  }
>
  {student.is_active ? (
    <PowerOff className="h-3.5 w-3.5" />
  ) : (
    <Power className="h-3.5 w-3.5" />
  )}

  {student.is_active
    ? "Deactivate"
    : "Activate"}
</button>
{/* Resend Verification */}

{!student.email_verified && (
    <button
        type="button"
        onClick={() =>
            setVerificationStudent(student)
        }
        title="Resend verification email"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 transition-all duration-200 hover:border-orange-300 hover:bg-orange-100 hover:shadow-sm"
    >
        <Mail className="h-3.5 w-3.5" />
        Resend
    </button>
)}

                              {/* Delete */}

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteStudentData(
                                    student
                                  )
                                }
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                                title="Delete student"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.min(
                      endIndex,
                      filteredStudents.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {
                      filteredStudents.length
                    }
                  </span>{" "}
                  students
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    disabled={
                      safeCurrentPage === 1
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">
                    {safeCurrentPage}
                  </div>

                  <span className="text-sm text-gray-400">
                    of
                  </span>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600">
                    {totalPages}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    disabled={
                      safeCurrentPage ===
                      totalPages
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
      </div>

      {/* =========================================
          Add Student Modal
      ========================================= */}

      <AddStudentModal
        isOpen={showAddModal}
        onClose={() =>
          setShowAddModal(false)
        }
        onSubmit={handleCreateStudent}
        sections={sections}
        submitting={creatingStudent}
      />

      {/* =========================================
          Edit Student Modal
      ========================================= */}

 <EditStudentModal
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  }}
  student={editingStudent}
  sections={sections}
  submitting={updatingStudent}
  onSubmit={handleUpdateStudent}
/>      {/* =========================================
          Student Status Modal
      ========================================= */}

      <StudentStatusModal
        isOpen={Boolean(statusStudent)}
        student={statusStudent}
        loading={updatingStatus}
        onClose={() =>
          setStatusStudent(null)
        }
        onConfirm={handleStatusChange}
      />

      {/* =========================================
          Delete Student Modal
      ========================================= */}

      <DeleteStudentModal
        isOpen={Boolean(deleteStudentData)}
        student={deleteStudentData}
        loading={deletingStudent}
        onClose={() =>
          setDeleteStudentData(null)
        }
        onConfirm={handleDeleteStudent}
      />
      {/* =========================================
    Student Verification Modal
========================================= */}

<StudentVerificationModal
    isOpen={Boolean(verificationStudent)}
    student={verificationStudent}
    loading={resendingVerification}
    onClose={() =>
        setVerificationStudent(null)
    }
    onConfirm={handleResendVerification}
/>
    </div>
  );
};

export default StudentManagement;