import api from "./api";

/* ===========================
   Dashboard
=========================== */

export const getTeacherDashboard = async () => {
    const response = await api.get("/teachers/dashboard");
    return response.data;
};

/* ===========================
   Quiz Management
=========================== */

export const getTeacherQuizzes = async () => {
    const response = await api.get("/teachers/quizzes");
    return response.data;
};

export const getTeacherQuiz = async (quizId) => {
    const response = await api.get(`/teachers/quizzes/${quizId}`);
    return response.data;
};

// Alias (old name kept for compatibility)
export const getQuizById = getTeacherQuiz;

export const getQuizAssignments = async (quizId) => {
    const response = await api.get(
        `/teachers/quizzes/${quizId}/assignments`
    );

    return response.data;
};
export const exportQuizAssignments = async (quizId) => {
    const response = await api.get(
        `/teachers/quizzes/${quizId}/assignments/export`,
        {
            responseType: "blob",
        }
    );

    return response.data;
};
export const updateTeacherQuiz = async (quizId, quizData) => {
    const response = await api.put(
        `/teachers/quizzes/${quizId}`,
        quizData
    );

    return response.data;
};

export const deleteTeacherQuiz = async (quizId) => {
    const response = await api.delete(
        `/teachers/quizzes/${quizId}`
    );

    return response.data;
};

export const duplicateTeacherQuiz = async (quizId) => {
    const response = await api.post(
        `/teachers/quizzes/${quizId}/duplicate`
    );

    return response.data;
};

export const publishTeacherQuiz = async (quizId) => {
    const response = await api.patch(
        `/teachers/quizzes/${quizId}/publish`
    );

    return response.data;
};

export const moveQuizToDraft = async (quizId) => {
    const response = await api.patch(
        `/teachers/quizzes/${quizId}/draft`
    );

    return response.data;
};

// Alias
export const draftTeacherQuiz = moveQuizToDraft;

/* ===========================
   Reports
=========================== */

export const getQuizReports = async (quizId) => {
    const response = await api.get(
        `/teachers/quizzes/${quizId}/reports`
    );

    return response.data;
};

export const getStudentReport = async (responseId) => {
    const response = await api.get(
        `/teachers/reports/${responseId}`
    );

    return response.data;
};

/* ===========================
   AI Quiz
=========================== */

export const generateQuizFromTopic = async (data) => {
    const response = await api.post(
        "/teachers/ai/generate-topic",
        data
    );

    return response.data;
};

