import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ allowedRoles }) {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();
    console.log("ProtectedRoute:", {
    isAuthenticated,
    loading,
    user,
    allowedRoles,
    currentPath: location.pathname,
});

    if (loading) {
        return <h2>Loading...</h2>;
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location,
                }}
            />
        );
    }

    if (!user) {
        return <h2>Loading...</h2>;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;