import { Fragment, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isSigningOut } = useAuth();

  if (!user) {
    return isSigningOut ? null : <Navigate to="/login" />;
  }

  return <Fragment key={user.uid}>{children}</Fragment>;
};

export default ProtectedRoute;
