import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
    getTeacherQuizzes,
    deleteTeacherQuiz,
    duplicateTeacherQuiz,
    publishTeacherQuiz,
    moveQuizToDraft,
} from "../../api/teacherApi";

import {
    FaEye,
    FaClipboardList,
    FaEdit,
    FaTrash,
    FaSearch,
    FaBookOpen,
    FaPlus,
    FaQuestionCircle,
    FaCalendarAlt,
    FaCopy,
    FaRocket,
    FaUndo,
} from "react-icons/fa";

const TeacherQuizzes = () => {
    const navigate = useNavigate();

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteQuiz, setDeleteQuiz] = useState(null);
    const [publishQuiz, setPublishQuiz] = useState(null);
    const [draftQuiz, setDraftQuiz] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const data = await getTeacherQuizzes();
            setQuizzes(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load quizzes");
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (quiz) => {
    setDeleteQuiz(quiz);
};
const openPublishModal = (quiz) => {
    setPublishQuiz(quiz);
};

const openDraftModal = (quiz) => {
    setDraftQuiz(quiz);
};

const handleDelete = async () => {
    if (!deleteQuiz) return;

    try {
        await deleteTeacherQuiz(deleteQuiz.id);

        setQuizzes((prev) =>
            prev.filter((q) => q.id !== deleteQuiz.id)
        );

        toast.success("Quiz deleted successfully");

        setDeleteQuiz(null);

    } catch (error) {
        toast.error("Failed to delete quiz.");
    }
};
const handlePublish = async (quizId) => {
    try {
        await publishTeacherQuiz(quizId);

        toast.success("Quiz published successfully");

        fetchQuizzes();

    } catch (error) {
        console.error(error);
        toast.error("Failed to publish quiz.");
    }
};
const confirmPublish = async () => {

    if (!publishQuiz) return;

    await handlePublish(publishQuiz.id);

    setPublishQuiz(null);

};
const confirmMoveToDraft = async () => {

    if (!draftQuiz) return;

    await handleMoveToDraft(draftQuiz.id);

    setDraftQuiz(null);

};
const handleMoveToDraft = async (quizId) => {
    try {
        await moveQuizToDraft(quizId);

        toast.success("Quiz moved to Draft");

        fetchQuizzes();

    } catch (error) {
        console.error(error);
        toast.error("Failed to update quiz.");
    }
};
const handleDuplicate = async (quizId) => {
    try {
        await duplicateTeacherQuiz(quizId);

        toast.success("Quiz duplicated successfully");

        fetchQuizzes();

    } catch (error) {
        console.error(error);

        toast.error("Failed to duplicate quiz.");
    }
};

    const filteredQuizzes = useMemo(() => {
        return quizzes.filter((quiz) =>
            quiz.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [quizzes, searchTerm]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-72">
                <div className="text-lg font-medium text-gray-500">
                    Loading quizzes...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* Header */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div>

                    <h1 className="text-4xl font-bold text-gray-800">
                        My Quizzes
                    </h1>

                    <p className="text-gray-500 mt-2">
                        View and manage all quizzes created by you.
                    </p>

                </div>

                <button
                    onClick={() =>
                        toast.info("Coming Soon 🚀")
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-md"
                >
                    <FaPlus />
                    Create Quiz
                </button>

            </div>

            {/* Search */}

            <div className="relative">

                <FaSearch className="absolute left-4 top-4 text-gray-400" />

                <input
                    type="text"
                    placeholder="Search quizzes..."
                    value={searchTerm}
                    onChange={(e) =>
                        setSearchTerm(e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

            </div>

            {/* Empty State */}

            {filteredQuizzes.length === 0 ? (

                <div className="bg-white rounded-2xl shadow-md p-16 text-center">

                    <FaBookOpen
                        className="mx-auto text-indigo-500 mb-5"
                        size={60}
                    />

                    <h2 className="text-2xl font-bold text-gray-700">
                        No quizzes found
                    </h2>

                    <p className="text-gray-500 mt-3">
                        Create your first quiz to get started.
                    </p>

                </div>

            ) : (

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {filteredQuizzes.map((quiz) => (

                        <div
                            key={quiz.id}
                            className="bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >

                            {/* Card Header */}

                            <div className="p-6">

                                <div className="flex items-start gap-4">

                                    <div className="bg-indigo-100 p-4 rounded-xl">

                                        <FaBookOpen
                                            className="text-indigo-600"
                                            size={24}
                                        />

                                    </div>

                                    <div className="flex-1">

                                        <div className="flex items-center justify-between mb-4">

    <h2 className="text-xl font-bold text-gray-800">
        {quiz.title}
    </h2>

    <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
            quiz.status === "Published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
        }`}
    >
        {quiz.status}
    </span>

</div>
                                        

                                        <div className="flex flex-wrap gap-6 mt-4 text-gray-600">

                                            <div className="flex items-center gap-2">

                                                <FaQuestionCircle />

                                                <span>
                                                    {
                                                        quiz.total_questions
                                                    }{" "}
                                                    Questions
                                                </span>

                                            </div>

                                            <div className="flex items-center gap-2">

                                                <FaCalendarAlt />

                                                <span>
                                                    {new Date(
                                                        quiz.created_at
                                                    ).toLocaleDateString()}
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            <hr />

                            {/* Actions */}

                            <div className="p-5 grid grid-cols-2 gap-3">

                                <button
                                    onClick={() =>
                                        navigate(
                                            `/teacher/quizzes/${quiz.id}/preview`
                                        )
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <FaEye />
                                    View
                                </button>

                                <button
                                    onClick={() =>
                                        navigate(
                                            `/teacher/quizzes/${quiz.id}/edit`
                                        )
                                    }
                                    className="bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <FaEdit />
                                    Edit
                                </button>
                                 {/* Duplicate */}
    <button
        onClick={() => handleDuplicate(quiz.id)}
        className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
    >
        <FaCopy />
        Duplicate
    </button>

    {/* Publish / Draft */}
    {quiz.status === "Draft" ? (
        <button
            onClick={() => openPublishModal(quiz)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
        >
         <FaRocket />
        Publish
        </button>
    ) : (
        <button
            onClick={() => openDraftModal(quiz)}
            className="bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
        >
             <FaUndo />
        Move to Draft
        </button>
    )}
                                

<button
    disabled={quiz.status !== "Published"}
    onClick={() =>
        navigate(`/teacher/quizzes/${quiz.id}/assignments`)
    }
    className={`py-2 rounded-lg flex items-center justify-center gap-2 ${
        quiz.status === "Published"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
>
    <FaClipboardList />
    Assign
</button>
 

                                <button
                                    onClick={() => openDeleteModal(quiz)}
                                    className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <FaTrash />
                                    Delete
                                </button>

          <div className="grid grid-cols-2 gap-3 col-span-2">

    <button
        onClick={() =>
            navigate(
                `/teacher/quizzes/${quiz.id}/reports`
            )
        }
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3"
    >
        Reports
    </button>

    <button
        onClick={() =>
            navigate(
                `/teacher/quizzes/${quiz.id}/performance`
            )
        }
        className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-3"
    >
        Performance
    </button>

</div>

                            </div>

                        </div>

                    ))}

                </div>

            )}
            <ConfirmModal
    isOpen={deleteQuiz !== null}
    title="Delete Quiz"
    message={
        deleteQuiz
            ? `Are you sure you want to delete "${deleteQuiz.title}"? This action cannot be undone.`
            : ""
    }
    confirmText="Delete"
    cancelText="Cancel"
    onConfirm={handleDelete}
    onCancel={() => setDeleteQuiz(null)}
/>
<ConfirmModal
    isOpen={publishQuiz !== null}
    title="Publish Quiz"
    message="This quiz will become available for assignment to students."
    confirmText="Publish"
    cancelText="Cancel"
    onConfirm={confirmPublish}
    onCancel={() => setPublishQuiz(null)}
/>
<ConfirmModal
    isOpen={draftQuiz !== null}
    title="Move to Draft"
    message="Students cannot receive new assignments until this quiz is published again."
    confirmText="Move to Draft"
    cancelText="Cancel"
    onConfirm={confirmMoveToDraft}
    onCancel={() => setDraftQuiz(null)}
/>

        </div>
    );
};

export default TeacherQuizzes;