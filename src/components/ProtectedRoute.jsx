import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { authChecked, session } = useAuth();

  if (!authChecked) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
