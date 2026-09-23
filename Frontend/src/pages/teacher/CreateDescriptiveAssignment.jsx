import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Trash2,
    BookOpen,
    Calendar,
    FileText,
    Users,
    Save,
    Send,
    Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import {
    createTeacherDescriptiveAssignment,
    getTeacherDescriptiveSections,
    publishDescriptiveAssignment,
} from "../../api/teacherApi";

const CreateDescriptiveAssignment = () => {
    const navigate = useNavigate();

    const [sections, setSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        subject_id: "",
        instructions: "",
        due_date: "",
        duration_minutes: "",
        questions: [
            {
                question_text: "",
                max_marks: 5,
                expected_answer: "",
                evaluation_rubric: "",
            },
        ],
        section_ids: [],
    });

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        try {
            setLoadingSections(true);

            const data = await getTeacherDescriptiveSections();

            setSections(Array.isArray(data) ? data : data.sections || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load sections");
        } finally {
            setLoadingSections(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleQuestionChange = (index, field, value) => {
        setFormData((prev) => {
            const questions = [...prev.questions];

            questions[index] = {
                ...questions[index],
                [field]: value,
            };

            return {
                ...prev,
                questions,
            };
        });
    };

    const addQuestion = () => {
        setFormData((prev) => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    question_text: "",
                    max_marks: 5,
                    expected_answer: "",
                    evaluation_rubric: "",
                },
            ],
        }));
    };

    const removeQuestion = (index) => {
        if (formData.questions.length === 1) {
            toast.warning("At least one question is required.");
            return;
        }

        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    const toggleSection = (sectionId) => {
        setFormData((prev) => {
            const exists = prev.section_ids.includes(sectionId);

            return {
                ...prev,
                section_ids: exists
                    ? prev.section_ids.filter((id) => id !== sectionId)
                    : [...prev.section_ids, sectionId],
            };
        });
    };

    const selectAllSections = () => {
        setFormData((prev) => ({
            ...prev,
            section_ids: sections.map((section) => section.id),
        }));
    };

    const clearSections = () => {
        setFormData((prev) => ({
            ...prev,
            section_ids: [],
        }));
    };

    const validate = () => {
        if (!formData.title.trim()) {
            toast.error("Assignment title is required.");
            return false;
        }

        if (!formData.subject_id) {
            toast.error("Subject ID is required.");
            return false;
        }
        if (
         !formData.duration_minutes ||
         Number(formData.duration_minutes) <= 0
       ) {
         toast.error(
        "Exam duration must be greater than 0 minutes."
      );
       return false;
     }

        if (!formData.questions.length) {
            toast.error("Add at least one question.");
            return false;
        }

        for (const question of formData.questions) {
            if (!question.question_text.trim()) {
                toast.error("Every question must have question text.");
                return false;
            }

            if (!question.max_marks || Number(question.max_marks) <= 0) {
                toast.error("Question marks must be greater than 0.");
                return false;
            }
        }

        return true;
    };

    
    const buildPayload = () => ({
    title: formData.title.trim(),
    subject_id: Number(formData.subject_id),
    instructions: formData.instructions?.trim() || null,
    due_date: formData.due_date
    ? new Date(formData.due_date).toISOString()
    : null,

duration_minutes: Number(formData.duration_minutes),

academic_year: "2026-27",

    section_ids: formData.section_ids,

    questions: formData.questions.map((question, index) => ({
        question_text: question.question_text.trim(),
        max_marks: Number(question.max_marks),
        expected_answer:
            question.expected_answer?.trim() || null,
        evaluation_rubric:
            question.evaluation_rubric?.trim() || null,
        question_order: index + 1,
    })),
 });

     const handleSaveDraft = async () => {
    if (!validate()) return;

    try {
        setSaving(true);

        const payload = buildPayload();

console.log("PAYLOAD:", payload);

const assignment =
    await createTeacherDescriptiveAssignment(payload);

        console.log("Created descriptive assignment:", assignment);

        toast.success("Assignment saved as draft.");

        navigate("/teacher/descriptive-assignments");
    } catch (error) {
        console.error(
            "Create descriptive assignment error:",
            error?.response?.data || error
        );

        toast.error(
            error?.response?.data?.detail ||
                "Failed to create assignment."
        );
    } finally {
        setSaving(false);
    }
};

    const handleCreateAndPublish = async () => {
        if (!validate()) return;

        if (formData.section_ids.length === 0) {
            toast.error(
                "Please select at least one section before publishing."
            );
            return;
        }

        try {
            setPublishing(true);

            const assignment =
                await createTeacherDescriptiveAssignment(
                    buildPayload()
                );

            await publishDescriptiveAssignment(
                assignment.id,
                formData.section_ids
            );

            toast.success(
                "Assignment published and sent to selected sections."
            );

            navigate("/teacher/descriptive-assignments");
        } catch (error) {
            console.error(error);

            toast.error(
                error?.response?.data?.detail ||
                    "Failed to publish assignment."
            );
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() =>
                                navigate(
                                    "/teacher/descriptive-assignments"
                                )
                            }
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Create Descriptive Assignment
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Create questions and assign them to your sections.
                        </p>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <FileText className="text-purple-600" />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                Assignment Information
                            </h2>

                            <p className="text-sm text-gray-500">
                                Basic details of the assignment
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Assignment Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Java OOP Assignment"
                                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Subject ID
                            </label>

                            <input
                                type="number"
                                name="subject_id"
                                value={formData.subject_id}
                                onChange={handleChange}
                                placeholder="Subject ID"
                                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">
                                Instructions
                            </label>

                            <textarea
                                name="instructions"
                                value={formData.instructions}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Write instructions for students..."
                                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Due Date
                            </label>

                            <div className="relative">
                                <Calendar
                                    size={18}
                                    className="absolute left-3 top-3.5 text-gray-400"
                                />

                                <input
                                    type="datetime-local"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    className="w-full border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
    <label className="block text-sm font-medium mb-2">
        Exam Duration
    </label>

    <div className="relative">
        <input
            type="number"
            name="duration_minutes"
            min="1"
            value={formData.duration_minutes}
            onChange={handleChange}
            placeholder="e.g. 60"
            className="w-full border rounded-xl px-4 py-3 pr-20 focus:ring-2 focus:ring-purple-500 outline-none"
        />

        <span className="absolute right-4 top-3.5 text-sm text-gray-500">
            minutes
        </span>
    </div>

    <p className="text-xs text-gray-500 mt-1">
        Students will have this much time after starting the exam.
    </p>
</div>
                    </div>
                </div>

                {/* Sections */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                    <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="text-blue-600" />
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold">
                                    Assign to Sections
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Students in selected sections will receive
                                    the assignment by email.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={selectAllSections}
                                className="text-sm text-purple-600 font-medium"
                            >
                                Select All
                            </button>

                            <button
                                type="button"
                                onClick={clearSections}
                                className="text-sm text-gray-500 font-medium"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {loadingSections ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2
                                className="animate-spin text-purple-600"
                            />
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No sections assigned to you.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                            {sections.map((section) => {
                                const selected =
                                    formData.section_ids.includes(
                                        section.id
                                    );

                                return (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() =>
                                            toggleSection(section.id)
                                        }
                                        className={`text-left border-2 rounded-xl p-4 transition ${
                                            selected
                                                ? "border-purple-600 bg-purple-50"
                                                : "border-gray-200 hover:border-purple-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">
                                                    {section.name ||
                                                        section.section_name ||
                                                        `Section ${section.id}`}
                                                </p>

                                                {section.department && (
                                                    <p className="text-sm text-gray-500">
                                                        {
                                                            section.department
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                    selected
                                                        ? "bg-purple-600 border-purple-600"
                                                        : "border-gray-300"
                                                }`}
                                            >
                                                {selected && (
                                                    <span className="text-white text-xs">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {formData.section_ids.length > 0 && (
                        <div className="mt-4 bg-purple-50 text-purple-700 px-4 py-3 rounded-xl text-sm">
                            {formData.section_ids.length} section(s)
                            selected
                        </div>
                    )}
                </div>

                {/* Questions */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <BookOpen className="text-green-600" />
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold">
                                    Questions
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Add descriptive questions and marking
                                    criteria.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addQuestion}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700"
                        >
                            <Plus size={18} />
                            Add Question
                        </button>
                    </div>

                    <div className="space-y-6">

                        {formData.questions.map((question, index) => (
                            <div
                                key={index}
                                className="border rounded-2xl p-5 bg-gray-50"
                            >
                                <div className="flex justify-between mb-4">
                                    <h3 className="font-semibold">
                                        Question {index + 1}
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeQuestion(index)
                                        }
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <textarea
                                    value={question.question_text}
                                    onChange={(e) =>
                                        handleQuestionChange(
                                            index,
                                            "question_text",
                                            e.target.value
                                        )
                                    }
                                    rows={4}
                                    placeholder="Enter question..."
                                    className="w-full border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Maximum Marks
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={question.max_marks}
                                            onChange={(e) =>
                                                handleQuestionChange(
                                                    index,
                                                    "max_marks",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border rounded-xl px-4 py-3 bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Expected Answer
                                        </label>

                                        <textarea
                                            rows={3}
                                            value={
                                                question.expected_answer
                                            }
                                            onChange={(e) =>
                                                handleQuestionChange(
                                                    index,
                                                    "expected_answer",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Optional"
                                            className="w-full border rounded-xl px-4 py-3 bg-white"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            Evaluation Rubric
                                        </label>

                                        <textarea
                                            rows={3}
                                            value={
                                                question.evaluation_rubric
                                            }
                                            onChange={(e) =>
                                                handleQuestionChange(
                                                    index,
                                                    "evaluation_rubric",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Describe how AI should evaluate this answer..."
                                            className="w-full border rounded-xl px-4 py-3 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row justify-end gap-3">

                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving || publishing}
                        className="flex items-center justify-center gap-2 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Save size={18} />
                        )}

                        Save Draft
                    </button>

                    <button
                        type="button"
                        onClick={handleCreateAndPublish}
                        disabled={saving || publishing}
                        className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                        {publishing ? (
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Send size={18} />
                        )}

                        Create & Publish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDescriptiveAssignment;