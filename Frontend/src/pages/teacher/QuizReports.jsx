import { useEffect, useState } from "react";
import {  useParams } from "react-router-dom";
import { getQuizReports } from "../../api/teacherApi";
import ReportCard from "../../components/teacher/ReportCard";
import ReportSummary from "../../components/teacher/ReportSummary";
function QuizReports() {
    const { quizId } = useParams();

    const [reports, setReports] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("latest");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const data = await getQuizReports(quizId);
            console.log("API Response:", data);
            console.log("Reports:", data.reports);
            setReports(data.reports);
        } catch (err) {
            setError("Failed to load reports.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const filteredReports = [...reports]
    .filter((report) =>
        report.student_name
            .toLowerCase()
            .includes(search.toLowerCase())
    )
    .sort((a, b) => {

        switch (sortBy) {

            case "highest":
                return b.percentage - a.percentage;

            case "lowest":
                return a.percentage - b.percentage;

            case "latest":
            default:
                return (
                    new Date(b.submitted_at) -
                    new Date(a.submitted_at)
                );

        }

    });

    if (loading) {
        return (
            <div className="p-6 text-center">
                Loading Reports...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-600">
                {error}
            </div>
        );
    }
    

    return (
        <div className="p-6">

            <h1 className="text-3xl font-bold mb-6">
                Quiz Reports
            </h1>
            <ReportSummary reports={reports} />
            <div className="flex flex-col md:flex-row gap-4 mb-6">

    <input
        type="text"
        placeholder="Search student..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="border rounded-xl px-4 py-3"
    >
        <option value="latest">
            Latest Submission
        </option>

        <option value="highest">
            Highest Score
        </option>

        <option value="lowest">
            Lowest Score
        </option>

    </select>

</div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

    {filteredReports.length === 0 ? (

    <div className="col-span-full text-center py-12 text-gray-500">
        No students found.
    </div>

) : (

    filteredReports.map((report) => (
        <ReportCard
            key={report.response_id}
            report={report}
        />
    ))

)}

</div>

        </div>
    );
}

export default QuizReports;