import {
    FaCheckCircle,
    FaTimesCircle,
    FaLightbulb,
} from "react-icons/fa";
function QuestionReportCard({ question }) {
    const studentIndex =
    question.student_answer.charCodeAt(0) - 65;

const correctIndex =
    question.correct_answer.charCodeAt(0) - 65;

    return (

        <div
    className={`bg-white rounded-xl shadow border-l-8 p-6 mb-6 transition-all hover:shadow-xl ${
        question.is_correct
            ? "border-green-500"
            : "border-red-500"
    }`}
>

            <div className="flex justify-between items-start border-b pb-4">

    <div>

        <p className="text-sm text-gray-500">
            <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold">
    Question #{question.question_no}
</span>
        </p>

        <h2 className="text-xl font-semibold mt-2">
            {question.question}
        </h2>

    </div>

    <span
        className={`px-4 py-2 rounded-full text-sm font-semibold ${
            question.is_correct
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
        }`}
    >
        {question.is_correct ? "✅ Correct" : "❌ Incorrect"}
    </span>

</div>
 

            

            <div className="mt-5">

    <h3 className="font-semibold text-gray-700 mb-3">
        Options
    </h3>

    <div className="space-y-3"></div>

                {question.options.map((option, index) => {

    const isCorrect =
        index === correctIndex;

    const isStudent =
        index === studentIndex;

    let classes =
    "border rounded-xl px-5 py-4 transition-all duration-200";

    if (isCorrect) {
        classes +=
            " bg-green-100 border-green-500";
    }

    if (isStudent && !isCorrect) {
        classes +=
            " bg-red-100 border-red-500";
    }

    return (

        <div
            key={index}
            className={classes}
        >

            <div className="flex justify-between">

                <span>

                    <strong>
                        {String.fromCharCode(65 + index)}.
                    </strong>{" "}
                    {option}

                </span>

                <span>

                    {isCorrect && "✅"}

                    {isStudent && !isCorrect && "❌"}

                </span>

            </div>

        </div>

    );

})}

            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">

                <div className="bg-red-50 rounded-lg p-4">

                    <p className="font-semibold">
                        <FaTimesCircle className="inline mr-2 text-red-600" />

Student Answer
                    </p>

                    <p className="font-medium">
    {question.student_answer}.{" "}
    {question.options[studentIndex]}
</p>

                </div>

                <div className="bg-green-50 rounded-lg p-4">

                    <p className="font-semibold">
                        <FaCheckCircle className="inline mr-2 text-green-600" />

Correct Answer
                    </p>

                    <p className="font-medium">
    {question.correct_answer}.{" "}
    {question.options[correctIndex]}
</p>

                </div>

            </div>

            <div className="mt-5 bg-blue-50 rounded-lg p-4">

                <p className="font-semibold mb-3 flex items-center">

    <FaLightbulb className="text-yellow-500 mr-2" />

    Explanation

</p>

                <p>
                    {question.explanation}
                </p>

            </div>

        </div>

    );

}

export default QuestionReportCard;