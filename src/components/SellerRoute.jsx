import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function SellerRoute({ children }) {
  const { token } = useContext(AuthContext);

  // simple decode (MVP) — token payload contains role
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    return <Navigate to="/" replace />;
  }

  return children;
}
