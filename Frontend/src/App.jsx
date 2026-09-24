import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VerifyEmail from "./components/auth/VerifyEmail";
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDetails from "./pages/StudentDetails";
import StudentManagement from "./components/dean/studentManagement/StudentManagement";
import GenerateQuiz from "./pages/GenerateQuiz";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";

import DashboardLayout from "./layouts/DashboardLayout";
import StudentLayout from "./layouts/StudentLayout";
import TopicQuizGenerator from "./pages/teacher/TopicQuizGenerator";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherQuizzes from "./pages/teacher/TeacherQuizzes";
import QuizAssignments from "./pages/teacher/QuizAssignments";
import Analytics from "./pages/teacher/Analytics";
import QuizDetails from "./pages/teacher/QuizDetails";
import TeacherEditQuiz from "./pages/teacher/TeacherEditQuiz";
import AIQuizGenerator from "./pages/teacher/AIQuizGenerator";
import TeacherQuizPreview from "./pages/teacher/TeacherQuizPreview";
import QuizReports from "./pages/teacher/QuizReports";
import StudentReport from "./pages/teacher/StudentReport";
import TeacherAnalytics from "./pages/teacher/TeacherAnalytics";
import TeacherSettings from "./pages/teacher/TeacherSettings";
import QuizResult from "./pages/student/QuizResult";
import DeanDashboard from "./pages/dean/Dashboard";
import TeacherManagement from "./pages/dean/TeacherManagement";
import SectionManagement from "./components/dean/SectionManagement";
import MyQuizzes from "./pages/student/MyQuizzes";
import StudentDashboard from "./pages/student/Dashboard";
import QuizHistory from "./pages/student/QuizHistory";
import Performance from "./pages/student/Performance";
import Profile from "./pages/student/Profile";
import Settings from "./pages/student/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SubjectManagement from "./components/dean/subjectmanagement/SubjectManagement";
import QuizManagement from "./components/dean/quizManagement/QuizManagement";
import AttemptsAnalytics from "./components/dean/attemptmanagement/AttemptsAnalytics";
import DeanAnalytics from "./components/dean/analytics/DeanAnalytics";
import DescriptiveAssignments from "./pages/teacher/DescriptiveAssignments";
import DescriptiveAnalysis
    from "./pages/teacher/DescriptiveAnalysis";
import DescriptiveAssignmentSubmissions
from "./pages/teacher/DescriptiveAssignmentSubmissions";
import DescriptiveSubmissionReview from "./pages/teacher/DescriptiveSubmissionReview";
import CreateDescriptiveAssignment from "./pages/teacher/CreateDescriptiveAssignment";
import StudentDescriptiveAssignment from "./pages/student/StudentDescriptiveAssignment";
import StudentDescriptiveResult from "./pages/student/StudentDescriptiveResult";
import StudentDescriptiveAssignments
    from "./pages/student/StudentDescriptiveAssignments";

import StudentDescriptivePending from "./pages/student/StudentDescriptivePending";
import AnswerDrawingPad from "./pages/student/AnswerDrawingPad";
import CreatePdfAssignment from "./pages/teacher/descriptivepdf/CreatePdfAssignment";
import StudentPdfDescriptiveAssignment
    from "./pages/student/descriptivePdf/StudentPdfDescriptiveAssignment";

import BatchManagement from "./components/dean/batchmanagement/BatchManagement";
import TeacherQuizPerformance
    from "./pages/teacher/TeacherQuizPerformance";
import DescriptiveAssignmentPerformance from "./pages/teacher/DescriptiveAssignmentPerformance";
import StudentQuizPerformance
    from "./pages/student/StudentQuizPerformance";
import StudentDescriptiveAssignmentPerformance
    from "./pages/student/StudentDescriptiveAssignmentPerformance";

import AllQuizPerformance
    from "./pages/student/AllQuizPerformance";
import AllDescriptivePerformance
    from "./pages/student/AllDescriptivePerformance";
import QuestionBankQuizGenerator
    from "./pages/teacher/QuestionBankQuizGenerator";
function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* =========================================
                    PUBLIC ROUTES
                ========================================= */}

                <Route
                    path="/quiz/:id"
                    element={<Quiz />}
                />

                

                <Route
                    path="/result/:id"
                    element={<Result />}
                />

                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/student/:email"
                    element={<StudentDetails />}
                />

                <Route
                    path="/students"
                    element={<StudentManagement />}
                />

                <Route
                    path="/generate-quiz"
                    element={<GenerateQuiz />}
                />

                <Route
                    path="/"
                    element={<Home />}
                />
                

                <Route
                    path="/login"
                    element={<Login />}
                />
                <Route
    path="/forgot-password"
    element={<ForgotPassword />}
/>
<Route
    path="/verify-email"
    element={<VerifyEmail />}
/>
<Route
    path="/reset-password"
    element={<ResetPassword />}
/>


                {/* =========================================
                    DEAN + TEACHER ROUTES
                ========================================= */}

                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["DEAN", "TEACHER"]}
                        />
                    }
                >

                    <Route element={<DashboardLayout />}>

                        {/* Teacher */}

                        <Route
                            path="/teacher/dashboard"
                            element={<TeacherDashboard />}
                        />
                        <Route
    path="/teacher/descriptive-assignments"
    element={<DescriptiveAssignments />}

