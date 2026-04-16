import { Navigate } from "react-router-dom";

export const ProtectedAdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem("admin_token");
  const adminUser = localStorage.getItem("admin_user");

  if (!adminToken || !adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
