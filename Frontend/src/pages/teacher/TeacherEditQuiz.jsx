import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    FaTrash,
    FaSyncAlt,
    FaPlus,
    FaSave,
} from "react-icons/fa";
import {
    getQuizById,
    updateTeacherQuiz,
    generateQuestion,
    regenerateQuestion,
    deleteTeacherQuestion,
} from "../../api/teacherApi";

const TeacherEditQuiz = () => {

    const { quizId } = useParams();

    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);

const [generateTopic, setGenerateTopic] = useState("");
const [regeneratingId, setRegeneratingId] = useState(null);
const [generateDifficulty, setGenerateDifficulty] = useState("Medium");

const [generating, setGenerating] = useState(false);
const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    index: null,
});

    const [quiz, setQuiz] = useState(null);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);

    useEffect(() => {
        loadQuiz();
    }, []);

    const loadQuiz = async () => {
        try {

            const data = await getQuizById(quizId);
            console.table(
    data.questions.map(q => ({
        id: q.id,
        order: q.question_order,
        text: q.question_text
    }))
);

            setQuiz(data);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load quiz.");

        } finally {

            setLoading(false);

        }
    };

    const updateField = (
        index,
        field,
        value
    ) => {

        const updated = [...quiz.questions];

        updated[index] = {
            ...updated[index],
            [field]: value,
        };

         setQuiz({
    ...quiz,
    questions: updated,
});

setHasUnsavedChanges(true);

    };

    if (loading) {

        return (
            <div className="p-6">
                Loading...
            </div>
        );

    }
    const handleSave = async () => {
        // Quiz title validation
if (!quiz.title.trim()) {

    toast.error("Quiz title is required.");

    return;

}

// Question validation
for (const [index, question] of quiz.questions.entries()) {

    if (!question.question_text.trim()) {

        toast.error(`Question ${index + 1} cannot be empty.`);

        return;

    }

    if (!question.option_a.trim()) {

        toast.error(`Question ${index + 1}: Option A is required.`);

        return;

    }

    if (!question.option_b.trim()) {

        toast.error(`Question ${index + 1}: Option B is required.`);

        return;

    }

    if (!question.option_c.trim()) {

        toast.error(`Question ${index + 1}: Option C is required.`);

        return;

    }

    if (!question.option_d.trim()) {

        toast.error(`Question ${index + 1}: Option D is required.`);

        return;

    }

    if (!question.correct_answer) {

        toast.error(`Question ${index + 1}: Select the correct answer.`);

        return;

    }

}
    try {

        setSaving(true);

        await updateTeacherQuiz(
            quizId,
            {
                title: quiz.title,

                questions: quiz.questions,

                deleted_question_ids: deletedQuestionIds,
            }
        );

        toast.success(
            "Quiz updated successfully."
        );
        setHasUnsavedChanges(false);

    } catch (error) {

        console.error(error);

        toast.error(
            "Failed to update quiz."
        );

    } finally {

        setSaving(false);
        console.log("===== BEFORE SAVE =====");

       console.table(
       quiz.questions.map((q) => ({
        id: q.id,
        order: q.question_order,
        text: q.question_text,
       }))
    );

      console.log("Deleted IDs:", deletedQuestionIds);

      }
    };
    const addQuestion = () => {

    setQuiz({

        ...quiz,

        questions: [

            ...quiz.questions,

            {

                id: null,

                question_text: "",

                option_a: "",

                option_b: "",

                option_c: "",

                option_d: "",

                correct_answer: "Option A",

                explanation: "",

                marks: 1,

                question_order: quiz.questions.length + 1,

            },

        ],

    });

};
    const deleteQuestion = (index) => {
          console.log(
        "Deleting index:",
        index,
        "Question ID:",
        quiz.questions[index].id,
        "Question:",
        quiz.questions[index].question_text
    );

    const question = quiz.questions[index];

    // Existing question stored in DB
    if (question.id) {
        setDeletedQuestionIds((prev) => [
            ...prev,
            question.id,
        ]);
    }

    const updatedQuestions = quiz.questions
        .filter((_, i) => i !== index)
        .map((q, idx) => ({
            ...q,
            question_order: idx + 1,
        }));

    setQuiz({
        ...quiz,
        questions: updatedQuestions,
    });
};

