import { Navigate } from "react-router-dom";
import { hasAccess } from "../utils/auth";

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = localStorage.getItem("accessToken");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
