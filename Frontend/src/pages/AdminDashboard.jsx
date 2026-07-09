import {useEffect,useState} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
 import "./AdminDashboard.css";
 import API_BASE_URL from "../config";
 import { Link } from "react-router-dom";

import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
PieChart,
Pie,
LineChart,
Line,
CartesianGrid
} from "recharts";



function AdminDashboard(){
 const navigate = useNavigate();

const [stats,setStats]=useState(null);

const [performance,setPerformance]=useState([]);

const [weakTopics,setWeakTopics]=useState([]);
const [students,setStudents]=useState([]);
const [quizAnalytics, setQuizAnalytics] = useState([]);
const [scoreTrend, setScoreTrend] = useState([]);
const [leaderboard, setLeaderboard] = useState([]);
const [topicAnalytics,setTopicAnalytics]=useState([]);
const [mostDifficultQuiz,setMostDifficultQuiz]=useState(null);
const [studentProgress, setStudentProgress] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [departmentFilter, setDepartmentFilter] = useState("All");
const [selectedQuiz, setSelectedQuiz] = useState("All");
const [allQuizzes, setAllQuizzes] = useState([]);



const fetchDashboardData = (quiz = selectedQuiz) => {

    const query =
        quiz === "All"
        ? ""
        : `?quiz_id=${quiz}`;
fetch(
`${API_BASE_URL}/admin/stats${query}`
)

.then(res=>res.json())

.then(data=>setStats(data));




fetch(
`${API_BASE_URL}/admin/performance${query}`
)

.then(res=>res.json())

.then(data=>{


setPerformance(

Object.entries(data)
.map(([name,value])=>({

name,
value

}))

)


});




fetch(
`${API_BASE_URL}/admin/weak-topics${query}`
)

.then(res=>res.json())

.then(data=>{


setWeakTopics(

Object.entries(data)

.map(([name,value])=>({

name,
value

}))

)


});

fetch(
`${API_BASE_URL}/admin/students${query}`
)

.then(res=>res.json())

.then(data=>{

setStudents(data)

});

fetch(`${API_BASE_URL}/admin/quizzes${query}`)
.then(res => res.json())
.then(data => {
    setQuizAnalytics(data);
});

fetch(
`${API_BASE_URL}/admin/score-trend${query}`
)
.then(res=>res.json())
.then(data=>{
setScoreTrend(data)
});

fetch(
`${API_BASE_URL}/admin/leaderboard${query}`
)
.then(res=>res.json())
.then(data=>{
setLeaderboard(data)
});

fetch(
`${API_BASE_URL}/admin/topic-analytics${query}`
)

.then(res=>res.json())

.then(data=>{

setTopicAnalytics(data)

});

fetch(
`${API_BASE_URL}/admin/most-difficult-quiz`
)

.then(res=>res.json())

.then(data=>{

setMostDifficultQuiz(data)

});

fetch(
`${API_BASE_URL}/admin/student-progress${query}`
)

.then(res => res.json())

.then(data => {

setStudentProgress(data);

});
} 
useEffect(()=>{
fetchDashboardData();

},[selectedQuiz])

useEffect(() => {

    const interval = setInterval(() => {

        fetchDashboardData();

    }, 30000); // 30 seconds

    return () => clearInterval(interval);

}, [selectedQuiz]);

useEffect(() => {

    fetch(`${API_BASE_URL}/all`)
        .then(res => res.json())
        .then(data => {
            setAllQuizzes(data);
        });

}, []);



if (!stats) {
    return (
        <div className="loading-container">
            <h2>Loading Dashboard...</h2>
        </div>
    );
}



const filteredStudents = students.filter((student) => {

    const search = searchTerm.toLowerCase();

    const matchesSearch =
        student.email.toLowerCase().includes(search) ||
        student.name.toLowerCase().includes(search) ||
        student.roll_no.toLowerCase().includes(search);

    const matchesDepartment =
        departmentFilter === "All" ||
        student.department === departmentFilter;

    return matchesSearch && matchesDepartment;

});
const departments = [
    "All",
    ...new Set(
        students.map((student) => student.department)
    )
];

return (

<div className="admin-container">


<h1 className="dashboard-title">
📊 Admin Dashboard
</h1>
<div className="dashboard-actions">

    <button
        onClick={() => navigate("/generate-quiz")}
    >
        ➕ Generate Quiz
    </button>

    <button
        onClick={() => navigate("/students")}
    >
        👨‍🎓 Student Management
    </button>

    

</div>
<div className="top-navigation">

    <Link to="/">
        <button className="home-btn">
            🏠 Home
        </button>
    </Link>

</div>
<div className="filter-container">

<select
    value={selectedQuiz}
    onChange={(e)=>setSelectedQuiz(e.target.value)}
    className="quiz-filter"
>

<option value="All">
All Quizzes
</option>

{
allQuizzes.map((quiz) => (

<option
    key={quiz.id}
    value={quiz.id}
>
    {quiz.title}
</option>

))
}

</select>

</div>

<div className="stats-container">


<div className="stat-card">

<h3>
👨‍🎓 Total Students
</h3>

<h1>
{stats.total_students}
</h1>

</div>



<div className="stat-card">

<h3>
📝 Total Quizzes
</h3>

<h1>
{stats.total_quizzes}
</h1>

</div>



<div className="stat-card">

<h3>
⭐ Average Score
</h3>

<h1>
{stats.average_score}
</h1>

</div>


</div>

{/* Most Difficult Quiz */}
{

mostDifficultQuiz && (

<div className="table-card">

<h2>
🔥 Most Difficult Quiz
</h2>

<div className="stats-container">

<div className="stat-card">

<h3>
Quiz
</h3>

<h2>
{mostDifficultQuiz.title}
</h2>

</div>

<div className="stat-card">

<h3>
Attempts
</h3>

<h1>
{mostDifficultQuiz.attempts}
</h1>

</div>

<div className="stat-card">

<h3>
Average Score
</h3>

<h1>
{mostDifficultQuiz.average_score}
</h1>

</div>

<div className="stat-card">

<h3>
Highest Score
</h3>

<h1>
{mostDifficultQuiz.highest_score}
</h1>

</div>

<div className="stat-card">

<h3>
Top Performer
</h3>

<h3>
{mostDifficultQuiz.topper_email}
</h3>

</div>

</div>

</div>

)
}



<div className="chart-grid">


<div className="chart-card">


<h2>
Performance Analysis
</h2>



<PieChart width={400} height={300}>


<Pie

data={performance}

dataKey="value"

nameKey="name"

cx="50%"

cy="50%"

outerRadius={100}

/>


<Tooltip/>


</PieChart>



</div>






<div className="chart-card">


<h2>
Weak Topics
</h2>



<BarChart

width={450}

height={300}

data={weakTopics}

>


<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Bar

dataKey="value"

/>


</BarChart>





</div>


</div>

<div className="table-card">


<h2>
👨‍🎓 Student Performance
</h2>

<input
    type="text"
    placeholder="🔍 Search by Name, Email or Roll No..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="search-box"
/>
<select
    value={departmentFilter}
    onChange={(e) => setDepartmentFilter(e.target.value)}
    className="department-filter"
>
    {departments.map((dept) => (
        <option key={dept} value={dept}>
            {dept}
        </option>
    ))}
</select>
<table>


<thead>

<tr>

<th>Name</th>

<th>Roll No</th>

<th>Department</th>

<th>Email</th>

<th>Attempts</th>

<th>Average</th>

<th>Status</th>

</tr>

</thead>



<tbody>


{
filteredStudents.map((s,index)=>(


<tr key={index}>

    <td>{s.name}</td>

    <td>{s.roll_no}</td>

    <td>{s.department}</td>

    <td>
        <a href={`/student/${s.email}`}>
            {s.email}
        </a>
    </td>

    <td>{s.attempts}</td>

    <td>{s.average_score}</td>

    <td>
        <span
            className={`badge ${
                s.performance === "Excellent"
                    ? "excellent"
                    : s.performance === "Good"
                    ? "good"
                    : "improvement"
            }`}
        >
            {s.performance}
        </span>
    </td>

</tr>


))
}


</tbody>


</table>
<div className="table-card">

    <h2>📈 Quiz Analytics</h2>

    <table>

        <thead>

            <tr>
                <th>Quiz</th>
                <th>Attempts</th>
                <th>Average</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>Topper</th>
            </tr>

        </thead>

        <tbody>

            {

                quizAnalytics.map((quiz) => (

                    <tr key={quiz.quiz_id}>

                        <td>{quiz.title}</td>

                        <td>{quiz.attempts}</td>

                        <td>{quiz.average_score}</td>

                        <td>{quiz.highest_score}</td>

                        <td>{quiz.lowest_score}</td>

                         <td>
    {quiz.topper?.name || "-"}
    <br />
    <small>{quiz.topper?.email || "-"}</small>
</td>

                    </tr>

                ))

            }

        </tbody>

    </table>

</div>


</div>
<div className="table-card">

<h2>
📈 Score Trend
</h2>

<LineChart
    width={900}
    height={300}
    data={scoreTrend}
>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="quiz"/>

<YAxis/>

<Tooltip/>

<Line
    type="monotone"
    dataKey="average_score"
/>

</LineChart>

</div>
<div className="table-card">

<h2>
🏆 Top Performers
</h2>

<table>

<thead>

<tr>

<th>Rank</th>

<th>Name</th>

<th>Email</th>

<th>Average</th>

<th>Attempts</th>

</tr>

</thead>

<tbody>

{
leaderboard.map((student,index)=>(

<tr key={index}>

<td>

{
student.rank===1
?
"🥇"

:
student.rank===2
?
"🥈"

:
student.rank===3
?
"🥉"

:
student.rank
}

</td>

<td>
{student.name}
</td>

<td>
{student.email}
</td>

<td>
{student.average_score}
</td>

<td>
{student.attempts}
</td>

</tr>

))
}

</tbody>

</table>

</div>
<div className="table-card">

<h2>
📚 Topic Accuracy
</h2>

<BarChart

width={900}

height={350}

data={topicAnalytics}

>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis
dataKey="topic"
/>

<YAxis/>

<Tooltip/>

<Bar
dataKey="accuracy"
/>

</BarChart>

</div>
<div className="table-card">

<h2>
📈 Student Progress
</h2>

<table>

<thead>

<tr>

<th>Name</th>

<th>Attempts</th>

<th>First</th>

<th>Latest</th>

<th>Best</th>

<th>Average</th>

<th>Progress</th>

</tr>

</thead>

<tbody>

{

studentProgress.map((student,index)=>(

<tr key={index}>

<td>
{student.name}
</td>

<td>
{student.attempts}
</td>

<td>
{student.first_score}
</td>

<td>
{student.latest_score}
</td>

<td>
{student.best_score}
</td>

<td>
{student.average_score}
</td>

<td>

{

student.improvement > 0 ?

<span style={{color:"green"}}>

📈 +{student.improvement}

</span>

:

student.improvement < 0 ?

<span style={{color:"red"}}>

📉 {student.improvement}

</span>

:

<span>

➖ 0

</span>

}

</td>

</tr>

))

}

</tbody>

</table>

</div>

</div>



)
}
export default AdminDashboard;
