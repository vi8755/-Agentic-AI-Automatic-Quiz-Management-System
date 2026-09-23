import api from "./api";

export const getStudentDashboard = async () => {
    const response = await api.get("/students/dashboard");
    return response.data;
};

export const getMyStudentProfile = async () => {
    const response = await api.get("/students/me");
    return response.data;
};
export const getStudentQuizzes = async () => {
    const response = await api.get("/students/quizzes");
    return response.data;
};
export const startStudentQuiz = async (token) => {
    const response = await api.get(`/students/start/${token}`);
    return response.data;
};
export const getStudentQuizResult = async (
    responseId,
    token
) => {
    const response = await api.get(
        `/result/${responseId}`,
        {
            params: {
                token,
            },
        }
    );

    return response.data;
};
export const getStudentHistory = async () => {
    const response = await api.get("/students/history");
    return response.data;
};
export const getStudentPerformance = async () => {
    const response = await api.get("/students/performance");
    return response.data;
};
export const getStudentDescriptivePerformance = async () => {
    const response = await api.get(
        "/students/descriptive-performance"
    );

    return response.data;
};
export const changeStudentPassword = async (
    currentPassword,
    newPassword
) => {
    const response = await api.post(
        "/auth/change-password",
        {
            current_password: currentPassword,
            new_password: newPassword,
        }
    );

    return response.data;
};
export const getStudentDescriptiveAssignmentByToken = async (token) => {
    const response = await api.get(
        `/students/descriptive-assignments/token/${token}`
    );

    return response.data;
};
export const startStudentDescriptiveAssignment = async (
    assignmentId
) => {
    const response = await api.post(
        `/students/descriptive-assignments/${assignmentId}/start`
    );

    return response.data;
};

export const submitStudentDescriptiveAssignment = async (data) => {
    const response = await api.post(
        "/students/descriptive-assignments/submit",
        data
    );
    return response.data;
};
export const uploadDescriptiveAnswerAttachment = async (
    answerId,
    file
) => {
    const formData = new FormData();

    formData.append("answer_id", answerId);
    formData.append("file", file);

    const response = await api.post(
        "/students/descriptive-assignments/answers/attachment",
        formData
    );

    return response.data;
};
export const getStudentDescriptiveSubmission = async (assignmentId) => {
    const response = await api.get(
        `/students/descriptive-assignments/${assignmentId}/submission`
    );

    return response.data;
};

export const getStudentDescriptiveAssignments = async () => {
    const response = await api.get(
        "/students/descriptive-assignments"
    );

    return response.data;
};

export const getStudentDescriptiveAssignment = async (assignmentId) => {
    const response = await api.get(
        `/students/descriptive-assignments/${assignmentId}`
    );

    return response.data;
};
export const getStudentQuizPerformance = async (quizId) => {
    const response = await api.get(
        `/students/quizzes/${quizId}/performance`
    );

    return response.data;
};
export const getStudentDescriptiveAssignmentPerformance = async (
    assignmentId
) => {
    const response = await api.get(
        `/students/descriptive-assignments/${assignmentId}/performance`
    );

    return response.data;
};

export const submitStudentDescriptiveAssignmentPdf = async (
    assignmentId,
    file
) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
        `/students/descriptive-assignments/${assignmentId}/submit-pdf`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};