import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
export const getTeacherAnalytics = async () => {
    const response = await api.get(
        "/teachers/analytics"
    );

    return response.data;
};


export const getQuizPerformance = async () => {
    const response = await api.get(
        "/teachers/analytics/quiz-performance"
    );

    return response.data;
};


export const getSectionPerformance = async () => {
    const response = await api.get(
        "/teachers/analytics/section-performance"
    );

    return response.data;
};


export const getRecentQuizActivity = async () => {
    const response = await api.get(
        "/teachers/analytics/recent-quizzes"
    );

    return response.data;
};

export default api;
