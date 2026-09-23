 import { useEffect, useMemo, useState } from "react";
import {
  X,
  Pencil,
  User,
  Mail,
  Hash,
  BookOpen,
  Building2,
  GraduationCap,
  CalendarDays,
} from "lucide-react";

const EditStudentModal = ({
  isOpen,
  onClose,
  onSubmit,
  student,
  sections = [],
  submitting = false,
}) => {
  // ============================================================
  // FORM STATE
  // ============================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roll_no: "",
    section_id: "",
  });

  const [formError, setFormError] = useState("");

  // ============================================================
  // LOAD STUDENT DATA
  // ============================================================

  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        roll_no: student.roll_no || "",
        section_id: student.section_id
          ? String(student.section_id)
          : "",
      });

      setFormError("");
    }
  }, [isOpen, student]);

  // ============================================================
  // SELECTED SECTION
  // ============================================================

  const selectedSection = useMemo(() => {
    if (!formData.section_id) {
      return null;
    }

    return (
      sections.find(
        (section) =>
          String(section.id) ===
          String(formData.section_id)
      ) || null
    );
  }, [sections, formData.section_id]);

  // ============================================================
  // CLOSE IF NOT OPEN
  // ============================================================

  if (!isOpen || !student) {
    return null;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  const getSectionName = (section) => {
    return (
      section?.section_name ||
      section?.name ||
      section?.section ||
      section?.code ||
      `Section ${section?.id ?? ""}`
    );
  };

  // ============================================================
  // HANDLE CHANGE
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------

    if (!formData.name.trim()) {
      setFormError("Student name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setFormError("Student email is required.");
      return;
    }

    if (!formData.roll_no.trim()) {
      setFormError("Roll number is required.");
      return;
    }

    if (!formData.section_id) {
      setFormError("Please select a section.");
      return;
    }

    if (!selectedSection) {
      setFormError(
        "Selected section could not be found."
      );
      return;
    }

    try {
       await onSubmit({
  name: formData.name.trim(),
  email: formData.email.trim(),
  roll_no: formData.roll_no.trim(),
  section_id: Number(formData.section_id),
});
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        "Failed to update student.";

      setFormError(
        Array.isArray(message)
          ? message[0]?.msg ||
              "Invalid student data."
          : message
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Background overlay */}
      <div
        className="absolute inset-0"
        onClick={
          submitting ? undefined : onClose
        }
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Pencil className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Student
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update student account and academic
                information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ======================================================
            FORM
        ====================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-6">

            {/* ==================================================
                ERROR
            ================================================== */}

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {/* ==================================================
                BASIC INFORMATION
            ================================================== */}

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Basic Information
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Update the student's personal and account
                information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Student Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Student Name
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter student name"
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@example.com"
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Roll Number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Roll Number
                </label>

                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    name="roll_no"
                    value={formData.roll_no}
                    onChange={handleChange}
                    placeholder="Enter roll number"
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Student ID - Read Only */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Student ID
                </label>

                <input
                  type="text"
                  value={student.id ?? ""}
                  disabled
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-500"
                />
              </div>
            </div>

            {/* ==================================================
                ACADEMIC INFORMATION
            ================================================== */}

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Academic Information
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Select the student's current section. Batch,
                department, year and semester are automatically
                taken from the selected section.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* =================================================
                  SECTION
              ================================================= */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Section
                </label>

                <div className="relative">
                  <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleChange}
                    disabled={
                      submitting ||
                      sections.length === 0
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                  >
                    <option value="">
                      {sections.length > 0
                        ? "Select section"
                        : "No sections available"}
                    </option>

                    {sections.map((section) => (
                      <option
                        key={section.id}
                        value={section.id}
                      >
                        {getSectionName(section)}
                        {" — "}
                        {section.batch_name ||
                          "No Batch"}
                        {" — Year "}
                        {section.year ?? "—"}
                        {" — Semester "}
                        {section.semester ?? "—"}
                      </option>
                    ))}
                  </select>
                </div>

                {sections.length === 0 && (
                  <p className="mt-2 text-xs text-red-500">
                    No sections were loaded. Please refresh
                    the page and try again.
                  </p>
                )}
              </div>

              {/* =================================================
                  BATCH
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Batch
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={
                      selectedSection?.batch_name ||
                      "—"
                    }
                    disabled
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-600"
                  />
                </div>
              </div>

              {/* =================================================
                  DEPARTMENT
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Department
                </label>

                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={
                      selectedSection?.department ||
                      "—"
                    }
                    disabled
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-600"
                  />
                </div>
              </div>

              {/* =================================================
                  YEAR
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Year
                </label>

                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={
                      selectedSection?.year
                        ? `Year ${selectedSection.year}`
                        : "—"
                    }
                    disabled
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-600"
                  />
                </div>
              </div>

              {/* =================================================
                  SEMESTER
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Semester
                </label>

                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={
                      selectedSection?.semester
                        ? `Semester ${selectedSection.semester}`
                        : "—"
                    }
                    disabled
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* ==================================================
                INFORMATION MESSAGE
            ================================================== */}

            {selectedSection && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-xs font-medium text-indigo-800">
                  Academic information is linked to the
                  selected section.
                </p>

                <p className="mt-1 text-xs text-indigo-600">
                  Changing the section will automatically
                  change the student's batch, department,
                  year and semester.
                </p>
              </div>
            )}
          </div>

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                sections.length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Update Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;