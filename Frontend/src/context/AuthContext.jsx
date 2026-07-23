import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        localStorage.getItem("token") || ""
    );

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    // Fetch logged-in user from backend
    const fetchCurrentUser = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
            return userData;
        } catch (error) {
            logout();
            return null;
        }
    };

    // Login
    const setAuthData = (jwtToken, userData) => {
    localStorage.setItem("token", jwtToken);

    setToken(jwtToken);

    setUser(userData);
};

    // Logout
    const logout = () => {
        localStorage.removeItem("token");

        setToken("");

        setUser(null);
    };

    // Restore session on page refresh
    useEffect(() => {
        const restoreSession = async () => {
            if (token) {
                await fetchCurrentUser();
            }

            setLoading(false);
        };

        restoreSession();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                setAuthData,
                logout,
                fetchCurrentUser,
                loading,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}