export const uploadPdfForQuiz = async (formData) => {
    const response = await api.post(
        "/teachers/ai/upload-pdf",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

// Alias
export const uploadPdf = uploadPdfForQuiz;

export const generateQuestion = async (quizId, data) => {
    const response = await api.post(
        `/teachers/quizzes/${quizId}/questions/generate`,
        data
    );

    return response.data.question;
};

export const regenerateQuestion = async (
    quizId,
    questionId
) => {
    const response = await api.post(
        `/teachers/quizzes/${quizId}/questions/${questionId}/regenerate`
    );

    return response.data.question;
};

export const deleteTeacherQuestion = async (questionId) => {
    const response = await api.delete(
        `/teachers/questions/${questionId}`
    );

    return response.data;
};

/* ===========================
   Quiz Assignment
=========================== */

export const assignQuizToSection = async (
    quizId,
    data
) => {
    const response = await api.post(
        `/teachers/quizzes/${quizId}/assign`,
        data
    );

    return response.data;
};

export const getTeacherSections = async () => {
    const response = await api.get(
        "/teachers/my-sections"
    );

    return response.data;
};

/* ===========================
   Analytics
=========================== */

export const getTeacherAnalytics = async (
    sectionId = null
) => {

    const response = await api.get(
        "/teachers/analytics",
        {
            params: {
                section_id: sectionId || undefined,
            },
        }
    );

    return response.data;
};

export const getQuizPerformance = async (
    sectionId = null
) => {

    const response = await api.get(
        "/teachers/analytics/quiz-performance",
        {
            params: {
                section_id: sectionId || undefined,
            },
        }
    );

    return response.data;
};

export const getSectionPerformance = async () => {
    const response = await api.get(
        "/teachers/analytics/section-performance"
    );

    return response.data;
};

export const getStudentPerformance = async (sectionId = null) => {
    const response = await api.get(
        "/teachers/analytics/student-performance",
        {
            params: {
                section_id: sectionId || undefined,
            },
        }
    );

    return response.data;
};
export const getRecentQuizActivity = async () => {
    const response = await api.get(
        "/teachers/analytics/recent-quizzes"
    );

    return response.data;
};
export const getTeacherQuizPerformance = async (
    quizId
) => {
    const response = await api.get(
        `/teachers/quizzes/${quizId}/performance`
    );

    return response.data;
};
export const exportTeacherQuizPerformance = async (
    quizId
) => {
    const response = await api.get(
        `/teachers/quizzes/${quizId}/performance/export`,
        {
            responseType: "blob",
        }
    );

    return response;
};
// Alias
export const getRecentQuizzes = getRecentQuizActivity;

export const getTeacherProfile = async () => {
    const response = await api.get("/teachers/profile");
    return response.data;
};

export const updateTeacherProfile = async (data) => {
    const response = await api.put(
        "/teachers/profile",
        data
    );

    return response.data;
};

export const changeTeacherPassword = async (data) => {
    const response = await api.put(
        "/teachers/change-password",
        data
    );

    return response.data;
};
/* ===========================
   Descriptive Assignment Management
=========================== */

// Get all descriptive assignments created by the logged-in teacher
export const getTeacherDescriptiveAssignments = async () => {
    const response = await api.get(
        "/teachers/descriptive-assignments"
    );

    return response.data;
};


// Get one descriptive assignment with questions
export const getTeacherDescriptiveAssignment = async (assignmentId) => {
    const response = await api.get(
        `/teachers/descriptive-assignments/${assignmentId}`
    );

    return response.data;
};


// Get student submissions for an assignment
export const getDescriptiveAssignmentSubmissions = async (assignmentId) => {
    const response = await api.get(
        `/teachers/descriptive-assignments/${assignmentId}/submissions`
    );

    return response.data;
};
// Download descriptive assignment submissions as Excel
export const downloadDescriptiveAssignmentSubmissions = async (
    assignmentId
) => {
    const response = await api.get(
        `/teachers/descriptive-assignments/${assignmentId}/submissions/download`,
        {
            responseType: "blob",
        }
    );

    return response;
};
/* ============================================================
   DESCRIPTIVE ANALYTICS
============================================================ */

export const getDescriptiveAnalytics = async (
    sectionId = null
) => {
    const response = await api.get(
        "/teachers/descriptive-analytics",
        {
            params: {
                section_id:
                    sectionId || undefined,
            },
        }
    );

    return response.data;
};
export const analyzeQuestionBank = async (formData) => {
    const response = await api.post(
        "/teachers/ai/analyze-question-bank",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};


export const generateQuizFromQuestionBank = async (
    formData
) => {
    const response = await api.post(
        "/teachers/ai/generate-question-bank-quiz",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};
export const generateQuestionBankQuiz = async (formData) => {
    const response = await api.post(
        "/teachers/ai/generate-question-bank-quiz",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};
// Get complete student submission
export const getDescriptiveSubmission = async (submissionId) => {
    const response = await api.get(
        `/teachers/descriptive-submissions/${submissionId}`
    );

    return response.data;
};


// Review / update teacher marks and feedback
export const reviewDescriptiveSubmission = async (
    submissionId,
    answers
) => {
    const response = await api.put(
        `/teachers/descriptive-submissions/${submissionId}/review`,
        {
            answers,
        }
    );

    return response.data;
};
/* ============================================================
   DESCRIPTIVE ASSIGNMENT - TEACHER REVIEW
============================================================ */

export const getTeacherDescriptiveSubmission = async (
    submissionId
) => {
    const response = await api.get(
        `/teachers/descriptive-submissions/${submissionId}`
    );

    return response.data;
};


export const reviewTeacherDescriptiveSubmission = async (
    submissionId,
    data
) => {
    const response = await api.put(
        `/teachers/descriptive-submissions/${submissionId}/review`,
        data
    );

    return response.data;
};
/* ============================================================
   DESCRIPTIVE ASSIGNMENT - SECTION MANAGEMENT
============================================================ */

// Get sections assigned to logged-in teacher
export const getTeacherDescriptiveSections = async () => {
    const response = await api.get(
        "/teachers/descriptive-assignments/sections"
    );

    return response.data;
};


// Create descriptive assignment
export const createTeacherDescriptiveAssignment = async (data) => {
    const response = await api.post(
        "/teachers/descriptive-assignments",
        data
    );

    return response.data;
};

export const uploadDescriptiveQuestionPdf = async (formData) => {
    const response = await api.post(
        "/teachers/descriptive-assignments/upload-pdf",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

// Publish descriptive assignment to selected sections
export const publishDescriptiveAssignment = async (
    assignmentId,
    sectionIds
) => {
    const response = await api.post(
        `/teachers/descriptive-assignments/${assignmentId}/assign`,
        sectionIds
    );

    return response.data;
};


// Alias used by DescriptiveAssignments.jsx
export const assignDescriptiveAssignment =
    publishDescriptiveAssignment;


/* ============================================================
   DESCRIPTIVE ASSIGNMENT - ASSIGNED STUDENTS
============================================================ */

// Get students who actually received the descriptive assignment
//
// Optional filters:
// ?section_id=3
// ?search=Arun
//

export const getDescriptiveAssignmentAssignedStudents = async (
    assignmentId,
    params = {}
) => {
    const response = await api.get(
        `/teachers/descriptive-assignments/${assignmentId}/assigned-students`,
        {
            params: {
                section_id: params.section_id || undefined,
                search: params.search || undefined,
            },
        }
    );

    return response.data;
};

export const analyzePdfForQuiz = async (formData) => {
    const response = await api.post(
        "/teachers/ai/analyze-pdf",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};
 
export const generateQuizFromPdf = async (
    formData
) => {
    const response = await api.post(
        "/teachers/ai/generate-pdf-quiz",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

export const generateTopicQuiz = async (data) => {
    const response = await api.post(
        "/generate-topic-quiz",
        data
    );

    return response.data;
};