import { useNavigate } from "react-router-dom";

function ReportCard({ report }) {
    const navigate = useNavigate();

    const passed = report.percentage >= 40;
    const minutes = Math.floor(report.time_taken_seconds / 60);
    const seconds = report.time_taken_seconds % 60;

    return (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5 hover:shadow-lg transition">

            {/* Header */}

            <div className="flex justify-between items-center">

                <div>

                    <h2 className="text-lg font-semibold">
                        {report.student_name}
                    </h2>

                    

                </div>

                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
    {report.status}
</span>
            </div>

            {/* Score */}

            <div className="mt-5">

                <div className="flex justify-between mb-2">

                    <span className="font-medium">
                        Score
                    </span>

                    <span>
                        {report.score} / {report.total_questions}
                    </span>

                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">

                    <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{
                            width: `${report.percentage}%`,
                        }}
                    />

                </div>

                <p className="mt-2 text-sm text-gray-500">
                    {report.percentage}%
                </p>

            </div>

            {/* Time */}

            <div className="mt-4 flex justify-between">

                <span className="font-medium">
                    Time Taken
                </span>

                <span>{minutes}m {seconds}s</span>

            </div>

            {/* Action */}

            <button
                onClick={() =>
                    navigate(`/teacher/reports/${report.response_id}`)
                }
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
                View Full Report
            </button>

        </div>
    );
}

export default ReportCard;