import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    loginUser,
    getCurrentUser,
} from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

function LoginForm() {
    const navigate = useNavigate();

    const { setAuthData } = useAuth();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please enter email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await loginUser(
               email,
               password
            );

// Save token first so the interceptor can use it
            localStorage.setItem(
              "token",
              response.access_token
             );

// Fetch current user
           const currentUser = await getCurrentUser();

// Update AuthContext
           setAuthData(
            response.access_token,
            currentUser
           );

            toast.success("Login successful!");

            if (currentUser.role === "DEAN") {
                navigate("/dean/dashboard");
            } else if (currentUser.role === "TEACHER") {
                navigate("/teacher/dashboard");
            } else if (currentUser.role === "STUDENT") {
                navigate("/student/dashboard");
            } else {
                navigate("/");
            }

        } catch (error) {

            toast.error(
                error?.response?.data?.detail ||
                error.message ||
                "Login failed."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>

            <div className="form-group">

                <label>Email</label>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

            </div>

            <div className="form-group">

                <label>Password</label>

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

            </div>

            <button
                className="login-btn"
                disabled={loading}
            >
                {
                    loading
                        ? "Signing In..."
                        : "Login"
                }
            </button>

        </form>
    );
}

export default LoginForm;