const handleGenerateQuestion = async () => {

    try {

        setGenerating(true);

        const question = await generateQuestion(
            quizId,
            {
                topic: generateTopic,
                difficulty: generateDifficulty,
            }
        );

        setQuiz({

            ...quiz,

            questions: [

                ...quiz.questions,

                question,

            ],

        });

        toast.success("AI Question Generated!");

        setShowGenerateModal(false);

        setGenerateTopic("");

        setGenerateDifficulty("Medium");

    }

    catch (error) {

        console.error(error);

        toast.error("Failed to generate question.");

    }

    finally {

        setGenerating(false);

    }

};

const handleRegenerateQuestion = async (questionId) => {

    try {

        setRegeneratingId(questionId);

        const regenerated = await regenerateQuestion(
            quizId,
            questionId
        );

        const updatedQuestions = quiz.questions.map((question) =>

            question.id === questionId
                ? regenerated
                : question
        );

        setQuiz({

            ...quiz,

            questions: updatedQuestions,

        });

        toast.success("Question regenerated successfully.");

    }

    catch (error) {

        console.error(error);

        toast.error("Failed to regenerate question.");

    }

    finally {

        setRegeneratingId(null);

    }

};

    return (

        <div className="max-w-6xl mx-auto p-6 space-y-8">

            <div className="bg-white rounded-xl shadow p-6">

                <h1 className="text-3xl font-bold mb-5">
                    Edit Quiz
                </h1>

                <label className="font-semibold">
                    Quiz Title
                </label>

                <input
                    className="mt-2 w-full border rounded-lg p-3"
                    value={quiz.title}
                     onChange={(e)=>{

    setQuiz({
        ...quiz,
        title:e.target.value
    });

    setHasUnsavedChanges(true);

}}
                />

            </div>

            {quiz.questions.map((question, index) => (

                <div
                    key={`${question.id ?? "new"}-${index}`}
                    className="bg-white rounded-xl shadow p-6 space-y-4"
                >

                    <h2 className="text-xl font-bold">
                        Question {index + 1}
                    </h2>

                    <textarea
                        rows={3}
                        className="w-full border rounded-lg p-3"
                        value={question.question_text}
                        onChange={(e) =>
                            updateField(
                                index,
                                "question_text",
                                e.target.value
                            )
                        }
                    />

                    <div className="grid md:grid-cols-2 gap-4">

                        <input
                            className="border rounded-lg p-3"
                            value={question.option_a}
                            onChange={(e)=>
                                updateField(index,"option_a",e.target.value)
                            }
                            placeholder="Option A"
                        />

                        <input
                            className="border rounded-lg p-3"
                            value={question.option_b}
                            onChange={(e)=>
                                updateField(index,"option_b",e.target.value)
                            }
                            placeholder="Option B"
                        />

                        <input
                            className="border rounded-lg p-3"
                            value={question.option_c}
                            onChange={(e)=>
                                updateField(index,"option_c",e.target.value)
                            }
                            placeholder="Option C"
                        />

                        <input
                            className="border rounded-lg p-3"
                            value={question.option_d}
                            onChange={(e)=>
                                updateField(index,"option_d",e.target.value)
                            }
                            placeholder="Option D"
                        />

                    </div>

                    <select
                        className="border rounded-lg p-3 w-full"
                        value={question.correct_answer}
                        onChange={(e)=>
                            updateField(
                                index,
                                "correct_answer",
                                e.target.value
                            )
                        }
                    >

                        <option value={question.option_a || ""}>
    Option A
</option>

                        <option value={question.option_b || ""}>
                            Option B
                        </option>

                        <option value={question.option_c || ""}>
                            Option C
                        </option>

                        <option value={question.option_d || ""}>
                            Option D
                        </option>

                    </select>

                    <textarea
                        rows={2}
                        className="w-full border rounded-lg p-3"
                        value={question.explanation ?? ""}
                        placeholder="Explanation"
                        onChange={(e)=>
                            updateField(
                                index,
                                "explanation",
                                e.target.value
                            )
                        }
                    />

                    <input
                        type="number"
                        className="border rounded-lg p-3 w-40"
                        value={question.marks}
                        onChange={(e)=>
                            updateField(
                                index,
                                "marks",
                                Number(e.target.value)
                            )
                        }
                    />
                    <div className="flex justify-end gap-3 mt-4">

    <button
        onClick={() => handleRegenerateQuestion(question.id)}
        disabled={regeneratingId === question.id}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
    >
        {regeneratingId === question.id
            ? "Generating..."
            : (<>
    <FaSyncAlt />
    <span>Regenerate</span>
</>)}
    </button>

    <button
    onClick={() =>
        setDeleteDialog({
            open: true,
            index,
        })
    }
    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
>
    <>
    <FaTrash />
    <span>Delete</span>
</>
</button>

</div>

                </div>

            ))}
            <div className="flex justify-between">

    <button
    onClick={() => setShowGenerateModal(true)}
    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
>
    <>
    <FaPlus />
    <span>Generate AI Question</span>
</>
</button>

</div>
            <div className="flex justify-end">

    <button
    onClick={handleSave}
    disabled={saving || !hasUnsavedChanges}
    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg disabled:opacity-50 flex items-center gap-2"
>
    {saving ? (
        "Saving..."
    ) : (
        <>
            <FaSave />
            <span>
                {hasUnsavedChanges
                    ? "Save Changes"
                    : "Saved"}
            </span>
        </>
    )}
</button>


</div>
{
showGenerateModal && (

<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

    <div className="bg-white rounded-xl w-full max-w-md p-6">

        <h2 className="text-2xl font-bold mb-5">
            Generate AI Question
        </h2>

        <label className="font-semibold">
            Topic
        </label>

        <input
            className="w-full border rounded-lg p-3 mt-2 mb-4"
            placeholder="Machine Learning"
            value={generateTopic}
            onChange={(e)=>setGenerateTopic(e.target.value)}
        />

        <label className="font-semibold">
            Difficulty
        </label>

        <select
            className="w-full border rounded-lg p-3 mt-2"
            value={generateDifficulty}
            onChange={(e)=>setGenerateDifficulty(e.target.value)}
        >

            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>

        </select>

        <div className="flex justify-end gap-3 mt-6">

            <button
                onClick={()=>setShowGenerateModal(false)}
                className="px-5 py-2 rounded-lg border"
            >
                Cancel
            </button>

            <button
                onClick={handleGenerateQuestion}
                disabled={generating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
            >
                {
                    generating
                    ? "Generating..."
                    : "Generate"
                }
            </button>

        </div>

    </div>

</div>

)}
{deleteDialog.open && (

<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

    <div className="bg-white rounded-xl p-6 w-full max-w-sm">

        <h2 className="text-xl font-bold mb-4">
            Delete Question
        </h2>

        <p className="text-gray-600">
            Are you sure you want to delete this question?
        </p>

        <div className="flex justify-end gap-3 mt-6">

            <button
                onClick={() =>
                    setDeleteDialog({
                        open: false,
                        index: null,
                    })
                }
                className="border px-4 py-2 rounded-lg"
            >
                Cancel
            </button>

            <button
                onClick={() => {

                    deleteQuestion(deleteDialog.index);

                    setDeleteDialog({
                        open: false,
                        index: null,
                    });

                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
                Delete
            </button>

        </div>

    </div>

</div>

)}

        </div>

    );

};

export default TeacherEditQuiz;