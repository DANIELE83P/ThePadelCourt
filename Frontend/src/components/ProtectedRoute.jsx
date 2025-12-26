import { Navigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

/**
 * ProtectedRoute component to protect routes based on authentication and role
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
    const { isLoggedIn, userRole, profile } = useAuth();

    // Check if authentication is required and user is not logged in
    if (requireAuth && !isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Check if specific roles are required
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redirect to home if user doesn't have the required role
        return <Navigate to="/" replace />;
    }

    // User is authorized, render the protected component
    return children;
};

export default ProtectedRoute;
