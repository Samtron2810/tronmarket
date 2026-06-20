import { createContext, useState, useEffect } from "react";
import {
  getToken,
  logout as doLogout,
  setToken,
  getUser,
  setUser,
} from "../utils/auth";
import api from "../services/api";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  const login = (t, u = null) => {
    setToken(t);
    setTokenState(t);
    if (u) {
      setUser(u);
      setUserState(u);
    }
  };

  useEffect(() => {
    // if token exists but user wasn't stored, decode token to get role/id
    if (token && !user) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const derived = {
          _id: payload.id || payload?.userId || null,
          role: payload.role,
        };
        setUser(derived);
        setUserState(derived);
      } catch (err) {
        // ignore
      }
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      // try server-side logout (if endpoint exists)
      await api.post("/auth/logout");
    } catch (err) {
      // ignore network errors
    }
    doLogout();
    setTokenState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        handleLogout,
        welcomeModalOpen,
        setWelcomeModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
