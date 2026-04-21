import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requireRole?: "admin" | "contributor";
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole === "admin" && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (requireRole === "contributor" && user.role !== "admin" && user.role !== "contributor") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
