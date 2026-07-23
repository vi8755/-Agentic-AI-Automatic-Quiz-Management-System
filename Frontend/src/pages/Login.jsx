import LoginForm from "../components/common/LoginForm";
import "./Login.css";

function Login() {
    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Agentic AI Quiz Management System</h1>

                <p>
                    Sign in to continue
                </p>

                <LoginForm />
            </div>
        </div>
    );
}

export default Login;