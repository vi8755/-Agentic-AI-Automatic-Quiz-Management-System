import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config";
import "./StudentManagement.css";
import { Link } from "react-router-dom";

function StudentManagement() {
   const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [student, setStudent] = useState({
    name: "",
    roll_no: "",
    email: "",
    department: "",
  });

  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizId, setQuizId] = useState("");
  const [excelFile, setExcelFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [quizRes, studentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/all`),
        fetch(`${API_BASE_URL}/students/all`),
      ]);

      setQuizzes(await quizRes.json());
      setStudents(await studentRes.json());
    } catch (e) {
      console.error(e);
    }
  }

  function handleChange(e) {
    setStudent({ ...student, [e.target.name]: e.target.value });
  }

  async function addStudent() {
    if (
        !student.name.trim() ||
        !student.roll_no.trim() ||
        !student.email.trim() ||
        !student.department.trim()
    ) {
        toast.warning("All fields are required.");
        return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/students/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });

      const data = await res.json();
      if (data.message === "Student added") {
    toast.success("✅ Student added successfully");
} else {
    toast.warning(data.message);
}

      setStudent({
        name: "",
        roll_no: "",
        email: "",
        department: "",
      });

      loadData();
    } catch {
    toast.error("❌ Failed to add student.");
}
  }

  function handleSelectAll() {
    if (selectAll) {
      setSelected([]);
      setSelectAll(false);
    } else {
      setSelected(students.map((s) => s.email));
      setSelectAll(true);
    }
  }

  function selectStudent(email) {
    setSelected((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  }
  function downloadTemplate() {

    window.open(
        `${API_BASE_URL}/students/download_template`,
        "_blank"
    );

}
async function uploadExcel() {

  if (!excelFile) {
    toast.warning("Please select an Excel file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", excelFile);

  try {

    const res = await fetch(
      `${API_BASE_URL}/students/upload_excel`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    toast.success(
    `${data.message} | Added: ${data.added} | Skipped: ${data.skipped}`
);

    setExcelFile(null);

    loadData();

  } catch (err) {

    console.error(err);

    toast.error("❌ Upload failed.");

  }

}
async function deleteStudent(id, name) {

  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${name}?\n\nThis will also delete all quiz assignments and responses.`
  );

  if (!confirmDelete) return;

  try {

    const res = await fetch(
      `${API_BASE_URL}/students/delete/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    toast.success(data.message);

    loadData();

  } catch (error) {

    console.error(error);

    toast.error("Failed to delete student.");

  }

}
  async function assignQuiz() {
    if (!quizId) {
    toast.warning("Please select a quiz.");
    return;
}

if (selected.length === 0) {
    toast.warning("Please select at least one student.");
    return;
}

    const res = await fetch(`${API_BASE_URL}/students/assign_quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: Number(quizId),
        students: selected,
      }),
    });

    const data = await res.json();
    toast.success(data.message || "Quiz assigned successfully.");
    setSelected([]);
setSelectAll(false);
setQuizId("");
  }

  return (
    <div className="student-container">
      <h2>Student Management</h2>
      <div className="dashboard-actions">

    <button
        onClick={() => navigate("/admin")}
    >
        📊 Dashboard
    </button>

    <button
        onClick={() => navigate("/generate-quiz")}
    >
        ➕ Generate Quiz
    </button>

</div>
<div className="top-navigation">

    <Link to="/">
        <button className="home-btn">
            🏠 Home
        </button>
    </Link>

</div>

      <div className="student-form">
        <input name="name" value={student.name} placeholder="Name" onChange={handleChange}/>
        <input name="roll_no" value={student.roll_no} placeholder="Roll No" onChange={handleChange}/>
        <input name="email" value={student.email} placeholder="Email" onChange={handleChange}/>
        <input name="department" value={student.department} placeholder="Department" onChange={handleChange}/>
        <button onClick={addStudent}>Add Student</button>
      </div>

       <div className="excel-upload">

  <input
    type="file"
    accept=".xlsx"
    onChange={(e) => setExcelFile(e.target.files[0])}
  />

  <button onClick={uploadExcel}>
    📤 Upload Excel
  </button>

  <button
      className="download-btn"
      onClick={downloadTemplate}
  >
      📥 Download Template
  </button>

</div>

      <div className="selection-box">
        <label>
          <input type="checkbox" checked={selectAll} onChange={handleSelectAll}/> Select All Students
        </label>
      </div>

      

      <div className="student-list">
        {students.map((s) => (
          <div className="student-card" key={s.id}>
            <div>
              <input
                type="checkbox"
                checked={selected.includes(s.email)}
                onChange={() => selectStudent(s.email)}
              />
            </div>
            <div className="student-info">
              <div><b>{s.name}</b></div>
              <div>Roll No: {s.roll_no}</div>
              <div>{s.email}</div>
              <div>{s.department}</div>
              <button
  className="delete-btn"
  onClick={() => deleteStudent(s.id, s.name)}
>
  🗑 Delete
</button>
            </div>
          </div>
        ))}
      </div>

      <div className="quiz-section">
        <select value={quizId} onChange={(e)=>setQuizId(e.target.value)}>
          <option value="">Select Quiz</option>
          {quizzes.map((q)=>(
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>

        <button onClick={assignQuiz}>Send Quiz</button>
      </div>
    </div>
  );
}

export default StudentManagement;
