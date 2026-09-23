import api from "./api";

/* ===========================
Dashboard
=========================== */

export const getDeanDashboard = async () => {
const response = await api.get("/dean/dashboard");
return response.data;
};

/* ===========================
Teacher Management
=========================== */

export const getTeachers = async (params = {}) => {
const response = await api.get("/dean/teachers", {
params,
});

return response.data;
};

export const getTeacherProfile = async (teacherId) => {
const response = await api.get(
`/dean/teachers/${teacherId}`
);

return response.data;
};

export const updateTeacherStatus = async (
teacherId,
is_active
) => {
const response = await api.patch(
`/dean/teachers/${teacherId}/status`,
{
is_active,
}
);

return response.data;
};

export const deleteTeacher = async (teacherId) => {
const response = await api.delete(
`/dean/teachers/${teacherId}`
);

return response.data;
};
/* ===========================
Teacher Section Assignments
=========================== */

export const getTeacherAssignments = async (teacherId) => {
    const response = await api.get(
        `/dean/teachers/${teacherId}/assignments`
    );

    return response.data;
};

export const assignTeacherSections = async (
    teacherId,
    assignmentData
) => {
    const response = await api.post(
        `/dean/teachers/${teacherId}/assignments`,
        assignmentData
    );

    return response.data;
};

export const removeTeacherSectionAssignment = async (
    teacherId,
    assignmentId
) => {
    const response = await api.delete(
        `/dean/teachers/${teacherId}/assignments/${assignmentId}`
    );

    return response.data;
};
/* ===========================
Register Teacher
=========================== */

export const registerTeacher = async (teacherData) => {
const response = await api.post(
"/dean/teachers",
teacherData
);

return response.data;
};
/* ===========================
Batch Management
=========================== */

 
/* ===========================
Section Management
=========================== */

export const getDeanSections = async () => {
const response = await api.get("/dean/sections");

return response.data;
};

export const createDeanSection = async (sectionData) => {
const response = await api.post(
"/dean/sections",
sectionData
);

return response.data;
};

export const updateDeanSection = async (
sectionId,
sectionData
) => {
const response = await api.patch(
`/dean/sections/${sectionId}`,
sectionData
);

return response.data;
};

/* ===========================
Activate / Deactivate Section
=========================== */

export const updateDeanSectionStatus = async (
sectionId,
is_active
) => {
const response = await api.patch(
`/dean/sections/${sectionId}/status`,
null,
{
params: {
is_active,
},
}
);

return response.data;
};

/* ===========================
Delete Section
=========================== */

export const deleteDeanSection = async (sectionId) => {
const response = await api.delete(
`/dean/sections/${sectionId}`
);

return response.data;
};

/* ===========================
Subject Management
=========================== */

export const getDeanSubjects = async () => {
const response = await api.get("/dean/subjects");

return response.data;
};

export const createDeanSubject = async (subjectData) => {
const response = await api.post(
"/dean/subjects",
subjectData
);

return response.data;
};

export const updateDeanSubject = async (
subjectId,
subjectData
) => {
const response = await api.put(
`/dean/subjects/${subjectId}`,
subjectData
);

return response.data;
};

export const updateDeanSubjectStatus = async (
subjectId,
is_active
) => {
const response = await api.patch(
`/dean/subjects/${subjectId}/status`,
null,
{
params: {
is_active,
},
}
);

return response.data;
};

export const deleteDeanSubject = async (subjectId) => {
const response = await api.delete(
`/dean/subjects/${subjectId}`
);

return response.data;
};

/* ===========================
Student Management
=========================== */

/**

* Get all students
* Supports search, filters and pagination.
  */
  export const getDeanStudents = async (params = {}) => {
  const response = await api.get("/dean/students", {
  params,
  });

return response.data;
};

/**

* Create Student
  */
  export const createDeanStudent = async (studentData) => {
  const response = await api.post(
  "/dean/students",
  studentData
  );

return response.data;
};

/**

* Update Student
  */
  export const updateDeanStudent = async (
  studentId,
  studentData
  ) => {
  const response = await api.put(
  `/dean/students/${studentId}`,
  studentData
  );

return response.data;
};

/**

* Activate / Deactivate Student
  */
  export const updateDeanStudentStatus = async (
  studentId,
  is_active
  ) => {
  const response = await api.patch(
  `/dean/students/${studentId}/status`,
  null,
  {
  params: {
  is_active,
  },
  }
  );

return response.data;
};

/**

* Delete Student
  */
  export const deleteDeanStudent = async (studentId) => {
  const response = await api.delete(
  `/dean/students/${studentId}`
  );

return response.data;
};

/**

* Upload Students through Excel
  */
  export const uploadDeanStudentsExcel = async (file) => {
  const formData = new FormData();

formData.append("file", file);

const response = await api.post(
"/dean/students/upload-excel",
formData,
{
headers: {
"Content-Type": "multipart/form-data",
},
}
);

return response.data;
};

/**

* Download Student Excel Template
  */
  export const downloadDeanStudentTemplate = async () => {
  const response = await api.get(
  "/dean/students/download-template",
  {
  responseType: "blob",
  }
  );

return response.data;
};

/* ===========================
Quiz Management
=========================== */

export const getDeanQuizzes = async (params = {}) => {
    const response = await api.get("/dean/quizzes", {
        params,
    });

    return response.data;
};

export const getDeanQuiz = async (quizId) => {
    const response = await api.get(
        `/dean/quizzes/${quizId}`
    );

    return response.data;
};

export const deleteDeanQuiz = async (quizId) => {
    const response = await api.delete(
        `/dean/quizzes/${quizId}`
    );

    return response.data;
};

/* ===========================
Teacher Sections for Quiz Filter
=========================== */

export const getDeanTeacherSections = async (teacherId) => {
    const response = await api.get(
        `/dean/teachers/${teacherId}/sections`
    );

    return response.data;
};
/* ===========================
Attempts / Performance Analytics
=========================== */

export const getDeanAttemptAnalytics = async (params = {}) => {
    const response = await api.get(
        "/dean/attempts/analytics",
        {
            params,
        }
    );

    return response.data;
};
/* ===========================
Dean Analytics
=========================== */

export const getDeanAnalytics = async () => {
    const response = await api.get("/dean/analytics");

    return response.data;
};

/* ===========================
Batch Management
=========================== */

export const getDeanBatches = async () => {
    const response = await api.get("/dean/batches");

    return response.data;
};

export const createDeanBatch = async (batchData) => {
    const response = await api.post(
        "/dean/batches",
        batchData
    );

    return response.data;
};

export const updateDeanBatch = async (
    batchId,
    batchData
) => {
    const response = await api.patch(
        `/dean/batches/${batchId}`,
        batchData
    );

    return response.data;
};

export const updateDeanBatchStatus = async (
    batchId,
    is_active
) => {
    const response = await api.patch(
        `/dean/batches/${batchId}/status`,
        {
            is_active,
        }
    );

    return response.data;
};

export const deleteDeanBatch = async (batchId) => {
    const response = await api.delete(
        `/dean/batches/${batchId}`
    );

    return response.data;
};
export const resendDeanStudentVerification = async (studentId) => {
    const response = await api.post(
        `/dean/students/${studentId}/resend-verification`
    );

    return response.data;
};