/>
<Route
    path="/teacher/descriptive-analysis"
    element={<DescriptiveAnalysis />}
/>
<Route
    path="/teacher/descriptive-assignments/:assignmentId/submissions"
    element={<DescriptiveAssignmentSubmissions />}
/>
<Route
    path="/teacher/descriptive-submissions/:submissionId"
    element={<DescriptiveSubmissionReview />}
/>
<Route
    path="/teacher/descriptive-assignments/create"
    element={<CreateDescriptiveAssignment />}
/>
<Route
    path="/teacher/descriptive-assignments/:assignmentId/performance"
    element={
        <DescriptiveAssignmentPerformance />
    }
/>
<Route
    path="/teacher/descriptive-assignments/create-pdf"
    element={<CreatePdfAssignment />}
/>
                        <Route
                            path="/teacher/quizzes"
                            element={<TeacherQuizzes />}
                        />

                        <Route
                            path="/teacher/quizzes/:quizId/assignments"
                            element={<QuizAssignments />}
                        />
                        <Route
    path="/teacher/topic-quiz"
    element={<TopicQuizGenerator />}
/>

                        <Route
                            path="/teacher/analytics"
                            element={<TeacherAnalytics />}
                        />

                        <Route
                            path="/teacher/quizzes/:quizId"
                            element={<QuizDetails />}
                        />

                        <Route
                            path="/teacher/quizzes/:quizId/edit"
                            element={<TeacherEditQuiz />}
                        />

                        <Route
                            path="/teacher/ai-quiz"
                            element={<AIQuizGenerator />}
                        />
                        <Route
    path="/teacher/question-bank-quiz"
    element={
        <QuestionBankQuizGenerator />
    }
/>

                        <Route
                            path="/teacher/quizzes/:quizId/preview"
                            element={<TeacherQuizPreview />}
                        />

                        <Route
                            path="/teacher/quizzes/:quizId/reports"
                            element={<QuizReports />}
                        />
                        <Route
    path="/teacher/quizzes/:quizId/performance"
    element={<TeacherQuizPerformance />}
/>

                        <Route
                            path="/teacher/reports/:responseId"
                            element={<StudentReport />}
                        />

                        <Route
                            path="/teacher/settings"
                            element={<TeacherSettings />}
                        />


                        {/* Dean */}

                        <Route
                            path="/dean/dashboard"
                            element={<DeanDashboard />}
                        />

                        <Route
                            path="/dean/teachers"
                            element={<TeacherManagement />}
                        />
                        <Route
    path="/dean/sections"
    element={<SectionManagement />}
/>
<Route
    path="/dean/subjects"
    element={<SubjectManagement />}
/>
<Route
    path="/dean/batches"
    element={<BatchManagement />}
/>
<Route
    path="/dean/students"
    element={<StudentManagement />}
/>
<Route
    path="/dean/quizzes"
    element={<QuizManagement />}
/>
<Route
    path="/dean/attempts"
    element={<AttemptsAnalytics />}
/>
<Route
    path="/dean/analytics"
    element={<DeanAnalytics />}
/>
                    </Route>

                </Route>


                {/* =========================================
                    STUDENT ROUTES
                ========================================= */}
   

                <Route
    element={
        <ProtectedRoute
            allowedRoles={["STUDENT"]}
        />
    }
>
    <Route
    path="/quiz/start/:token"
    element={<Quiz />}
/>
    <Route element={<StudentLayout />}>

        {/* Student Dashboard */}

        <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
        />

        {/* My Quizzes */}

        <Route
            path="/student/quizzes"
            element={<MyQuizzes />}
        />
        <Route
    path="/student/quizzes/:quizId/performance"
    element={<StudentQuizPerformance />}
/>

        {/* Quiz Result */}
        <Route
    path="/quiz/result/:responseId"
    element={<QuizResult />}
/>
 
        {/* Quiz History */}

        <Route
            path="/student/history"
            element={<QuizHistory />}
        />

        {/* Performance */}

         <Route
    path="/student/performance"
    element={<AllQuizPerformance />}
/>
<Route
    path="/student/descriptive-performance"
    element={<AllDescriptivePerformance />}
/>
            <Route
        path="/student/profile"
        element={<Profile />}
    />
    <Route
    path="/student/settings"
    element={<Settings />}
/>
<Route
    path="/student/descriptive-assignments"
    element={<StudentDescriptiveAssignments />}
/>
 
<Route
    path="/student/descriptive-assignments/pending"
    element={<StudentDescriptivePending />}
/>
 
<Route
    path="/student/descriptive-assignments/:assignmentId/result"
    element={<StudentDescriptiveResult />}
/>
<Route
    path="/student/descriptive-assignments/:assignmentId/performance"
    element={<StudentDescriptiveAssignmentPerformance />}
/>

    </Route>
      {/* =========================================
        ACTIVE EXAM — NO STUDENT SIDEBAR
    ========================================= */}

    <Route
        path="/student/descriptive-assignments/token/:token"
        element={<StudentDescriptiveAssignment />}
    />

    <Route
        path="/student/descriptive-assignments/:assignmentId"
        element={<StudentDescriptiveAssignment />}
    />

    <Route
        path="/student/descriptive-pdf/:token"
        element={<StudentPdfDescriptiveAssignment />}
    />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;