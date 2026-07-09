import { BrowserRouter, Routes, Route } from "react-router-dom";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDetails from "./pages/StudentDetails";
import StudentManagement from "./components/StudentManagement";
import GenerateQuiz from "./pages/GenerateQuiz";
import Home from "./pages/Home";
 


function App(){

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/result/:id" element={<Result />} />
        <Route
path="/admin"
element={<AdminDashboard/>}
/>

<Route

path="/student/:email"

element={<StudentDetails/>}

/>
<Route

path="/students"

element={<StudentManagement/>}

/>
<Route
    path="/generate-quiz"
    element={<GenerateQuiz />}
/>
<Route path="/" element={<Home />} />

      </Routes>

    </BrowserRouter>

  )

}


export default App;