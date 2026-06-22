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
    // If token exists but user wasn't stored (e.g. page refresh),
    // role is already in localStorage via setUser in login() — nothing to do.
    // We no longer decode the JWT since role comes from the login response.
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
